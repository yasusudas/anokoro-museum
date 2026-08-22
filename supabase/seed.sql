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
  year,
  created_at
) VALUES
  (
    'abccab1c-030a-46ca-a77e-403558a7b4e3',
    NULL,
    'ひもQ',
    '遠足の日、ちぎれないように端から大事に食べた、あの長いグミ。友だちと長さを比べるのも定番でした。',
    'おかし',
    'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80',
    2004,
    '2026-08-01 00:00:00+09'
  ),
  (
    '96d0cc6b-ef33-4d69-b5f0-8e5371ab3c29',
    NULL,
    '妖怪ウォッチ',
    '放課後になると、みんなで妖怪メダルを見せ合った。あの召喚ソングは今でも口ずさめるかも。',
    'ゲーム',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
    2013,
    '2026-08-01 01:00:00+09'
  ),
  (
    '01b2a5ce-d7f5-48a5-83be-c02acbe44673',
    NULL,
    'タピオカ',
    '長い列に並んで、黒糖ミルクを片手に写真を撮った放課後。太いストローも含めて思い出。',
    'たべもの',
    'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&auto=format&fit=crop&q=80',
    2018,
    '2026-08-01 02:00:00+09'
  ),
  (
    'f5336f5e-34f3-4dad-b26a-516a70e92e1f',
    NULL,
    'かいけつゾロリ',
    '休み時間の図書室。貸出中なら次の巻を探して、最後のなぞなぞまでしっかり読んだ。',
    'ほん',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
    2000,
    '2026-08-01 03:00:00+09'
  ),
  (
    '5fbf3448-5776-4765-8676-8a7a7ca7531f',
    NULL,
    'ソーラン節',
    '運動会前、筋肉痛になるまで低い姿勢を練習した。クラス全員の掛け声が揃った瞬間は忘れられない。',
    'できごと',
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&auto=format&fit=crop&q=80',
    2005,
    '2026-08-01 04:00:00+09'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  year = EXCLUDED.year;
