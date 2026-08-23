create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.users (id) on delete cascade,
  actor_user_id uuid not null references public.users (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  event_type varchar not null check (event_type in ('comment', 'shinmiri')),
  comment_id uuid references public.comments (id) on delete cascade,
  shinmiri_reaction_id uuid references public.shinmiri_reactions (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (event_type = 'comment' and comment_id is not null and shinmiri_reaction_id is null)
    or
    (event_type = 'shinmiri' and comment_id is null and shinmiri_reaction_id is not null)
  ),
  unique (comment_id),
  unique (shinmiri_reaction_id)
);

create index notifications_recipient_created_at_idx
on public.notifications (recipient_user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "本人宛ての通知を読み取れる"
on public.notifications
for select
to authenticated
using ((select auth.uid()) = recipient_user_id);

create policy "本人宛ての通知を既読にできる"
on public.notifications
for update
to authenticated
using ((select auth.uid()) = recipient_user_id)
with check ((select auth.uid()) = recipient_user_id);

grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create function public.create_comment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select items.user_id into owner_id
  from public.items
  where items.id = new.item_id;

  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (
      recipient_user_id,
      actor_user_id,
      item_id,
      event_type,
      comment_id
    ) values (
      owner_id,
      new.user_id,
      new.item_id,
      'comment',
      new.id
    );
  end if;

  return new;
end;
$$;

create trigger create_notification_after_comment
after insert on public.comments
for each row
execute function public.create_comment_notification();

create function public.create_shinmiri_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select items.user_id into owner_id
  from public.items
  where items.id = new.item_id;

  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (
      recipient_user_id,
      actor_user_id,
      item_id,
      event_type,
      shinmiri_reaction_id
    ) values (
      owner_id,
      new.user_id,
      new.item_id,
      'shinmiri',
      new.id
    );
  end if;

  return new;
end;
$$;

create trigger create_notification_after_shinmiri
after insert on public.shinmiri_reactions
for each row
execute function public.create_shinmiri_notification();

