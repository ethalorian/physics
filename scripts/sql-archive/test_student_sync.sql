-- ============================================================================
-- Test Student Sync Function
-- ============================================================================
-- Run this to test if the sync_student function works correctly

-- Test 1: Check if the function exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'sync_student'
    ) 
    THEN '✅ sync_student function exists'
    ELSE '❌ sync_student function MISSING'
  END as function_status;

-- Test 2: Check tables exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') 
    THEN '✅ students table exists'
    ELSE '❌ students table MISSING'
  END as students_table,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_students') 
    THEN '✅ course_students table exists'
    ELSE '❌ course_students table MISSING'
  END as course_students_table;

-- Test 3: Try to sync a test student (replace with a real course UUID from your courses table)
-- First, get a course UUID
SELECT 
  'Use this course UUID for testing:' as info,
  id as course_uuid,
  name as course_name
FROM public.courses
LIMIT 1;

-- Test 4: Try syncing a test student
-- IMPORTANT: Replace 'YOUR-COURSE-UUID-HERE' with actual UUID from Test 3
DO $$
DECLARE
  test_student_id UUID;
  test_course_uuid UUID;
BEGIN
  -- Get the first course UUID
  SELECT id INTO test_course_uuid FROM public.courses LIMIT 1;
  
  IF test_course_uuid IS NULL THEN
    RAISE NOTICE '❌ No courses found in database. Run sync_course first!';
    RETURN;
  END IF;
  
  RAISE NOTICE '🧪 Testing with course UUID: %', test_course_uuid;
  
  -- Try to sync a test student
  BEGIN
    test_student_id := public.sync_student(
      p_google_user_id => 'test-user-123',
      p_email => 'test@example.com',
      p_name => 'Test Student',
      p_photo_url => NULL,
      p_course_id => test_course_uuid
    );
    
    RAISE NOTICE '✅ Test student synced successfully! Student UUID: %', test_student_id;
    
    -- Verify student was created
    IF EXISTS (SELECT 1 FROM public.students WHERE id = test_student_id) THEN
      RAISE NOTICE '✅ Student record exists in students table';
    ELSE
      RAISE WARNING '❌ Student record NOT found in students table';
    END IF;
    
    -- Verify course_student link was created
    IF EXISTS (SELECT 1 FROM public.course_students WHERE student_id = test_student_id AND course_id = test_course_uuid) THEN
      RAISE NOTICE '✅ Student linked to course in course_students table';
    ELSE
      RAISE WARNING '❌ Student NOT linked to course in course_students table';
    END IF;
    
    -- Clean up test data
    DELETE FROM public.course_students WHERE student_id = test_student_id;
    DELETE FROM public.students WHERE id = test_student_id;
    RAISE NOTICE '🧹 Test data cleaned up';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error testing sync_student: % %', SQLERRM, SQLSTATE;
  END;
END $$;

-- Test 5: Check RLS policies on students table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('students', 'course_students')
ORDER BY tablename, policyname;

-- Test 6: Count existing students and course_students
SELECT 
  'Current data:' as info,
  (SELECT COUNT(*) FROM public.students) as total_students,
  (SELECT COUNT(*) FROM public.course_students) as total_course_student_links,
  (SELECT COUNT(*) FROM public.courses) as total_courses;
