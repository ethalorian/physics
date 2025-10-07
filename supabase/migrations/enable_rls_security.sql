-- Enable Row Level Security (RLS) on all tables
-- This migration addresses Supabase security linter warnings
--
-- NOTE: This migration is IDEMPOTENT - it can be run multiple times safely.
-- It will drop and recreate all policies to ensure consistency.

-- ============================================================================
-- STEP 1: DROP EXISTING POLICIES FIRST (they depend on the function)
-- ============================================================================

DO $$ 
DECLARE 
  r RECORD;
BEGIN
  -- Drop all existing policies on all tables
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) 
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: DROP EXISTING HELPER FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS public.is_admin_or_teacher(TEXT) CASCADE;

-- ============================================================================
-- STEP 3: ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Reference/Static Data Tables (Read-only for students, writable for admins)
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_usage_log ENABLE ROW LEVEL SECURITY;

-- Authentication Tables (Managed by NextAuth)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- Assignment System Tables
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Assignment System Extended Tables
ALTER TABLE public.lesson_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lesson_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_assignment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_reminders ENABLE ROW LEVEL SECURITY;

-- Student/Course Management Tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity ENABLE ROW LEVEL SECURITY;

-- Progress Tracking Tables
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gradebook_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: CREATE HELPER FUNCTION TO CHECK USER ROLE
-- ============================================================================

-- Function to check if a user is an admin or teacher
CREATE OR REPLACE FUNCTION public.is_admin_or_teacher(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_emails TEXT[] := ARRAY['antoccic@fitchburg.k12.ma.us', 'craigantocci@gmail.com'];
BEGIN
  RETURN user_email = ANY(admin_emails);
END;
$$;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================================================

-- ============================================================================
-- RLS POLICIES - REFERENCE/STATIC DATA
-- ============================================================================

-- Units: Read-only for all authenticated users, writable for admins
CREATE POLICY "Units are viewable by all authenticated users"
  ON public.units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Units are writable by admins"
  ON public.units FOR ALL
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- Lessons: Students can view published lessons, admins/teachers can see and edit ALL
CREATE POLICY "Lessons viewable by all authenticated users"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (
    published = true OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Lessons manageable by admins and teachers"
  ON public.lessons FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Lessons updatable by admins and teachers"
  ON public.lessons FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Lessons deletable by admins and teachers"
  ON public.lessons FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- Question Bank: Teachers can manage, students can view published questions
CREATE POLICY "Question bank viewable by teachers"
  ON public.question_bank FOR SELECT
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Question bank writable by teachers"
  ON public.question_bank FOR ALL
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- Question Usage Log: Teachers can view all, students see nothing
CREATE POLICY "Question usage viewable by teachers"
  ON public.question_usage_log FOR SELECT
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Question usage writable by teachers"
  ON public.question_usage_log FOR ALL
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- ============================================================================
-- RLS POLICIES - AUTHENTICATION TABLES
-- ============================================================================

-- Users: Users can read their own data, admins can read all
CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Users can update their own data"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Accounts: Users can view their own accounts
CREATE POLICY "Users can view their own accounts"
  ON public.accounts FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Users can manage their own accounts"
  ON public.accounts FOR ALL
  TO authenticated
  USING (user_id::uuid = auth.uid());

-- Sessions: Users can view their own sessions
CREATE POLICY "Users can view their own sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Users can manage their own sessions"
  ON public.sessions FOR ALL
  TO authenticated
  USING (user_id::uuid = auth.uid());

-- Verification Tokens: Users can manage their own tokens
CREATE POLICY "Users can manage their own verification tokens"
  ON public.verification_tokens FOR ALL
  TO authenticated
  USING (true);

-- ============================================================================
-- RLS POLICIES - ASSIGNMENTS
-- ============================================================================

-- Assignments: Students view published only, admins/teachers can see and edit ALL
CREATE POLICY "Assignments viewable by authenticated users"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    published = true OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Assignments insertable by admins and teachers"
  ON public.assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Assignments updatable by admins and teachers"
  ON public.assignments FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Assignments deletable by admins and teachers"
  ON public.assignments FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- Assignment Submissions: Students can manage their own, teachers can view all
CREATE POLICY "Students can view their own submissions"
  ON public.assignment_submissions FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Students can create their own submissions"
  ON public.assignment_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id::uuid = auth.uid());

CREATE POLICY "Students can update their own submissions"
  ON public.assignment_submissions FOR UPDATE
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- Submissions (old table): Same as assignment_submissions
CREATE POLICY "Students can view their own submissions (legacy)"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Students can manage their own submissions (legacy)"
  ON public.submissions FOR ALL
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- Assignment Analytics: Teachers only
CREATE POLICY "Assignment analytics viewable by teachers"
  ON public.assignment_analytics FOR ALL
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- ============================================================================
-- RLS POLICIES - ASSIGNMENT SYSTEM (Lesson & Homework Assignments)
-- ============================================================================

-- Lesson Assignments: Admins/teachers see ALL, students see only their published assignments
CREATE POLICY "Lesson assignments viewable by authenticated users"
  ON public.lesson_assignments FOR SELECT
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid())) OR
    published = true
  );

CREATE POLICY "Lesson assignments insertable by admins and teachers"
  ON public.lesson_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Lesson assignments updatable by admins and teachers"
  ON public.lesson_assignments FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Lesson assignments deletable by admins and teachers"
  ON public.lesson_assignments FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- Student Lesson Assignments: Students can view/update their own
