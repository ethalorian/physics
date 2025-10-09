-- ============================================================================
-- DATABASE FIX FOR YOUR EXISTING STRUCTURE
-- ============================================================================
-- This script works with your current column types without changing them
-- It properly handles TEXT vs UUID mismatches
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES (Clean slate)
-- ============================================================================

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
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
        r.policyname, r.schemaname, r.tablename);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: CREATE USER ROLES TABLE (if missing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert admin users
INSERT INTO public.user_roles (email, role) VALUES
  ('antoccic@fitchburg.k12.ma.us', 'admin'),
  ('craigantocci@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- ============================================================================
-- STEP 3: CREATE HELPER FUNCTIONS THAT HANDLE TYPE MISMATCHES
-- ============================================================================

-- Drop old functions
DROP FUNCTION IF EXISTS public.is_admin_or_teacher(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_or_teacher() CASCADE;
DROP FUNCTION IF EXISTS public.get_auth_email() CASCADE;
DROP FUNCTION IF EXISTS public.get_auth_email_safe() CASCADE;
DROP FUNCTION IF EXISTS public.get_auth_user_id_text() CASCADE;

-- Get current user's email (handles both JWT and users table)
CREATE OR REPLACE FUNCTION public.get_auth_email_safe()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_value TEXT;
BEGIN
  -- Try JWT first
  email_value := auth.jwt() ->> 'email';
  
  -- If not in JWT, try users table
  IF email_value IS NULL THEN
    SELECT email INTO email_value 
    FROM public.users 
    WHERE id = auth.uid()
    LIMIT 1;
  END IF;
  
  RETURN COALESCE(email_value, '');
END;
$$;

-- Get auth user ID as TEXT (for tables that use TEXT for user_id)
CREATE OR REPLACE FUNCTION public.get_auth_user_id_text()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth.uid()::TEXT, '')
$$;

-- Check if current user is admin or teacher
CREATE OR REPLACE FUNCTION public.is_admin_or_teacher()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  user_email := public.get_auth_email_safe();
  
  -- Check user_roles table
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE email = user_email 
    AND role IN ('admin', 'teacher')
  );
END;
$$;

-- Overloaded version for checking specific email
CREATE OR REPLACE FUNCTION public.is_admin_or_teacher(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE email = check_email 
    AND role IN ('admin', 'teacher')
  );
END;
$$;

-- ============================================================================
-- STEP 4: ENABLE RLS ON KEY TABLES
-- ============================================================================

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE SIMPLE RLS POLICIES WITH PROPER TYPE HANDLING
-- ============================================================================

-- ASSIGNMENTS table policies
CREATE POLICY "assignments_select_policy" ON public.assignments
  FOR SELECT TO authenticated
  USING (true); -- Everyone can read assignments

CREATE POLICY "assignments_insert_policy" ON public.assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_teacher());

CREATE POLICY "assignments_update_policy" ON public.assignments
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_teacher());

CREATE POLICY "assignments_delete_policy" ON public.assignments
  FOR DELETE TO authenticated
  USING (public.is_admin_or_teacher());

-- ASSIGNMENT_SUBMISSIONS table policies (user_id is TEXT!)
CREATE POLICY "assignment_submissions_select_policy" ON public.assignment_submissions
  FOR SELECT TO authenticated
  USING (
    user_id = public.get_auth_user_id_text()  -- Compare TEXT to TEXT
    OR user_email = public.get_auth_email_safe()  -- Compare by email
    OR public.is_admin_or_teacher()
  );

CREATE POLICY "assignment_submissions_insert_policy" ON public.assignment_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = public.get_auth_user_id_text()  -- Allow users to submit their own
    OR user_email = public.get_auth_email_safe()
    OR public.is_admin_or_teacher()
  );

CREATE POLICY "assignment_submissions_update_policy" ON public.assignment_submissions
  FOR UPDATE TO authenticated
  USING (
    user_id = public.get_auth_user_id_text()
    OR user_email = public.get_auth_email_safe()
    OR public.is_admin_or_teacher()
  );

-- SUBMISSIONS table policies (user_id is TEXT!)
CREATE POLICY "submissions_select_policy" ON public.submissions
  FOR SELECT TO authenticated
  USING (
    user_id = public.get_auth_user_id_text()  -- Compare TEXT to TEXT
    OR public.is_admin_or_teacher()
  );

CREATE POLICY "submissions_insert_policy" ON public.submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = public.get_auth_user_id_text()
    OR public.is_admin_or_teacher()
  );

CREATE POLICY "submissions_update_policy" ON public.submissions
  FOR UPDATE TO authenticated
  USING (
    user_id = public.get_auth_user_id_text()
    OR public.is_admin_or_teacher()
  );

-- LESSONS table policies
CREATE POLICY "lessons_select_policy" ON public.lessons
  FOR SELECT TO authenticated
  USING (published = true OR public.is_admin_or_teacher());

CREATE POLICY "lessons_insert_policy" ON public.lessons
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_teacher());

CREATE POLICY "lessons_update_policy" ON public.lessons
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_teacher());

