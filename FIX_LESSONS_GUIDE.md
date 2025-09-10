# Fix Lessons Display Guide

## 🔍 Problem Identified

The lessons are not showing because:
1. **Type Mismatch**: Your database uses UUID for lesson IDs, but the code was expecting integers
2. **Possible RLS (Row Level Security) issues**: The database might be blocking access

## ✅ Fixes Applied

### 1. **Updated Type Definitions**
- Changed lesson ID type from `number` to `string` in all components
- Updated in: `LessonManagement.tsx`, `lessons/page.tsx`, `supabase.ts`

### 2. **Created Test Page**
Navigate to `/test-lessons` to debug your connection

## 🛠️ Steps to Fix

### Step 1: Check Environment Variables
Make sure you have these in your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 2: Run Database Setup
Go to your Supabase SQL Editor and run this:

```sql
-- Check if lessons table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'lessons'
);

-- View current RLS policies
SELECT * FROM pg_policies WHERE tablename = 'lessons';

-- If you need to allow public read access (for testing):
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view published lessons" ON public.lessons;
DROP POLICY IF EXISTS "Authenticated can manage lessons" ON public.lessons;

-- Create simple policies for testing
CREATE POLICY "Anyone can read published lessons"
ON public.lessons FOR SELECT
USING (published = true);

-- Allow authenticated users full access (for admin)
CREATE POLICY "Authenticated users full access"
ON public.lessons FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.lessons TO anon;
GRANT ALL ON public.lessons TO authenticated;

-- Insert a test lesson
INSERT INTO public.lessons (
  title, 
  slug, 
  description, 
  content, 
  unit, 
  lesson_number, 
  published
) VALUES (
  'One-Step Unit Conversions',
  'unit-conversions',
  'Learn how to convert between different units using the train tracks method',
  E'# One-Step Unit Conversions\n\n## Bell Ringer\nWarm-up exercises...',
  'Unit 0 - Foundations',
  1,
  true
) ON CONFLICT (slug) DO NOTHING;

-- Check if lesson was inserted
SELECT id, title, slug, published FROM public.lessons;
```

### Step 3: Test Your Connection
1. Navigate to `/test-lessons` in your app
2. Click "Test All Lessons" to see raw database response
3. Click "Test Published Lessons" to see only published ones
4. Click "Create Sample Lesson" to test write permissions

### Step 4: Check Console Logs
Open browser DevTools and look for:
- Connection errors
- Authentication issues
- Network failures

## 🎯 Common Issues & Solutions

### Issue 1: "relation does not exist"
**Solution**: The lessons table doesn't exist. Create it with the schema above.

### Issue 2: "permission denied"
**Solution**: RLS policies are blocking access. Run the policy setup SQL above.

### Issue 3: No data returned (empty array)
**Solution**: 
- Check if any lessons exist: `SELECT COUNT(*) FROM public.lessons;`
- Check if lessons are published: `SELECT * FROM public.lessons WHERE published = true;`

### Issue 4: Environment variables not loading
**Solution**:
1. Restart your Next.js dev server
2. Make sure `.env.local` is in the root directory
3. Variables must start with `NEXT_PUBLIC_` to be available in browser

## 📊 Verify Your Setup

Run this SQL to verify everything:

```sql
-- Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'lessons'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'lessons';

-- Check policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'lessons';

-- Count lessons
SELECT 
  COUNT(*) as total_lessons,
  COUNT(*) FILTER (WHERE published = true) as published_lessons
FROM public.lessons;
```

## 🚀 Once Fixed

After fixing the database connection:
1. Your lessons will appear on `/lessons`
2. Admin can manage lessons at `/admin` → "Lesson Management"
3. Unit conversion lessons will automatically use the enhanced interactive view
4. Students can access lessons with the engaging tabbed interface

## 💡 Quick Test

Create a lesson directly in Supabase:
1. Go to Table Editor → lessons
2. Click "Insert row"
3. Fill in:
   - title: "Test Lesson"
   - slug: "test-lesson"
   - content: "# Test Content"
   - unit: "Test Unit"
   - lesson_number: 1
   - published: true
4. Save and check if it appears in your app

## Need More Help?

1. Check Supabase logs: Dashboard → Logs → API Logs
2. Verify project URL matches your `.env.local`
3. Try regenerating your anon key if authentication fails
4. Make sure your Supabase project is not paused
