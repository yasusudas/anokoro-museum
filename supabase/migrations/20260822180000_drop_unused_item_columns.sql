drop trigger if exists validate_items_birth_year_range on public.items;

drop function if exists public.validate_item_birth_year_range();

drop index if exists public.items_birth_year_range_idx;

alter table public.items
  drop column if exists theme cascade,
  drop column if exists image_path cascade,
  drop column if exists image_alt cascade,
  drop column if exists image_rights_confirmed cascade,
  drop column if exists birth_year_start cascade,
  drop column if exists birth_year_end cascade,
  drop column if exists updated_at cascade;
