# API設計

この文書はブラウザ・Next.js・Supabase間の公開契約の正とする。現時点は設計案であり、実装時に入力schemaと戻り値を確定する。

## 1. 提供形態

| 方式 | 用途 | 原則 |
| --- | --- | --- |
| Server Component query | 公開展示、詳細、コメントの読み取り | server用Supabase clientからRLS付きで読む |
| Server Action | ログイン後のフォーム・mutation | 入力検証、認証、更新、再検証をまとめる |
| Route Handler | Webhook、外部クライアント、バイナリ応答 | 必要な場合だけ追加する |
| Supabase PostgREST | repository内部のDBアクセス | ブラウザからの直接利用は単純・RLS安全な操作に限定 |
| Supabase RPC | トランザクションや集計 | SQL側が適切な複数更新に限定 |

「APIを作るため」だけにRoute Handlerを増やさず、Server ActionやRLS付きPostgRESTで足りるか先に検討する。

現在の展示詳細はClient Componentのモーダルで構成されているため、コメント読み取りは暫定的にServer Action `getCommentsAction`を介する。展示詳細をServer ComponentのURLへ分離した段階で、コメント読み取りをServer Component queryへ寄せる。

## 2. 操作一覧

| 操作 | 実装候補 | 認証 | 関連機能 |
| --- | --- | --- | --- |
| 公開展示一覧取得 | Server query | 不要 | F-01 |
| 展示詳細取得 | Server query | 不要 | F-02 |
| しんみり切替 | Server Action / RPC | 必要 | F-04 |
| コメント投稿・削除 | Server Action | 必要 | F-05 |
| コメントいいね切替 | Server Action | 必要 | F-05 |
| コメントいいね件数取得 | Supabase RPC `get_comment_like_counts` | 不要 | F-05 |
| 展示候補投稿 | Server Action | 必要 | F-06 |
| 画像アップロード確定 | Server Action | 必要 | F-06 |
| Google OAuth callback | `GET /auth/callback` Route Handler | OAuth認可コード | F-03 |

## 3. 共通入力・出力

- IDはUUID文字列として検証する
- 本文は前後だけtrimして長さを検証し、本文中の改行は保持する
- Server Actionは例外文字列をそのまま返さず、識別可能なcodeを返す

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR" | "CONFLICT" | "INTERNAL_ERROR";
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };
```

内部ログには調査情報を残せるが、SQL、環境変数、stack trace、他ユーザーの情報をクライアントへ返さない。

## 4. 認証・認可

- 展示（DBテーブルは `items`）・コメントは匿名で読み取れる
- 投稿、しんみり、コメント、コメントいいねは `auth.uid()` と所有者をRLSで照合する
- コメントいいね件数は生テーブルを直接読ませず、`comment_id` と件数だけを返すRPCで取得する
- service roleは管理用サーバー処理に限定し、通常ユーザー処理でRLSを迂回しない
- 運営ロールを持たないため、認可判定は所有者かどうかだけで完結する
- 生まれ年はDBで管理しないため、対応するServer Actionを持たない

## 5. キャッシュと再検証

- 一覧更新: 展示一覧tagまたは該当pathを再検証
- 展示更新: 一覧と `/exhibits/{id}` を再検証
- コメント更新: 該当展示のコメント境界だけを更新
- コメントいいね: 楽観的UI後、サーバーの確定値へ収束させる。同時付与で一意制約に当たった場合は付与済みとして成功扱いする
- しんみり件数: 楽観的UI後、サーバーの確定値へ収束させる

具体APIは導入済みNext.jsのローカルドキュメントを確認して選択する。

## 6. Google OAuth callback

GoogleからSupabase経由で返される認可コードをセッションへ交換し、サインイン画面または検証済みの復帰先へリダイレクトするRoute Handler。ブラウザからAPIとしてJSONを取得する用途ではない。

### 契約

| 項目 | 内容 |
| --- | --- |
| Method / path | `GET /auth/callback` |
| 認証 | callback開始前のアプリセッションは不要。Supabaseが発行した一時的な`code`を受け取り、サーバー側でセッション交換する。サービスロールキーは使用しない |
| Query | `code`（認可成功時に必須、OAuth認可コード）、`next`（任意、同一サイト内の相対パス）、`error` / `error_description`（プロバイダ側が認可に失敗したときだけ付与） |
| 成功レスポンス | `307`で`next`へリダイレクト。`next`がない、外部URL、解釈できない値の場合は`/`へ戻す |
| 中断レスポンス | `error=access_denied`（利用者がGoogleの同意画面で中断）の場合は失敗扱いにせず、検証済みの`next`を付けて`307 /sign-in?next=...`へリダイレクトする。`error`は付けないためサインイン画面にエラーは表示しない |
| 失敗レスポンス | `access_denied`以外の`error`、`code`がない、Supabaseのセッション交換に失敗のいずれかの場合は、検証済みの`next`を付けて`307 /sign-in?error=oauth_callback&next=...`へリダイレクト |
| エラー値の扱い | プロバイダの`error` / `error_description`を画面へそのまま渡さない。既知の識別子（`access_denied`かそれ以外）へ判定してから、アプリ側の固定コード`oauth_callback`だけをクエリに載せる。原文はサーバーログにのみ残す |
| セッション | セッション交換成功時にSupabase SSRクライアントが認証Cookieを設定する |
| 冪等性 | 認可コードは一時的かつ再利用不可のため、同じcallback URLの自動再送で二重ログインや二重データ作成を行わない。失敗後は同じ`code`を再送せず、新しいOAuth認証を開始する |
| timeout | Route Handler独自のタイムアウトは設定しない。セッション交換はNext.js実行環境とSupabaseクライアントの既定タイムアウトに従い、完了しない場合は失敗として扱う |
| retry | `exchangeCodeForSession`の自動再試行は行わない。タイムアウトや交換失敗時はサインイン画面へ戻し、利用者が新しいOAuthフローを開始する |

### Request / response例

```text
GET /auth/callback?code=<authorization-code>&next=/?exhibit=<exhibit-id>

HTTP/1.1 307 Temporary Redirect
Location: /?exhibit=<exhibit-id>
Set-Cookie: <Supabase session cookies>
```

利用者がGoogleの同意画面で中断した場合は、エラーを表示せずサインイン画面へ戻す。

```text
GET /auth/callback?error=access_denied&error_description=<provider-message>&next=/?exhibit=<exhibit-id>

HTTP/1.1 307 Temporary Redirect
Location: /sign-in?next=%2F%3Fexhibit%3D%3Cexhibit-id%3E
```

それ以外のプロバイダ側エラー、認可コードがない場合、セッション交換に失敗した場合は、次のエラー導線へリダイレクトする。

```text
GET /auth/callback?error=server_error&error_description=<provider-message>&next=/?exhibit=<exhibit-id>

HTTP/1.1 307 Temporary Redirect
Location: /sign-in?error=oauth_callback&next=%2F%3Fexhibit%3D%3Cexhibit-id%3E
```

`next`は相対URLとして解釈した結果のoriginがリクエストのoriginと一致する場合だけ採用し、外部サイトへのオープンリダイレクトを許可しない。判定は`features/auth/domain/next-path.ts`の`getSafeNextPath(value, origin)`に集約し、Route Handlerとサインイン画面の両方から同じ実装を使う。
