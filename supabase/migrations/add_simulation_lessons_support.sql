-- ============================================================================
-- ADD SIMULATION LESSONS SUPPORT TO LESSONS TABLE
-- ============================================================================
-- This migration adds fields to support simulation-based lessons
-- Safe to run - doesn't break existing video lessons

-- Add new columns for simulation lessons
ALTER TABLE public.lessons 
  ADD COLUMN IF NOT EXISTS lesson_type TEXT 
    CHECK (lesson_type IN ('video', 'simulation', 'markdown')) 
    DEFAULT 'markdown';

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS simulation_id UUID;

-- Add foreign key constraint separately (in case simulations table doesn't exist yet)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'simulations') THEN
    ALTER TABLE public.lessons
      DROP CONSTRAINT IF EXISTS lessons_simulation_id_fkey;
    ALTER TABLE public.lessons
      ADD CONSTRAINT lessons_simulation_id_fkey 
      FOREIGN KEY (simulation_id) REFERENCES public.simulations(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS embedded_questions JSONB 
    DEFAULT '[]';

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS question_timing TEXT 
    DEFAULT 'after'
    CHECK (question_timing IN ('before', 'after', 'mixed'));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_lessons_simulation_id ON public.lessons(simulation_id);
CREATE INDEX IF NOT EXISTS idx_lessons_type ON public.lessons(lesson_type);

-- Update existing lessons to mark their type
-- Video lessons have videos JSONB array with data
UPDATE public.lessons 
SET lesson_type = 'video' 
WHERE videos IS NOT NULL 
  AND jsonb_array_length(videos) > 0
  AND lesson_type = 'markdown';

-- Markdown lessons have content but no videos
UPDATE public.lessons
SET lesson_type = 'markdown'
WHERE content IS NOT NULL 
  AND (videos IS NULL OR jsonb_array_length(videos) = 0)
  AND simulation_id IS NULL
  AND lesson_type = 'markdown';

-- Make content field nullable (it's now optional for simulation lessons)
ALTER TABLE public.lessons 
  ALTER COLUMN content DROP NOT NULL;

COMMENT ON COLUMN public.lessons.lesson_type IS 'Type of lesson: video (EdPuzzle-style) or simulation (interactive)';
COMMENT ON COLUMN public.lessons.simulation_id IS 'For simulation lessons, references the simulation to display';
COMMENT ON COLUMN public.lessons.embedded_questions IS 'JSONB array of questions to show before/after simulation';
COMMENT ON COLUMN public.lessons.question_timing IS 'When to show questions: before, after, or mixed';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show summary of changes
SELECT 
  lesson_type,
  COUNT(*) as count,
  COUNT(CASE WHEN published THEN 1 END) as published_count
FROM public.lessons
GROUP BY lesson_type;

-- Show columns added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'lessons'
  AND table_schema = 'public'
  AND column_name IN ('lesson_type', 'simulation_id', 'embedded_questions', 'question_timing')
ORDER BY column_name;

-- Success message
SELECT '✓ Simulation lessons support added successfully!' as status;
SELECT '✓ Existing video lessons preserved' as status;
SELECT '✓ Ready to create simulation-based lessons' as status;

