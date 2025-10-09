-- ============================================================================
-- SAFE DATABASE REFACTOR SCRIPT - Handles Existing Tables
-- ============================================================================
-- This version checks existing table structures and adapts accordingly
-- Run this in Supabase SQL Editor
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: DROP ALL POLICIES FIRST (Clean Slate)
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
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
        r.policyname, r.schemaname, r.tablename);
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Ignore errors
    END;
  END LOOP;
  
  -- Disable RLS on all tables temporarily
  FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE '_prisma%'
      AND tablename != 'schema_migrations'
  )
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Ignore errors
    END;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: DROP OLD FUNCTIONS SAFELY
-- ============================================================================

DROP FUNCTION IF EXISTS public.is_admin_or_teacher(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_email() CASCADE;
DROP FUNCTION IF EXISTS public.auth_email() CASCADE;
DROP FUNCTION IF EXISTS public.auth_role() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_teacher() CASCADE;

-- ============================================================================
-- STEP 3: CREATE USER ROLES TABLE (CRITICAL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert admin roles
INSERT INTO public.user_roles (email, role) VALUES
  ('antoccic@fitchburg.k12.ma.us', 'admin'),
  ('craigantocci@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- ============================================================================
-- STEP 4: CREATE/ALTER UNITS TABLE
-- ============================================================================

-- Check if units table exists and has proper structure
DO $$
BEGIN
  -- Create units table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'units' AND schemaname = 'public') THEN
    CREATE TABLE public.units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      order_index INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'id') THEN
      ALTER TABLE public.units ADD COLUMN id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'name') THEN
      ALTER TABLE public.units ADD COLUMN name TEXT;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: CREATE/ALTER LESSONS TABLE
-- ============================================================================

DO $$
BEGIN
  -- Create lessons table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lessons' AND schemaname = 'public') THEN
    CREATE TABLE public.lessons (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      unit_id TEXT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      content TEXT,
      order_index INTEGER,
      published BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'unit_id') THEN
      ALTER TABLE public.lessons ADD COLUMN unit_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'published') THEN
      ALTER TABLE public.lessons ADD COLUMN published BOOLEAN DEFAULT false;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 6: CREATE/ALTER ASSIGNMENTS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'assignments' AND schemaname = 'public') THEN
    CREATE TABLE public.assignments (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      lesson_id UUID,
      title TEXT NOT NULL,
      description TEXT,
      instructions TEXT,
      questions JSONB NOT NULL DEFAULT '[]'::jsonb,
      total_points INTEGER DEFAULT 0,
      due_date TIMESTAMPTZ,
      published BOOLEAN DEFAULT false,
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    -- Add missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'questions') THEN
      ALTER TABLE public.assignments ADD COLUMN questions JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'published') THEN
      ALTER TABLE public.assignments ADD COLUMN published BOOLEAN DEFAULT false;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 7: CREATE/ALTER ASSIGNMENT_SUBMISSIONS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'assignment_submissions' AND schemaname = 'public') THEN
    CREATE TABLE public.assignment_submissions (
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
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(assignment_id, user_id)
    );
  END IF;
END $$;

-- ============================================================================
-- STEP 8: CREATE OTHER ESSENTIAL TABLES
-- ============================================================================

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

-- Question bank table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'question_bank' AND schemaname = 'public') THEN
    CREATE TABLE public.question_bank (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      question_data JSONB NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      unit_id TEXT,
      lesson_id UUID,
      topics TEXT[] DEFAULT '{}',
      tags TEXT[] DEFAULT '{}',
      difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
      usage_count INTEGER DEFAULT 0,
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  ELSE
    -- Add unit_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'question_bank' AND column_name = 'unit_id') THEN
      ALTER TABLE public.question_bank ADD COLUMN unit_id TEXT;
    END IF;
  END IF;
END $$;

-- Student activity
CREATE TABLE IF NOT EXISTS public.student_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}'::jsonb,
  lesson_id UUID,
  assignment_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 9: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Simple is_admin_or_teacher function
CREATE OR REPLACE FUNCTION public.is_admin_or_teacher(user_email TEXT)
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
    WHERE email = user_email 
    AND role IN ('admin', 'teacher')
  ) THEN
    RETURN true;
  END IF;
  
  -- Fallback to hardcoded list
  IF user_email IN ('antoccic@fitchburg.k12.ma.us', 'craigantocci@gmail.com') THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Get current user email
CREATE OR REPLACE FUNCTION public.auth_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'email',
    (SELECT email FROM public.users WHERE id = auth.uid()),
    ''
  )
$$;

-- Get current user role
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE email = (
      COALESCE(
        auth.jwt() ->> 'email',
        (SELECT email FROM public.users WHERE id = auth.uid())
      )
    )),
    'student'
  )
