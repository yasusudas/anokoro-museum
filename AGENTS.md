# AGENTS.md

Codex / Claude などのAIコーディングエージェントは、このリポジトリで作業する前に本ファイルを読み、以下のルールに従う。

## 基本方針

- 回答・説明・PRコメントは日本語で書く。
- 作業前に現在のブランチと差分を確認する。
- 編集や実装の前に、作業内容に対応する作業ブランチにいることを確認する。`main` / `develop`、または目的が異なるブランチにいる場合は、編集前に新規ブランチを作る。
- 未コミット差分の由来や目的が不明な場合は、ブランチ作成や実装の前にユーザーへ確認する。
- 既存コード・docsを優先し、無関係なリファクタリングやフォーマット変更を混ぜない。他者の変更を巻き戻さない。
- 生成ツール名など変更内容と無関係なtrailer（`Co-Authored-By`等）をコミットメッセージへ付けない。

## 必ず参照するドキュメント

開発・実装は以下の文書を正とする。変更時は同じPRで該当文書を更新する。

| 内容 | パス |
| --- | --- |
| 開発ルール全体（Git / コミット / PR / 禁止事項） | `docs/DEVELOPMENT_RULES.md` |
| コーディング規約（命名・TS・React・CSS・import） | `docs/conventions.md` |
| プロダクト要件（何を・誰のために・なぜ） | `docs/PRD.md` |
| 機能要件（F-01〜F-09・受け入れ条件） | `docs/FEATURE_REQUIREMENTS.md` |
| 技術方針（スタック・アーキテクチャ・非機能） | `docs/TRD.md` |
| コード配置と依存方向 | `docs/ARCHITECTURE_GUIDE.md` |
| API 境界（Server Actions / Route Handlers / Supabase） | `docs/API_DESIGN.md` |
| DB 設計と RLS | `docs/DATABASE_DESIGN.md` |
| DB マイグレーション手順 | `docs/MIGRATIONS.md` |
| 参考資料と採用・不採用の記録 | `docs/REFERENCE_NOTES.md` |

## よく使うコマンド

```bash
npm run dev
npm run lint
npm run build
```

テストを導入したら、CIと同じコマンドをここへ追記する。

## Git / ブランチ / コミット

- ブランチ命名、コミットメッセージ、PR運用は `docs/DEVELOPMENT_RULES.md` に従う。
- pushは `git push -u origin <branch>` または `git push origin <branch>` を使う。`--force` 系は使わない。
- コミットメッセージは `type: 日本語で変更内容を一文` 形式（`add` / `fix` / `refactor` / `test` / `docs` / `style` / `perf` / `chore`）。

## 実装時の注意

- Next.js 16の規約・APIは、このリポジトリの `node_modules/next/dist/docs/` を確認してから使う。
- Server Componentを既定とし、`"use client"` は必要な最小ファイルに置く。pageは薄く保つ。
- 認可はクライアントUIの非表示だけでは済ませず、DB/RLSまたはサーバーで強制する。
- 秘密値・service role keyをブラウザへ渡さない。`NEXT_PUBLIC_*` は全利用者から見える前提で扱う。
- 環境変数を追加・変更した場合は `.env.example` も更新する。
- 成果物に不要なコメントアウトや説明用コメントを残さない。
- コミット前に `npm run lint` と `npm run build` を通す（pre-commitフックが同じ内容を実行する）。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
