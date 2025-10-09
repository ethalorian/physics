-- Migration to remove dependency on student emails and photos from Google Classroom
-- This migration updates the system to use Google User IDs as primary identifiers

-- Update the sync_student function to make email and photo_url optional
-- and generate internal identifiers when real emails are not provided
CREATE OR REPLACE FUNCTION public.sync_student(
  p_google_user_id TEXT,
  p_email TEXT,
  p_name TEXT,
  p_photo_url TEXT DEFAULT NULL,
  p_course_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_student_id UUID;
  v_internal_email TEXT;
BEGIN
  -- Use provided email or generate internal identifier
  -- Internal emails use format: {google_user_id}@classroom.local
  v_internal_email := COALESCE(p_email, p_google_user_id || '@classroom.local');
  
  -- Insert or update student
  INSERT INTO public.students (
    google_user_id,
    email,
    name,
    photo_url,
    last_sync
  ) VALUES (
    p_google_user_id,
    v_internal_email,
    p_name,
    NULL,  -- Always set photo_url to NULL since we're not using it anymore
    NOW()
  )
  ON CONFLICT (google_user_id) 
  DO UPDATE SET
    name = EXCLUDED.name,
    email = CASE 
      WHEN students.email LIKE '%@classroom.local' THEN EXCLUDED.email
      ELSE students.email  -- Keep existing real email if we have one
    END,
    photo_url = NULL,  -- Clear any existing photo URLs
    last_sync = NOW()
  RETURNING id INTO v_student_id;
  
  -- Link student to course if course_id provided
  IF p_course_id IS NOT NULL THEN
    INSERT INTO public.course_students (
      course_id,
      student_id,
      enrollment_state,
      joined_at
    ) VALUES (
      p_course_id,
      v_student_id,
      'ACTIVE',
      NOW()
    )
    ON CONFLICT (course_id, student_id) 
    DO UPDATE SET
      enrollment_state = 'ACTIVE',
      updated_at = NOW();
  END IF;
  
  RETURN v_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index on google_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_google_user_id ON public.students(google_user_id);

-- Update any existing NULL emails to use Google User ID format
UPDATE public.students 
SET email = google_user_id || '@classroom.local'
WHERE email IS NULL OR email = '' OR email LIKE '%@unknown.com';

-- Clear all photo URLs since we're no longer using them
UPDATE public.students 
SET photo_url = NULL;

-- Add comment to explain the new approach
COMMENT ON COLUMN public.students.email IS 'Internal identifier or actual email. Format {google_user_id}@classroom.local for students without real emails';
COMMENT ON COLUMN public.students.photo_url IS 'Deprecated - no longer fetching photos from Google Classroom';

-- Update the get_course_students function to handle internal emails properly
CREATE OR REPLACE FUNCTION public.get_course_students(p_course_id UUID)
RETURNS TABLE (
  id UUID,
  google_user_id TEXT,
  email TEXT,
  name TEXT,
  photo_url TEXT,
  enrollment_state TEXT,
  joined_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.google_user_id,
    s.email,
    s.name,
    NULL::TEXT as photo_url,  -- Always return NULL for photo_url
    cs.enrollment_state,
    cs.joined_at
  FROM public.students s
  JOIN public.course_students cs ON cs.student_id = s.id
  WHERE cs.course_id = p_course_id
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.sync_student TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_course_students TO authenticated;
