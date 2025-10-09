-- Fix RLS policies for simulation embedded assignments
-- This migration updates the RLS policies to use the established pattern

-- Drop existing policies
DROP POLICY IF EXISTS "Admins and teachers can manage simulation assignments" ON simulation_embedded_assignments;
DROP POLICY IF EXISTS "Students can view published simulation assignments" ON simulation_embedded_assignments;
DROP POLICY IF EXISTS "Admins and teachers can view all simulation submissions" ON simulation_assignment_submissions;
DROP POLICY IF EXISTS "Admins and teachers can update simulation submissions" ON simulation_assignment_submissions;
DROP POLICY IF EXISTS "Students can view own simulation submissions" ON simulation_assignment_submissions;
DROP POLICY IF EXISTS "Students can create simulation submissions" ON simulation_assignment_submissions;
DROP POLICY IF EXISTS "Students can update own in-progress simulation submissions" ON simulation_assignment_submissions;

-- Ensure the is_admin_or_teacher function exists (reuse existing one or create if missing)
CREATE OR REPLACE FUNCTION public.is_admin_or_teacher(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  admin_emails TEXT[] := ARRAY['antoccic@fitchburg.k12.ma.us', 'craigantocci@gmail.com'];
BEGIN
  RETURN user_email = ANY(admin_emails);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get user email helper function
CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS TEXT AS $$
BEGIN
  -- First try to get from JWT
  IF auth.jwt() ->> 'email' IS NOT NULL THEN
    RETURN auth.jwt() ->> 'email';
  END IF;
  
  -- Fallback to users table
  RETURN (SELECT email FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- RECREATE POLICIES WITH PROPER PATTERN
-- ============================================================================

-- Policies for simulation_embedded_assignments

-- Students can view published assignments
CREATE POLICY "Students can view published simulation assignments"
ON simulation_embedded_assignments
FOR SELECT
TO authenticated
USING (published = true);

-- Admins and teachers can view all assignments
CREATE POLICY "Admins and teachers can view all simulation assignments"
ON simulation_embedded_assignments
FOR SELECT
TO authenticated
USING (
  is_admin_or_teacher(get_user_email())
);

-- Admins and teachers can insert assignments
CREATE POLICY "Admins and teachers can insert simulation assignments"
ON simulation_embedded_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_teacher(get_user_email())
);

-- Admins and teachers can update assignments
CREATE POLICY "Admins and teachers can update simulation assignments"
ON simulation_embedded_assignments
FOR UPDATE
TO authenticated
USING (
  is_admin_or_teacher(get_user_email())
);

-- Admins and teachers can delete assignments
CREATE POLICY "Admins and teachers can delete simulation assignments"
ON simulation_embedded_assignments
FOR DELETE
TO authenticated
USING (
  is_admin_or_teacher(get_user_email())
);

-- ============================================================================
-- Policies for simulation_assignment_submissions
-- ============================================================================

-- Students can view their own submissions
CREATE POLICY "Students can view own simulation submissions"
ON simulation_assignment_submissions
FOR SELECT
TO authenticated
USING (
  student_email = get_user_email()
  OR is_admin_or_teacher(get_user_email())
);

-- Students can insert their own submissions
CREATE POLICY "Students can insert own simulation submissions"
ON simulation_assignment_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  student_email = get_user_email()
);

-- Students can update their own in-progress submissions
CREATE POLICY "Students can update own in-progress simulation submissions"
ON simulation_assignment_submissions
FOR UPDATE
TO authenticated
USING (
  (student_email = get_user_email() AND status = 'in_progress')
  OR is_admin_or_teacher(get_user_email())
)
WITH CHECK (
  (student_email = get_user_email() AND status = 'in_progress')
  OR is_admin_or_teacher(get_user_email())
);

-- Admins and teachers can delete submissions
CREATE POLICY "Admins and teachers can delete simulation submissions"
ON simulation_assignment_submissions
FOR DELETE
TO authenticated
USING (
  is_admin_or_teacher(get_user_email())
);

-- ============================================================================
-- Additional security improvements
-- ============================================================================

-- Add function to check if user can grade submissions
CREATE OR REPLACE FUNCTION public.can_grade_simulation_submissions()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_admin_or_teacher(get_user_email());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON simulation_embedded_assignments TO authenticated;
GRANT ALL ON simulation_embedded_assignments TO authenticated;
GRANT SELECT ON simulation_assignment_submissions TO authenticated;
GRANT ALL ON simulation_assignment_submissions TO authenticated;

-- Ensure sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.is_admin_or_teacher IS 'Checks if the given email belongs to an admin or teacher. Update the admin_emails array to add/remove admin users.';
COMMENT ON FUNCTION public.get_user_email IS 'Gets the current user email from JWT or users table.';
COMMENT ON FUNCTION public.can_grade_simulation_submissions IS 'Checks if the current user can grade simulation submissions.';
