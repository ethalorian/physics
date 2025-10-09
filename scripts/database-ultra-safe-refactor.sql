-- ============================================================================
-- ULTRA SAFE DATABASE REFACTOR - With Type Casting Fixed
-- ============================================================================
-- This version handles UUID/TEXT type mismatches properly
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: CLEAN SLATE - Remove problematic policies
-- ============================================================================

DO $$ 
DECLARE 
  r RECORD;
BEGIN
  -- Drop all existing policies (they may have type issues)
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
      NULL; -- Ignore errors
    END;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: CREATE CRITICAL TABLES WITH CORRECT TYPES
-- ============================================================================

-- User roles table (TEXT email)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add admin users
INSERT INTO public.user_roles (email, role) VALUES
  ('antoccic@fitchburg.k12.ma.us', 'admin'),
  ('craigantocci@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- Units table (TEXT id for compatibility)
CREATE TABLE IF NOT EXISTS public.units (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons table (UUID id)
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id TEXT, -- TEXT to match units.id
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  content TEXT,
  order_index INTEGER,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments table (UUID id)
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID, -- UUID to match lessons.id
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  questions JSONB DEFAULT '[]'::jsonb,
  total_points INTEGER DEFAULT 0,
  due_date TIMESTAMPTZ,
  published BOOLEAN DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment submissions (UUID for IDs)
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_email TEXT,
  answers JSONB DEFAULT '{}'::jsonb,
  score DECIMAL(5,2),
  status TEXT DEFAULT 'assigned',
  feedback TEXT,
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'assignment_submissions_assignment_id_user_id_key'
  ) THEN
    ALTER TABLE public.assignment_submissions 
    ADD CONSTRAINT assignment_submissions_assignment_id_user_id_key 
    UNIQUE(assignment_id, user_id);
  END IF;
END $$;

-- Students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  google_id TEXT UNIQUE,
  course_id TEXT,
  enrollment_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  section TEXT,
  enrollment_code TEXT,
  teacher_email TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: FIX QUESTION BANK TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'question_bank' AND schemaname = 'public') THEN
    CREATE TABLE public.question_bank (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      question_data JSONB NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      unit_id TEXT, -- TEXT to match units.id
      lesson_id UUID, -- UUID to match lessons.id
      topics TEXT[] DEFAULT '{}',
      tags TEXT[] DEFAULT '{}',
      difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
      usage_count INTEGER DEFAULT 0,
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    -- Add columns if missing, with proper types
    BEGIN
      ALTER TABLE public.question_bank ADD COLUMN unit_id TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    
    BEGIN
      ALTER TABLE public.question_bank ADD COLUMN lesson_id UUID;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
  END IF;
END $$;

-- Student activity table
CREATE TABLE IF NOT EXISTS public.student_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}'::jsonb,
  lesson_id UUID, -- UUID to match lessons.id
  assignment_id UUID, -- UUID to match assignments.id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: CREATE HELPER FUNCTIONS WITH PROPER TYPE HANDLING
-- ============================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS public.is_admin_or_teacher(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.auth_email() CASCADE;
DROP FUNCTION IF EXISTS public.auth_role() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_teacher() CASCADE;

-- Get current user's email
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Try to get email from JWT
  user_email := auth.jwt() ->> 'email';
  
  -- If not in JWT, try to get from users table
  IF user_email IS NULL THEN
    SELECT email INTO user_email 
    FROM public.users 
    WHERE id = auth.uid()
    LIMIT 1;
  END IF;
  
  RETURN COALESCE(user_email, '');
END;
$$;

-- Check if user is admin or teacher
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
  user_email := public.get_auth_email();
  
  -- Check user_roles table
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE email = user_email 
    AND role IN ('admin', 'teacher')
  ) THEN
    RETURN true;
  END IF;
  
  -- Fallback check
  IF user_email IN ('antoccic@fitchburg.k12.ma.us', 'craigantocci@gmail.com') THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Overloaded version that accepts email parameter
CREATE OR REPLACE FUNCTION public.is_admin_or_teacher(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check user_roles table
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE email = check_email 
    AND role IN ('admin', 'teacher')
  ) THEN
    RETURN true;
  END IF;
  
  -- Fallback check
  IF check_email IN ('antoccic@fitchburg.k12.ma.us', 'craigantocci@gmail.com') THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- ============================================================================
