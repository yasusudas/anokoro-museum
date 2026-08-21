# データベース設計

Supabase PostgreSQLの設計意図を管理する。サークル内ハッカソン用プロダクトのため開発スピードを最優先とし、テーブル結合を最小限に抑えたフラットでシンプルな構成を採用する。運営ロール・展示審査・モデレーションは意図的に持たない（[スコープ外の記録](#スコープ外の記録)）。

## ER図

```mermaid
erDiagram
  auth_users ||--|| users : has
  users ||--o{ items : submits
  items ||--o{ comments : receives
  users ||--o{ comments : writes
  comments ||--o{ comment_likes : receives
  users ||--o{ comment_likes : likes
  items ||--o{ shinmiri_reactions : receives
  users ||--o{ shinmiri_reactions : reacts
```

## 共通ルール

- table / column / constraint: `snake_case`
- 展示品を表すtableは `items` に固定する。設計書・UI・URLの内部識別子もすべて `item` 系で統一する
- 主キー: UUIDの `id`（`gen_random_uuid()`。拡張機能が不要なため `uuid_generate_v4()` は使わない）
- 時刻: `timestamptz`。更新される可能性のあるtableだけ `updated_at` を持つ
- ユーザー参照: `auth.users(id)` を起点としたUUID外部キー
- **RLSはtable作成と同じmigrationで有効化する。** 無効のままPreview / Productionへ出さない
- 生まれ年（F-01）はDBで管理しない。クライアント側の一時保存のみとする

## テーブル一覧

| table | 役割 | 備考 |
| --- | --- | --- |
| `users` | ユーザー情報 | Authと連動。表示名のみを保持し、個人情報を持たない |
| `items` | 展示品本体 | 画像・カテゴリを別テーブルにせず直接保持 |
| `comments` | コメント | 投稿と本人による物理削除のみ。編集不可 |
| `comment_likes` | コメントいいね | 1ユーザー1コメント1件 |
| `shinmiri_reactions` | しんみり | 1ユーザー1展示1件 |

## 主要列

### `users`

| column | type | rule |
| --- | --- | --- |
| `id` | uuid | PK、`auth.users.id` (ON DELETE CASCADE) |
| `user_name` | varchar | NOT NULL |
| `created_at`, `updated_at` | timestamptz | NOT NULL DEFAULT `now()` |

生まれ年を持たないため、このtableは表示名のみの公開情報となる。匿名SELECTを許可しても個人情報を露出しない。

### `items`

| column | type | rule |
| --- | --- | --- |
| `id` | uuid | PK、DEFAULT `gen_random_uuid()` |
| `user_id` | uuid | FK `users.id` (ON DELETE CASCADE)、NULL可 |
| `title` | varchar | NOT NULL |
| `description` | text | NOT NULL |
| `category` | varchar | NOT NULL。CHECK制約で `おかし` / `ゲーム` / `たべもの` / `ほん` / `できごと` に限定 |
| `theme` | varchar | NOT NULL。画像未設定時のフォールバックアート識別子（`gummy`, `watch` など） |
| `image_path` | text | Supabase Storageのオブジェクトキー。外部URLは保存しない |
| `image_alt` | text | 画像の代替テキスト（F-03） |
| `birth_year_start` | int | NOT NULL。主に記憶を共有する来場者の生まれ年の開始 |
| `birth_year_end` | int | NOT NULL。主に記憶を共有する来場者の生まれ年の終了 |
| `created_at`, `updated_at` | timestamptz | NOT NULL DEFAULT `now()` |

制約:

- `CHECK (birth_year_end >= birth_year_start)`
- `user_id` が `NULL` の行は seed で投入した初期展示を表す。RLSの所有者判定が成立しないため、誰も更新・削除できない

`birth_year_start` / `birth_year_end` は**主に記憶を共有する来場者の生まれ年の範囲**であり、展示自体が流行した年ではない。F-01で端末内に保持する来場者自身の生まれ年とは別の概念である。

### `comments`

| column | type | rule |
| --- | --- | --- |
| `id` | uuid | PK、DEFAULT `gen_random_uuid()` |
| `item_id` | uuid | FK `items.id` (ON DELETE CASCADE)、NOT NULL |
| `user_id` | uuid | FK `users.id` (ON DELETE CASCADE)、NOT NULL |
| `content` | text | NOT NULL。CHECK制約で trim後1〜500文字 |
| `created_at` | timestamptz | NOT NULL DEFAULT `now()` |

編集を提供しないため `updated_at` を持たない。本人削除は物理削除とする。

### `comment_likes`

| column | type | rule |
| --- | --- | --- |
| `id` | uuid | PK、DEFAULT `gen_random_uuid()` |
| `comment_id` | uuid | FK `comments.id` (ON DELETE CASCADE)、NOT NULL |
| `user_id` | uuid | FK `users.id` (ON DELETE CASCADE)、NOT NULL |
| `created_at` | timestamptz | NOT NULL DEFAULT `now()` |

制約: `UNIQUE(comment_id, user_id)`。ログインユーザーは付与・解除でき、匿名ユーザーは件数だけを閲覧する。コメントが物理削除されると、関連するいいねもCASCADEで削除される。

### `shinmiri_reactions`

| column | type | rule |
| --- | --- | --- |
| `id` | uuid | PK、DEFAULT `gen_random_uuid()` |
| `item_id` | uuid | FK `items.id` (ON DELETE CASCADE)、NOT NULL |
| `user_id` | uuid | FK `users.id` (ON DELETE CASCADE)、NOT NULL |
| `created_at` | timestamptz | NOT NULL DEFAULT `now()` |

制約: `UNIQUE(item_id, user_id)`。1ユーザーにつき1展示1回までをDBレベルで保証する。行を更新しないため `updated_at` を持たない。

## RLS方針

全tableでRLSを有効化する。運営ロールが存在しないため、判定は「匿名 / ログイン済み / 所有者」の3種類だけで済む。

| table | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `users` | 全員 | トリガー経由のみ | 本人 | 不可（`auth.users` 削除にCASCADE） |
| `items` | 全員 | ログイン済み・本人名義 | 本人 | 本人 |
| `comments` | 全員 | ログイン済み・本人名義 | 不可（編集なし） | 本人 |
| `comment_likes` | 全員 | ログイン済み・本人名義 | 不可 | 本人 |
| `shinmiri_reactions` | 全員 | ログイン済み・本人名義 | 不可 | 本人 |

- INSERTは `WITH CHECK (auth.uid() = user_id)` で本人名義を強制する
- UPDATE / DELETEは `USING (auth.uid() = user_id)` で所有者を照合する
- 公開状態（status）を持たないため、SELECTに条件分岐は不要

## `users` の自動作成

RLS有効下ではクライアントから `users` をINSERTできない。`auth.users` へのINSERTに対する `SECURITY DEFINER` トリガーを唯一の作成経路とする。

- `user_name` は `raw_user_meta_data` から取得し、無い場合はメールアドレスのローカル部などを既定値にする
- トリガーが無いと、サインアップ直後の投稿・コメントが外部キー違反で失敗する

## `updated_at` の更新

`users` と `items` に `BEFORE UPDATE` トリガーを設定し、`now()` を代入する。`comments`、`comment_likes`、`shinmiri_reactions` は更新しないため不要。

## インデックス

- `comments(item_id, created_at DESC)` — 展示詳細のコメント取得
- `items(category)` / `items(birth_year_start, birth_year_end)` — F-02の絞り込み
- `comment_likes` は `UNIQUE(comment_id, user_id)` が `comment_id` 先頭の複合indexになるため追加不要
- `shinmiri_reactions` は `UNIQUE(item_id, user_id)` が `item_id` 先頭の複合indexになるため追加不要

データ量が少ないうちは効果が小さいが、記述コストがほぼ無いため最初から入れる。

## しんみり件数の取得

`items` に非正規化したカウント列を持たせず、`shinmiri_reactions` を集計する。一覧では展示ごとに問い合わせず、`item_id` ごとの件数を1クエリでまとめて取得する。

## コメントいいね件数の取得

`comments` に非正規化したカウント列を持たせず、`comment_likes` を集計する。コメントごとの問い合わせを繰り返さず、一覧に含まれる `comment_id` ごとの件数を1回のgrouped queryで取得する。

## Realtime

MVPでは有効化しない。PRDのMVP対象外にリアルタイム機能が含まれ、コメント・しんみりの反映はServer Actionと再検証で足りるため（[API_DESIGN.md](./API_DESIGN.md)）。

## スコープ外の記録

サークル内ハッカソン用途のため、以下を意図的に持たない。不特定多数へ公開する場合は再検討する。

| 省略したもの | 影響 |
| --- | --- |
| 運営 / モデレーターのロール | 権限判定が「本人かどうか」だけになる |
| 展示の公開状態（`status`）と審査フロー | 投稿は即時公開される |
| コメントの論理削除・運営による非表示 | 不適切な投稿へ運営が対処する手段がない |
| 画像の出典・権利確認（`image_source` / `rights_confirmed`） | 権利確認は投稿者の自己申告に依存する |
| 生まれ年のDB保存 | F-01は端末内の一時保存に留まり、再ログインでは復元されない |
| 展示のslug | URLは `/items/{uuid}` になる。後からslugを導入すると既存URLが変わる |
| コメントの論理削除 | 物理削除のため、後から論理削除へ移行してもデータを復元できない |
