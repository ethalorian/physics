-- ============================================================================
-- SAFE DATABASE DIAGNOSTIC SCRIPT (No Errors Version)
-- ============================================================================
-- This version won't error even if tables don't exist
-- Copy and run in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CHECK WHAT TABLES EXIST
-- ============================================================================
SELECT '=== EXISTING TABLES ===' as section, '' as details
UNION ALL
SELECT 
  tablename::text,
  CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE '_prisma%'
  AND tablename NOT LIKE 'schema_migrations'
ORDER BY section DESC, details;

-- ============================================================================
-- 2. CHECK CRITICAL TABLES EXISTENCE
-- ============================================================================
SELECT '=== CRITICAL TABLES CHECK ===' as section, '' as status
UNION ALL
SELECT 
  'assignments' as section,
  CASE WHEN EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'assignments' AND schemaname = 'public') 
    THEN '✅ Exists' ELSE '❌ Missing' END as status
UNION ALL
SELECT 
  'lessons',
  CASE WHEN EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'lessons' AND schemaname = 'public')
    THEN '✅ Exists' ELSE '❌ Missing' END
UNION ALL
SELECT 
  'assignment_submissions',
  CASE WHEN EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'assignment_submissions' AND schemaname = 'public')
    THEN '✅ Exists' ELSE '❌ Missing' END
UNION ALL
SELECT 
  'students',
  CASE WHEN EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'students' AND schemaname = 'public')
    THEN '✅ Exists' ELSE '❌ Missing' END
UNION ALL
SELECT 
  'courses',
  CASE WHEN EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'courses' AND schemaname = 'public')
    THEN '✅ Exists' ELSE '❌ Missing' END
UNION ALL
SELECT 
  'question_bank',
  CASE WHEN EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'question_bank' AND schemaname = 'public')
    THEN '✅ Exists' ELSE '❌ Missing' END
UNION ALL
SELECT 
  'user_roles',
  CASE WHEN EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'user_roles' AND schemaname = 'public')
    THEN '✅ Exists' ELSE '❌ Missing - CRITICAL!' END
UNION ALL
SELECT 
  'users',
  CASE WHEN EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public')
    THEN '✅ Exists' ELSE '❌ Missing' END
UNION ALL
SELECT 
  'simulations',
  CASE WHEN EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'simulations' AND schemaname = 'public')
    THEN '✅ Exists' ELSE '❌ Missing' END
UNION ALL
SELECT 
  'simulation_embedded_assignments',
  CASE WHEN EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'simulation_embedded_assignments' AND schemaname = 'public')
    THEN '✅ Exists' ELSE '❌ Missing' END;

-- ============================================================================
-- 3. COUNT RLS POLICIES
-- ============================================================================
SELECT '=== RLS POLICIES SUMMARY ===' as info, '' as details
UNION ALL
SELECT 
  'Total tables with RLS enabled'::text,
  COUNT(*)::text || ' tables'
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT 
  'Total tables without RLS'::text,
  COUNT(*)::text || ' tables'
FROM pg_tables
WHERE schemaname = 'public' 
  AND rowsecurity = false
  AND tablename NOT LIKE '_prisma%'
  AND tablename NOT LIKE 'schema_migrations'
UNION ALL
SELECT 
  'Total RLS policies defined'::text,
  COUNT(*)::text || ' policies'
FROM pg_policies
WHERE schemaname = 'public';

-- ============================================================================
-- 4. CHECK HELPER FUNCTIONS
-- ============================================================================
SELECT '=== HELPER FUNCTIONS CHECK ===' as function_type, '' as status
UNION ALL
SELECT 
  proname::text as function_type,
  '✅ Exists' as status
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname IN (
    'is_admin_or_teacher', 
    'auth_email', 
    'auth_role', 
    'is_admin', 
    'is_teacher',
    'calculate_assignment_stats',
    'get_user_email',
    'update_updated_at',
    'increment_question_usage'
  )
UNION ALL
SELECT 
  'is_admin_or_teacher'::text,
  '❌ Missing - CRITICAL!' as status
WHERE NOT EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'is_admin_or_teacher'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
)
UNION ALL
SELECT 
  'auth_email'::text,
  '❌ Missing' as status
WHERE NOT EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'auth_email'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
)
UNION ALL
SELECT 
  'auth_role'::text,
  '❌ Missing' as status
WHERE NOT EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'auth_role'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
);

-- ============================================================================
-- 5. CHECK FOR PROBLEMS IN POLICIES
-- ============================================================================
SELECT '=== POTENTIAL ISSUES ===' as issue, '' as count
UNION ALL
SELECT 
  'Hardcoded emails in policies'::text,
  COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual::text LIKE '%@%' OR with_check::text LIKE '%@%')
UNION ALL
SELECT 
  'Policies referencing missing user_roles table'::text,
  COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual::text LIKE '%user_roles%' OR with_check::text LIKE '%user_roles%')
  AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_roles' AND schemaname = 'public');

-- ============================================================================
-- 6. FINAL DIAGNOSIS
-- ============================================================================
SELECT '=== DIAGNOSIS RESULT ===' as diagnosis, '' as recommendation
UNION ALL
SELECT 
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_roles' AND schemaname = 'public')
      AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'assignments' AND schemaname = 'public')
    THEN '🚨 CRITICAL ISSUES FOUND'
    WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_roles' AND schemaname = 'public')
    THEN '🚨 MISSING ROLE MANAGEMENT'
    WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'assignments' AND schemaname = 'public')
    THEN '🚨 MISSING CORE TABLES'
    ELSE '⚠️ MINOR ISSUES FOUND'
  END as diagnosis,
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_roles' AND schemaname = 'public')
    THEN 'Run database-refactor.sql or database-quick-fix.sql immediately'
    ELSE 'Review issues above and run appropriate fix'
  END as recommendation;

-- ============================================================================
-- 7. WHAT WILL BE FIXED
-- ============================================================================
SELECT '=== WHAT THE FIX SCRIPTS WILL DO ===' as action, '' as description
UNION ALL
SELECT '1. Create missing tables', 'user_roles, assignments, lessons, students, courses, etc.'
UNION ALL
SELECT '2. Fix RLS policies', 'Simplify and correct all Row Level Security policies'
UNION ALL
SELECT '3. Add helper functions', 'is_admin(), is_teacher(), auth_email(), auth_role()'
UNION ALL
SELECT '4. Set up indexes', 'Optimize query performance'
UNION ALL
SELECT '5. Grant permissions', 'Ensure authenticated users have proper access'
UNION ALL
SELECT '6. Add role management', 'Proper admin/teacher/student role system';

-- ============================================================================
-- END OF DIAGNOSTIC
-- ============================================================================