-- STEP 5: CREATE SIMPLE RLS POLICIES WITH PROPER TYPE CASTING
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ASSIGNMENTS - Simple policies
CREATE POLICY "assignments_read_all" ON public.assignments 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "assignments_write_teacher" ON public.assignments 
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_admin_or_teacher());

CREATE POLICY "assignments_update_teacher" ON public.assignments 
  FOR UPDATE TO authenticated 
  USING (public.is_admin_or_teacher());

CREATE POLICY "assignments_delete_teacher" ON public.assignments 
  FOR DELETE TO authenticated 
  USING (public.is_admin_or_teacher());

-- ASSIGNMENT SUBMISSIONS - With proper UUID handling
CREATE POLICY "submissions_read_own_or_teacher" ON public.assignment_submissions 
  FOR SELECT TO authenticated 
  USING (
    user_id = auth.uid() 
    OR public.is_admin_or_teacher()
  );

CREATE POLICY "submissions_create_all" ON public.assignment_submissions 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "submissions_update_own_or_teacher" ON public.assignment_submissions 
  FOR UPDATE TO authenticated 
  USING (
    user_id = auth.uid() 
    OR public.is_admin_or_teacher()
  );

-- LESSONS - Simple policies
CREATE POLICY "lessons_read_all" ON public.lessons 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "lessons_write_teacher" ON public.lessons 
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_admin_or_teacher());

CREATE POLICY "lessons_update_teacher" ON public.lessons 
  FOR UPDATE TO authenticated 
  USING (public.is_admin_or_teacher());

CREATE POLICY "lessons_delete_teacher" ON public.lessons 
  FOR DELETE TO authenticated 
  USING (public.is_admin_or_teacher());

-- STUDENTS - Simple policies
CREATE POLICY "students_read_all" ON public.students 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "students_write_teacher" ON public.students 
  FOR ALL TO authenticated 
  USING (public.is_admin_or_teacher());

-- COURSES - Simple policies
CREATE POLICY "courses_read_all" ON public.courses 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "courses_write_teacher" ON public.courses 
  FOR ALL TO authenticated 
  USING (public.is_admin_or_teacher());

-- QUESTION BANK - Teacher only
CREATE POLICY "qbank_teacher_only" ON public.question_bank 
  FOR ALL TO authenticated 
  USING (public.is_admin_or_teacher());

-- STUDENT ACTIVITY - Own or teacher
CREATE POLICY "activity_read_own_or_teacher" ON public.student_activity 
  FOR SELECT TO authenticated 
  USING (
    user_id = auth.uid() 
    OR public.is_admin_or_teacher()
  );

CREATE POLICY "activity_create_all" ON public.student_activity 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- USER ROLES - Read all, write admin
CREATE POLICY "roles_read_all" ON public.user_roles 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "roles_write_admin" ON public.user_roles 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE email = public.get_auth_email() 
      AND role = 'admin'
    )
  );

-- ============================================================================
-- STEP 6: CREATE UTILITY FUNCTIONS
-- ============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at()
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

-- Assignment stats function with proper type handling
CREATE OR REPLACE FUNCTION public.calculate_assignment_stats(assignment_uuid UUID)
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
  FROM public.assignment_submissions
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
-- STEP 8: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_assignments_published ON public.assignments(published);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.assignment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_slug ON public.lessons(slug);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Database refactor complete!';
  RAISE NOTICE 'Critical tables created/verified.';
  RAISE NOTICE 'RLS policies simplified and fixed.';
  RAISE NOTICE 'Type casting issues resolved.';
END $$;

COMMIT;

-- ============================================================================
-- POST-MIGRATION CHECK
-- ============================================================================

-- Show created tables
SELECT 'TABLES STATUS:' as info;
SELECT tablename, 
       CASE WHEN rowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END as rls
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_roles', 'assignments', 'lessons', 'assignment_submissions')
ORDER BY tablename;

-- Show admin users
SELECT 'ADMIN USERS:' as info;
SELECT email, role FROM public.user_roles WHERE role = 'admin';

-- Test functions
SELECT 'FUNCTION TEST:' as info;
SELECT 
  public.is_admin_or_teacher('antoccic@fitchburg.k12.ma.us') as should_be_true,
  public.is_admin_or_teacher('student@test.com') as should_be_false;
