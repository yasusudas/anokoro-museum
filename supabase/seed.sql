-- ==========================================
-- 初期展示データ（seed.sql）
-- ==========================================

INSERT INTO public.items (
  id,
  user_id,
  title,
  description,
  category,
  image_url,
  image_rights_confirmed,
  year,
  created_at
) VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    NULL,
    'ひもQ',
    '遠足の日、ちぎれないように端から大事に食べた、あの長いグミ。友だちと長さを比べるのも定番でした。',
    'おかし',
    'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80',
    TRUE,
    2004,
    '2026-08-01 00:00:00+09'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    NULL,
    '妖怪ウォッチ',
    '放課後になると、みんなで妖怪メダルを見せ合った。あの召喚ソングは今でも口ずさめるかも。',
    'ゲーム',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
    TRUE,
    2013,
    '2026-08-01 01:00:00+09'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    NULL,
    'タピオカ',
    '長い列に並んで、黒糖ミルクを片手に写真を撮った放課後。太いストローも含めて思い出。',
    'たべもの',
    'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&auto=format&fit=crop&q=80',
    TRUE,
    2018,
    '2026-08-01 02:00:00+09'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    NULL,
    'かいけつゾロリ',
    '休み時間の図書室。貸出中なら次の巻を探して、最後のなぞなぞまでしっかり読んだ。',
    'ほん',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
    TRUE,
    2000,
    '2026-08-01 03:00:00+09'
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    NULL,
    'ソーラン節',
    '運動会前、筋肉痛になるまで低い姿勢を練習した。クラス全員の掛け声が揃った瞬間は忘れられない。',
    'できごと',
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&auto=format&fit=crop&q=80',
    TRUE,
    2005,
    '2026-08-01 04:00:00+09'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  image_rights_confirmed = EXCLUDED.image_rights_confirmed,
  year = EXCLUDED.year;
