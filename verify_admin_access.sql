-- Verify Admin Access and RLS Configuration
-- Run this in Supabase SQL Editor to check if your admin setup is correct

-- 1. Check if lessons table has RLS enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('lessons', 'assignments', 'lesson_assignments', 'assignment_assignments')
ORDER BY tablename;

-- 2. Check your current user email
SELECT 
  id as user_id,
  email,
  name
FROM public.users
WHERE email IN ('antoccic@fitchburg.k12.ma.us', 'craigantocci@gmail.com')
ORDER BY email;

-- 3. Test the is_admin_or_teacher function with your email
-- Replace 'your-email@example.com' with your actual email
SELECT is_admin_or_teacher('antoccic@fitchburg.k12.ma.us') as is_admin_1;
SELECT is_admin_or_teacher('craigantocci@gmail.com') as is_admin_2;

-- 4. Check all RLS policies on lessons table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'lessons'
ORDER BY policyname;

-- 5. Count lessons in database
SELECT 
  COUNT(*) as total_lessons,
  COUNT(*) FILTER (WHERE published = true) as published_lessons,
  COUNT(*) FILTER (WHERE published = false) as draft_lessons
FROM public.lessons;

-- 6. Test if current user can see lessons (run this while logged in)
-- This should return lessons if RLS is working correctly
SELECT 
  id,
  title,
  published,
  unit,
  created_at
FROM public.lessons
ORDER BY created_at DESC
LIMIT 5;
