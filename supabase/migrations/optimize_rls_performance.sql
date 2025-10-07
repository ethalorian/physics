-- ============================================================================
-- RLS PERFORMANCE OPTIMIZATION
-- ============================================================================
-- This migration addresses Supabase database linter warnings:
-- 1. Auth RLS Initplan: Wrap auth.uid() in subqueries for better performance
-- 2. Multiple Permissive Policies: Combine policies to reduce evaluation overhead
--
-- Changes:
-- - auth.uid() -> (select auth.uid()) 
-- - Multiple SELECT policies -> Single policy with OR conditions
-- - Multiple INSERT/UPDATE policies -> Single policy with OR conditions
-- ============================================================================

-- Drop all existing policies
DO $$ 
DECLARE 
  r RECORD;
BEGIN
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
-- OPTIMIZED RLS POLICIES - REFERENCE/STATIC DATA
-- ============================================================================

-- Units: Separate policies for each action to avoid duplicates
CREATE POLICY "Everyone can view units"
  ON public.units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert units"
  ON public.units FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Admins can update units"
  ON public.units FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Admins can delete units"
  ON public.units FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- Lessons: Students can view published lessons, admins/teachers can see and edit ALL
CREATE POLICY "Lessons viewable by all authenticated users"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (
    published = true OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Lessons manageable by admins and teachers"
  ON public.lessons FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Lessons updatable by admins and teachers"
  ON public.lessons FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Lessons deletable by admins and teachers"
  ON public.lessons FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- Question Bank: Separate policies for each action
CREATE POLICY "Admins can view question bank"
  ON public.question_bank FOR SELECT
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Admins can insert question bank"
  ON public.question_bank FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Admins can update question bank"
  ON public.question_bank FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Admins can delete question bank"
  ON public.question_bank FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- Question Usage Log: Teachers only
CREATE POLICY "Question usage viewable by teachers"
  ON public.question_usage_log FOR SELECT
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Question usage insertable by teachers"
  ON public.question_usage_log FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Question usage updatable by teachers"
  ON public.question_usage_log FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Question usage deletable by teachers"
  ON public.question_usage_log FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- ============================================================================
-- OPTIMIZED RLS POLICIES - AUTHENTICATION TABLES
-- ============================================================================

-- Users: Combine own and admin access into single policy
CREATE POLICY "View own user data"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    id = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()));

-- Accounts: Separate policies for each action to avoid duplicates
CREATE POLICY "View own or all accounts"
  ON public.accounts FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Insert own accounts"
  ON public.accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id::uuid = (select auth.uid()));

CREATE POLICY "Update own accounts"
  ON public.accounts FOR UPDATE
  TO authenticated
  USING (user_id::uuid = (select auth.uid()));

CREATE POLICY "Delete own accounts"
  ON public.accounts FOR DELETE
  TO authenticated
  USING (user_id::uuid = (select auth.uid()));

-- Sessions: Separate policies for each action to avoid duplicates
CREATE POLICY "View own sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Insert own sessions"
  ON public.sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id::uuid = (select auth.uid()));

CREATE POLICY "Update own sessions"
  ON public.sessions FOR UPDATE
  TO authenticated
  USING (user_id::uuid = (select auth.uid()));

CREATE POLICY "Delete own sessions"
  ON public.sessions FOR DELETE
  TO authenticated
  USING (user_id::uuid = (select auth.uid()));

-- Verification Tokens: Keep simple policy
CREATE POLICY "Users can manage their own verification tokens"
  ON public.verification_tokens FOR ALL
  TO authenticated
  USING (true);

-- ============================================================================
-- OPTIMIZED RLS POLICIES - ASSIGNMENTS
-- ============================================================================

-- Assignments: Students view published only, admins/teachers can see and edit ALL
CREATE POLICY "Assignments viewable by authenticated users"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    published = true OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Assignments insertable by admins and teachers"
  ON public.assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Assignments updatable by admins and teachers"
  ON public.assignments FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Assignments deletable by admins and teachers"
  ON public.assignments FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- Assignment Submissions: Combine into fewer policies
CREATE POLICY "View own or all submissions"
  ON public.assignment_submissions FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Students can create submissions"
  ON public.assignment_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id::uuid = (select auth.uid()));

CREATE POLICY "Update own or all submissions"
  ON public.assignment_submissions FOR UPDATE
  TO authenticated
  USING (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- Submissions (legacy): Separate policies for each action
CREATE POLICY "View own legacy submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Insert own legacy submissions"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Update own legacy submissions"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Delete own legacy submissions"
  ON public.submissions FOR DELETE
  TO authenticated
  USING (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- Assignment Analytics: Teachers only
CREATE POLICY "Assignment analytics viewable by teachers"
  ON public.assignment_analytics FOR SELECT
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Assignment analytics insertable by teachers"
  ON public.assignment_analytics FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Assignment analytics updatable by teachers"
  ON public.assignment_analytics FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Assignment analytics deletable by teachers"
  ON public.assignment_analytics FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- ============================================================================
-- OPTIMIZED RLS POLICIES - ASSIGNMENT SYSTEM (Lesson & Homework Assignments)
-- ============================================================================

-- Lesson Assignments: Admins/teachers see ALL, students see only published
CREATE POLICY "Lesson assignments viewable by authenticated users"
  ON public.lesson_assignments FOR SELECT
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid()))) OR
    published = true
  );

