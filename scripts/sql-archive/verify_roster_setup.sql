-- ============================================================================
-- Roster Import Setup Verification Script
-- ============================================================================
-- Run this script to verify that all tables and functions are properly set up

-- Check if required tables exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') 
    THEN '✅ courses table exists'
    ELSE '❌ courses table MISSING'
  END as courses_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') 
    THEN '✅ students table exists'
    ELSE '❌ students table MISSING'
  END as students_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_students') 
    THEN '✅ course_students table exists'
    ELSE '❌ course_students table MISSING'
  END as course_students_status;

-- Check if required functions exist
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'sync_course'
    ) 
    THEN '✅ sync_course function exists'
    ELSE '❌ sync_course function MISSING'
  END as sync_course_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'sync_student'
    ) 
    THEN '✅ sync_student function exists'
    ELSE '❌ sync_student function MISSING'
  END as sync_student_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'get_course_students'
    ) 
    THEN '✅ get_course_students function exists'
    ELSE '❌ get_course_students function MISSING'
  END as get_course_students_status;

-- Check courses table columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'courses'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check students table columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'students'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show function signatures
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as parameters,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('sync_course', 'sync_student', 'get_course_students', 'update_course_student_counts')
ORDER BY p.proname;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS enabled'
    ELSE '❌ RLS disabled'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('courses', 'students', 'course_students')
ORDER BY tablename;

-- Summary
SELECT 
  '🎯 Setup Summary' as status,
  CASE 
    WHEN 
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') AND
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') AND
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_students') AND
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_course') AND
      EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_student')
    THEN '✅ All required tables and functions exist - Ready to import roster!'
    ELSE '❌ Some components are missing - Check the output above'
  END as overall_status;

