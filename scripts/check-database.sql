-- Check Current Database State
-- Run this in Supabase SQL Editor to see what tables already exist

-- Check which tables currently exist
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check if specific tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (
  VALUES 
    ('lessons'),
    ('units'),
    ('question_bank'),
    ('vocabulary_sets'),
    ('student_activity'),
    ('courses'),
    ('students')
) AS expected_tables(table_name)
LEFT JOIN information_schema.tables t 
  ON t.table_name = expected_tables.table_name 
  AND t.table_schema = 'public';

-- Check for any existing data in key tables (if they exist)
DO $$
BEGIN
  -- Check lessons table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons' AND table_schema = 'public') THEN
    RAISE NOTICE 'LESSONS TABLE: Found % records', (SELECT COUNT(*) FROM lessons);
  ELSE
    RAISE NOTICE 'LESSONS TABLE: Does not exist';
  END IF;
  
  -- Check question_bank table  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_bank' AND table_schema = 'public') THEN
    RAISE NOTICE 'QUESTION_BANK TABLE: Found % records', (SELECT COUNT(*) FROM question_bank);
  ELSE
    RAISE NOTICE 'QUESTION_BANK TABLE: Does not exist';
  END IF;
  
  -- Check vocabulary_sets table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vocabulary_sets' AND table_schema = 'public') THEN
    RAISE NOTICE 'VOCABULARY_SETS TABLE: Found % records', (SELECT COUNT(*) FROM vocabulary_sets);
  ELSE
    RAISE NOTICE 'VOCABULARY_SETS TABLE: Does not exist';
  END IF;
END $$;
