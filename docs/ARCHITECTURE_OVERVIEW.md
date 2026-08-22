# アーキテクチャ全体図

## システム全体

```mermaid
flowchart TB
  User["来場者 / 投稿者"]
  Browser["PC Browser"]
  subgraph Vercel["Vercel"]
    Next["Next.js App Router"]
    SC["Server Components"]
    SA["Server Actions / Route Handlers"]
  end
  subgraph Supabase["Supabase"]
    Auth["Auth"]
    REST["PostgREST + RLS"]
    DB[("PostgreSQL")]
    Storage["Storage"]
  end

  User --> Browser --> Next
  Next --> SC
  Next --> SA
  SC --> REST --> DB
  SA --> Auth
  SA --> REST
  SA --> Storage
```

## アプリ内の依存方向

```mermaid
flowchart LR
  Presentation["presentation\napp / components"] --> Application["application\nuse cases"]
  Application --> Domain["domain\ntypes / rules"]
  Application --> Ports["ports\nrepository interfaces"]
  Infrastructure["infrastructure\nSupabase adapters"] -. implements .-> Ports
  Infrastructure --> Domain
  Presentation --> Infrastructure
```

`domain` はNext.js、React、Supabaseへ依存しない。薄い読み取り処理ではpresentationからinfrastructureを直接利用できるが、認可や複数更新を含む処理はapplicationを経由する。

## 主要データフロー

### 展示を閲覧する

```mermaid
sequenceDiagram
  participant U as 来場者
  participant P as Next.js Page
  participant R as Item Repository
  participant DB as Supabase
  U->>P: 年代・カテゴリ付きURLを開く
  P->>R: 公開展示を問い合わせる
  R->>DB: SELECT (RLS)
  DB-->>R: 一覧DTO
  R-->>P: ExhibitSummary[]
  P-->>U: 回廊をServer Render
```

### しんみりを付ける

```mermaid
sequenceDiagram
  participant U as 登録ユーザー
  participant C as Client Component
  participant A as Server Action
  participant DB as Supabase
  U->>C: しんみりを押す
  C->>C: 楽観的に表示更新
  C->>A: toggleShinmiri(itemId)
  A->>DB: insert / delete (JWT + RLS)
  DB-->>A: result
  alt 失敗
    A-->>C: typed error
    C->>C: 表示をロールバック
  else 成功
    A-->>C: canonical state
  end
```

### 展示候補を投稿する

投稿は保存と同時に公開され、以降は投稿者本人でも編集・削除できない。運営にも編集削除は不可。

```mermaid
stateDiagram-v2
  [*] --> published: 投稿者がフォーム送信
  published --> [*]: 運営がサーバー側権限で取り下げ
```

## デプロイ単位

- Web: Vercel Preview / Production
- Auth・DB・Storage: Supabase環境ごと
- スキーマ: `supabase/migrations` を順番に適用
- 環境変数: VercelとSupabaseの管理画面で値を管理し、名前だけを `.env.example` に記載
