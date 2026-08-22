drop policy if exists "本人の展示を更新できる" on public.items;

revoke update on public.items from authenticated;

drop trigger if exists set_items_updated_at on public.items;
