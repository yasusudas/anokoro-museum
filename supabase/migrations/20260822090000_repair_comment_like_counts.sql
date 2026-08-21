create table if not exists public.comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

alter table public.comment_likes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'comment_likes'
      and policyname = 'comment_likes_select_own'
  ) then
    create policy comment_likes_select_own
      on public.comment_likes
      for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'comment_likes'
      and policyname = 'comment_likes_insert_own'
  ) then
    create policy comment_likes_insert_own
      on public.comment_likes
      for insert
      to authenticated
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'comment_likes'
      and policyname = 'comment_likes_delete_own'
  ) then
    create policy comment_likes_delete_own
      on public.comment_likes
      for delete
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end
$$;

create or replace function public.get_comment_like_counts(comment_ids uuid[])
returns table (comment_id uuid, like_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select requested.comment_id, count(likes.id)::bigint
  from (
    select distinct input.comment_id
    from unnest(comment_ids) as input(comment_id)
  ) as requested
  inner join public.comments as comments on comments.id = requested.comment_id
  left join public.comment_likes as likes on likes.comment_id = comments.id
  group by requested.comment_id;
$$;

revoke all on function public.get_comment_like_counts(uuid[]) from public;
grant execute on function public.get_comment_like_counts(uuid[]) to anon, authenticated;
grant insert, delete on public.comment_likes to authenticated;
grant select on public.comment_likes to authenticated;
