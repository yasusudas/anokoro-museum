alter table public.items
  drop constraint if exists items_category_check;

update public.items
set category = case
  when category in ('おかし', 'たべもの') then '食べ物'
  when category = 'ほん' then '本'
  when category = 'できごと' then '出来事'
  when category in ('ガジェット', 'インターネット') then 'その他'
  when category in ('食べ物', 'テレビ', 'アニメ', 'ゲーム', '音楽', '本', '出来事', 'その他') then category
  else 'その他'
end;

update public.items
set category = '音楽'
where id = '5fbf3448-5776-4765-8676-8a7a7ca7531f';

alter table public.items
  add constraint items_category_check
  check (category in ('食べ物', 'テレビ', 'アニメ', 'ゲーム', '音楽', '本', '出来事', 'その他'));
