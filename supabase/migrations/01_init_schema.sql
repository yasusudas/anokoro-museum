-- ==========================================
-- 1. テーブルの作成
-- ==========================================

-- usersテーブル（Authと連動）
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- itemsテーブル（展示品）
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR,
  image_url TEXT,
  year INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- commentsテーブル（コメント）
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- shinmiri_reactionsテーブル（しんみりリアクション）
CREATE TABLE shinmiri_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, user_id) -- 1人1回までの制約
);

-- ==========================================
-- 2. ログイン（サインアップ）時の自動連動トリガー
-- ==========================================

-- 関数: Authにユーザーが作られたら、usersテーブルにも自動でINSERTする
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, user_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'user_name', '名無し') -- フロントから名前が来なければ「名無し」
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー: 上記の関数を auth.users の INSERT 後に自動実行する
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 3. リアルタイム通信の有効化（チャット・リアクション用）
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE comments, shinmiri_reactions;