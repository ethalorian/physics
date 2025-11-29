-- ============================================================================
-- PHYSICS CLASSROOM DATABASE REFACTORING SCRIPT
-- ============================================================================
-- This script will refactor your database to fix current issues while
-- preserving existing data where possible.
--
-- INSTRUCTIONS:
-- 1. Back up your database before running this script
-- 2. Copy this entire script
-- 3. Go to Supabase Dashboard → SQL Editor
-- 4. Paste and run the script
-- 5. Check the output for any errors
--
-- ============================================================================

-- Start transaction for safety
BEGIN;

-- ============================================================================
-- STEP 1: DISABLE RLS TEMPORARILY AND DROP PROBLEMATIC POLICIES
-- ============================================================================

-- Disable RLS on all tables temporarily to fix issues
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  -- Drop all existing policies first
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) 
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
  
  -- Disable RLS on all tables
  FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE '_prisma%'
      AND tablename != 'schema_migrations'
  )
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: DROP OLD HELPER FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS public.is_admin_or_teacher(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_email() CASCADE;
DROP FUNCTION IF EXISTS public.can_grade_simulation_submissions() CASCADE;

-- ============================================================================
-- STEP 3: CREATE ROLE MANAGEMENT TABLE (IF NOT EXISTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin/teacher roles
INSERT INTO public.user_roles (email, role) VALUES
  ('antoccic@fitchburg.k12.ma.us', 'admin'),
  ('craigantocci@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- ============================================================================
-- STEP 4: CREATE IMPROVED HELPER FUNCTIONS
-- ============================================================================

-- Get current user's email from auth
CREATE OR REPLACE FUNCTION public.auth_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'email',
    (SELECT email FROM public.users WHERE id = auth.uid())
  )
$$;

-- Get current user's role
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE email = public.auth_email()),
    'student'
  )
$$;

-- Check if user has admin access
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.auth_role() = 'admin'
$$;

-- Check if user has teacher access (includes admin)
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.auth_role() IN ('admin', 'teacher')
$$;

-- ============================================================================
-- STEP 5: CREATE/UPDATE CORE TABLES
-- ============================================================================

-- Units table
CREATE TABLE IF NOT EXISTS public.units (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id TEXT REFERENCES public.units(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  order_index INTEGER,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for lessons
CREATE INDEX IF NOT EXISTS idx_lessons_slug ON public.lessons(slug);
CREATE INDEX IF NOT EXISTS idx_lessons_published ON public.lessons(published);
CREATE INDEX IF NOT EXISTS idx_lessons_unit_id ON public.lessons(unit_id);

-- Assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
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

-- Create indexes for assignments
CREATE INDEX IF NOT EXISTS idx_assignments_published ON public.assignments(published);
CREATE INDEX IF NOT EXISTS idx_assignments_lesson_id ON public.assignments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON public.assignments(created_at DESC);

-- Assignment submissions table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT,
  answers JSONB DEFAULT '{}'::jsonb,
  score DECIMAL(5,2),
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'started', 'submitted', 'graded')),
  feedback TEXT,
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, user_id)
);

-- Create indexes for submissions
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.assignment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.assignment_submissions(status);

-- Students table (for roster management)
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

-- Create index for students
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_course_id ON public.students(course_id);

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
CREATE TABLE IF NOT EXISTS public.question_bank (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_data JSONB NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  unit_id TEXT REFERENCES public.units(id),
  lesson_id UUID REFERENCES public.lessons(id),
  topics TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  usage_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for question bank
CREATE INDEX IF NOT EXISTS idx_question_bank_unit_lesson ON public.question_bank(unit_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_type ON public.question_bank(question_type);
CREATE INDEX IF NOT EXISTS idx_question_bank_difficulty ON public.question_bank(difficulty);
CREATE INDEX IF NOT EXISTS idx_question_text_search ON public.question_bank USING gin(to_tsvector('english', question_text));

-- Student activity tracking
CREATE TABLE IF NOT EXISTS public.student_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}'::jsonb,
  lesson_id UUID REFERENCES public.lessons(id),
  assignment_id UUID REFERENCES public.assignments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for student activity
CREATE INDEX IF NOT EXISTS idx_student_activity_user_id ON public.student_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_student_activity_type ON public.student_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_student_activity_created_at ON public.student_activity(created_at DESC);

-- Simulation tables (for the simulation assignments)
CREATE TABLE IF NOT EXISTS public.simulations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  physics_concepts TEXT[],
  difficulty_level TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.simulation_embedded_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_points INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.simulation_assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.simulation_embedded_assignments(id) ON DELETE CASCADE,
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
-- STEP 6: CREATE SIMPLE RLS POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_embedded_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Units: Everyone can read
CREATE POLICY "units_read" ON public.units
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "units_write" ON public.units
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Lessons: Students see published, teachers see all
CREATE POLICY "lessons_read" ON public.lessons
  FOR SELECT TO authenticated
  USING (published = true OR public.is_teacher());

CREATE POLICY "lessons_write" ON public.lessons
  FOR ALL TO authenticated
  USING (public.is_teacher())
  WITH CHECK (public.is_teacher());

-- Assignments: Students see published, teachers see all
CREATE POLICY "assignments_read" ON public.assignments
  FOR SELECT TO authenticated
  USING (published = true OR public.is_teacher());

CREATE POLICY "assignments_write" ON public.assignments
  FOR ALL TO authenticated
  USING (public.is_teacher())
  WITH CHECK (public.is_teacher());

-- Assignment Submissions: Students see own, teachers see all
CREATE POLICY "submissions_read" ON public.assignment_submissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_teacher());

