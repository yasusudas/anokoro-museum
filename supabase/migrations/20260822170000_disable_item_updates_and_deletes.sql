drop policy if exists "本人の展示を更新できる" on public.items;

revoke update on public.items from authenticated;

revoke update (
  title,
  description,
  category,
  theme,
  image_path,
  image_alt,
  image_rights_confirmed,
  image_url,
  year,
  birth_year_start,
  birth_year_end
) on public.items from authenticated;

drop trigger if exists set_items_updated_at on public.items;

drop policy if exists "本人の展示を削除できる" on public.items;

revoke delete on public.items from authenticated;
