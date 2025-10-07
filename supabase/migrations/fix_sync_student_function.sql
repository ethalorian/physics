-- ============================================================================
-- Fix sync_student Function - Resolve Ambiguous Column Reference
-- ============================================================================
-- The error "column reference student_id is ambiguous" happens because
-- the students table has a student_id column AND the function uses that name

-- Drop and recreate the sync_student function with qualified names
CREATE OR REPLACE FUNCTION public.sync_student(
  p_google_user_id TEXT,
  p_email TEXT,
  p_name TEXT,
  p_photo_url TEXT DEFAULT NULL,
  p_course_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;  -- Use v_ prefix to avoid ambiguity
BEGIN
  -- Insert or update student
  INSERT INTO public.students (
    google_user_id,
    email,
    name,
    photo_url,
    updated_at
  ) VALUES (
    p_google_user_id,
    p_email,
    p_name,
    p_photo_url,
    NOW()
  )
  ON CONFLICT (google_user_id)
  DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    photo_url = EXCLUDED.photo_url,
    updated_at = NOW()
  RETURNING id INTO v_student_id;

  -- If course_id provided, link student to course
  IF p_course_id IS NOT NULL THEN
    INSERT INTO public.course_students (course_id, student_id)
    VALUES (p_course_id, v_student_id)
    ON CONFLICT (course_id, student_id) DO NOTHING;
  END IF;

  RETURN v_student_id;
END;
$$;

-- Verify function was updated
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'sync_student'
  ) THEN
    RAISE NOTICE '✅ sync_student function updated successfully';
  ELSE
    RAISE WARNING '❌ sync_student function NOT found';
  END IF;
END $$;

-- Show the function signature
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as parameters,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'sync_student';

COMMENT ON FUNCTION public.sync_student IS 'Syncs student data from Google Classroom and links to course via course_students junction table';