CREATE POLICY "submissions_create" ON public.assignment_submissions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_teacher());

CREATE POLICY "submissions_update" ON public.assignment_submissions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_teacher())
  WITH CHECK (user_id = auth.uid() OR public.is_teacher());

-- Students: Teachers can manage
CREATE POLICY "students_read" ON public.students
  FOR SELECT TO authenticated
  USING (email = public.auth_email() OR public.is_teacher());

CREATE POLICY "students_write" ON public.students
  FOR ALL TO authenticated
  USING (public.is_teacher())
  WITH CHECK (public.is_teacher());

-- Courses: Everyone can read
CREATE POLICY "courses_read" ON public.courses
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "courses_write" ON public.courses
  FOR ALL TO authenticated
  USING (public.is_teacher())
  WITH CHECK (public.is_teacher());

-- Question Bank: Teachers only
CREATE POLICY "question_bank_read" ON public.question_bank
  FOR SELECT TO authenticated
  USING (public.is_teacher());

CREATE POLICY "question_bank_write" ON public.question_bank
  FOR ALL TO authenticated
  USING (public.is_teacher())
  WITH CHECK (public.is_teacher());

-- Student Activity: Students see own, teachers see all
CREATE POLICY "student_activity_read" ON public.student_activity
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_teacher());

CREATE POLICY "student_activity_create" ON public.student_activity
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_teacher());

-- User Roles: Admins only
CREATE POLICY "user_roles_read" ON public.user_roles
  FOR SELECT TO authenticated
  USING (email = public.auth_email() OR public.is_admin());

CREATE POLICY "user_roles_write" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Simulations: Everyone can read published
CREATE POLICY "simulations_read" ON public.simulations
  FOR SELECT TO authenticated
  USING (published = true OR public.is_teacher());

CREATE POLICY "simulations_write" ON public.simulations
  FOR ALL TO authenticated
  USING (public.is_teacher())
  WITH CHECK (public.is_teacher());

-- Simulation Assignments: Students see published, teachers see all
CREATE POLICY "sim_assignments_read" ON public.simulation_embedded_assignments
  FOR SELECT TO authenticated
  USING (published = true OR public.is_teacher());

CREATE POLICY "sim_assignments_write" ON public.simulation_embedded_assignments
  FOR ALL TO authenticated
  USING (public.is_teacher())
  WITH CHECK (public.is_teacher());

-- Simulation Submissions: Students see own, teachers see all
CREATE POLICY "sim_submissions_read" ON public.simulation_assignment_submissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_teacher());

CREATE POLICY "sim_submissions_create" ON public.simulation_assignment_submissions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_teacher());

CREATE POLICY "sim_submissions_update" ON public.simulation_assignment_submissions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_teacher())
  WITH CHECK (user_id = auth.uid() OR public.is_teacher());

-- ============================================================================
-- STEP 7: CREATE UTILITY FUNCTIONS
-- ============================================================================

-- Update timestamp trigger function
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

-- Add triggers for updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN (
        'units', 'lessons', 'assignments', 'assignment_submissions',
        'students', 'courses', 'question_bank', 'user_roles',
        'simulations', 'simulation_embedded_assignments', 'simulation_assignment_submissions'
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()', t, t);
  END LOOP;
END;
$$;

-- Function to calculate assignment stats (for dashboard)
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
-- STEP 8: GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- ============================================================================
-- STEP 9: VERIFY AND COMMIT
-- ============================================================================

-- Check that RLS is enabled on important tables
DO $$
DECLARE
  r RECORD;
  has_error BOOLEAN := false;
BEGIN
  FOR r IN 
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'assignments', 'assignment_submissions', 'students', 
        'question_bank', 'user_roles'
      )
  LOOP
    IF NOT r.rowsecurity THEN
      RAISE NOTICE 'WARNING: RLS not enabled on table %', r.tablename;
      has_error := true;
    END IF;
  END LOOP;
  
  IF has_error THEN
    RAISE EXCEPTION 'RLS not properly enabled on all tables';
  END IF;
END;
$$;

-- If we got here, everything worked!
COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- 
-- After running this script:
-- 
-- 1. Test authentication:
--    - Sign in as admin (antoccic@fitchburg.k12.ma.us or craigantocci@gmail.com)
--    - Sign in as a student
--    - Verify appropriate access levels
-- 
-- 2. Add more users to user_roles table as needed:
--    INSERT INTO public.user_roles (email, role) VALUES ('teacher@school.edu', 'teacher');
-- 
-- 3. Monitor performance and adjust indexes if needed
-- 
-- 4. Consider adding more specific policies for your use cases
--
-- ============================================================================
