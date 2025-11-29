-- Script to check and diagnose RLS policies in the database
-- Run this script to see all RLS policies and identify potential issues

-- ============================================================================
-- CHECK IF RLS IS ENABLED ON TABLES
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY 
  CASE WHEN rowsecurity = false THEN 0 ELSE 1 END,
  tablename;

-- ============================================================================
-- LIST ALL RLS POLICIES
-- ============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- CHECK FOR HARDCODED EMAILS IN POLICIES
-- ============================================================================
SELECT 
  tablename,
  policyname,
  'Potential Issue: Hardcoded email found' as issue
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual::text LIKE '%@%' 
    OR with_check::text LIKE '%@%'
  );

-- ============================================================================
-- CHECK HELPER FUNCTIONS
-- ============================================================================
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname IN ('is_admin_or_teacher', 'get_user_email', 'can_grade_simulation_submissions')
ORDER BY proname;

-- ============================================================================
-- TEST RLS AS DIFFERENT USERS
-- ============================================================================
-- To test RLS policies, you can use these commands:

-- Test as an admin user
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims = '{"email": "antoccic@fitchburg.k12.ma.us"}';
-- SELECT * FROM simulation_embedded_assignments LIMIT 5;

-- Test as a student user
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims = '{"email": "student@example.com"}';
-- SELECT * FROM simulation_embedded_assignments WHERE published = true LIMIT 5;

-- Reset to superuser
-- RESET ROLE;

-- ============================================================================
-- RECOMMENDED FIXES
-- ============================================================================
-- If you see any tables with RLS disabled that contain user data, enable RLS:
-- ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- If you see hardcoded emails in policies, update them to use helper functions:
-- 1. Drop the old policy: DROP POLICY "policy_name" ON table_name;
-- 2. Create new policy using is_admin_or_teacher() function

-- ============================================================================
-- CHECK FOR MISSING GRANTS
-- ============================================================================
SELECT 
  'GRANT ' || privilege_type || ' ON ' || table_schema || '.' || table_name || ' TO authenticated;' as missing_grant
FROM information_schema.table_privileges
WHERE grantee = 'authenticated'
  AND table_schema = 'public'
  AND table_name IN (
    'simulation_embedded_assignments',
    'simulation_assignment_submissions'
  )
GROUP BY table_schema, table_name, privilege_type
HAVING COUNT(*) = 0;