$$;

-- Check if admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE email = COALESCE(
      auth.jwt() ->> 'email',
      (SELECT email FROM public.users WHERE id = auth.uid())
    )
    AND role = 'admin'
  )
$$;

-- Check if teacher (includes admin)
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE email = COALESCE(
      auth.jwt() ->> 'email',
      (SELECT email FROM public.users WHERE id = auth.uid())
    )
    AND role IN ('admin', 'teacher')
  )
$$;

-- ============================================================================
-- STEP 10: CREATE SIMPLE RLS POLICIES
-- ============================================================================

-- Enable RLS on important tables
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Assignments policies
CREATE POLICY "assignments_select" ON public.assignments FOR SELECT TO authenticated
  USING (true); -- Everyone can see assignments for now

CREATE POLICY "assignments_insert" ON public.assignments FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher());

CREATE POLICY "assignments_update" ON public.assignments FOR UPDATE TO authenticated
  USING (public.is_teacher());

CREATE POLICY "assignments_delete" ON public.assignments FOR DELETE TO authenticated
  USING (public.is_teacher());

-- Assignment Submissions policies
CREATE POLICY "submissions_select" ON public.assignment_submissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_teacher());

CREATE POLICY "submissions_insert" ON public.assignment_submissions FOR INSERT TO authenticated
  WITH CHECK (true); -- Anyone can submit

CREATE POLICY "submissions_update" ON public.assignment_submissions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_teacher());

-- Lessons policies
CREATE POLICY "lessons_select" ON public.lessons FOR SELECT TO authenticated
  USING (true); -- Everyone can see lessons

CREATE POLICY "lessons_insert" ON public.lessons FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher());

CREATE POLICY "lessons_update" ON public.lessons FOR UPDATE TO authenticated
  USING (public.is_teacher());

CREATE POLICY "lessons_delete" ON public.lessons FOR DELETE TO authenticated
  USING (public.is_teacher());

-- Students policies
CREATE POLICY "students_select" ON public.students FOR SELECT TO authenticated
  USING (true); -- Simplified for now

CREATE POLICY "students_manage" ON public.students FOR ALL TO authenticated
  USING (public.is_teacher());

-- Courses policies
CREATE POLICY "courses_select" ON public.courses FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "courses_manage" ON public.courses FOR ALL TO authenticated
  USING (public.is_teacher());

-- Question bank policies
CREATE POLICY "question_bank_select" ON public.question_bank FOR SELECT TO authenticated
  USING (public.is_teacher());

CREATE POLICY "question_bank_manage" ON public.question_bank FOR ALL TO authenticated
  USING (public.is_teacher());

-- Student activity policies
CREATE POLICY "activity_select" ON public.student_activity FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_teacher());

CREATE POLICY "activity_insert" ON public.student_activity FOR INSERT TO authenticated
  WITH CHECK (true);

-- User roles policies
CREATE POLICY "roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (true); -- Can see roles

CREATE POLICY "roles_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 11: CREATE UTILITY FUNCTIONS
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

-- Assignment stats function
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
-- STEP 12: CREATE INDEXES SAFELY
-- ============================================================================

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_assignments_published ON public.assignments(published);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON public.assignments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.assignment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_slug ON public.lessons(slug);
CREATE INDEX IF NOT EXISTS idx_lessons_published ON public.lessons(published);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_course_id ON public.students(course_id);

-- ============================================================================
-- STEP 13: GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- STEP 14: FINAL VERIFICATION
-- ============================================================================

DO $$
DECLARE
  missing_tables TEXT := '';
BEGIN
  -- Check critical tables
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_roles' AND schemaname = 'public') THEN
    missing_tables := missing_tables || 'user_roles, ';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'assignments' AND schemaname = 'public') THEN
    missing_tables := missing_tables || 'assignments, ';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lessons' AND schemaname = 'public') THEN
    missing_tables := missing_tables || 'lessons, ';
  END IF;
  
  IF missing_tables != '' THEN
    RAISE NOTICE 'WARNING: Still missing tables: %', missing_tables;
  ELSE
    RAISE NOTICE 'SUCCESS: All critical tables exist!';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION
-- ============================================================================

-- Check what was created
SELECT 'Tables created/verified:' as status;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_roles', 'assignments', 'lessons', 'assignment_submissions', 'students', 'courses')
ORDER BY tablename;

-- Check admin users
SELECT 'Admin users:' as status;
SELECT email, role FROM public.user_roles WHERE role = 'admin';

-- Test the functions
SELECT 'Function test:' as status;
SELECT 
  is_admin_or_teacher('antoccic@fitchburg.k12.ma.us') as admin_check,
  is_admin_or_teacher('student@example.com') as student_check;
