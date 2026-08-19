# アーキテクチャ

## 方針

Next.js App Router を UI と Backend for Frontend に使い、認証・PostgreSQL・画像ストレージを Supabase に集約する。Vercel にデプロイする。

```text
Browser
  └─ Next.js App Router (Vercel)
       ├─ Server Components: 展示一覧・詳細の取得
       ├─ Client Components: 横移動・絞り込み・モーダル
       ├─ Server Actions: 投稿・しんみり・コメント
       └─ Supabase
            ├─ Auth
            ├─ PostgreSQL + Row Level Security
            └─ Storage (展示画像)
```

## 推奨ディレクトリ

```text
app/
  (museum)/                 # 公開展示ルート
  login/
  exhibits/[exhibitId]/
  exhibits/new/
components/
  museum/                   # 展示回廊固有 UI
  ui/                       # 汎用 UI
features/
  exhibits/                 # 展示の型、queries、actions
  memories/                 # コメントとしんみり
lib/
  supabase/                 # server/client の接続生成
docs/
```

## データモデル案

- `profiles`: `id`, `birth_year`, `display_name`, `created_at`
- `exhibits`: `id`, `title`, `description`, `category`, `image_path`, `start_birth_year`, `end_birth_year`, `status`, `created_by`, `created_at`
- `memories`: `id`, `exhibit_id`, `author_id`, `body`, `created_at`, `deleted_at`
- `nostalgia_reactions`: `exhibit_id`, `profile_id`, `created_at`（複合ユニーク制約）

公開読み取りは `exhibits.status = 'published'` のみ。投稿の更新・削除は本人、モデレーションは管理者ロールだけに RLS で制限する。

## 境界

- ページはデータ取得と画面構成を担当する。
- ドメイン処理は `features/*` に置く。
- ブラウザ状態が必要な最小単位だけを Client Component にする。
- Supabase の service role key はサーバー専用とし、ブラウザへ渡さない。