CREATE POLICY "Lesson assignments insertable by admins and teachers"
  ON public.lesson_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Lesson assignments updatable by admins and teachers"
  ON public.lesson_assignments FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Lesson assignments deletable by admins and teachers"
  ON public.lesson_assignments FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- Student Lesson Assignments: Combine policies
CREATE POLICY "View own lesson progress"
  ON public.student_lesson_assignments FOR SELECT
  TO authenticated
  USING (
    student_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Update own lesson progress"
  ON public.student_lesson_assignments FOR UPDATE
  TO authenticated
  USING (
    student_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
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
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid()))) OR
    published = true
  );

CREATE POLICY "Homework assignments insertable by admins and teachers"
  ON public.assignment_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Homework assignments updatable by admins and teachers"
  ON public.assignment_assignments FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Homework assignments deletable by admins and teachers"
  ON public.assignment_assignments FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- Student Assignment Assignments: Combine policies
CREATE POLICY "View own homework progress"
  ON public.student_assignment_assignments FOR SELECT
  TO authenticated
  USING (
    student_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Update own homework progress"
  ON public.student_assignment_assignments FOR UPDATE
  TO authenticated
  USING (
    student_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "System can create student homework assignments"
  ON public.student_assignment_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Assignment Reminders: Teachers can manage - separate by action
CREATE POLICY "Assignment reminders viewable by teachers"
  ON public.assignment_reminders FOR SELECT
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Assignment reminders insertable by teachers"
  ON public.assignment_reminders FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Assignment reminders updatable by teachers"
  ON public.assignment_reminders FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Assignment reminders deletable by teachers"
  ON public.assignment_reminders FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- ============================================================================
-- OPTIMIZED RLS POLICIES - STUDENTS & COURSES
-- ============================================================================

-- Students: Separate policies for each action
CREATE POLICY "View own student record"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Admins can insert students"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Admins can update students"
  ON public.students FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Admins can delete students"
  ON public.students FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- Courses: Separate policies for each action
CREATE POLICY "View courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid()))) OR
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id::uuid = (select auth.uid())
    )
  );

CREATE POLICY "Admins can insert courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Admins can update courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Admins can delete courses"
  ON public.courses FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- Student Activity: Separate policies for each action
CREATE POLICY "View own activity"
  ON public.student_activity FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Students can record activity"
  ON public.student_activity FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Update student activity"
  ON public.student_activity FOR UPDATE
  TO authenticated
  USING (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Delete student activity"
  ON public.student_activity FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- ============================================================================
-- OPTIMIZED RLS POLICIES - PROGRESS TRACKING
-- ============================================================================

-- Lesson Progress: Separate policies for each action
CREATE POLICY "View own lesson progress tracking"
  ON public.lesson_progress FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Students can track lesson progress"
  ON public.lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Students can update lesson progress"
  ON public.lesson_progress FOR UPDATE
  TO authenticated
  USING (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Delete lesson progress"
  ON public.lesson_progress FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- Vocabulary Game Scores: Separate policies for each action
CREATE POLICY "View own game scores"
  ON public.vocabulary_game_scores FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Students can record game scores"
  ON public.vocabulary_game_scores FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Update game scores"
  ON public.vocabulary_game_scores FOR UPDATE
  TO authenticated
  USING (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Delete game scores"
  ON public.vocabulary_game_scores FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- Video Question Responses: Separate policies for each action
CREATE POLICY "View own video responses"
  ON public.video_question_responses FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Students can record video responses"
  ON public.video_question_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Students can update video responses"
  ON public.video_question_responses FOR UPDATE
  TO authenticated
  USING (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Delete video responses"
  ON public.video_question_responses FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- Gradebook Entries: Separate policies for each action
CREATE POLICY "View own gradebook entries"
  ON public.gradebook_entries FOR SELECT
  TO authenticated
  USING (
    user_id::uuid = (select auth.uid()) OR
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Insert gradebook entries"
  ON public.gradebook_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Update gradebook entries"
  ON public.gradebook_entries FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

CREATE POLICY "Delete gradebook entries"
  ON public.gradebook_entries FOR DELETE
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = (select auth.uid())))
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is still enabled
DO $$
DECLARE
  table_count INTEGER;
  rls_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM pg_tables
  WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true;
  
  RAISE NOTICE 'Total tables: %, Tables with RLS: %', table_count, rls_count;
END $$;

COMMENT ON FUNCTION public.is_admin_or_teacher IS 
'Helper function to check if a user email belongs to an admin or teacher. 
Performance optimized: Always use (select auth.uid()) in RLS policies to avoid per-row evaluation.';
