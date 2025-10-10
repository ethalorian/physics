-- ============================================================================
-- Add Course Join Codes and Unassigned Student Management
-- ============================================================================
-- This migration adds:
-- 1. Join code functionality for courses
-- 2. Functions to manage unassigned students
-- 3. Student self-enrollment tracking

-- Add join_code column to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS join_code_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS join_code_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS max_enrollments INTEGER;

-- Create index for join code lookups
CREATE INDEX IF NOT EXISTS idx_courses_join_code ON public.courses(join_code) 
WHERE join_code IS NOT NULL AND join_code_enabled = true;

-- Add self-enrollment tracking to course_students
ALTER TABLE public.course_students 
ADD COLUMN IF NOT EXISTS enrolled_via TEXT DEFAULT 'import', -- 'import', 'join_code', 'manual'
ADD COLUMN IF NOT EXISTS enrolled_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.course_students.enrolled_via IS 'How the student was enrolled: import, join_code, or manual';
COMMENT ON COLUMN public.course_students.enrolled_by IS 'User ID who enrolled the student (null for self-enrollment)';

-- ============================================================================
-- Function: Generate unique join code
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-character alphanumeric code (uppercase, no confusing chars like O, 0, I, 1)
    v_code := UPPER(
      SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6)
    );
    -- Replace confusing characters
    v_code := TRANSLATE(v_code, '0O1IL', 'ABCDE');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.courses WHERE join_code = v_code) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;

-- ============================================================================
-- Function: Enroll student using join code
-- ============================================================================
CREATE OR REPLACE FUNCTION public.enroll_student_with_code(
  p_student_email TEXT,
  p_join_code TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  course_id UUID,
  course_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_id UUID;
  v_course_name TEXT;
  v_student_id UUID;
  v_enrollment_count INTEGER;
  v_max_enrollments INTEGER;
  v_code_enabled BOOLEAN;
  v_code_expires TIMESTAMPTZ;
BEGIN
  -- Find course by join code
  SELECT 
    c.id, 
    c.name, 
    c.join_code_enabled, 
    c.join_code_expires_at,
    c.max_enrollments
  INTO 
    v_course_id, 
    v_course_name, 
    v_code_enabled, 
    v_code_expires,
    v_max_enrollments
  FROM public.courses c
  WHERE c.join_code = UPPER(p_join_code);
  
  -- Check if course exists
  IF v_course_id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid join code'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if join code is enabled
  IF NOT v_code_enabled THEN
    RETURN QUERY SELECT false, 'This join code is no longer active'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if join code has expired
  IF v_code_expires IS NOT NULL AND v_code_expires < NOW() THEN
    RETURN QUERY SELECT false, 'This join code has expired'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check enrollment limit
  IF v_max_enrollments IS NOT NULL THEN
    SELECT COUNT(*) INTO v_enrollment_count
    FROM public.course_students cs
    WHERE cs.course_id = v_course_id;
    
    IF v_enrollment_count >= v_max_enrollments THEN
      RETURN QUERY SELECT false, 'This course has reached maximum enrollment'::TEXT, NULL::UUID, NULL::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Find or create student record
  SELECT id INTO v_student_id
  FROM public.students
  WHERE email = p_student_email;
  
  IF v_student_id IS NULL THEN
    -- Create student record if it doesn't exist
    INSERT INTO public.students (email, name, google_user_id)
    VALUES (
      p_student_email, 
      SPLIT_PART(p_student_email, '@', 1), -- Use email prefix as temporary name
      'user_' || MD5(p_student_email) -- Generate temporary google_user_id
    )
    RETURNING id INTO v_student_id;
  END IF;
  
  -- Check if already enrolled
  IF EXISTS(
    SELECT 1 FROM public.course_students 
    WHERE course_id = v_course_id AND student_id = v_student_id
  ) THEN
    RETURN QUERY SELECT true, 'Already enrolled in this course'::TEXT, v_course_id, v_course_name;
    RETURN;
  END IF;
  
  -- Enroll student
  INSERT INTO public.course_students (
    course_id, 
    student_id, 
    enrollment_state, 
    enrolled_via,
    enrolled_at
  )
  VALUES (
    v_course_id, 
    v_student_id, 
    'ACTIVE', 
    'join_code',
    NOW()
  );
  
  RETURN QUERY SELECT true, 'Successfully enrolled'::TEXT, v_course_id, v_course_name;
END;
$$;

-- ============================================================================
-- Function: Get unassigned students
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_unassigned_students()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  google_user_id TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in TIMESTAMPTZ,
  course_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.email,
    s.name,
    s.google_user_id,
    s.created_at,
    s.updated_at as last_sign_in,
    COALESCE(
      (SELECT COUNT(*) FROM public.course_students cs WHERE cs.student_id = s.id),
      0
    )::INTEGER as course_count
  FROM public.students s
  WHERE NOT EXISTS (
    SELECT 1 FROM public.course_students cs 
    WHERE cs.student_id = s.id
  )
  ORDER BY s.created_at DESC;
END;
$$;

-- ============================================================================
-- Function: Manually assign student to course
-- ============================================================================
CREATE OR REPLACE FUNCTION public.assign_student_to_course(
  p_student_id UUID,
  p_course_id UUID,
  p_assigned_by UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if student exists
  IF NOT EXISTS(SELECT 1 FROM public.students WHERE id = p_student_id) THEN
    RETURN QUERY SELECT false, 'Student not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if course exists
  IF NOT EXISTS(SELECT 1 FROM public.courses WHERE id = p_course_id) THEN
    RETURN QUERY SELECT false, 'Course not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if already enrolled
  IF EXISTS(
    SELECT 1 FROM public.course_students 
    WHERE student_id = p_student_id AND course_id = p_course_id
  ) THEN
    RETURN QUERY SELECT false, 'Student already enrolled in this course'::TEXT;
    RETURN;
  END IF;
  
  -- Enroll student
  INSERT INTO public.course_students (
    course_id,
    student_id,
    enrollment_state,
    enrolled_via,
    enrolled_by,
    enrolled_at
  )
  VALUES (
    p_course_id,
    p_student_id,
    'ACTIVE',
    'manual',
    p_assigned_by,
    NOW()
  );
  
  RETURN QUERY SELECT true, 'Student successfully assigned to course'::TEXT;
END;
$$;

-- ============================================================================
-- RLS Policies for new columns
-- ============================================================================

-- Students can view courses with active join codes
DROP POLICY IF EXISTS "Students can view courses with active join codes" ON public.courses;
CREATE POLICY "Students can view courses with active join codes"
ON public.courses
FOR SELECT
TO authenticated
USING (
  join_code_enabled = true 
  AND (join_code_expires_at IS NULL OR join_code_expires_at > NOW())
);

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Course join codes migration completed successfully';
  RAISE NOTICE '📋 Added columns: join_code, join_code_enabled, join_code_expires_at, max_enrollments';
  RAISE NOTICE '🔧 Created functions: generate_join_code, enroll_student_with_code, get_unassigned_students, assign_student_to_course';
END $$;

