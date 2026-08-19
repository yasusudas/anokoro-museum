# 命名・実装規則

## 命名

- React コンポーネント、型: `PascalCase`（`ExhibitCard`, `Exhibit`）
- 関数、変数、フック: `camelCase`（`getExhibits`, `useHorizontalScroll`）
- 定数: 通常は `camelCase`。環境変数だけ `SCREAMING_SNAKE_CASE`
- ファイル、ディレクトリ、URL: `kebab-case`（`exhibit-card.tsx`, `/exhibits/new`）
- DB のテーブル、列: `snake_case`（`nostalgia_reactions`, `birth_year`）
- ID を含む名前は対象を明記する（`exhibitId`）。曖昧な `id` は短い局所スコープに限る。

## TypeScript / React

- `any` は使わず、外部入力は実行時にも検証する。
- Server Component を既定とし、状態・イベント・ブラウザ API が必要な境界だけ `"use client"` にする。
- 表示文言に依存した分岐を避け、`categoryId` や列挙値で判定する。
- DB 型は Supabase から生成し、手書きの重複型を増やさない。
- mutation 後の成功・失敗を UI で通知する。楽観的更新はロールバック可能にする。

## CSS

- 色、余白、角丸、影は CSS カスタムプロパティでトークン化する。
- グローバル CSS はリセットと全体トークンに限定し、画面固有の複雑なスタイルは CSS Modules に移す。
- 動きには `prefers-reduced-motion` を考慮する。

## Git

- 1コミットは1つの目的に絞る。
- コミット例: `feat: add horizontal exhibit corridor`
- PR には目的、画面差分、確認方法、DB/RLS 変更の有無を書く。
