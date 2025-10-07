-- Add foreign key relationship between assignments and lessons tables
-- This allows proper joins in Supabase queries

-- First, check if lessons table exists
DO $$
BEGIN
  -- Check if the foreign key already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'assignments_lesson_id_fkey' 
    AND table_name = 'assignments'
  ) THEN
    -- Add foreign key constraint if it doesn't exist
    ALTER TABLE public.assignments
    ADD CONSTRAINT assignments_lesson_id_fkey
    FOREIGN KEY (lesson_id)
    REFERENCES public.lessons(id)
    ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key constraint added successfully';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END $$;

-- Create index on lesson_id for better query performance
CREATE INDEX IF NOT EXISTS idx_assignments_lesson_id 
ON public.assignments(lesson_id);

-- Verify the relationship
COMMENT ON CONSTRAINT assignments_lesson_id_fkey ON public.assignments 
IS 'Links assignments to their associated lesson for context and organization';
