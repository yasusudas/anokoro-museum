# 参考資料と採用・不採用の記録

ハーネス（AI向けドキュメント・開発ルール・機械的強制）を設計するにあたり参照したリポジトリと、採用・不採用の判断を記録する。将来の見直しや他プロジェクトへの展開の際に参照する。

## 参照リポジトリ

| リポジトリ | 概要 | 調査時点 |
| --- | --- | --- |
| [Yuuuki16/HangWat](https://github.com/Yuuuki16/HangWat) | Next.js + Hono + PrismaのWebアプリ。AGENTS.md/CLAUDE.md同期型、docs/development/集約、CIによるブランチ名強制 | 2026-08-19 |
| [junpei0315/SubTrack](https://github.com/junpei0315/SubTrack) | Expo + Supabaseのモバイルアプリ。PRD/TRD/機能/API/DBの階層型docs、「リポジトリ上の正」明示、CodeRabbit層別指示 | 2026-08-19 |

## 採用したパターン

### SubTrack由来

- **文書階層**: PRD → TRD → FEATURE_REQUIREMENTS → API_DESIGN → DATABASE_DESIGN → ARCHITECTURE_GUIDE/OVERVIEW → MIGRATIONS の6系統構成を踏襲した。
- **「リポジトリ上の正」の明示**: 文書ごとに「この文書が正、外部メモは補助」と宣言し、矛盾時は同じPRで解消するルールを `docs/README.md` の優先関係に反映した。
- **段階的導入**: クリーンアーキテクチャを過剰に強制せず、「薄い画面は簡略、ロジックが増えたら層へ切り出す」を `docs/ARCHITECTURE_GUIDE.md` に明記した。
- **PRテンプレートのセルフチェック**: `.github/pull_request_template.md` にチェックリストを持たせる運用を採用した。
- **pre-pushフック**: lint + typecheckをCIと同一コマンドで実行する仕組みを、npm script構成に合わせてpre-commitフック（lint + build）へ読み替えて採用した。

### HangWat由来

- **AGENTS.md/CLAUDE.mdの同期**: `CLAUDE.md` は `@AGENTS.md` 参照のみとし、実体をAGENTS.mdへ一本化した（記述の分岐・乖離を防ぐ）。
- **入口は薄く、正はdocsへ**: 入口ファイルには「必ず参照するドキュメント」リストと基本方針だけを置き、詳細ルールを `docs/` へ寄せた。
- **コミットメッセージ**: `type: 日本語で一文` の形式を採用した。type一覧はSubTrackの `add` 系とHangWatのConventional Commitsを合わせ、ハッカソン規模に合うよう `add/fix/refactor/test/docs/style/perf/chore` に絞った。
- **機械的強制の自動化**: ブランチ命名をCIで検証するパターンをPR検証workflow（lint + build + ブランチ名チェック）として採用した。

## 採用しなかったパターンと理由

| パターン | 理由 |
| --- | --- |
| Git Flow（`main` / `develop` 分離 + `feature/PascalCase`） | ハッカソン規模ではdevelop分岐のオーバーヘッドが大きい。`main` + 短命ブランチのトランク運用を選んだ（既存リポジトリのブランチ運用とも整合） |
| `feature/PascalCase` 命名 | `docs/DEVELOPMENT_RULES.md` で全typeをkebab-caseへ統一済みのため。大文字混在はシェル・URL・クロスOSで事故りやすい |
| AGENTS.mdとCLAUDE.mdに同一内容を複製する方式（HangWat） | 片方だけ更新するリスクがあるため、CLAUDE.mdはAGENTS.mdへの参照のみとした |
| CodeRabbit設定（`.coderabbit.yaml`） | ハッカソンの短期間ではレビューbotの運用コストが利得を上回る。導入する場合はSubTrackの層別path_instructionsが参考になる |
| create-prスキル（`.claude/skills/`） | 自動修正ループは便利だが、途中リポジトリとパスのズレが残っていた。ブランチ確認・lint・ビルド・PRテンプレート埋めをAGENTS.mdで標準化し、自動化は必要になったら追加する |
| `pnpm verify` 単一コマンド集約 | 現状のnpm script構成（dev/lint/build）で足りるため。スクリプトが増えたら再検討する |
| 3重ルール（cursor rules / coderabbit / docs） | 記述の乖離リスクが大きい。ルールの実体はdocsへ一本化し、ツール固有設定は最小限にした |

## 調査時の気づき

- HangWatの `.githoocks/commit-msg` はディレクトリ名のタイポ（`.githoocks`）により機能していない。フックの検証は必ず実際にコミットして確かめる。
- HangWatのcreate-prスキルには `apps/web/src/`、`tmp/plans/` などリポジトリ実体とズレたパスが残っていた。自動化スキルは実際のツリーと突き合わせてから使う。
- SubTrackはPRD/TRDに未記入欄（KPI・非機能要件など）が多い。文書は「穴を残して埋める運用」でも、入口から正へ確実に到達できれば機能する。
- 両リポジトリともAIツール表記（`Made with Cursor` / `Co-Authored-By`）を禁止しており、本リポジトリも同じ方針を `docs/DEVELOPMENT_RULES.md` の禁止事項に含めた。
