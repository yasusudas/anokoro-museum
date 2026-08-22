# TRD（Technical Requirements Document）

[PRD.md](./PRD.md) と [FEATURE_REQUIREMENTS.md](./FEATURE_REQUIREMENTS.md) を、実装可能な技術方針へ落とす文書。API詳細は [API_DESIGN.md](./API_DESIGN.md)、DB詳細は [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) を正とする。

## 1. 技術スタック

| 領域 | 技術 | 用途 |
| --- | --- | --- |
| Web | Next.js 16 App Router / React 19 / TypeScript | UI、Server Components、Server Actions、Route Handlers |
| CSS | Tailwind CSS 4 + CSS Modules | トークン、レイアウト、展示固有表現 |
| Backend | Next.js + Supabase | BFF、認証、CRUD、サーバー処理 |
| DB | Supabase PostgreSQL | 永続化、制約、RLS |
| Storage | Supabase Storage | 展示画像 |
| Hosting | Vercel | Preview / Production |

導入バージョンのNext.jsを正とし、実装前に `node_modules/next/dist/docs/` の該当ガイドを確認する。

## 2. アーキテクチャ方針

- Server Componentを既定にし、ブラウザ状態やイベントが必要な最小境界だけClient Componentにする
- ページはルーティング、データ取得、表示構成を担い、ビジネスルールを抱えない
- ドメインルールはReact・Supabaseに依存しない純粋なTypeScriptとして保つ
- Supabaseアクセスはserver用・browser用クライアントを分離し、service role keyをブラウザへ渡さない
- 単純CRUDは過度に抽象化しない。複数の分岐・認可・トランザクションを持つ機能からuse caseへ分離する

詳細な配置は [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md) を参照する。

## 3. レンダリングと状態

- 公開展示一覧・詳細: Server Componentで取得し、検索条件はURLのsearch paramsを正とする
- 横スクロール、モーダル、楽観的な「しんみり」表示: Client Component
- 認証セッション: Supabase AuthのcookieベースSSR構成
- フォーム: Server Actionを基本とし、入力をサーバー側でも検証する
- DB更新後: 必要なpath/tagだけを再検証する

## 4. 非機能要件

### パフォーマンス

- 初期表示のLCP目標: p75で2.5秒以内
- CLS目標: 0.1未満
- 展示画像は寸法を確定し、`next/image` と適切な `sizes` を使う
- 一覧の初期取得は必要列だけに絞り、コメント本文など詳細データを含めない
- 展示数が増えたらカーソルページネーションまたは段階取得を導入する

### アクセシビリティ

- WCAG 2.2 AAを目標とする
- 横移動へキーボードと画面ボタンを提供する
- ダイアログはフォーカストラップ、Escape閉じ、元要素へのフォーカス復帰を行う
- `prefers-reduced-motion` と十分なコントラストを考慮する

### セキュリティ

- 全ユーザーデータ系テーブルでRLSを有効化する
- 認可はUI表示制御ではなくDB/RLSまたはサーバーで強制する
- 投稿画像はJPEG、PNG、WebP、5MB以下に限定する。Server ActionでMIME、拡張子、サイズを検証し、推測困難な保存名でSupabase Storageへ保存する
- コメント表示時はReactの標準エスケープを維持し、任意HTMLを許可しない
- URLのリンク化はHTTP/HTTPSに限定し、`target="_blank"` では `rel="noopener noreferrer"` を必ず付ける
- 秘密値を `NEXT_PUBLIC_*` に置かない

### 運用

- Preview環境とProduction環境でSupabaseプロジェクトを分離する
- エラーには利用者向けメッセージと調査用識別子を持たせる

## 5. テスト方針

| 種別 | 対象 | 例 |
| --- | --- | --- |
| Unit | domain、バリデーション | 年代一致、状態遷移、文字数 |
| Integration | Server Action / repository / RLS | 他人の投稿を更新できない |
| Component | 操作が複雑なUI | モーダル、絞り込み、しんみり |
| E2E | 主要ユーザーフロー | 年代設定→展示→コメント投稿 |
| Visual | PC展示回廊 | 主要viewportでの崩れとコントラスト |

PR前の最低条件は `lint` と `build`。テスト導入後はCIとローカルのコマンドを一致させる。

## 6. 未解決事項

- OAuthプロバイダーの選定
- アナリティクス製品とCookie同意の要否
- Preview / Productionへのmigration適用担当と自動化方式

## 7. スコープ外

サークル内ハッカソン用途のため、以下を持たない。不特定多数へ公開する場合は再検討する。

- 生まれ年のDB保存（端末内の一時保存に留める）
