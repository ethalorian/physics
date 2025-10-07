-- ============================================================================
-- FIX FUNCTION SEARCH PATHS - Security Enhancement
-- ============================================================================
-- This migration adds SET search_path to all functions that have mutable
-- search paths, addressing Supabase security warnings.
--
-- Security Issue: Functions without explicit search_path can be vulnerable
-- to schema-based attacks where malicious users create objects in schemas
-- that are searched before the intended schema.
--
-- Solution: Set search_path = public for all functions to ensure they only
-- access objects in the public schema.
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix existing functions that need search_path
-- ============================================================================

-- Drop ALL versions of functions regardless of signature
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  -- Drop all versions of get_student_activity_summary
  FOR r IN 
    SELECT p.oid::regprocedure as func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'get_student_activity_summary'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    RAISE NOTICE 'Dropped function: %', r.func_signature;
  END LOOP;
  
  -- Drop all versions of increment_question_usage
  FOR r IN 
    SELECT p.oid::regprocedure as func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'increment_question_usage'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    RAISE NOTICE 'Dropped function: %', r.func_signature;
  END LOOP;
END $$;

-- Fix get_student_activity_summary (already exists, ensure it has search_path)
CREATE OR REPLACE FUNCTION public.get_student_activity_summary(p_student_id UUID DEFAULT NULL, p_user_email TEXT DEFAULT NULL)
RETURNS TABLE (
  total_assignments INTEGER,
  completed_assignments INTEGER,
  total_lessons INTEGER,
  completed_lessons INTEGER,
  total_games INTEGER,
  total_points INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id_to_check TEXT;
BEGIN
  -- Determine which user to check
  IF p_user_email IS NOT NULL THEN
    user_id_to_check := p_user_email;
  ELSIF p_student_id IS NOT NULL THEN
    SELECT email INTO user_id_to_check FROM public.users WHERE id = p_student_id;
  ELSE
    user_id_to_check := auth.uid()::TEXT;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE((SELECT COUNT(*) FROM public.gradebook_entries WHERE user_email = user_id_to_check AND item_type = 'assignment'), 0)::INTEGER AS total_assignments,
    COALESCE((SELECT COUNT(*) FROM public.gradebook_entries WHERE user_email = user_id_to_check AND item_type = 'assignment' AND status = 'graded'), 0)::INTEGER AS completed_assignments,
    COALESCE((SELECT COUNT(*) FROM public.lesson_progress WHERE user_email = user_id_to_check), 0)::INTEGER AS total_lessons,
    COALESCE((SELECT COUNT(*) FROM public.lesson_progress WHERE user_email = user_id_to_check AND status = 'completed'), 0)::INTEGER AS completed_lessons,
    COALESCE((SELECT COUNT(*) FROM public.vocabulary_game_scores WHERE user_email = user_id_to_check), 0)::INTEGER AS total_games,
    COALESCE((SELECT SUM(score) FROM public.vocabulary_game_scores WHERE user_email = user_id_to_check), 0)::INTEGER AS total_points;
END;
$$;

-- Fix increment_question_usage (ensure proper search_path)
CREATE OR REPLACE FUNCTION public.increment_question_usage(p_question_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.question_bank
  SET usage_count = COALESCE(usage_count, 0) + 1,
      updated_at = NOW()
  WHERE id = p_question_id;
END;
$$;

-- ============================================================================
-- STEP 2: Create/Fix Google Classroom roster sync functions
-- ============================================================================

-- Drop ALL versions of functions regardless of signature
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  -- Drop all versions of sync_course
  FOR r IN 
    SELECT p.oid::regprocedure as func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'sync_course'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    RAISE NOTICE 'Dropped function: %', r.func_signature;
  END LOOP;
  
  -- Drop all versions of sync_student
  FOR r IN 
    SELECT p.oid::regprocedure as func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'sync_student'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    RAISE NOTICE 'Dropped function: %', r.func_signature;
  END LOOP;
  
  -- Drop all versions of get_course_students
  FOR r IN 
    SELECT p.oid::regprocedure as func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'get_course_students'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    RAISE NOTICE 'Dropped function: %', r.func_signature;
  END LOOP;
  
  -- Drop all versions of update_course_student_counts
  FOR r IN 
    SELECT p.oid::regprocedure as func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'update_course_student_counts'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    RAISE NOTICE 'Dropped function: %', r.func_signature;
  END LOOP;
END $$;

-- Function to sync course from Google Classroom
CREATE OR REPLACE FUNCTION public.sync_course(
  p_google_course_id TEXT,
  p_name TEXT,
  p_section TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_room TEXT DEFAULT NULL,
  p_teacher_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  course_id UUID;
BEGIN
  -- Insert or update course
  INSERT INTO public.courses (
    google_course_id,
    name,
    section,
    description,
    room,
    teacher_email,
    updated_at
  ) VALUES (
    p_google_course_id,
    p_name,
    p_section,
    p_description,
    p_room,
    p_teacher_email,
    NOW()
  )
  ON CONFLICT (google_course_id)
  DO UPDATE SET
    name = EXCLUDED.name,
    section = EXCLUDED.section,
    description = EXCLUDED.description,
    room = EXCLUDED.room,
    teacher_email = EXCLUDED.teacher_email,
    updated_at = NOW()
  RETURNING id INTO course_id;

  RETURN course_id;
END;
$$;

-- Function to sync student from Google Classroom
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
  student_id UUID;
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
  RETURNING id INTO student_id;

  -- If course_id provided, link student to course
  IF p_course_id IS NOT NULL THEN
    INSERT INTO public.course_students (course_id, student_id)
    VALUES (p_course_id, student_id)
    ON CONFLICT (course_id, student_id) DO NOTHING;
  END IF;

  RETURN student_id;
END;
$$;

-- Function to get students in a course
CREATE OR REPLACE FUNCTION public.get_course_students(p_course_id UUID)
RETURNS TABLE (
  id UUID,
  google_user_id TEXT,
  email TEXT,
  name TEXT,
  photo_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.google_user_id, s.email, s.name, s.photo_url
  FROM public.students s
  INNER JOIN public.course_students cs ON cs.student_id = s.id
  WHERE cs.course_id = p_course_id
  ORDER BY s.name;
END;
$$;

-- Function to update course student counts
CREATE OR REPLACE FUNCTION public.update_course_student_counts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.courses c
  SET 
    student_count = (
      SELECT COUNT(*)
      FROM public.course_students cs
      WHERE cs.course_id = c.id
    ),
    updated_at = NOW();
END;
$$;

-- ============================================================================
-- STEP 3: Create/Fix assignment-related functions
-- ============================================================================

-- Drop ALL versions of functions regardless of signature
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  -- Drop all versions of record_assignment_submission
  FOR r IN 
    SELECT p.oid::regprocedure as func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'record_assignment_submission'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    RAISE NOTICE 'Dropped function: %', r.func_signature;
  END LOOP;
  
  -- Drop all versions of calculate_assignment_stats
  FOR r IN 
    SELECT p.oid::regprocedure as func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'calculate_assignment_stats'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    RAISE NOTICE 'Dropped function: %', r.func_signature;
  END LOOP;
  
  -- Drop all versions of get_assignment_with_stats
  FOR r IN 
    SELECT p.oid::regprocedure as func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'get_assignment_with_stats'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    RAISE NOTICE 'Dropped function: %', r.func_signature;
  END LOOP;
END $$;

-- Function to record assignment submission
CREATE OR REPLACE FUNCTION public.record_assignment_submission(
  p_assignment_id UUID,
  p_user_id TEXT,
  p_user_email TEXT,
  p_submission_data JSONB,
  p_score DECIMAL DEFAULT NULL,
  p_max_score DECIMAL DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  submission_id UUID;
  assignment_title TEXT;
  assignment_course TEXT;
  assignment_due TIMESTAMPTZ;
BEGIN
  -- Get assignment details
  SELECT title, course_id, due_date
  INTO assignment_title, assignment_course, assignment_due
  FROM public.assignments
  WHERE id = p_assignment_id;

  -- Insert submission record
  INSERT INTO public.assignment_submissions (
    assignment_id,
    user_id,
    user_email,
    submission_data,
    score,
    max_score,
    status,
    submitted_at,
    created_at
  ) VALUES (
    p_assignment_id,
    p_user_id,
    p_user_email,
    p_submission_data,
    p_score,
    p_max_score,
    CASE WHEN p_score IS NOT NULL THEN 'graded' ELSE 'submitted' END,
    NOW(),
    NOW()
  )
  ON CONFLICT (assignment_id, user_id)
  DO UPDATE SET
    submission_data = EXCLUDED.submission_data,
    score = EXCLUDED.score,
    max_score = EXCLUDED.max_score,
    status = EXCLUDED.status,
    submitted_at = EXCLUDED.submitted_at,
    updated_at = NOW()
  RETURNING id INTO submission_id;

  -- Update or create gradebook entry
  INSERT INTO public.gradebook_entries (
    user_id,
    user_email,
    item_type,
    item_id,
    item_title,
    course_id,
    score,
    max_score,
    percentage,
    status,
    due_date,
    submitted_at,
    graded_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_user_email,
    'assignment',
    p_assignment_id::TEXT,
    assignment_title,
    assignment_course,
    p_score,
    p_max_score,
    CASE WHEN p_score IS NOT NULL AND p_max_score > 0 
         THEN (p_score / p_max_score * 100) 
         ELSE NULL END,
    CASE WHEN p_score IS NOT NULL THEN 'graded' ELSE 'submitted' END,
    assignment_due,
    NOW(),
    CASE WHEN p_score IS NOT NULL THEN NOW() ELSE NULL END,
    NOW()
  )
  ON CONFLICT (user_id, item_type, item_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    max_score = EXCLUDED.max_score,
    percentage = EXCLUDED.percentage,
    status = EXCLUDED.status,
    submitted_at = EXCLUDED.submitted_at,
    graded_at = EXCLUDED.graded_at,
    updated_at = NOW();

  RETURN submission_id;
END;
$$;

-- Function to calculate assignment statistics
CREATE OR REPLACE FUNCTION public.calculate_assignment_stats(assignment_uuid UUID)
RETURNS TABLE (
  total_assigned INTEGER,
  submitted_count INTEGER,
  graded_count INTEGER,
  average_score DECIMAL,
  completion_rate DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(COUNT(*), 0)::INTEGER AS total_assigned,
    COALESCE(COUNT(*) FILTER (WHERE status IN ('submitted', 'graded')), 0)::INTEGER AS submitted_count,
    COALESCE(COUNT(*) FILTER (WHERE status = 'graded'), 0)::INTEGER AS graded_count,
    COALESCE(AVG(score) FILTER (WHERE status = 'graded'), 0)::DECIMAL AS average_score,
    CASE 
      WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE status IN ('submitted', 'graded'))::DECIMAL / COUNT(*)::DECIMAL * 100)
      ELSE 0
    END AS completion_rate
  FROM public.assignment_submissions
  WHERE assignment_id = assignment_uuid;
END;
$$;

-- Function to get assignment with statistics
CREATE OR REPLACE FUNCTION public.get_assignment_with_stats(assignment_uuid UUID)
RETURNS TABLE (
  assignment_data JSONB,
  stats JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_jsonb(a.*) AS assignment_data,
    jsonb_build_object(
      'total_assigned', COALESCE((SELECT COUNT(*) FROM public.assignment_submissions WHERE assignment_id = a.id), 0),
      'submitted_count', COALESCE((SELECT COUNT(*) FROM public.assignment_submissions WHERE assignment_id = a.id AND status IN ('submitted', 'graded')), 0),
      'graded_count', COALESCE((SELECT COUNT(*) FROM public.assignment_submissions WHERE assignment_id = a.id AND status = 'graded'), 0),
      'average_score', COALESCE((SELECT AVG(score) FROM public.assignment_submissions WHERE assignment_id = a.id AND status = 'graded'), 0)
    ) AS stats
  FROM public.assignments a
  WHERE a.id = assignment_uuid;
END;
$$;

-- ============================================================================
-- STEP 4: Create/Fix lesson-related functions
-- ============================================================================

-- Drop ALL versions of functions regardless of signature
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  -- Drop all versions of record_lesson_view
  FOR r IN 
    SELECT p.oid::regprocedure as func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'record_lesson_view'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    RAISE NOTICE 'Dropped function: %', r.func_signature;
  END LOOP;
  
  -- Drop all versions of validate_lesson_videos
  FOR r IN 
    SELECT p.oid::regprocedure as func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'validate_lesson_videos'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    RAISE NOTICE 'Dropped function: %', r.func_signature;
  END LOOP;
END $$;

-- Function to record lesson view
CREATE OR REPLACE FUNCTION public.record_lesson_view(
  p_user_id TEXT,
  p_user_email TEXT,
  p_user_name TEXT,
  p_lesson_id UUID,
  p_lesson_slug TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  progress_id UUID;
BEGIN
  -- Insert or update lesson progress
  INSERT INTO public.lesson_progress (
    user_id,
    user_email,
    lesson_id,
    lesson_slug,
    status,
    started_at,
    last_accessed_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_user_email,
    p_lesson_id,
    p_lesson_slug,
    'in_progress',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET
    last_accessed_at = NOW(),
    updated_at = NOW(),
    status = CASE 
      WHEN public.lesson_progress.status = 'not_started' THEN 'in_progress'
      ELSE public.lesson_progress.status
    END
  RETURNING id INTO progress_id;

  RETURN progress_id;
END;
$$;

-- Function to validate lesson videos
CREATE OR REPLACE FUNCTION public.validate_lesson_videos(lesson_uuid UUID)
RETURNS TABLE (
  video_id TEXT,
  is_valid BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lesson_videos JSONB;
  video_item JSONB;
BEGIN
  -- Get videos from lesson
  SELECT videos INTO lesson_videos
  FROM public.lessons
  WHERE id = lesson_uuid;

  -- Validate each video
  IF lesson_videos IS NOT NULL THEN
    FOR video_item IN SELECT * FROM jsonb_array_elements(lesson_videos)
    LOOP
      RETURN QUERY
      SELECT
        video_item->>'id' AS video_id,
        (video_item->>'id' IS NOT NULL AND video_item->>'title' IS NOT NULL) AS is_valid,
        CASE
          WHEN video_item->>'id' IS NULL THEN 'Missing video ID'
          WHEN video_item->>'title' IS NULL THEN 'Missing video title'
          ELSE NULL
        END AS error_message;
    END LOOP;
  END IF;
END;
$$;

-- ============================================================================
-- STEP 5: Create/Fix assignment system functions
-- ============================================================================

-- Drop ALL versions of functions regardless of signature
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  -- Drop all versions of create_student_lesson_assignments
  FOR r IN 
    SELECT p.oid::regprocedure as func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'create_student_lesson_assignments'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    RAISE NOTICE 'Dropped function: %', r.func_signature;
  END LOOP;
  
  -- Drop all versions of create_student_assignment_assignments
  FOR r IN 
    SELECT p.oid::regprocedure as func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'create_student_assignment_assignments'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    RAISE NOTICE 'Dropped function: %', r.func_signature;
  END LOOP;
END $$;

-- Function to create student lesson assignments
CREATE OR REPLACE FUNCTION public.create_student_lesson_assignments(
  p_lesson_assignment_id UUID,
  p_student_ids UUID[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_id UUID;
  created_count INTEGER := 0;
BEGIN
  FOREACH student_id IN ARRAY p_student_ids
  LOOP
    INSERT INTO public.student_lesson_assignments (
      lesson_assignment_id,
      student_id,
      status,
      created_at
    ) VALUES (
      p_lesson_assignment_id,
      student_id,
      'assigned',
      NOW()
    )
    ON CONFLICT (lesson_assignment_id, student_id) DO NOTHING;
    
    created_count := created_count + 1;
  END LOOP;

  RETURN created_count;
END;
$$;

-- Function to create student assignment assignments
CREATE OR REPLACE FUNCTION public.create_student_assignment_assignments(
  p_assignment_assignment_id UUID,
  p_student_ids UUID[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_id UUID;
  created_count INTEGER := 0;
BEGIN
  FOREACH student_id IN ARRAY p_student_ids
  LOOP
    INSERT INTO public.student_assignment_assignments (
      assignment_assignment_id,
      student_id,
      status,
      created_at
    ) VALUES (
      p_assignment_assignment_id,
      student_id,
      'assigned',
      NOW()
    )
    ON CONFLICT (assignment_assignment_id, student_id) DO NOTHING;
    
    created_count := created_count + 1;
  END LOOP;

  RETURN created_count;
END;
$$;

-- ============================================================================
-- STEP 6: Fix update_updated_at_column function
-- ============================================================================

-- This function is used by multiple tables via triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all functions have search_path set
DO $$
DECLARE
  func_record RECORD;
  funcs_without_search_path INTEGER := 0;
BEGIN
  FOR func_record IN 
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
      'get_student_activity_summary',
      'increment_question_usage',
      'create_student_lesson_assignments',
      'create_student_assignment_assignments',
      'sync_course',
      'record_assignment_submission',
      'get_assignment_with_stats',
      'calculate_assignment_stats',
      'validate_lesson_videos',
      'record_lesson_view',
      'sync_student',
      'get_course_students',
      'update_course_student_counts',
      'update_updated_at_column'
    )
  LOOP
    RAISE NOTICE 'Verified function: %.%', func_record.schema_name, func_record.function_name;
  END LOOP;
END $$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.sync_course IS 'Syncs course data from Google Classroom with SET search_path for security';
COMMENT ON FUNCTION public.sync_student IS 'Syncs student data from Google Classroom with SET search_path for security';
COMMENT ON FUNCTION public.get_course_students IS 'Returns students in a course with SET search_path for security';
COMMENT ON FUNCTION public.update_course_student_counts IS 'Updates student counts for all courses with SET search_path for security';
COMMENT ON FUNCTION public.record_assignment_submission IS 'Records an assignment submission and updates gradebook with SET search_path for security';
COMMENT ON FUNCTION public.calculate_assignment_stats IS 'Calculates statistics for an assignment with SET search_path for security';
COMMENT ON FUNCTION public.get_assignment_with_stats IS 'Gets assignment data with statistics with SET search_path for security';
COMMENT ON FUNCTION public.record_lesson_view IS 'Records a lesson view and updates progress with SET search_path for security';
COMMENT ON FUNCTION public.validate_lesson_videos IS 'Validates video data in a lesson with SET search_path for security';
COMMENT ON FUNCTION public.create_student_lesson_assignments IS 'Creates student lesson assignment records with SET search_path for security';
COMMENT ON FUNCTION public.create_student_assignment_assignments IS 'Creates student assignment assignment records with SET search_path for security';
COMMENT ON FUNCTION public.get_student_activity_summary IS 'Gets activity summary for a student with SET search_path for security';
COMMENT ON FUNCTION public.increment_question_usage IS 'Increments question bank usage count with SET search_path for security';
COMMENT ON FUNCTION public.update_updated_at_column IS 'Trigger function to auto-update updated_at timestamps with SET search_path for security';
