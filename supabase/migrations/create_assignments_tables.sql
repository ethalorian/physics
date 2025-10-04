-- Migration: Create Assignments and Submissions Tables
-- Description: Move assignments from localStorage to Supabase database
-- Version: 1.0
-- Date: 2025-01-XX

-- ===============================
-- 1. ASSIGNMENTS TABLE
-- ===============================

CREATE TABLE IF NOT EXISTS assignments (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  
  -- Content
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_points INTEGER NOT NULL DEFAULT 0,
  
  -- Settings
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  published BOOLEAN DEFAULT false,
  
  -- User tracking
  created_by TEXT,  -- user email or ID from NextAuth
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================
-- 2. SUBMISSIONS TABLE
-- ===============================

CREATE TABLE IF NOT EXISTS submissions (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,  -- NextAuth user ID or email
  
  -- Student Answers
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Grading
  score NUMERIC(10, 2),
  max_score NUMERIC(10, 2),
  feedback JSONB DEFAULT '{}'::jsonb,
  rubric_grades JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status TEXT CHECK (status IN ('partial', 'submitted', 'graded')) DEFAULT 'partial',
  
  -- Timestamps
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(assignment_id, user_id)  -- One submission per user per assignment
);

-- ===============================
-- 3. INDEXES FOR PERFORMANCE
-- ===============================

-- Assignments indexes
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_lesson_id ON assignments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_assignments_published ON assignments(published);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at DESC);

-- Submissions indexes
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_user ON submissions(assignment_id, user_id);

-- GIN indexes for JSONB columns (enables fast searching within JSON)
CREATE INDEX IF NOT EXISTS idx_assignments_questions ON assignments USING GIN (questions);
CREATE INDEX IF NOT EXISTS idx_submissions_answers ON submissions USING GIN (answers);
CREATE INDEX IF NOT EXISTS idx_submissions_feedback ON submissions USING GIN (feedback);
CREATE INDEX IF NOT EXISTS idx_submissions_rubric_grades ON submissions USING GIN (rubric_grades);

-- ===============================
-- 4. TRIGGERS FOR AUTO-UPDATES
-- ===============================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to assignments table
DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to submissions table
DROP TRIGGER IF EXISTS update_submissions_updated_at ON submissions;
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===============================
-- 5. HELPER FUNCTIONS
-- ===============================

-- Function to get assignment with submission count
CREATE OR REPLACE FUNCTION get_assignment_with_stats(assignment_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  instructions TEXT,
  questions JSONB,
  total_points INTEGER,
  lesson_id UUID,
  due_date TIMESTAMPTZ,
  published BOOLEAN,
  created_by TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  submission_count BIGINT,
  submitted_count BIGINT,
  graded_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.*,
    COUNT(s.id) as submission_count,
    COUNT(s.id) FILTER (WHERE s.status = 'submitted' OR s.status = 'graded') as submitted_count,
    COUNT(s.id) FILTER (WHERE s.status = 'graded') as graded_count
  FROM assignments a
  LEFT JOIN submissions s ON s.assignment_id = a.id
  WHERE a.id = assignment_uuid
  GROUP BY a.id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate assignment statistics
CREATE OR REPLACE FUNCTION calculate_assignment_stats(assignment_uuid UUID)
RETURNS TABLE (
  total_submissions BIGINT,
  submitted_count BIGINT,
  graded_count BIGINT,
  average_score NUMERIC,
  completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_submissions,
    COUNT(*) FILTER (WHERE status IN ('submitted', 'graded'))::BIGINT as submitted_count,
    COUNT(*) FILTER (WHERE status = 'graded')::BIGINT as graded_count,
    AVG(score) FILTER (WHERE status = 'graded') as average_score,
    (COUNT(*) FILTER (WHERE status IN ('submitted', 'graded'))::NUMERIC / 
     NULLIF(COUNT(*)::NUMERIC, 0) * 100) as completion_rate
  FROM submissions
  WHERE assignment_id = assignment_uuid;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 6. ROW LEVEL SECURITY (OPTIONAL)
-- ===============================

-- Enable RLS
-- ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Note: Since we're using NextAuth.js (not Supabase Auth), 
-- we handle authorization in API routes rather than RLS.
-- If you want to enable RLS later, create policies here.

-- Example policies (commented out):
-- CREATE POLICY "Teachers can view all assignments" ON assignments
--   FOR SELECT USING (auth.role() IN ('teacher', 'admin'));

-- CREATE POLICY "Students can view published assignments" ON assignments
--   FOR SELECT USING (published = true);

-- CREATE POLICY "Students can view their own submissions" ON submissions
--   FOR SELECT USING (auth.uid() = user_id);

-- ===============================
-- 7. COMMENTS FOR DOCUMENTATION
-- ===============================

COMMENT ON TABLE assignments IS 'Stores physics assignments created by teachers';
COMMENT ON COLUMN assignments.questions IS 'JSONB array of question objects with all question types (multiple-choice, numerical, open-response, etc.)';
COMMENT ON COLUMN assignments.total_points IS 'Sum of all question points, auto-calculated on insert/update';
COMMENT ON COLUMN assignments.published IS 'Controls visibility to students - false = draft, true = published';

COMMENT ON TABLE submissions IS 'Stores student submissions for assignments';
COMMENT ON COLUMN submissions.answers IS 'JSONB object with question IDs as keys and answers as values';
COMMENT ON COLUMN submissions.feedback IS 'JSONB object with question IDs as keys and feedback strings as values';
COMMENT ON COLUMN submissions.rubric_grades IS 'JSONB array of OpenResponseGrade objects from AI grading';
COMMENT ON COLUMN submissions.status IS 'partial = in progress, submitted = completed, graded = teacher/AI graded';

-- ===============================
-- 8. SAMPLE DATA (OPTIONAL)
-- ===============================

-- Uncomment to insert sample data for testing
/*
INSERT INTO assignments (title, description, questions, total_points, published, created_by) VALUES
(
  'Newton''s Laws Quiz',
  'Test your understanding of Newton''s three laws of motion',
  '[
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "Which law states F=ma?",
      "options": ["First Law", "Second Law", "Third Law", "Law of Gravitation"],
      "correctAnswer": 1,
      "points": 5
    },
    {
      "id": "q2",
      "type": "numerical",
      "question": "A 5kg object accelerates at 2m/s². Calculate the force.",
      "correctValue": 10,
      "unit": "N",
      "points": 10
    }
  ]'::jsonb,
  15,
  true,
  'teacher@example.com'
);
*/

-- ===============================
-- 9. VERIFICATION
-- ===============================

-- Verify tables were created
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'assignments') THEN
    RAISE NOTICE 'SUCCESS: assignments table created';
  ELSE
    RAISE EXCEPTION 'ERROR: assignments table not created';
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'submissions') THEN
    RAISE NOTICE 'SUCCESS: submissions table created';
  ELSE
    RAISE EXCEPTION 'ERROR: submissions table not created';
  END IF;
END $$;

-- Show table structure
SELECT 'Assignments table structure:' as info;
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'assignments'
ORDER BY ordinal_position;

SELECT 'Submissions table structure:' as info;
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'submissions'
ORDER BY ordinal_position;

