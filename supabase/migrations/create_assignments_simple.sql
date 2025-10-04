-- Simple Assignments Tables Migration (No Helper Functions)
-- This version avoids helper function errors

-- ==============================================
-- STEP 1: Drop existing tables (START FRESH)
-- ==============================================

DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;

-- ==============================================
-- STEP 2: Create assignments table
-- ==============================================

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_points INTEGER NOT NULL DEFAULT 0,
  lesson_id UUID,
  due_date TIMESTAMPTZ,
  published BOOLEAN DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- STEP 3: Create submissions table
-- ==============================================

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC(10, 2),
  max_score NUMERIC(10, 2),
  feedback JSONB DEFAULT '{}'::jsonb,
  rubric_grades JSONB DEFAULT '[]'::jsonb,
  status TEXT CHECK (status IN ('partial', 'submitted', 'graded')) DEFAULT 'partial',
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, user_id)
);

-- ==============================================
-- STEP 4: Create indexes
-- ==============================================

CREATE INDEX idx_assignments_created_by ON assignments(created_by);
CREATE INDEX idx_assignments_lesson_id ON assignments(lesson_id);
CREATE INDEX idx_assignments_published ON assignments(published);
CREATE INDEX idx_assignments_created_at ON assignments(created_at DESC);

CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);

CREATE INDEX idx_assignments_questions ON assignments USING GIN (questions);
CREATE INDEX idx_submissions_answers ON submissions USING GIN (answers);
CREATE INDEX idx_submissions_rubric_grades ON submissions USING GIN (rubric_grades);

-- ==============================================
-- STEP 5: Create update trigger
-- ==============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- DONE! Verify tables
-- ==============================================

SELECT 'SUCCESS: Tables created!' as status;

-- Show what was created
SELECT 'Assignments columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'assignments'
ORDER BY ordinal_position;

SELECT 'Submissions columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'submissions'
ORDER BY ordinal_position;

