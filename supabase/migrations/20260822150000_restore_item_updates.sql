drop policy if exists "本人の展示を更新できる" on public.items;

create policy "本人の展示を更新できる"
on public.items
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

do $$
declare
  updatable_columns text;
begin
  select string_agg(quote_ident(column_name), ', ')
  into updatable_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'items'
    and column_name in (
      'title',
      'description',
      'category',
      'theme',
      'image_path',
      'image_alt',
      'image_rights_confirmed',
      'image_url',
      'year',
      'birth_year_start',
      'birth_year_end'
    );

  if updatable_columns is not null then
    execute format('grant update (%s) on public.items to authenticated', updatable_columns);
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'items'
      and column_name = 'updated_at'
  ) then
    execute 'drop trigger if exists set_items_updated_at on public.items';
    execute 'create trigger set_items_updated_at before update on public.items for each row execute function public.set_updated_at()';
  end if;
end;
$$;
