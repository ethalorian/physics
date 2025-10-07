-- ============================================================================
-- Fix Missing Columns in Google Classroom Tables
-- ============================================================================
-- Adds missing columns to existing tables

-- Add missing columns to courses table if they don't exist
DO $$ 
BEGIN
  -- Add teacher_email if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name = 'teacher_email'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN teacher_email TEXT;
    RAISE NOTICE 'Added teacher_email column to courses table';
  ELSE
    RAISE NOTICE 'teacher_email column already exists in courses table';
  END IF;

  -- Add student_count if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name = 'student_count'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN student_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added student_count column to courses table';
  ELSE
    RAISE NOTICE 'student_count column already exists in courses table';
  END IF;

  -- Add section if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name = 'section'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN section TEXT;
    RAISE NOTICE 'Added section column to courses table';
  ELSE
    RAISE NOTICE 'section column already exists in courses table';
  END IF;

  -- Add description if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column to courses table';
  ELSE
    RAISE NOTICE 'description column already exists in courses table';
  END IF;

  -- Add room if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name = 'room'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN room TEXT;
    RAISE NOTICE 'Added room column to courses table';
  ELSE
    RAISE NOTICE 'room column already exists in courses table';
  END IF;
END $$;

-- Add missing columns to students table if they don't exist
DO $$ 
BEGIN
  -- Add photo_url if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' 
    AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE public.students ADD COLUMN photo_url TEXT;
    RAISE NOTICE 'Added photo_url column to students table';
  ELSE
    RAISE NOTICE 'photo_url column already exists in students table';
  END IF;
END $$;

-- Add index on teacher_email if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_courses_teacher_email'
  ) THEN
    CREATE INDEX idx_courses_teacher_email ON public.courses(teacher_email);
    RAISE NOTICE 'Created index idx_courses_teacher_email';
  ELSE
    RAISE NOTICE 'Index idx_courses_teacher_email already exists';
  END IF;
END $$;

-- Verify the columns exist
DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
  col_name TEXT;
BEGIN
  -- Check courses table required columns
  FOR col_name IN 
    SELECT unnest(ARRAY['google_course_id', 'name', 'section', 'description', 'room', 'teacher_email', 'student_count', 'created_at', 'updated_at'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'courses' 
      AND column_name = col_name
    ) THEN
      missing_columns := array_append(missing_columns, 'courses.' || col_name);
    END IF;
  END LOOP;

  -- Check students table required columns
  FOR col_name IN 
    SELECT unnest(ARRAY['google_user_id', 'email', 'name', 'photo_url', 'created_at', 'updated_at'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'students' 
      AND column_name = col_name
    ) THEN
      missing_columns := array_append(missing_columns, 'students.' || col_name);
    END IF;
  END LOOP;

  -- Report results
  IF array_length(missing_columns, 1) IS NULL THEN
    RAISE NOTICE '✅ All required columns exist!';
  ELSE
    RAISE WARNING '❌ Missing columns: %', array_to_string(missing_columns, ', ');
  END IF;
END $$;

-- Show current table structure
SELECT 
  '📋 Courses table columns:' as info,
  string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_name = 'courses' AND table_schema = 'public'
GROUP BY table_name

UNION ALL

SELECT 
  '📋 Students table columns:' as info,
  string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_name = 'students' AND table_schema = 'public'
GROUP BY table_name;
