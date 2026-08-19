# あのころミュージアム

世代ごとの「懐かしいもの」をオンライン展示室として並べ、個人の記憶と世代間の会話を生むWebアプリ。team-2:watnow 2026夏ハッカソン向けプロダクト。

## ドキュメント

プロダクト・技術・運用の判断は `docs/` に分けて管理しています。読み方と優先関係は [docs/README.md](./docs/README.md) を参照してください。

- [PRD](./docs/PRD.md) — 誰の何を、なぜ作るか
- [FEATURE_REQUIREMENTS](./docs/FEATURE_REQUIREMENTS.md) — 機能ごとの受け入れ条件
- [TRD](./docs/TRD.md) — どの技術で、どう作るか
- [ARCHITECTURE_GUIDE](./docs/ARCHITECTURE_GUIDE.md) — コードの配置と依存方向
- [API_DESIGN](./docs/API_DESIGN.md) — Server Actions・Route Handlers・Supabaseの境界
- [DATABASE_DESIGN](./docs/DATABASE_DESIGN.md) — テーブル、制約、RLS
- [DEVELOPMENT_RULES](./docs/DEVELOPMENT_RULES.md) — Git・コミット・PR・レビュー運用

AIコーディングエージェント向けの入口は [AGENTS.md](./AGENTS.md)。

## Tech Stack

| 領域 | 技術 |
| --- | --- |
| Web | Next.js 16 App Router / React 19 / TypeScript |
| CSS | Tailwind CSS 4 + CSS Modules |
| Backend | Next.js + Supabase（Auth / PostgreSQL / Storage） |
| Hosting | Vercel |

## セットアップ

```bash
npm install
cp .env.example .env.local   # 変数名と説明を確認して値を埋める
npm run dev
```

<http://localhost:3000> を開くと展示回廊が表示されます。

## 開発

```bash
npm run dev     # 開発サーバー
npm run lint    # ESLint
npm run build   # 本番ビルド
```

初回のみgitフックを有効化してください（コミット時に lint + build が走ります）。

```bash
./scripts/setup-hooks
```

ブランチ・コミット・PRの運用は [DEVELOPMENT_RULES.md](./docs/DEVELOPMENT_RULES.md) に従います。

## 環境変数

環境変数の一覧と説明は `.env.example` を参照してください。秘密値はコミットせず、値はVercel・Supabaseの管理画面で管理します。
