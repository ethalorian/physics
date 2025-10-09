-- ============================================================================
-- TEST RLS ACCESS - Verify Admin and Student Permissions
-- ============================================================================
-- Run this script in Supabase SQL Editor while logged in to test access
-- ============================================================================

-- ============================================================================
-- PART 1: Check if RLS is enabled on all tables
-- ============================================================================

SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'lessons', 'assignments', 'lesson_assignments', 
    'assignment_assignments', 'vocabulary_game_scores',
    'lesson_progress', 'video_question_responses'
  )
ORDER BY tablename;

-- ============================================================================
-- PART 2: Test admin email function
-- ============================================================================

-- Test with your admin emails
SELECT 
  'antoccic@fitchburg.k12.ma.us' as email,
  is_admin_or_teacher('antoccic@fitchburg.k12.ma.us') as is_admin;

SELECT 
  'craigantocci@gmail.com' as email,
  is_admin_or_teacher('craigantocci@gmail.com') as is_admin;

-- Test with a non-admin email
SELECT 
  'student@example.com' as email,
  is_admin_or_teacher('student@example.com') as is_admin;

-- Test current user
SELECT 
  get_user_email() as current_user_email,
  is_admin_or_teacher() as is_current_user_admin;

-- ============================================================================
-- PART 3: Check your user account
-- ============================================================================

-- Find your user ID and email
SELECT 
  id as user_id,
  email,
  name,
  created_at
FROM public.users
WHERE email IN ('antoccic@fitchburg.k12.ma.us', 'craigantocci@gmail.com')
ORDER BY email;

-- ============================================================================
-- PART 4: Test lesson access
-- ============================================================================

-- Count total lessons (admins should see all, students only published)
SELECT 
  COUNT(*) as total_lessons,
  COUNT(*) FILTER (WHERE published = true) as published_lessons,
  COUNT(*) FILTER (WHERE published = false) as draft_lessons
FROM public.lessons;

-- Try to select lessons (this tests the SELECT policy)
SELECT 
  id,
  title,
  published,
  unit,
  CASE 
    WHEN published THEN '✅ Published (students can see)'
    ELSE '🔒 Draft (admins only)'
  END as visibility
FROM public.lessons
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- PART 5: Test assignment access
-- ============================================================================

-- Count assignments
SELECT 
  COUNT(*) as total_assignments,
  COUNT(*) FILTER (WHERE published = true) as published_assignments,
  COUNT(*) FILTER (WHERE published = false) as draft_assignments
FROM public.assignments;

-- View assignments
SELECT 
  id,
  title,
  published,
  total_points,
  CASE 
    WHEN published THEN '✅ Published (students can see)'
    ELSE '🔒 Draft (admins only)'
  END as visibility
FROM public.assignments
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- PART 6: Check all policies on key tables
-- ============================================================================

-- List all policies for lessons
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️  Read'
    WHEN cmd = 'INSERT' THEN '➕ Create'
    WHEN cmd = 'UPDATE' THEN '✏️  Update'
    WHEN cmd = 'DELETE' THEN '🗑️  Delete'
    WHEN cmd = 'ALL' THEN '🔓 All Operations'
    ELSE cmd
  END as action
FROM pg_policies
WHERE tablename IN ('lessons', 'assignments', 'lesson_assignments')
ORDER BY tablename, cmd;

-- ============================================================================
-- PART 7: Permission summary
-- ============================================================================

-- Show what the current user can do
SELECT 
  'Current User Permissions' as info,
  CASE WHEN is_admin_or_teacher() 
    THEN 'ADMIN/TEACHER - Full Access' 
    ELSE 'STUDENT - Limited Access' 
  END as role,
  CASE WHEN is_admin_or_teacher() 
    THEN '✅ Can create, edit, delete, and publish all content'
    ELSE '👁️  Can view published content and manage own submissions'
  END as permissions;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- 
-- If you're logged in as ADMIN (antoccic@fitchburg.k12.ma.us or craigantocci@gmail.com):
-- - All RLS status should show "✅ Enabled"
-- - is_admin_or_teacher should return TRUE
-- - You should see ALL lessons (published and unpublished)
-- - You should see ALL assignments (published and unpublished)
-- - Role should show "ADMIN/TEACHER - Full Access"
--
-- If you're logged in as a STUDENT:
-- - All RLS status should show "✅ Enabled"
-- - is_admin_or_teacher should return FALSE
-- - You should see ONLY published lessons
-- - You should see ONLY published assignments
-- - Role should show "STUDENT - Limited Access"
--
-- ============================================================================
