-- ============================================================================
-- FIX RLS ADMIN ACCESS - Comprehensive Solution
-- ============================================================================
-- This migration fixes RLS policies to ensure:
-- - Students can access: lessons, assignments, games, simulations (view only)
-- - Admins/Teachers can: create, publish, assign, manage all content
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop all existing policies and functions
-- ============================================================================

DO $$ 
DECLARE 
  r RECORD;
BEGIN
  -- Drop all existing policies
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) 
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Drop existing helper functions
DROP FUNCTION IF EXISTS public.is_admin_or_teacher(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_email() CASCADE;

-- ============================================================================
-- STEP 2: Create improved helper functions
-- ============================================================================

-- Function to get current user's email from auth context
CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get email from users table based on auth.uid()
  SELECT email INTO user_email
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN user_email;
END;
$$;

-- Improved function to check if user is admin or teacher
CREATE OR REPLACE FUNCTION public.is_admin_or_teacher(check_email TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  admin_emails TEXT[] := ARRAY[
    'antoccic@fitchburg.k12.ma.us', 
    'craigantocci@gmail.com',
    'admin@test.com',
    'teacher@test.com'
  ];
  email_to_check TEXT;
BEGIN
  -- Use provided email or get current user's email
  IF check_email IS NULL THEN
    email_to_check := public.get_user_email();
  ELSE
    email_to_check := check_email;
  END IF;
  
  -- Check if email is in admin list
  RETURN email_to_check = ANY(admin_emails);
END;
$$;

-- Function to check if user is a student (not admin/teacher)
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN NOT public.is_admin_or_teacher();
END;
$$;

-- ============================================================================
-- STEP 3: Enable RLS on all tables
-- ============================================================================

-- Core content tables
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_usage_log ENABLE ROW LEVEL SECURITY;

-- Auth tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- Assignment tables
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Assignment system tables
ALTER TABLE public.lesson_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lesson_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_assignment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_reminders ENABLE ROW LEVEL SECURITY;

-- Student/course management
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity ENABLE ROW LEVEL SECURITY;

-- Progress tracking
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gradebook_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: LESSONS - Students view published, admins manage all
-- ============================================================================

-- Students can view published lessons
CREATE POLICY "Students can view published lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (
    published = true OR public.is_admin_or_teacher()
  );

-- Admins can create lessons
CREATE POLICY "Admins can create lessons"
  ON public.lessons FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_teacher());

-- Admins can update lessons
CREATE POLICY "Admins can update lessons"
  ON public.lessons FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_teacher())
  WITH CHECK (public.is_admin_or_teacher());

-- Admins can delete lessons
CREATE POLICY "Admins can delete lessons"
  ON public.lessons FOR DELETE
  TO authenticated
  USING (public.is_admin_or_teacher());

-- ============================================================================
-- STEP 5: ASSIGNMENTS - Students view published, admins manage all
-- ============================================================================

-- Students can view published assignments
CREATE POLICY "Students can view published assignments"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    published = true OR public.is_admin_or_teacher()
  );

-- Admins can create assignments
CREATE POLICY "Admins can create assignments"
  ON public.assignments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_teacher());

-- Admins can update assignments
CREATE POLICY "Admins can update assignments"
  ON public.assignments FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_teacher())
  WITH CHECK (public.is_admin_or_teacher());

-- Admins can delete assignments
CREATE POLICY "Admins can delete assignments"
  ON public.assignments FOR DELETE
  TO authenticated
  USING (public.is_admin_or_teacher());

-- ============================================================================
-- STEP 6: ASSIGNMENT SUBMISSIONS - Students manage own, admins see all
-- ============================================================================

-- Students can view their own submissions, admins can view all
CREATE POLICY "View own or all submissions"
  ON public.assignment_submissions FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR public.is_admin_or_teacher()
  );

-- Students can create their own submissions
CREATE POLICY "Students can create submissions"
  ON public.assignment_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id::uuid = auth.uid());

-- Students can update their own submissions, admins can update all (for grading)
CREATE POLICY "Update own or all submissions"
  ON public.assignment_submissions FOR UPDATE
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR public.is_admin_or_teacher()
  )
  WITH CHECK (
    user_id::uuid = auth.uid() OR public.is_admin_or_teacher()
  );

-- ============================================================================
-- STEP 7: LESSON ASSIGNMENTS - Admins assign, students view their assignments
-- ============================================================================

-- Students can view published lesson assignments
CREATE POLICY "View published lesson assignments"
  ON public.lesson_assignments FOR SELECT
  TO authenticated
  USING (
    published = true OR public.is_admin_or_teacher()
  );

-- Admins can create lesson assignments
CREATE POLICY "Admins can create lesson assignments"
  ON public.lesson_assignments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_teacher());

