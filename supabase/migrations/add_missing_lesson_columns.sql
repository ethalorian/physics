-- ============================================================================
-- ADD MISSING LESSON COLUMNS FOR RECENT FEATURES
-- ============================================================================
-- This migration adds columns that the code expects but are missing from the schema:
-- 1. video_url - For storing individual video URLs (separate from videos JSONB array)
-- 2. created_by - For tracking who created the lesson
-- 3. prerequisites - For listing prerequisite knowledge
-- 4. difficulty - For lesson difficulty level

-- ============================================================================
-- LESSONS TABLE - ADD MISSING COLUMNS
-- ============================================================================

-- Add video_url column for individual video lessons
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN public.lessons.video_url IS 'YouTube or other video URL for video-type lessons';

-- Add created_by column for tracking lesson creator
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS created_by TEXT;

COMMENT ON COLUMN public.lessons.created_by IS 'Email of the teacher/admin who created the lesson';

-- Add prerequisites column for listing prerequisite knowledge
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS prerequisites TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.lessons.prerequisites IS 'Array of prerequisite knowledge/lessons';

-- Add difficulty column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lessons' 
    AND column_name = 'difficulty'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.lessons
      ADD COLUMN difficulty TEXT DEFAULT 'intermediate'
      CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));
  END IF;
END $$;

COMMENT ON COLUMN public.lessons.difficulty IS 'Lesson difficulty level: beginner, intermediate, advanced';

-- Create index on created_by for query performance
CREATE INDEX IF NOT EXISTS idx_lessons_created_by ON public.lessons(created_by);

-- Create index on difficulty for filtering
CREATE INDEX IF NOT EXISTS idx_lessons_difficulty ON public.lessons(difficulty);

-- ============================================================================
-- QUESTION_BANK TABLE - ADD SCENARIO IMAGE SUPPORT
-- ============================================================================
-- The question editor allows adding AI-generated scenario images to questions
-- This is stored in question_data JSONB, but let's ensure it's documented

COMMENT ON COLUMN public.question_bank.question_data IS 
  'Full question data including: type, question text, options, correctAnswer, points, explanation, scenarioImage (base64/URL), rubric, and type-specific fields';

-- ============================================================================
-- VIDEO_QUESTION_RESPONSES - ADD MISSING INDEX
-- ============================================================================
-- Add composite index for better query performance on video question responses
CREATE INDEX IF NOT EXISTS idx_video_question_responses_user_lesson 
  ON public.video_question_responses(user_id, lesson_id);

CREATE INDEX IF NOT EXISTS idx_video_question_responses_video_question 
  ON public.video_question_responses(video_id, question_id);

-- ============================================================================
-- LESSON_PROGRESS - ADD MISSING INDEX
-- ============================================================================
-- Add index for user lesson progress lookups
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson 
  ON public.lesson_progress(user_id, lesson_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show the updated lessons table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'lessons'
  AND table_schema = 'public'
  AND column_name IN ('video_url', 'created_by', 'prerequisites', 'difficulty')
ORDER BY column_name;

-- Success message
SELECT '✓ Missing lesson columns added successfully!' as status;
SELECT '✓ Indexes created for better performance' as status;

