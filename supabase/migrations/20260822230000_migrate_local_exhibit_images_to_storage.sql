with storage_base as (
  select substring(
    image_url
    from '^(https?://[^/]+/storage/v1/object/public/exhibits/)'
  ) as public_url
  from public.items
  where image_url ~ '^https?://[^/]+/storage/v1/object/public/exhibits/'
  order by created_at
  limit 1
), legacy_images (item_id, local_path, storage_path) as (
  values
    (
      'abccab1c-030a-46ca-a77e-403558a7b4e3'::uuid,
      '/mock-images/himo-q.jpg',
      'd29a811b-75cc-4b9b-82c8-5d8d54f0f695/mock_11111111-1111-4111-8111-111111111111.jpg'
    ),
    (
      'f5336f5e-34f3-4dad-b26a-516a70e92e1f'::uuid,
      '/mock-images/zorori.jpg',
      'd29a811b-75cc-4b9b-82c8-5d8d54f0f695/mock_44444444-4444-4444-8444-444444444444.jpg'
    ),
    (
      '052dd450-347a-4166-8b4c-da075e9a796d'::uuid,
      '/mock-images/doubutsu-no-mori.jpg',
      'd29a811b-75cc-4b9b-82c8-5d8d54f0f695/mock_052dd450-347a-4166-8b4c-da075e9a796d.jpg'
    )
)
update public.items as items
set image_url = storage_base.public_url || legacy_images.storage_path
from legacy_images
cross join storage_base
where items.id = legacy_images.item_id
  and items.image_url = legacy_images.local_path
  and storage_base.public_url is not null;