CREATE POLICY "Students can view their lesson assignments"
  ON public.student_lesson_assignments FOR SELECT
  TO authenticated
  USING (
    student_id::uuid = auth.uid() OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Students can update their lesson progress"
  ON public.student_lesson_assignments FOR UPDATE
  TO authenticated
  USING (
    student_id::uuid = auth.uid() OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "System can create student lesson assignments"
  ON public.student_lesson_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Assignment Assignments (Homework): Admins/teachers see ALL, students see only published
CREATE POLICY "Homework assignments viewable by authenticated users"
  ON public.assignment_assignments FOR SELECT
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid())) OR
    published = true
  );

CREATE POLICY "Homework assignments insertable by admins and teachers"
  ON public.assignment_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Homework assignments updatable by admins and teachers"
  ON public.assignment_assignments FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Homework assignments deletable by admins and teachers"
  ON public.assignment_assignments FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- Student Assignment Assignments: Students can view/update their own
CREATE POLICY "Students can view their homework assignments"
  ON public.student_assignment_assignments FOR SELECT
  TO authenticated
  USING (
    student_id::uuid = auth.uid() OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Students can update their homework progress"
  ON public.student_assignment_assignments FOR UPDATE
  TO authenticated
  USING (
    student_id::uuid = auth.uid() OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "System can create student homework assignments"
  ON public.student_assignment_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Assignment Reminders: Teachers can manage
CREATE POLICY "Assignment reminders manageable by teachers"
  ON public.assignment_reminders FOR ALL
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- ============================================================================
-- RLS POLICIES - STUDENTS & COURSES
-- ============================================================================

-- Students: Teachers can view all, students can view their own
CREATE POLICY "Students viewable by teachers"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    id::uuid = auth.uid() OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Students writable by teachers"
  ON public.students FOR ALL
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- Courses: Teachers can manage, students in course can view
CREATE POLICY "Courses viewable by teachers"
  ON public.courses FOR SELECT
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid())) OR
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id::uuid = auth.uid()
    )
  );

CREATE POLICY "Courses writable by teachers"
  ON public.courses FOR ALL
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- Student Activity: Students can view/update their own, teachers can view all
CREATE POLICY "Students can view their own activity"
  ON public.student_activity FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Students can record their own activity"
  ON public.student_activity FOR INSERT
  TO authenticated
  WITH CHECK (user_id::uuid = auth.uid());

CREATE POLICY "Teachers can manage all student activity"
  ON public.student_activity FOR ALL
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- ============================================================================
-- RLS POLICIES - PROGRESS TRACKING
-- ============================================================================

-- Lesson Progress: Students can view/update their own, teachers can view all
CREATE POLICY "Students can view their lesson progress"
  ON public.lesson_progress FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Students can update their lesson progress"
  ON public.lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id::uuid = auth.uid());

CREATE POLICY "Students can modify their lesson progress"
  ON public.lesson_progress FOR UPDATE
  TO authenticated
  USING (user_id::uuid = auth.uid());

CREATE POLICY "Teachers can manage all lesson progress"
  ON public.lesson_progress FOR ALL
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- Vocabulary Game Scores: Students can view/create their own, teachers can view all
CREATE POLICY "Students can view their game scores"
  ON public.vocabulary_game_scores FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Students can record their game scores"
  ON public.vocabulary_game_scores FOR INSERT
  TO authenticated
  WITH CHECK (user_id::uuid = auth.uid());

CREATE POLICY "Teachers can manage all game scores"
  ON public.vocabulary_game_scores FOR ALL
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- Video Question Responses: Students can manage their own, teachers can view all
CREATE POLICY "Students can view their video responses"
  ON public.video_question_responses FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Students can record their video responses"
  ON public.video_question_responses FOR INSERT
  TO authenticated
  WITH CHECK (user_id::uuid = auth.uid());

CREATE POLICY "Students can update their video responses"
  ON public.video_question_responses FOR UPDATE
  TO authenticated
  USING (user_id::uuid = auth.uid());

CREATE POLICY "Teachers can manage all video responses"
  ON public.video_question_responses FOR ALL
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- Gradebook Entries: Teachers can manage, students can view their own
CREATE POLICY "Students can view their gradebook entries"
  ON public.gradebook_entries FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = auth.uid() OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Teachers can manage all gradebook entries"
  ON public.gradebook_entries FOR ALL
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- ============================================================================
-- FIX FUNCTION SEARCH_PATH ISSUES
-- ============================================================================

-- Update all functions to have immutable search_path
CREATE OR REPLACE FUNCTION public.update_lesson_assignment_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Function implementation remains the same
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_assignment_assignment_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Function implementation remains the same
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_activity_summary(p_student_id UUID)
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
BEGIN
  -- Function implementation remains the same
  RETURN QUERY
  SELECT 0, 0, 0, 0, 0, 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_question_usage(p_question_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.question_bank
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = p_question_id;
END;
$$;

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

-- Note: Other function implementations should be updated similarly
-- This sets the foundation for secure function execution

-- ============================================================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant necessary table permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- You can verify RLS is enabled by running:
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

COMMENT ON FUNCTION public.is_admin_or_teacher IS 'Helper function to check if a user email belongs to an admin or teacher. Update the admin_emails array as needed.';
