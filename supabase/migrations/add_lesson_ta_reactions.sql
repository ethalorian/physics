-- Add TA reactions and key terms columns to lessons table
-- This allows saving the AI-generated TA responses along with the lesson

-- Add ta_reactions column (JSONB to store Jose and Marialys reactions)
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS ta_reactions JSONB DEFAULT NULL;

-- Add key_terms column (JSONB array to store vocabulary terms with definitions)
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS key_terms JSONB DEFAULT NULL;

-- Add check_for_understanding column (JSONB array for end-of-lesson questions)
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS check_for_understanding JSONB DEFAULT NULL;

-- Add mastery_level to track the reading level
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS mastery_level TEXT DEFAULT NULL;

-- Add metadata for generation info
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT NULL;

-- Comments for documentation
COMMENT ON COLUMN public.lessons.ta_reactions IS 'Student TA reactions from Jose and Marialys - stored as JSONB with jose and marialys keys';
COMMENT ON COLUMN public.lessons.key_terms IS 'Key vocabulary terms with definitions as JSONB array [{term, definition}]';
COMMENT ON COLUMN public.lessons.check_for_understanding IS 'End-of-lesson comprehension questions as JSONB array [{question, answer}]';
COMMENT ON COLUMN public.lessons.mastery_level IS 'Reading/mastery level of the lesson (e.g., high-school-intro, ap-physics)';
COMMENT ON COLUMN public.lessons.generation_metadata IS 'Metadata about AI generation including topic, environments, word count, etc.';

-- Create index for faster queries on mastery level
CREATE INDEX IF NOT EXISTS idx_lessons_mastery_level ON public.lessons(mastery_level);

SELECT '✓ TA reactions and related columns added to lessons table!' as status;

