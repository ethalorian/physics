-- ============================================================================
-- DATABASE DIAGNOSTIC SCRIPT
-- ============================================================================
-- Run this BEFORE applying any fixes to understand your current database state
-- Copy and run in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CHECK WHAT TABLES EXIST
-- ============================================================================
SELECT '=== EXISTING TABLES ===' as info;

SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE '_prisma%'
  AND tablename NOT LIKE 'schema_migrations'
ORDER BY tablename;

-- ============================================================================
-- 2. CHECK CRITICAL TABLES
-- ============================================================================
SELECT '=== CRITICAL TABLES CHECK ===' as info;

SELECT 
  'assignments' as table_name,
  EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'assignments' AND schemaname = 'public') as exists,
  (SELECT COUNT(*) FROM public.assignments WHERE true) as row_count
UNION ALL
SELECT 
  'lessons',
  EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'lessons' AND schemaname = 'public'),
  (SELECT COUNT(*) FROM public.lessons WHERE true)
UNION ALL
SELECT 
  'assignment_submissions',
  EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'assignment_submissions' AND schemaname = 'public'),
  (SELECT COUNT(*) FROM public.assignment_submissions WHERE true)
UNION ALL
SELECT 
  'students',
  EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'students' AND schemaname = 'public'),
  (SELECT COUNT(*) FROM public.students WHERE true)
UNION ALL
SELECT 
  'courses',
  EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'courses' AND schemaname = 'public'),
  (SELECT COUNT(*) FROM public.courses WHERE true)
UNION ALL
SELECT 
  'question_bank',
  EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'question_bank' AND schemaname = 'public'),
  (SELECT COUNT(*) FROM public.question_bank WHERE true)
UNION ALL
SELECT 
  'user_roles',
  EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'user_roles' AND schemaname = 'public'),
  (SELECT COUNT(*) FROM public.user_roles WHERE true);

-- ============================================================================
-- 3. CHECK RLS POLICIES
-- ============================================================================
SELECT '=== RLS POLICIES COUNT BY TABLE ===' as info;

SELECT 
  tablename,
  COUNT(policyname) as policy_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;

-- ============================================================================
-- 4. CHECK HELPER FUNCTIONS
-- ============================================================================
SELECT '=== HELPER FUNCTIONS ===' as info;

SELECT 
  proname as function_name,
  CASE 
    WHEN proname = 'is_admin_or_teacher' THEN '⚠️ Check implementation'
    WHEN proname LIKE 'auth_%' THEN '✅ Auth helper'
    ELSE '📌 Utility function'
  END as status
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname IN (
    'is_admin_or_teacher', 
    'auth_email', 
    'auth_role', 
    'is_admin', 
    'is_teacher',
    'calculate_assignment_stats',
    'get_user_email'
  )
ORDER BY proname;

-- ============================================================================
-- 5. CHECK FOR PROBLEM INDICATORS
-- ============================================================================
SELECT '=== POTENTIAL ISSUES ===' as info;

-- Check for hardcoded emails in policies
SELECT 
  'Hardcoded emails in RLS policies' as issue_type,
  COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual::text LIKE '%@%' OR with_check::text LIKE '%@%');

-- Check for tables without indexes
SELECT 
  'Tables without indexes' as issue_type,
  COUNT(DISTINCT tablename) as count
FROM pg_tables t
WHERE schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM pg_indexes i 
    WHERE i.tablename = t.tablename 
    AND i.schemaname = 'public'
  );

-- Check for missing foreign key constraints
SELECT 
  'Tables that might need foreign keys' as issue_type,
  COUNT(*) as count
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('assignment_submissions', 'student_activity', 'lesson_progress')
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_name = tablename
  );

-- ============================================================================
-- 6. CHECK CURRENT USER ROLES (if table exists)
-- ============================================================================
SELECT '=== CURRENT USER ROLES ===' as info;

-- This will error if user_roles doesn't exist, that's okay
SELECT email, role 
FROM public.user_roles 
ORDER BY role, email
LIMIT 20;

-- ============================================================================
-- 7. TEST CURRENT PERMISSIONS
-- ============================================================================
SELECT '=== PERMISSION FUNCTION TESTS ===' as info;

-- Test if the is_admin_or_teacher function exists and works
SELECT 
  'is_admin_or_teacher(''antoccic@fitchburg.k12.ma.us'')' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'is_admin_or_teacher'
    ) THEN 
      is_admin_or_teacher('antoccic@fitchburg.k12.ma.us')::text
    ELSE 
      'Function does not exist'
  END as result;

-- ============================================================================
-- 8. RECOMMENDATIONS
-- ============================================================================
SELECT '=== RECOMMENDATIONS ===' as info;

SELECT 
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_roles' AND schemaname = 'public')
    THEN '🚨 CRITICAL: user_roles table missing - run database fix'
    WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'assignments' AND schemaname = 'public')
    THEN '🚨 CRITICAL: assignments table missing - run database fix'
    WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin_or_teacher')
    THEN '⚠️ WARNING: Helper functions missing - run database fix'
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND (qual::text LIKE '%antoccic@fitchburg%' OR with_check::text LIKE '%antoccic@fitchburg%')
    )
    THEN '⚠️ WARNING: Hardcoded emails in policies - run database refactor'
    ELSE '✅ Database structure looks okay - consider running quick fix for optimization'
  END as recommendation;

-- ============================================================================
-- END OF DIAGNOSTIC
-- ============================================================================
-- 
-- After running this diagnostic:
-- 1. Review the output to understand your current state
-- 2. Choose between database-quick-fix.sql or database-refactor.sql
-- 3. Back up your database before applying any fixes
-- 4. Run your chosen fix script
--
-- ============================================================================
