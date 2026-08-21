-- ==========================================
-- 1. ダミーユーザーの作成（Authテーブルへ直接INSERT）
-- ==========================================

INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111', -- 固定のUUID
    'authenticated',
    'authenticated',
    'test@example.com',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"user_name":"ダミー太郎"}',
    current_timestamp,
    current_timestamp
);

-- ==========================================
-- 2. 展示品のダミーデータ作成 (2005〜2008年)
-- ==========================================

INSERT INTO public.items (user_id, title, description, category, year)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'おいでよ どうぶつの森', 'DSを持ち寄って、友達の村に遊びに行ったりカブを売買したりして通信プレイに夢中になりました。', 'ゲーム', 2005),
  ('11111111-1111-1111-1111-111111111111', 'ニンテンドーDS Lite', '授業の休み時間にピクトチャットを開いて、教室の隅の友達とこっそりお絵かきチャットをしてました。', 'ガジェット', 2006),
  ('11111111-1111-1111-1111-111111111111', 'スライド式ガラケー', 'メアド交換は赤外線通信！携帯をピタッとくっつけて受信して、キラキラのデコメで返信するのが定番でした。', 'ガジェット', 2007),
  ('11111111-1111-1111-1111-111111111111', '前略プロフィール', '自分の「プロフ」を作って、友達にURLを教え合うのが流行ってました。質問項目を埋めるのに必死だった思い出。', 'インターネット', 2008);