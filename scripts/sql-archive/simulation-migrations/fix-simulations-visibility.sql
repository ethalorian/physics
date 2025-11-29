-- ============================================================================
-- FIX SIMULATIONS VISIBILITY
-- ============================================================================
-- Quick fix to make simulations visible in the admin panel
-- ============================================================================

BEGIN;

-- Enable RLS on simulations tables
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_embedded_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_activity ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "simulations_select_policy" ON public.simulations;
DROP POLICY IF EXISTS "simulations_insert_policy" ON public.simulations;
DROP POLICY IF EXISTS "simulations_update_policy" ON public.simulations;
DROP POLICY IF EXISTS "simulations_delete_policy" ON public.simulations;

-- SIMULATIONS table - Everyone can read, teachers can manage
CREATE POLICY "simulations_select_policy" ON public.simulations
  FOR SELECT TO authenticated
  USING (true); -- Everyone can see simulations

CREATE POLICY "simulations_insert_policy" ON public.simulations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_teacher());

CREATE POLICY "simulations_update_policy" ON public.simulations
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_teacher());

CREATE POLICY "simulations_delete_policy" ON public.simulations
  FOR DELETE TO authenticated
  USING (public.is_admin_or_teacher());

-- SIMULATION_EMBEDDED_ASSIGNMENTS - Similar policies
DROP POLICY IF EXISTS "sim_embedded_select_policy" ON public.simulation_embedded_assignments;
DROP POLICY IF EXISTS "sim_embedded_insert_policy" ON public.simulation_embedded_assignments;
DROP POLICY IF EXISTS "sim_embedded_update_policy" ON public.simulation_embedded_assignments;
DROP POLICY IF EXISTS "sim_embedded_delete_policy" ON public.simulation_embedded_assignments;

CREATE POLICY "sim_embedded_select_policy" ON public.simulation_embedded_assignments
  FOR SELECT TO authenticated
  USING (published = true OR public.is_admin_or_teacher());

CREATE POLICY "sim_embedded_insert_policy" ON public.simulation_embedded_assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_teacher());

CREATE POLICY "sim_embedded_update_policy" ON public.simulation_embedded_assignments
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_teacher());

CREATE POLICY "sim_embedded_delete_policy" ON public.simulation_embedded_assignments
  FOR DELETE TO authenticated
  USING (public.is_admin_or_teacher());

-- SIMULATION_ASSIGNMENT_SUBMISSIONS (student_id is TEXT!)
DROP POLICY IF EXISTS "sim_submissions_select_policy" ON public.simulation_assignment_submissions;
DROP POLICY IF EXISTS "sim_submissions_insert_policy" ON public.simulation_assignment_submissions;
DROP POLICY IF EXISTS "sim_submissions_update_policy" ON public.simulation_assignment_submissions;

CREATE POLICY "sim_submissions_select_policy" ON public.simulation_assignment_submissions
  FOR SELECT TO authenticated
  USING (
    student_id = public.get_auth_user_id_text()
    OR student_email = public.get_auth_email_safe()
    OR public.is_admin_or_teacher()
  );

CREATE POLICY "sim_submissions_insert_policy" ON public.simulation_assignment_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = public.get_auth_user_id_text()
    OR student_email = public.get_auth_email_safe()
    OR public.is_admin_or_teacher()
  );

CREATE POLICY "sim_submissions_update_policy" ON public.simulation_assignment_submissions
  FOR UPDATE TO authenticated
  USING (
    student_id = public.get_auth_user_id_text()
    OR student_email = public.get_auth_email_safe()
    OR public.is_admin_or_teacher()
  );

-- SIMULATION_ASSIGNMENTS
DROP POLICY IF EXISTS "sim_assignments_select_policy" ON public.simulation_assignments;
DROP POLICY IF EXISTS "sim_assignments_manage_policy" ON public.simulation_assignments;

CREATE POLICY "sim_assignments_select_policy" ON public.simulation_assignments
  FOR SELECT TO authenticated
  USING (published = true OR public.is_admin_or_teacher());

CREATE POLICY "sim_assignments_manage_policy" ON public.simulation_assignments
  FOR ALL TO authenticated
  USING (public.is_admin_or_teacher());

-- SIMULATION_RUBRICS
DROP POLICY IF EXISTS "sim_rubrics_select_policy" ON public.simulation_rubrics;
DROP POLICY IF EXISTS "sim_rubrics_manage_policy" ON public.simulation_rubrics;

CREATE POLICY "sim_rubrics_select_policy" ON public.simulation_rubrics
  FOR SELECT TO authenticated
  USING (published = true OR public.is_admin_or_teacher());

CREATE POLICY "sim_rubrics_manage_policy" ON public.simulation_rubrics
  FOR ALL TO authenticated
  USING (public.is_admin_or_teacher());

-- SIMULATION_ACTIVITY
DROP POLICY IF EXISTS "sim_activity_select_policy" ON public.simulation_activity;
DROP POLICY IF EXISTS "sim_activity_insert_policy" ON public.simulation_activity;

CREATE POLICY "sim_activity_select_policy" ON public.simulation_activity
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()  -- student_id is UUID here
    OR public.is_admin_or_teacher()
  );

CREATE POLICY "sim_activity_insert_policy" ON public.simulation_activity
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    OR public.is_admin_or_teacher()
  );

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if simulations are now accessible
SELECT 'Simulations Table Check:' as status;
SELECT COUNT(*) as simulation_count FROM public.simulations;

-- Check RLS status
SELECT 'RLS Status:' as status;
SELECT tablename, 
       CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'simulation%'
ORDER BY tablename;

-- Check policies created
SELECT 'Policies Created:' as status;
SELECT tablename, COUNT(policyname) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'simulation%'
GROUP BY tablename
ORDER BY tablename;
