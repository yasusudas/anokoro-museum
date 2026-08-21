-- ==========================================
-- Supabase Storage: exhibits バケットの作成とポリシー設定
-- ==========================================

-- バケットの作成（公開読み取り許可、5MB制限、MIME制限）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exhibits',
  'exhibits',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- 1. 誰でも画像を閲覧できるポリシー
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'exhibits');

-- 2. ログイン済みユーザーが画像をアップロードできるポリシー（自分のUIDフォルダ配下に限定）
DROP POLICY IF EXISTS "Authenticated users can upload exhibits" ON storage.objects;
CREATE POLICY "Authenticated users can upload exhibits"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'exhibits' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. 投稿者が自分の画像を削除できるポリシー
DROP POLICY IF EXISTS "Users can delete own exhibits" ON storage.objects;
CREATE POLICY "Users can delete own exhibits"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'exhibits' AND (storage.foldername(name))[1] = auth.uid()::text);
