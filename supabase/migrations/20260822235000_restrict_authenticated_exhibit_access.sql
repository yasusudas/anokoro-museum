-- 公開1Fの固定展示だけを匿名閲覧可能とし、投稿展示と交流データは認証済みに限定する。

drop policy if exists "展示を読み取れる" on public.items;
create policy "公開展示またはログイン済み展示を読み取れる"
on public.items
for select
using (
  (select auth.uid()) is not null
  or id in (
    'abccab1c-030a-46ca-a77e-403558a7b4e3'::uuid,
    '96d0cc6b-ef33-4d69-b5f0-8e5371ab3c29'::uuid,
    '01b2a5ce-d7f5-48a5-83be-c02acbe44673'::uuid,
    'f5336f5e-34f3-4dad-b26a-516a70e92e1f'::uuid,
    '5fbf3448-5776-4765-8676-8a7a7ca7531f'::uuid,
    '052dd450-347a-4166-8b4c-da075e9a796d'::uuid,
    '5a802a54-d1eb-490d-a167-53714978ffeb'::uuid,
    '3bf75231-81b2-4701-a1f5-2a28ec4918b5'::uuid
  )
);

drop policy if exists "コメントを読み取れる" on public.comments;
create policy "ログイン済みならコメントを読み取れる"
on public.comments
for select
using ((select auth.uid()) is not null);

drop policy if exists "しんみりを読み取れる" on public.shinmiri_reactions;
create policy "ログイン済みならしんみりを読み取れる"
on public.shinmiri_reactions
for select
using ((select auth.uid()) is not null);
