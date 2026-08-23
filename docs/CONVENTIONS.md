# Next.js / TypeScript コーディング規約

## 命名

| 対象 | 規則 | 例 |
| --- | --- | --- |
| component / type / enum | `PascalCase` | `ExhibitCard`, `ExhibitStatus` |
| function / variable | `camelCase` | `findPublishedItems` |
| boolean | `is` / `has` / `can` / `should` | `isPublished`, `canModerate` |
| hook | `use` + PascalCase相当 | `useHorizontalScroll` |
| constant | 原則 `camelCase`、不変設定は `SCREAMING_SNAKE_CASE` | `categories`, `MAX_IMAGE_SIZE` |
| component file | `kebab-case.tsx` | `item-card.tsx` |
| non-UI TypeScript | `kebab-case.ts` | `toggle-shinmiri.ts` |
| route segment | `kebab-case` | `/exhibits/new` |
| DB | `snake_case` | `shinmiri_reactions` |

- 識別子とファイル名へ日本語・絵文字・空白を使わない
- `id` は短い局所scope以外では対象を明示する（`itemId`）
- handlerは結果を表す名前にする。曖昧な `handleClick` より `handleOpenItem` を使う

## TypeScript

- `strict` を維持し、`any` を使わない。未知の外部入力は `unknown` から検証する
- DB生成型を再定義しない。ただしUI用DTOとdomain型はDB行から分離してよい
- `as` による強制よりtype guard・schema validationを優先する
- client/server境界を越える値はserializableにする
- エラーを握りつぶさず、利用者向け結果と調査用ログを分ける

## React / Next.js

- Server Componentを既定とする
- `"use client"` は必要な最小ファイルに置く
- pageはrouteとcompositionに集中し、再利用部品とdomain logicを分離する
- propsは変更不可として扱い、stateを直接変更しない
- listのkeyに配列indexを使わず、安定したIDを使う
- `<button>`、heading、landmark、labelなどネイティブHTMLの意味を優先する
- `next/image`, metadata, Linkなど導入済みNext.jsの機能は、ローカル公式docsを確認して使う

## CSS

- 色、余白、影、z-indexなど繰り返す値はdesign tokenへ寄せる
- `globals.css` はreset・token・全体レイアウトに限定し、機能固有CSSはmoduleへ移す
- `!important` は原則使わない
- hoverだけに依存せず、keyboard focusとtouch相当の操作を用意する
- motionには `prefers-reduced-motion` を用意する

## import

- Node / package / project内部 / relative / styleの順でまとまりを作る
- 循環依存を避ける。domainからpresentationやinfrastructureをimportしない
- barrel exportは境界が明確になる場合だけ使い、依存元を隠しすぎない