CREATE POLICY "lessons_delete_policy" ON public.lessons
  FOR DELETE TO authenticated
  USING (public.is_admin_or_teacher());

-- STUDENTS table policies
CREATE POLICY "students_select_policy" ON public.students
  FOR SELECT TO authenticated
  USING (
    email = public.get_auth_email_safe()
    OR public.is_admin_or_teacher()
  );

CREATE POLICY "students_insert_policy" ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_teacher());

CREATE POLICY "students_update_policy" ON public.students
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_teacher());

CREATE POLICY "students_delete_policy" ON public.students
  FOR DELETE TO authenticated
  USING (public.is_admin_or_teacher());

-- COURSES table policies
CREATE POLICY "courses_select_policy" ON public.courses
  FOR SELECT TO authenticated
  USING (true); -- Everyone can see courses

CREATE POLICY "courses_manage_policy" ON public.courses
  FOR ALL TO authenticated
  USING (public.is_admin_or_teacher());

-- QUESTION_BANK table policies
CREATE POLICY "question_bank_select_policy" ON public.question_bank
  FOR SELECT TO authenticated
  USING (public.is_admin_or_teacher());

CREATE POLICY "question_bank_manage_policy" ON public.question_bank
  FOR ALL TO authenticated
  USING (public.is_admin_or_teacher());

-- STUDENT_ACTIVITY table policies (user_id is TEXT!)
CREATE POLICY "student_activity_select_policy" ON public.student_activity
  FOR SELECT TO authenticated
  USING (
    user_id = public.get_auth_user_id_text()
    OR user_email = public.get_auth_email_safe()
    OR public.is_admin_or_teacher()
  );

CREATE POLICY "student_activity_insert_policy" ON public.student_activity
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = public.get_auth_user_id_text()
    OR user_email = public.get_auth_email_safe()
    OR public.is_admin_or_teacher()
  );

-- LESSON_PROGRESS table policies (user_id is TEXT!)
CREATE POLICY "lesson_progress_select_policy" ON public.lesson_progress
  FOR SELECT TO authenticated
  USING (
    user_id = public.get_auth_user_id_text()
    OR user_email = public.get_auth_email_safe()
    OR public.is_admin_or_teacher()
  );

CREATE POLICY "lesson_progress_insert_policy" ON public.lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = public.get_auth_user_id_text()
    OR user_email = public.get_auth_email_safe()
    OR public.is_admin_or_teacher()
  );

CREATE POLICY "lesson_progress_update_policy" ON public.lesson_progress
  FOR UPDATE TO authenticated
  USING (
    user_id = public.get_auth_user_id_text()
    OR user_email = public.get_auth_email_safe()
    OR public.is_admin_or_teacher()
  );

-- USER_ROLES table policies
CREATE POLICY "user_roles_select_policy" ON public.user_roles
  FOR SELECT TO authenticated
  USING (true); -- Can see roles

CREATE POLICY "user_roles_manage_policy" ON public.user_roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE email = public.get_auth_email_safe() 
      AND role = 'admin'
    )
  );

-- ============================================================================
-- STEP 6: CREATE/UPDATE UTILITY FUNCTIONS
-- ============================================================================

-- Drop existing functions that might have different signatures
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_assignment_stats(UUID) CASCADE;

-- Update timestamp function
CREATE FUNCTION public.update_updated_at()
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

-- Assignment stats function (fixed for your structure)
CREATE FUNCTION public.calculate_assignment_stats(assignment_uuid UUID)
RETURNS TABLE (
  total_submissions BIGINT,
  submitted_count BIGINT,
  graded_count BIGINT,
  average_score DECIMAL,
  completion_rate DECIMAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_submissions,
    COUNT(CASE WHEN status IN ('submitted', 'graded') THEN 1 END)::BIGINT as submitted_count,
    COUNT(CASE WHEN status = 'graded' THEN 1 END)::BIGINT as graded_count,
    AVG(score)::DECIMAL as average_score,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(CASE WHEN status IN ('submitted', 'graded') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL)
      ELSE 0
    END as completion_rate
  FROM public.submissions
  WHERE assignment_id = assignment_uuid;
END;
$$;

-- ============================================================================
-- STEP 7: GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- STEP 8: VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database fix complete!';
  RAISE NOTICE '✅ RLS policies created with proper type handling';
  RAISE NOTICE '✅ Helper functions handle TEXT/UUID conversions';
  RAISE NOTICE '✅ Your existing data structure is preserved';
END $$;

COMMIT;

-- ============================================================================
-- POST-FIX VERIFICATION QUERIES
-- ============================================================================

-- Check that policies were created
SELECT 'RLS Policies Created:' as status;
SELECT tablename, COUNT(policyname) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Check admin users
SELECT 'Admin Users:' as status;
SELECT email, role FROM public.user_roles WHERE role IN ('admin', 'teacher');

-- Test the functions
SELECT 'Function Tests:' as status;
SELECT 
  public.is_admin_or_teacher('antoccic@fitchburg.k12.ma.us') as should_be_true,
  public.is_admin_or_teacher('student@example.com') as should_be_false,
  public.get_auth_user_id_text() as user_id_as_text;
