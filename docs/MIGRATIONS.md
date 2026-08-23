# DBマイグレーション手順（Supabase）

## 原則

- 共有Supabase環境のTable Editor / SQL Editorでschemaを直接変更しない
- すべての変更を `supabase/migrations/*.sql` に残す
- 設計意図は [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) と同じPRで更新する
- リモート適用済みmigrationを書き換えず、新しいmigrationで修正する
- table作成時はRLSと最低限のpolicyを同じ変更単位に含める

## 通常フロー

1. 短命ブランチを作成する。
2. `supabase start` でローカル環境を起動する。
3. `supabase migration new <snake_case_name>` でファイルを作る。
4. DDL、constraint、index、RLS、policyを書く。
5. `supabase db reset` で最初から再構築できることを確認する。ローカルデータが消えるため対象環境を確認して実行する。
6. 匿名・本人・他人の3パターンでRLSを検証する。
7. 型生成を導入済みならDB型を再生成する。
8. migration、設計書、検証内容を同じPRへ含める。

## PRチェック

- [ ] migration名から目的が分かる
- [ ] rollbackまたは修正方針を説明した
- [ ] NOT NULL追加時の既存データを考慮した
- [ ] 外部キーの削除挙動を明示した
- [ ] RLSを有効化し、匿名・本人・他人を確認した
- [ ] `DATABASE_DESIGN.md` と一致している
- [ ] `supabase db reset` が成功した

## リモート反映

Preview / Productionへの適用方法は環境構築時に確定する。確定前に手動適用しない。少なくともProduction前に同一migrationをローカルまたはPreviewで再構築・検証する。

## 緊急時

障害対応で共有環境を直接修正した場合は、実施内容と時刻を記録し、速やかに同等のmigrationと設計書を追加して再現可能な状態へ戻す。
