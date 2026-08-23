-- items.title のアプリ外経路を含む40文字上限をDBで保証する。
-- char_length はPostgreSQLのUnicode文字数（コードポイント）で数える。
alter table public.items
  add constraint items_title_length_check
  check (
    char_length(
      regexp_replace(replace(title, chr(12288), ' '), '^[[:space:]]+|[[:space:]]+$', '', 'g')
    ) <= 40
  );
