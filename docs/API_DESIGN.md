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

## 6. 将来のRoute Handler

外部サービスのWebhookなど外部から呼ばれる処理を追加するときは、メソッド、path、認証、冪等性、request/response例、timeout、retry方針をこの文書へ追記する。
