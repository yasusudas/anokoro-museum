# あのころミュージアム ドキュメント

プロダクト・技術・運用の判断を、役割ごとに分けて管理する。実装や仕様を変更した場合は、同じプルリクエストで該当文書も更新する。

## 読む順番

| 文書 | 役割 | 主な読者 |
| --- | --- | --- |
| [PRD.md](./PRD.md) | 誰の何を、なぜ作るか | 全員 |
| [FEATURE_REQUIREMENTS.md](./FEATURE_REQUIREMENTS.md) | 機能ごとの受け入れ条件 | デザイン・開発・QA |
| [TRD.md](./TRD.md) | どの技術で、どう作るか | 開発者 |
| [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) | システム全体と主要データフロー | 全員 |
| [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md) | コードの配置と依存方向 | 開発者 |
| [API_DESIGN.md](./API_DESIGN.md) | Server Actions・Route Handlers・Supabase の境界 | 開発者 |
| [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) | テーブル、制約、RLS | 開発者 |
| [MIGRATIONS.md](./MIGRATIONS.md) | DB変更の作業手順 | 開発者 |
| [CONVENTIONS.md](./CONVENTIONS.md) | TypeScript・Next.js・命名規則 | 開発者 |
| [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md) | Git・コミット・PR・レビュー運用 | 全員 |

## 文書の優先関係

- プロダクト判断の正: `PRD.md`
- 実装単位の振る舞いの正: `FEATURE_REQUIREMENTS.md`
- 技術方針の正: `TRD.md`
- DB設計意図の正: `DATABASE_DESIGN.md`
- 実際に適用されるDBスキーマの正: `supabase/migrations/*.sql`
- GitHubで自動挿入されるPR本文の正: `.github/pull_request_template.md`

矛盾を見つけた場合は、上位文書を勝手に読み替えず、同じPRで解消する。
