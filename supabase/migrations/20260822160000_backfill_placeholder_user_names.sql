update public.users as target
set user_name = source.metadata_user_name
from (
  select
    auth_users.id,
    coalesce(
      nullif(btrim(auth_users.raw_user_meta_data ->> 'user_name'), ''),
      nullif(btrim(auth_users.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(auth_users.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(auth_users.raw_user_meta_data ->> 'name'), '')
    ) as metadata_user_name
  from auth.users as auth_users
) as source
where source.id = target.id
  and source.metadata_user_name is not null
  and target.user_name = '名無し';