-- Admins can update lesson assignments
CREATE POLICY "Admins can update lesson assignments"
  ON public.lesson_assignments FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_teacher());

-- Admins can delete lesson assignments
CREATE POLICY "Admins can delete lesson assignments"
  ON public.lesson_assignments FOR DELETE
  TO authenticated
  USING (public.is_admin_or_teacher());

-- ============================================================================
-- STEP 8: STUDENT LESSON ASSIGNMENTS - Track individual progress
-- ============================================================================

-- Students can view their own progress, admins can view all
CREATE POLICY "View own lesson progress"
  ON public.student_lesson_assignments FOR SELECT
  TO authenticated
  USING (
    student_id::uuid = auth.uid() OR public.is_admin_or_teacher()
  );

-- System can create student lesson assignments
CREATE POLICY "Create student lesson assignments"
  ON public.student_lesson_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Students can update their own progress, admins can update all
CREATE POLICY "Update own lesson progress"
  ON public.student_lesson_assignments FOR UPDATE
  TO authenticated
  USING (
    student_id::uuid = auth.uid() OR public.is_admin_or_teacher()
  );

-- ============================================================================
-- STEP 9: HOMEWORK ASSIGNMENTS - Same pattern as lesson assignments
-- ============================================================================

-- Students can view published homework assignments
CREATE POLICY "View published homework assignments"
  ON public.assignment_assignments FOR SELECT
  TO authenticated
  USING (
    published = true OR public.is_admin_or_teacher()
  );

-- Admins can manage homework assignments
CREATE POLICY "Admins can create homework assignments"
  ON public.assignment_assignments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_teacher());

CREATE POLICY "Admins can update homework assignments"
  ON public.assignment_assignments FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_teacher());

CREATE POLICY "Admins can delete homework assignments"
  ON public.assignment_assignments FOR DELETE
  TO authenticated
  USING (public.is_admin_or_teacher());

-- ============================================================================
-- STEP 10: STUDENT HOMEWORK ASSIGNMENTS - Track homework progress
-- ============================================================================

CREATE POLICY "View own homework progress"
  ON public.student_assignment_assignments FOR SELECT
  TO authenticated
  USING (
    student_id::uuid = auth.uid() OR public.is_admin_or_teacher()
  );

CREATE POLICY "Create student homework assignments"
  ON public.student_assignment_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Update own homework progress"
  ON public.student_assignment_assignments FOR UPDATE
  TO authenticated
  USING (
    student_id::uuid = auth.uid() OR public.is_admin_or_teacher()
  );

-- ============================================================================
-- STEP 11: VOCABULARY GAMES - Students play, admins manage
-- ============================================================================

-- Students can view and record their own game scores
CREATE POLICY "View own game scores"
  ON public.vocabulary_game_scores FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR public.is_admin_or_teacher()
  );

CREATE POLICY "Students can record game scores"
  ON public.vocabulary_game_scores FOR INSERT
  TO authenticated
  WITH CHECK (user_id::uuid = auth.uid());

CREATE POLICY "Admins can manage all game scores"
  ON public.vocabulary_game_scores FOR ALL
  TO authenticated
  USING (public.is_admin_or_teacher());

-- ============================================================================
-- STEP 12: LESSON PROGRESS - Students track own, admins see all
-- ============================================================================

CREATE POLICY "View own lesson progress tracking"
  ON public.lesson_progress FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR public.is_admin_or_teacher()
  );

CREATE POLICY "Students can track lesson progress"
  ON public.lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id::uuid = auth.uid());

CREATE POLICY "Students can update lesson progress"
  ON public.lesson_progress FOR UPDATE
  TO authenticated
  USING (user_id::uuid = auth.uid());

CREATE POLICY "Admins can manage all lesson progress"
  ON public.lesson_progress FOR ALL
  TO authenticated
  USING (public.is_admin_or_teacher());

-- ============================================================================
-- STEP 13: VIDEO QUESTIONS - Students answer, admins manage
-- ============================================================================

CREATE POLICY "View own video responses"
  ON public.video_question_responses FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR public.is_admin_or_teacher()
  );

CREATE POLICY "Students can record video responses"
  ON public.video_question_responses FOR INSERT
  TO authenticated
  WITH CHECK (user_id::uuid = auth.uid());

CREATE POLICY "Students can update video responses"
  ON public.video_question_responses FOR UPDATE
  TO authenticated
  USING (user_id::uuid = auth.uid());

CREATE POLICY "Admins can manage all video responses"
  ON public.video_question_responses FOR ALL
  TO authenticated
  USING (public.is_admin_or_teacher());

-- ============================================================================
-- STEP 14: GRADEBOOK - Students view own, admins manage all
-- ============================================================================

CREATE POLICY "View own gradebook entries"
  ON public.gradebook_entries FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR public.is_admin_or_teacher()
  );

