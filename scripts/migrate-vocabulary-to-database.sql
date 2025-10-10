-- ============================================================================
-- MIGRATE VOCABULARY SETS FROM LOCALSTORAGE TO DATABASE
-- ============================================================================
-- This script helps verify the vocabulary tables are set up correctly
-- Run this after applying the create_vocabulary_tables.sql migration

-- Step 1: Verify tables exist
SELECT 
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('vocabulary_sets', 'vocabulary_terms')
ORDER BY table_name;

-- Step 2: Check if there are any existing vocabulary sets
SELECT 
  COUNT(*) as total_sets,
  COUNT(CASE WHEN published = true THEN 1 END) as published_sets,
  COUNT(CASE WHEN published = false THEN 1 END) as unpublished_sets
FROM vocabulary_sets;

-- Step 3: Check vocabulary terms
SELECT 
  vs.name as set_name,
  COUNT(vt.id) as term_count,
  vs.published
FROM vocabulary_sets vs
LEFT JOIN vocabulary_terms vt ON vt.vocabulary_set_id = vs.id
GROUP BY vs.id, vs.name, vs.published
ORDER BY vs.created_at DESC;

-- Step 4: Verify RLS policies are in place
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('vocabulary_sets', 'vocabulary_terms')
ORDER BY tablename, policyname;

-- ============================================================================
-- SAMPLE DATA INSERT (Optional - for testing)
-- ============================================================================
-- Uncomment below to create a sample vocabulary set for testing

/*
-- Insert a sample vocabulary set
INSERT INTO vocabulary_sets (name, description, unit_id, lesson_id, published, created_by)
VALUES (
  'Unit 1: Motion - Sample Terms',
  'Basic motion and kinematics vocabulary',
  'unit-1',
  'lesson-1-1',
  true,
  'antoccic@fitchburg.k12.ma.us'
)
RETURNING id;

-- Use the returned ID to insert sample terms
-- Replace 'YOUR_SET_ID_HERE' with the actual UUID from the above INSERT
INSERT INTO vocabulary_terms (vocabulary_set_id, term, definition, difficulty, order_index)
VALUES 
  ('YOUR_SET_ID_HERE', 'Velocity', 'The rate of change of position with respect to time', 'easy', 0),
  ('YOUR_SET_ID_HERE', 'Acceleration', 'The rate of change of velocity with respect to time', 'medium', 1),
  ('YOUR_SET_ID_HERE', 'Displacement', 'The change in position of an object', 'easy', 2),
  ('YOUR_SET_ID_HERE', 'Kinematics', 'The study of motion without considering its causes', 'hard', 3);
*/

-- ============================================================================
-- CLEANUP QUERIES (Use with caution!)
-- ============================================================================

-- Uncomment below to remove all vocabulary data (use for testing only)
/*
DELETE FROM vocabulary_terms;
DELETE FROM vocabulary_sets;
*/

