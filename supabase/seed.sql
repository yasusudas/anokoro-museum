-- ==========================================
-- 初期展示データ（seed.sql）
-- user_id が NULL の展示はシステム提供の初期展示を表します
-- ==========================================

INSERT INTO public.items (
  id,
  user_id,
  title,
  description,
  category,
  theme,
  image_path,
  image_alt,
  image_rights_confirmed,
  birth_year_start,
  birth_year_end,
  created_at
) VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    NULL,
    'ひもQ',
    '遠足の日、ちぎれないように端から大事に食べた、あの長いグミ。友だちと長さを比べるのも定番でした。',
    'おかし',
    'gummy',
    'seeds/himo-q.png',
    'ひもQの展示アート',
    true,
    2004,
    2008,
    '2026-08-01 00:00:00+09'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    NULL,
    '妖怪ウォッチ',
    '放課後になると、みんなで妖怪メダルを見せ合った。あの召喚ソングは今でも口ずさめるかも。',
    'ゲーム',
    'watch',
    'seeds/yokai.png',
    '妖怪ウォッチの展示アート',
    true,
    2004,
    2008,
    '2026-08-01 01:00:00+09'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    NULL,
    'タピオカ',
    '長い列に並んで、黒糖ミルクを片手に写真を撮った放課後。太いストローも含めて思い出。',
    'たべもの',
    'tapioca',
    'seeds/tapioca.png',
    'タピオカの展示アート',
    true,
    2002,
    2007,
    '2026-08-01 02:00:00+09'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    NULL,
    'かいけつゾロリ',
    '休み時間の図書室。貸出中なら次の巻を探して、最後のなぞなぞまでしっかり読んだ。',
    'ほん',
    'book',
    'seeds/zoro.png',
    'かいけつゾロリの展示アート',
    true,
    2000,
    2009,
    '2026-08-01 03:00:00+09'
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    NULL,
    'ソーラン節',
    '運動会前、筋肉痛になるまで低い姿勢を練習した。クラス全員の掛け声が揃った瞬間は忘れられない。',
    'できごと',
    'soran',
    'seeds/soran.png',
    'ソーラン節の展示アート',
    true,
    1998,
    2009,
    '2026-08-01 04:00:00+09'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  theme = EXCLUDED.theme,
  image_path = EXCLUDED.image_path,
  image_alt = EXCLUDED.image_alt,
  image_rights_confirmed = EXCLUDED.image_rights_confirmed,
  birth_year_start = EXCLUDED.birth_year_start,
  birth_year_end = EXCLUDED.birth_year_end;
