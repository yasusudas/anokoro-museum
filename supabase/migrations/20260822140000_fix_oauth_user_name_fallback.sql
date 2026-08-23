create or replace function public.handle_new_user()
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
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      'あのころの来場者-' || left(replace(gen_random_uuid()::text, '-', ''), 8)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

update public.users as target
set user_name = source.oauth_user_name
from (
  select
    auth_users.id,
    coalesce(
      nullif(btrim(auth_users.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(auth_users.raw_user_meta_data ->> 'name'), '')
    ) as oauth_user_name
  from auth.users as auth_users
) as source
where source.id = target.id
  and source.oauth_user_name is not null
  and target.user_name like 'あのころの来場者-%'
  and target.user_name ~ '^あのころの来場者-[0-9a-f]{8}$';
