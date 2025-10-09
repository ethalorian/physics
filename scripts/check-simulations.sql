-- Check simulations in database
-- Run this script to see what simulations exist and their status

-- First, check if simulations table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'simulations'
) AS table_exists;

-- Count simulations
SELECT COUNT(*) as total_simulations FROM public.simulations;

-- Show all simulations with their status
SELECT 
    id,
    title,
    slug,
    published,
    created_at,
    updated_at,
    unit,
    difficulty,
    created_by
FROM public.simulations
ORDER BY created_at DESC;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'simulations';

-- Check current user
SELECT current_user, session_user;

-- Check if we have the helper functions
SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'is_admin_or_teacher'
) AS has_admin_function;

-- Test the helper function
SELECT public.is_admin_or_teacher() AS is_admin_or_teacher;
SELECT public.get_auth_email_safe() AS current_email;

-- Check if there are any RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'simulations';
