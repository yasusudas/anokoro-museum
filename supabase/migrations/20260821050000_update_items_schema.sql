-- ==========================================
-- items テーブルのスキーマ更新（image_url, year 列の追加・整合）
-- ==========================================

DO $$
BEGIN
  -- image_url 列が存在しない場合は追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.items ADD COLUMN image_url TEXT;
  END IF;

  -- year 列が存在しない場合は追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'year'
  ) THEN
    ALTER TABLE public.items ADD COLUMN year INT;
  END IF;

  -- theme 列を NULL 可に変更（コード側でのフォールバック判定に対応）
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'theme' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.items ALTER COLUMN theme DROP NOT NULL;
  END IF;

  -- image_path 列を NULL 可に変更（外部URL運用の許容）
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'image_path' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.items ALTER COLUMN image_path DROP NOT NULL;
  END IF;

  -- image_alt 列を NULL 可に変更
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'image_alt' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.items ALTER COLUMN image_alt DROP NOT NULL;
  END IF;

  -- birth_year_start 列を NULL 可に変更
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'birth_year_start' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.items ALTER COLUMN birth_year_start DROP NOT NULL;
  END IF;

  -- birth_year_end 列を NULL 可に変更
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'birth_year_end' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.items ALTER COLUMN birth_year_end DROP NOT NULL;
  END IF;
END $$;
