-- Check if lessons table exists and what columns it has
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'lessons'
ORDER BY ordinal_position;

-- Check if lessons table has any data
SELECT COUNT(*) as lesson_count FROM public.lessons;

-- Check if RLS is enabled on lessons table
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'lessons';
