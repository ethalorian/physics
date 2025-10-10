-- ============================================================================
-- FIX VOCABULARY TABLES - ADD MISSING PUBLISHED COLUMN AND FEATURES
-- ============================================================================
-- This migration adds the missing 'published' column and other features
-- to the existing vocabulary_sets and vocabulary_terms tables

-- ============================================================================
-- ADD MISSING PUBLISHED COLUMN TO vocabulary_sets
-- ============================================================================

-- Add published column if it doesn't exist
ALTER TABLE public.vocabulary_sets 
  ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- ADD MISSING INDEXES
-- ============================================================================

-- Indexes for vocabulary_sets
CREATE INDEX IF NOT EXISTS idx_vocabulary_sets_unit ON public.vocabulary_sets(unit_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_sets_lesson ON public.vocabulary_sets(lesson_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_sets_published ON public.vocabulary_sets(published);
CREATE INDEX IF NOT EXISTS idx_vocabulary_sets_created_by ON public.vocabulary_sets(created_by);

-- Indexes for vocabulary_terms
CREATE INDEX IF NOT EXISTS idx_vocabulary_terms_set ON public.vocabulary_terms(vocabulary_set_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_terms_difficulty ON public.vocabulary_terms(difficulty);
CREATE INDEX IF NOT EXISTS idx_vocabulary_terms_order ON public.vocabulary_terms(vocabulary_set_id, order_index);

-- ============================================================================
-- ADD UPDATE TRIGGERS IF NOT EXISTS
-- ============================================================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_vocabulary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist, then recreate
DROP TRIGGER IF EXISTS update_vocabulary_sets_updated_at ON public.vocabulary_sets;
CREATE TRIGGER update_vocabulary_sets_updated_at 
  BEFORE UPDATE ON public.vocabulary_sets
  FOR EACH ROW 
  EXECUTE FUNCTION update_vocabulary_updated_at();

DROP TRIGGER IF EXISTS update_vocabulary_terms_updated_at ON public.vocabulary_terms;
CREATE TRIGGER update_vocabulary_terms_updated_at 
  BEFORE UPDATE ON public.vocabulary_terms
  FOR EACH ROW 
  EXECUTE FUNCTION update_vocabulary_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on vocabulary tables if not already enabled
ALTER TABLE public.vocabulary_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_terms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins and teachers can manage vocabulary sets" ON public.vocabulary_sets;
DROP POLICY IF EXISTS "Admins and teachers can manage vocabulary terms" ON public.vocabulary_terms;
DROP POLICY IF EXISTS "Students can view published vocabulary sets" ON public.vocabulary_sets;
DROP POLICY IF EXISTS "Students can view terms from published sets" ON public.vocabulary_terms;

-- Create policies for admin/teacher full access
CREATE POLICY "Admins and teachers can manage vocabulary sets"
ON public.vocabulary_sets
FOR ALL
TO authenticated
USING (
  -- Check if user's email is in admin list
  auth.jwt() ->> 'email' IN (
    SELECT email FROM public.admin_emails
  )
  OR
  -- Or check user_roles table
  auth.jwt() ->> 'email' IN (
    SELECT email FROM public.user_roles WHERE role IN ('admin', 'teacher')
  )
)
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    SELECT email FROM public.admin_emails
  )
  OR
  auth.jwt() ->> 'email' IN (
    SELECT email FROM public.user_roles WHERE role IN ('admin', 'teacher')
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
    AND (
      auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_emails)
      OR
      auth.jwt() ->> 'email' IN (SELECT email FROM public.user_roles WHERE role IN ('admin', 'teacher'))
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vocabulary_sets
    WHERE vocabulary_sets.id = vocabulary_terms.vocabulary_set_id
    AND (
      auth.jwt() ->> 'email' IN (SELECT email FROM public.admin_emails)
      OR
      auth.jwt() ->> 'email' IN (SELECT email FROM public.user_roles WHERE role IN ('admin', 'teacher'))
    )
  )
);

-- Create policies for student read-only access to published sets
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
-- ADD FOREIGN KEY CONSTRAINT FOR vocabulary_terms.vocabulary_set_id
-- ============================================================================

-- The foreign key should already exist, but let's ensure it's CASCADE DELETE
-- First drop if exists, then recreate with CASCADE
ALTER TABLE public.vocabulary_terms 
  DROP CONSTRAINT IF EXISTS vocabulary_terms_vocabulary_set_id_fkey;

ALTER TABLE public.vocabulary_terms 
  ADD CONSTRAINT vocabulary_terms_vocabulary_set_id_fkey 
  FOREIGN KEY (vocabulary_set_id) 
  REFERENCES public.vocabulary_sets(id) 
  ON DELETE CASCADE;

-- ============================================================================
-- UPDATE EXISTING RECORDS (if any)
-- ============================================================================

-- Set all existing vocabulary sets to unpublished by default
-- (This is safe since the column was just added with DEFAULT FALSE)
UPDATE public.vocabulary_sets 
SET published = FALSE 
WHERE published IS NULL;

-- ============================================================================
-- VERIFY THE CHANGES
-- ============================================================================

-- Check that published column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'vocabulary_sets' 
      AND column_name = 'published'
  ) THEN
    RAISE NOTICE '✅ Published column exists in vocabulary_sets';
  ELSE
    RAISE EXCEPTION '❌ Published column NOT found in vocabulary_sets';
  END IF;
END $$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN public.vocabulary_sets.published IS 'Whether the vocabulary set is visible to students (required for games)';
COMMENT ON TABLE public.vocabulary_sets IS 'Collections of vocabulary terms grouped by physics unit/lesson';
COMMENT ON TABLE public.vocabulary_terms IS 'Individual vocabulary terms within sets';

