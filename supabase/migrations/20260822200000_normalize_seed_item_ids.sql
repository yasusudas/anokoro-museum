create temporary table seed_item_id_map (
  old_id uuid primary key,
  new_id uuid not null unique,
  image_url text
) on commit drop;

insert into seed_item_id_map (old_id, new_id, image_url)
values
  ('11111111-1111-4111-8111-111111111111', 'abccab1c-030a-46ca-a77e-403558a7b4e3', '/mock-images/himo-q.jpg'),
  ('22222222-2222-4222-8222-222222222222', '96d0cc6b-ef33-4d69-b5f0-8e5371ab3c29', null),
  ('33333333-3333-4333-8333-333333333333', '01b2a5ce-d7f5-48a5-83be-c02acbe44673', null),
  ('44444444-4444-4444-8444-444444444444', 'f5336f5e-34f3-4dad-b26a-516a70e92e1f', '/mock-images/zorori.jpg'),
  ('55555555-5555-4555-8555-555555555555', '5fbf3448-5776-4765-8676-8a7a7ca7531f', null);

alter table public.comments
  drop constraint if exists comments_item_id_fkey;

alter table public.shinmiri_reactions
  drop constraint if exists shinmiri_reactions_item_id_fkey;

update public.comments as comments
set item_id = id_map.new_id
from seed_item_id_map as id_map
where comments.item_id = id_map.old_id;

update public.shinmiri_reactions as reactions
set item_id = id_map.new_id
from seed_item_id_map as id_map
where reactions.item_id = id_map.old_id;

update public.items as items
set
  id = id_map.new_id,
  image_url = coalesce(id_map.image_url, items.image_url)
from seed_item_id_map as id_map
where items.id = id_map.old_id;

alter table public.comments
  add constraint comments_item_id_fkey
  foreign key (item_id) references public.items (id) on delete cascade;

alter table public.shinmiri_reactions
  add constraint shinmiri_reactions_item_id_fkey
  foreign key (item_id) references public.items (id) on delete cascade;
