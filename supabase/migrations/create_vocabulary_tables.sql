-- ============================================================================
-- CREATE VOCABULARY TABLES
-- ============================================================================
-- This migration creates tables for the vocabulary games system

-- Vocabulary Sets Table
-- Stores collections of vocabulary terms grouped by unit/lesson
CREATE TABLE IF NOT EXISTS public.vocabulary_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Set information
  name TEXT NOT NULL,
  description TEXT,
  
  -- Association with curriculum
  unit_id TEXT, -- e.g., 'unit-1', 'unit-2'
  lesson_id TEXT, -- e.g., 'lesson-1-1'
  
  -- Status
  published BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_by TEXT, -- User ID or email
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vocabulary Terms Table
-- Individual vocabulary terms within sets
CREATE TABLE IF NOT EXISTS public.vocabulary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key to vocabulary set
  vocabulary_set_id UUID NOT NULL REFERENCES public.vocabulary_sets(id) ON DELETE CASCADE,
  
  -- Term information
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  category TEXT, -- Optional categorization
  
  -- Difficulty
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  
  -- Ordering
  order_index INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vocabulary_sets_unit ON public.vocabulary_sets(unit_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_sets_lesson ON public.vocabulary_sets(lesson_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_sets_published ON public.vocabulary_sets(published);
CREATE INDEX IF NOT EXISTS idx_vocabulary_sets_created_by ON public.vocabulary_sets(created_by);

CREATE INDEX IF NOT EXISTS idx_vocabulary_terms_set ON public.vocabulary_terms(vocabulary_set_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_terms_difficulty ON public.vocabulary_terms(difficulty);
CREATE INDEX IF NOT EXISTS idx_vocabulary_terms_order ON public.vocabulary_terms(vocabulary_set_id, order_index);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vocabulary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_vocabulary_sets_updated_at 
  BEFORE UPDATE ON public.vocabulary_sets
  FOR EACH ROW 
  EXECUTE FUNCTION update_vocabulary_updated_at();

CREATE TRIGGER update_vocabulary_terms_updated_at 
  BEFORE UPDATE ON public.vocabulary_terms
  FOR EACH ROW 
  EXECUTE FUNCTION update_vocabulary_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on vocabulary tables
ALTER TABLE public.vocabulary_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_terms ENABLE ROW LEVEL SECURITY;

-- Admin and Teacher Policies: Full access
CREATE POLICY "Admins and teachers can manage vocabulary sets"
ON public.vocabulary_sets
FOR ALL
TO authenticated
USING (
  -- Allow if user is in admin or teacher list
  auth.jwt() ->> 'email' IN (
    'antoccic@fitchburg.k12.ma.us',
    'craigantocci@gmail.com'
  )
)
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    'antoccic@fitchburg.k12.ma.us',
    'craigantocci@gmail.com'
  )
);

CREATE POLICY "Admins and teachers can manage vocabulary terms"
ON public.vocabulary_terms
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vocabulary_sets
    WHERE vocabulary_sets.id = vocabulary_terms.vocabulary_set_id
    AND auth.jwt() ->> 'email' IN (
      'antoccic@fitchburg.k12.ma.us',
      'craigantocci@gmail.com'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vocabulary_sets
    WHERE vocabulary_sets.id = vocabulary_terms.vocabulary_set_id
    AND auth.jwt() ->> 'email' IN (
      'antoccic@fitchburg.k12.ma.us',
      'craigantocci@gmail.com'
    )
  )
);

-- Student Policies: Read-only access to published sets
CREATE POLICY "Students can view published vocabulary sets"
ON public.vocabulary_sets
FOR SELECT
TO authenticated
USING (published = true);

CREATE POLICY "Students can view terms from published sets"
ON public.vocabulary_terms
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vocabulary_sets
    WHERE vocabulary_sets.id = vocabulary_terms.vocabulary_set_id
    AND vocabulary_sets.published = true
  )
);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.vocabulary_sets IS 'Collections of vocabulary terms grouped by physics unit/lesson';
COMMENT ON TABLE public.vocabulary_terms IS 'Individual vocabulary terms within sets';

COMMENT ON COLUMN public.vocabulary_sets.published IS 'Whether the vocabulary set is visible to students';
COMMENT ON COLUMN public.vocabulary_sets.unit_id IS 'Physics unit (e.g., unit-1, unit-2)';
COMMENT ON COLUMN public.vocabulary_sets.lesson_id IS 'Specific lesson (e.g., lesson-1-1)';

COMMENT ON COLUMN public.vocabulary_terms.vocabulary_set_id IS 'Foreign key to vocabulary_sets table';
COMMENT ON COLUMN public.vocabulary_terms.difficulty IS 'Difficulty level for adaptive games';
COMMENT ON COLUMN public.vocabulary_terms.order_index IS 'Display order within the set';