CREATE POLICY "Admins can manage all gradebook entries"
  ON public.gradebook_entries FOR ALL
  TO authenticated
  USING (public.is_admin_or_teacher());

-- ============================================================================
-- STEP 15: QUESTION BANK - Admins only
-- ============================================================================

CREATE POLICY "Admins can view question bank"
  ON public.question_bank FOR SELECT
  TO authenticated
  USING (public.is_admin_or_teacher());

CREATE POLICY "Admins can manage question bank"
  ON public.question_bank FOR ALL
  TO authenticated
  USING (public.is_admin_or_teacher());

CREATE POLICY "Admins can view question usage"
  ON public.question_usage_log FOR ALL
  TO authenticated
  USING (public.is_admin_or_teacher());

-- ============================================================================
-- STEP 16: STUDENTS & COURSES - Admins manage, students view own
-- ============================================================================

CREATE POLICY "View own student record"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    id::uuid = auth.uid() OR public.is_admin_or_teacher()
  );

CREATE POLICY "Admins can manage students"
  ON public.students FOR ALL
  TO authenticated
  USING (public.is_admin_or_teacher());

CREATE POLICY "View courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage courses"
  ON public.courses FOR ALL
  TO authenticated
  USING (public.is_admin_or_teacher());

-- ============================================================================
-- STEP 17: STUDENT ACTIVITY - Track student usage
-- ============================================================================

CREATE POLICY "View own activity"
  ON public.student_activity FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR public.is_admin_or_teacher()
  );

CREATE POLICY "Students can record activity"
  ON public.student_activity FOR INSERT
  TO authenticated
  WITH CHECK (user_id::uuid = auth.uid());

CREATE POLICY "Admins can manage all activity"
  ON public.student_activity FOR ALL
  TO authenticated
  USING (public.is_admin_or_teacher());

-- ============================================================================
-- STEP 18: UNITS - Reference data, read-only for students
-- ============================================================================

CREATE POLICY "Everyone can view units"
  ON public.units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage units"
  ON public.units FOR ALL
  TO authenticated
  USING (public.is_admin_or_teacher());

-- ============================================================================
-- STEP 19: ASSIGNMENT ANALYTICS & REMINDERS - Admins only
-- ============================================================================

CREATE POLICY "Admins can manage assignment analytics"
  ON public.assignment_analytics FOR ALL
  TO authenticated
  USING (public.is_admin_or_teacher());

CREATE POLICY "Admins can manage assignment reminders"
  ON public.assignment_reminders FOR ALL
  TO authenticated
  USING (public.is_admin_or_teacher());

-- ============================================================================
-- STEP 20: LEGACY SUBMISSIONS TABLE - Same as assignment_submissions
-- ============================================================================

CREATE POLICY "View own legacy submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR public.is_admin_or_teacher()
  );

CREATE POLICY "Manage own legacy submissions"
  ON public.submissions FOR ALL
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR public.is_admin_or_teacher()
  );

-- ============================================================================
-- STEP 21: AUTH TABLES - Users manage own data
-- ============================================================================

-- Users can view their own data, admins can view all
CREATE POLICY "View own user data"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR public.is_admin_or_teacher()
  );

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Accounts (user_id might be TEXT in NextAuth tables)
CREATE POLICY "View own accounts"
  ON public.accounts FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR public.is_admin_or_teacher()
  );

CREATE POLICY "Manage own accounts"
  ON public.accounts FOR ALL
  TO authenticated
  USING (user_id::uuid = auth.uid());

-- Sessions (user_id might be TEXT in NextAuth tables)
CREATE POLICY "View own sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR public.is_admin_or_teacher()
  );

CREATE POLICY "Manage own sessions"
  ON public.sessions FOR ALL
  TO authenticated
  USING (user_id::uuid = auth.uid());

-- Verification tokens
CREATE POLICY "Manage verification tokens"
  ON public.verification_tokens FOR ALL
  TO authenticated
  USING (true);

-- ============================================================================
-- STEP 22: Grant necessary permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant SELECT to authenticated users (RLS will filter)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant INSERT/UPDATE/DELETE where appropriate (RLS will control)
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- ============================================================================
-- STEP 23: Add helpful comments
-- ============================================================================

COMMENT ON FUNCTION public.get_user_email() IS 'Gets the email of the currently authenticated user from the users table';
COMMENT ON FUNCTION public.is_admin_or_teacher(TEXT) IS 'Checks if the given email (or current user if NULL) is an admin or teacher';
COMMENT ON FUNCTION public.is_student() IS 'Checks if the current user is a student (not admin/teacher)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify RLS is enabled on all tables
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;

-- Test admin function with your email
-- SELECT is_admin_or_teacher('antoccic@fitchburg.k12.ma.us');
-- SELECT is_admin_or_teacher('craigantocci@gmail.com');

-- List all policies
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;
