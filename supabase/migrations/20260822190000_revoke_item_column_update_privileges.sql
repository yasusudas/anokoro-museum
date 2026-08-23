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
    execute format(
      'revoke update (%s) on public.items from authenticated',
      updatable_columns
    );
  end if;
end;
$$;
