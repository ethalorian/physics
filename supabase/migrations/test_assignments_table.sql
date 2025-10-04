-- Test query to verify assignments table has all required columns

-- Check if created_by column exists in assignments table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'assignments'
AND column_name = 'created_by';

-- If you see a result, created_by exists! ✓

-- Or check ALL columns in assignments table:
SELECT 'Assignments table columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'assignments'
ORDER BY ordinal_position;

-- Test insert with created_by (to make sure it works)
INSERT INTO assignments (
  title,
  description,
  questions,
  total_points,
  published,
  created_by
) VALUES (
  'Test Assignment',
  'Testing created_by column',
  '[]'::jsonb,
  0,
  false,
  'test@example.com'
) RETURNING id, title, created_by;

-- If the insert succeeds, created_by works perfectly!
-- You should see the returned row with created_by = 'test@example.com'

-- Clean up test data
DELETE FROM assignments WHERE title = 'Test Assignment';

