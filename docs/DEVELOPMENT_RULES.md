# チーム開発ルール

## ブランチ

- `main` は常にデプロイ可能に保ち、原則直接pushしない
- 作業は短命ブランチからPRを作る
- ブランチの説明部分は、英小文字・数字・ハイフンだけの **kebab-case** にする
- 形式は `<type>/<kebab-case>` とする
- `type` は `feature`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf` のいずれかを使う
- Codexで作成する場合だけ、環境の既定に合わせて `codex/<kebab-case>` とする
- 1ブランチ・1PRは1つの目的に絞る

```text
feature/add-item-thread
fix/modal-focus-trap
docs/update-database-design
codex/add-item-thread
```

`feature/AddExhibitThread`、`feature/add_exhibit_thread`、`feature/展示追加` は使用しない。

## コミットメッセージ

### 形式

```text
type: 日本語で変更内容を一文
```

| type | 用途 |
| --- | --- |
| `add` | 新機能・新規ファイルの追加 |
| `fix` | 不具合修正 |
| `refactor` | 挙動を変えない構造改善 |
| `test` | テスト追加・修正 |
| `docs` | 文書だけの変更 |
| `style` | 見た目・CSS中心の変更 |
| `perf` | パフォーマンス改善 |
| `chore` | 設定、依存、補助作業 |

例:

- `add: 展示詳細のコメント投稿機能を実装`
- `fix: 横スクロール時にモーダルがずれる不具合を修正`
- `docs: データベース設計とRLS方針を追加`

コミット本文が必要な場合は「なぜ」「影響」「移行上の注意」を書く。生成ツール名など変更内容と無関係なtrailerは付けない。

## Pull Request

- タイトルも `type: 日本語` 形式にする
- リポジトリ直下の [`.github/pull_request_template.md`](../.github/pull_request_template.md) は、GitHubでPRを新規作成すると本文へ自動挿入される
- 自動挿入された各見出しを削除せず、該当しない項目は「なし」と記載する
- 未完成の共有はDraft PRにし、レビュー可能になってからReadyへ変更する
- UI変更には画像または動画を添える
- DB変更にはmigration、RLS確認、設計書更新を含める
- 原則として作成者以外がレビューしてからmergeする

## レビュー観点

- 要件・受け入れ条件を満たすか
- Server / Client境界と責務配置が妥当か
- 認証ではなく認可まで強制されているか
- エラー・空状態・loading・再試行が考慮されているか
- keyboard操作、focus、contrast、motionへ配慮しているか
- 秘密値、個人情報、画像権利情報を安全に扱っているか
- migrationとDB設計が一致するか

## Push前の確認

```bash
npm run lint
npm run build
```

- コミット時のpre-commitフックとCI（`.github/workflows/ci.yml`）が同じ2コマンドを実行する。
- フックは初回のみ `./scripts/setup-hooks` で有効化する（`core.hooksPath=.githooks`）。
- ブランチ名は `.github/workflows/pr-validation.yml` がPR時に検証する。命名は本ファイルの「ブランチ」節に従う。
- コミットメッセージのAIツール表記は `.githooks/commit-msg` が拒否する。
- テストを追加したら、pre-commitフックとCIの両方へ同じコマンドを追記する。
- `--no-verify` は緊急時に限り、PR本文へ理由を書く。

## 秘密情報と依存関係

- secret、token、password、service role keyをcommitしない
- `.env.example` には変数名と説明だけを置く
- `NEXT_PUBLIC_*` は全利用者から見える前提で扱う
- lockfileをcommitし、依存追加・大型updateは理由とlicense上の注意をPRに書く

## 禁止事項

- 共有Supabase環境のschemaをmigrationなしで直接変更する
- lint / type errorを理由なく無効化する
- 他者の変更を無関係なPRで巻き戻す
- 著作権・利用条件を確認していない画像を公開展示へ登録する
- 認可をクライアントUIの非表示だけで済ませる
