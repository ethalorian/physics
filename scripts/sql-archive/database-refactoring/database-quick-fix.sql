-- ============================================================================
-- QUICK FIX FOR DATABASE ISSUES
-- ============================================================================
-- This is a simpler version that just fixes the most critical issues
-- without doing a full refactor. Use this if you want minimal changes.
--
-- Run this in Supabase SQL Editor
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX 1: Create missing user_roles table for better role management
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert your admin users
INSERT INTO public.user_roles (email, role) VALUES
  ('antoccic@fitchburg.k12.ma.us', 'admin'),
  ('craigantocci@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- ============================================================================
-- FIX 2: Replace the broken is_admin_or_teacher function
-- ============================================================================

DROP FUNCTION IF EXISTS public.is_admin_or_teacher(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION public.is_admin_or_teacher(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if email exists in user_roles table with admin/teacher role
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE email = user_email 
    AND role IN ('admin', 'teacher')
  );
END;
$$;

-- ============================================================================
-- FIX 3: Create missing assignments table if it doesn't exist
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assignments (
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

-- ============================================================================
-- FIX 4: Create missing lessons table if it doesn't exist
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lessons (
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

-- ============================================================================
-- FIX 5: Create missing assignment_submissions table
-- ============================================================================

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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, user_id)
);

-- ============================================================================
-- FIX 6: Create missing students table
-- ============================================================================

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

-- ============================================================================
-- FIX 7: Create missing courses table
-- ============================================================================

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
-- FIX 8: Simplify RLS policies on assignments table
-- ============================================================================

-- Drop existing complex policies
DROP POLICY IF EXISTS "Assignments viewable by authenticated users" ON public.assignments;
DROP POLICY IF EXISTS "Assignments insertable by admins and teachers" ON public.assignments;
DROP POLICY IF EXISTS "Assignments updatable by admins and teachers" ON public.assignments;
DROP POLICY IF EXISTS "Assignments deletable by admins and teachers" ON public.assignments;

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "assignments_select" ON public.assignments
  FOR SELECT TO authenticated
  USING (
    published = true 
    OR is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
    OR is_admin_or_teacher((SELECT auth.jwt() ->> 'email'))
  );

CREATE POLICY "assignments_insert" ON public.assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
    OR is_admin_or_teacher((SELECT auth.jwt() ->> 'email'))
  );

CREATE POLICY "assignments_update" ON public.assignments
  FOR UPDATE TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
    OR is_admin_or_teacher((SELECT auth.jwt() ->> 'email'))
  );

CREATE POLICY "assignments_delete" ON public.assignments
  FOR DELETE TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
    OR is_admin_or_teacher((SELECT auth.jwt() ->> 'email'))
  );

-- ============================================================================
-- FIX 9: Fix assignment_submissions RLS policies
-- ============================================================================

-- Drop existing complex policies
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Students can create their own submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Students can update their own submissions" ON public.assignment_submissions;

-- Enable RLS
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "submissions_select" ON public.assignment_submissions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
    OR is_admin_or_teacher((SELECT auth.jwt() ->> 'email'))
  );

CREATE POLICY "submissions_insert" ON public.assignment_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
    OR is_admin_or_teacher((SELECT auth.jwt() ->> 'email'))
  );

CREATE POLICY "submissions_update" ON public.assignment_submissions
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
    OR is_admin_or_teacher((SELECT auth.jwt() ->> 'email'))
  );

-- ============================================================================
-- FIX 10: Grant necessary permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- FIX 11: Add the calculate_assignment_stats function if missing
-- ============================================================================

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

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify everything is working:

-- Check if tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('assignments', 'lessons', 'assignment_submissions', 'students', 'courses', 'user_roles');

-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('assignments', 'assignment_submissions');

-- Test the is_admin_or_teacher function
SELECT is_admin_or_teacher('antoccic@fitchburg.k12.ma.us'); -- Should return true
SELECT is_admin_or_teacher('student@example.com'); -- Should return false
