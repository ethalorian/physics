-- ============================================================================
-- Fix owner_id Column Constraint
-- ============================================================================
-- Makes owner_id nullable since we're using teacher_email to track the teacher

-- Make owner_id nullable (since we use teacher_email instead)
DO $$
BEGIN
  -- Check if owner_id column exists and is NOT NULL
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'courses' 
    AND column_name = 'owner_id'
    AND is_nullable = 'NO'
  ) THEN
    -- Remove NOT NULL constraint
    ALTER TABLE public.courses ALTER COLUMN owner_id DROP NOT NULL;
    RAISE NOTICE '✅ Removed NOT NULL constraint from owner_id column';
  ELSE
    RAISE NOTICE 'ℹ️  owner_id column is already nullable or does not exist';
  END IF;
END $$;

-- Verify the change
DO $$
DECLARE
  is_nullable_val TEXT;
BEGIN
  SELECT is_nullable INTO is_nullable_val
  FROM information_schema.columns
  WHERE table_name = 'courses' 
  AND column_name = 'owner_id';
  
  IF is_nullable_val = 'YES' THEN
    RAISE NOTICE '✅ owner_id is now nullable';
  ELSIF is_nullable_val = 'NO' THEN
    RAISE WARNING '⚠️  owner_id is still NOT NULL';
  ELSE
    RAISE NOTICE 'ℹ️  owner_id column not found';
  END IF;
END $$;

-- Show the current courses table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'courses' 
AND table_schema = 'public'
ORDER BY ordinal_position;
