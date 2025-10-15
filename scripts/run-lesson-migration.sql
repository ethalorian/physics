-- ============================================================================
-- SAFE MIGRATION - ONLY ADDS MISSING COLUMNS
-- ============================================================================
-- This is safe to run - it only adds columns if they don't exist
-- Your database already has most of these, so this will do nothing

-- Ensure all required columns exist
ALTER TABLE public.lessons 
  ADD COLUMN IF NOT EXISTS lesson_type TEXT 
    CHECK (lesson_type IN ('video', 'simulation', 'markdown')) 
    DEFAULT 'markdown';

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS simulation_id UUID;

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS embedded_questions JSONB 
    DEFAULT '[]';

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS question_timing TEXT 
    DEFAULT 'after'
    CHECK (question_timing IN ('before', 'after', 'mixed'));

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]';

-- Add indexes for better performance (safe if they exist)
CREATE INDEX IF NOT EXISTS idx_lessons_simulation_id ON public.lessons(simulation_id);
CREATE INDEX IF NOT EXISTS idx_lessons_type ON public.lessons(lesson_type);
CREATE INDEX IF NOT EXISTS idx_lessons_unit ON public.lessons(unit);
CREATE INDEX IF NOT EXISTS idx_lessons_published ON public.lessons(published);

-- Success message
SELECT '✓ All columns verified! Your database is ready.' as status;
SELECT 'Now refresh your browser with Cmd+Shift+R' as next_step;
