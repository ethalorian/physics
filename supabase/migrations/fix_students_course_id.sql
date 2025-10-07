-- ============================================================================
-- Fix students Table - Remove course_id NOT NULL Constraint
-- ============================================================================
-- Students should be linked to courses via course_students junction table,
-- not via a direct course_id foreign key (which only allows one course per student)

-- Make course_id nullable (since we use course_students junction table for many-to-many)
DO $$
BEGIN
  -- Check if course_id column exists on students table
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'students' 
    AND column_name = 'course_id'
  ) THEN
    -- Remove NOT NULL constraint if it exists
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'students' 
      AND column_name = 'course_id'
      AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE public.students ALTER COLUMN course_id DROP NOT NULL;
      RAISE NOTICE '✅ Removed NOT NULL constraint from students.course_id column';
    ELSE
      RAISE NOTICE 'ℹ️  students.course_id is already nullable';
    END IF;
    
    -- Optionally, we could drop the column entirely since we use junction table
    -- But let's keep it nullable for backwards compatibility
    RAISE NOTICE 'ℹ️  Keeping course_id column for backwards compatibility (students are linked via course_students table)';
  ELSE
    RAISE NOTICE 'ℹ️  students.course_id column does not exist';
  END IF;
END $$;

-- Verify the change
DO $$
DECLARE
  is_nullable_val TEXT;
BEGIN
  SELECT is_nullable INTO is_nullable_val
  FROM information_schema.columns
  WHERE table_name = 'students' 
  AND column_name = 'course_id';
  
  IF is_nullable_val = 'YES' THEN
    RAISE NOTICE '✅ students.course_id is now nullable';
  ELSIF is_nullable_val = 'NO' THEN
    RAISE WARNING '⚠️  students.course_id is still NOT NULL';
  ELSE
    RAISE NOTICE 'ℹ️  students.course_id column not found';
  END IF;
END $$;

-- Show the students table structure
SELECT 
  '📋 Students table columns:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'students' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Explain the architecture
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📚 Architecture Note:';
  RAISE NOTICE 'Students are linked to courses via the course_students junction table.';
  RAISE NOTICE 'This allows students to be enrolled in multiple courses (many-to-many).';
  RAISE NOTICE 'The course_id column on students table is kept nullable for backwards compatibility.';
  RAISE NOTICE '';
END $$;
