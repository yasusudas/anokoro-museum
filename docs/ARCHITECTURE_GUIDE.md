# アーキテクチャガイド

「どのフォルダに何を書くか」を決める実装ガイド。技術方針の正は [TRD.md](./TRD.md) とする。

## 目標ディレクトリ

現状はプロトタイプのため `app/page.tsx` に処理が集まっている。Supabase接続時から次へ段階的に移行する。

```text
app/
  (museum)/
    page.tsx
    items/[itemId]/page.tsx
  login/page.tsx
  items/new/page.tsx
  (auth)/
    layout.tsx
    sign-in/page.tsx
    sign-up/page.tsx
components/
  museum/                 # 回廊・額縁・展示UI
  auth/                   # ログイン・登録まわりのカードやフォーム
  ui/                     # 汎用的な小さい部品
features/
  items/
    domain/               # Item、年代判定、入力検証
    application/          # 投稿、削除などのuse case
    infrastructure/       # Supabase query / mapper
  comments/
    domain/               # Comment、本文・URLの入力検証
    application/          # 投稿、削除、いいね切替
    infrastructure/       # Supabase query / mapper
  memories/
  auth/
lib/
  supabase/
    server.ts
    browser.ts
    middleware.ts
supabase/
  migrations/
  seed.sql
docs/
```

## 配置の判断表

| 場所 | 書くもの | 書かないもの |
| --- | --- | --- |
| `app/` | route、metadata、データ取得の組み立て、画面構成 | 長いビジネス分岐、DB行の変換ロジック |
| `components/ui` | propsで動く汎用UI | Supabase呼び出し、展示固有ルール |
| `components/museum` | 横回廊、展示フレームなど体験固有UI | 認可、直接DB更新 |
| `features/*/domain` | 型、値検証、純粋関数、状態遷移 | React hook、`fetch`、Supabase client |
| `features/*/application` | 1操作の流れ、複数repositoryの調整 | JSX、具体的なSupabase query |
| `features/*/infrastructure` | query、repository実装、DB行とのmapper | UI状態 |
| `lib/supabase` | client生成と共通設定 | 機能固有query |

## Server / Client境界

- ページとレイアウトはServer Componentを維持する
- `useState`、`useEffect`、イベント、ブラウザAPIを使う部品だけをClient Componentにする
- 大きなページ全体へ安易に `"use client"` を付けない
- Server ComponentからClient Componentへ渡すpropsはserializableにする
- secretを必要とする処理はサーバー境界から出さない

## 具体例

### 公開展示一覧

現状の `app/page.tsx` は薄く保ち、表示の中心を `components/museum/museum-experience.tsx` に置く。routeを分割する段階では `app/(museum)/page.tsx` がsearch paramsを解釈し、`features/items/infrastructure/find-published-items.ts` を呼ぶ。年代との関連度計算が複雑になったら `domain` へ移し、横移動は `components/museum/exhibit-corridor.tsx` に分離する。

### 認証導線

`app/(auth)/sign-in/page.tsx` と `app/(auth)/sign-up/page.tsx` は route group 配下に置き、共通の見た目は `components/auth/auth-card.tsx` に寄せる。入力フォームは `components/auth/*-form.tsx` に分け、ページ側はルーティングと composition だけにする。

### しんみり

UI → Server Action → applicationの `toggle-shinmiri` → repository。重複防止の最終保証はDBの一意制約に置く。UIは楽観的更新できるが失敗時に戻す。

### コメント

詳細ページはServer Componentでコメントといいね件数をまとめて読み、入力・削除・いいね切替だけをClient ComponentからServer Actionへ渡す。本文の整形はdomainで行い、UIではReactの標準エスケープを維持してURLだけをリンク要素へ分割する。

### 展示投稿

投稿画面をページとして切るなら `app/(museum)/items/new/page.tsx` に置き、ページ側はルートとcompositionのみを担当する。モーダルで出すなら再利用UIは `components/forms/` か `components/museum/` に寄せる。フォーム入力をServer Actionで検証し、画像をStorageへアップロードしてから展示をDBへ保存する。DB保存に失敗した場合はアップロード済みオブジェクトを削除し、孤立ファイルを残さない。画像、代替テキスト、権利確認が揃った時点で保存・公開する。

## 段階的導入

- 表示だけの単純queryはinterfaceを作らず直接infrastructure関数でよい
- 条件分岐、認可、複数更新、外部I/Oが増えたらapplicationへ移す
- domainにルールがない機能へ、形式だけのentityやrepositoryを量産しない
- ただしDBアクセスをClient Componentへ直接埋め込まない
