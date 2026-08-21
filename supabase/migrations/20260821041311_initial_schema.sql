create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  user_name varchar not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  title varchar not null check (
    char_length(regexp_replace(replace(title, chr(12288), ' '), '^[[:space:]]+|[[:space:]]+$', '', 'g')) >= 1
  ),
  description text not null check (
    char_length(regexp_replace(replace(description, chr(12288), ' '), '^[[:space:]]+|[[:space:]]+$', '', 'g')) >= 1
  ),
  category varchar not null check (category in ('おかし', 'ゲーム', 'たべもの', 'ほん', 'できごと')),
  theme varchar not null,
  image_path text not null check (
    char_length(regexp_replace(replace(image_path, chr(12288), ' '), '^[[:space:]]+|[[:space:]]+$', '', 'g')) >= 1
  ),
  image_alt text not null check (
    char_length(regexp_replace(replace(image_alt, chr(12288), ' '), '^[[:space:]]+|[[:space:]]+$', '', 'g')) >= 1
  ),
  image_rights_confirmed boolean not null default false check (image_rights_confirmed),
  birth_year_start integer not null,
  birth_year_end integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (birth_year_start >= 1900),
  check (birth_year_end >= birth_year_start)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  content text not null check (
    char_length(content) <= 500
    and char_length(
      regexp_replace(replace(content, chr(12288), ' '), '^[[:space:]]+|[[:space:]]+$', '', 'g')
    ) between 1 and 500
  ),
  created_at timestamptz not null default now()
);

create table public.comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

create table public.shinmiri_reactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (item_id, user_id)
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create trigger set_items_updated_at
before update on public.items
for each row
execute function public.set_updated_at();

create function public.validate_item_birth_year_range()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  current_year integer := extract(year from timezone('Asia/Tokyo', current_timestamp))::integer;
begin
  if new.birth_year_start > current_year or new.birth_year_end > current_year then
    raise exception 'birth_year_range must not exceed the current year (%).', current_year
      using errcode = '22023';
  end if;

  return new;
end;
$$;

create trigger validate_items_birth_year_range
before insert or update of birth_year_start, birth_year_end on public.items
for each row
execute function public.validate_item_birth_year_range();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, user_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'user_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      'あのころの来場者-' || left(replace(gen_random_uuid()::text, '-', ''), 8)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create index comments_item_id_created_at_idx on public.comments (item_id, created_at desc);
create index items_category_idx on public.items (category);
create index items_birth_year_range_idx on public.items (birth_year_start, birth_year_end);

alter table public.users enable row level security;
alter table public.items enable row level security;
alter table public.comments enable row level security;
alter table public.comment_likes enable row level security;
alter table public.shinmiri_reactions enable row level security;

create policy "公開プロフィールを読み取れる"
on public.users
for select
using (true);

create policy "本人のプロフィールを更新できる"
on public.users
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "展示を読み取れる"
on public.items
for select
using (true);

create policy "本人名義で展示を作成できる"
on public.items
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "本人の展示を更新できる"
on public.items
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "本人の展示を削除できる"
on public.items
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "コメントを読み取れる"
on public.comments
for select
using (true);

create policy "本人名義でコメントを作成できる"
on public.comments
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "本人のコメントを削除できる"
on public.comments
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "本人のコメントいいねを読み取れる"
on public.comment_likes
for select
to authenticated
using ((select auth.uid()) = user_id);

create function public.get_comment_like_counts(comment_ids uuid[])
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

create policy "本人名義でコメントいいねを付けられる"
on public.comment_likes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "本人のコメントいいねを削除できる"
on public.comment_likes
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "しんみりを読み取れる"
on public.shinmiri_reactions
for select
using (true);

create policy "本人名義でしんみりを付けられる"
on public.shinmiri_reactions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "本人のしんみりを削除できる"
on public.shinmiri_reactions
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.users, public.items, public.comments, public.shinmiri_reactions to anon, authenticated;
grant select on public.comment_likes to authenticated;
grant update on public.users to authenticated;
grant insert, delete on public.items to authenticated;
revoke update on public.items from authenticated;
grant update (title, description, category, theme, image_path, image_alt, image_rights_confirmed, birth_year_start, birth_year_end)
on public.items to authenticated;
grant insert, delete on public.comments, public.comment_likes, public.shinmiri_reactions to authenticated;
revoke all on function public.get_comment_like_counts(uuid[]) from public;
grant execute on function public.get_comment_like_counts(uuid[]) to anon, authenticated;
