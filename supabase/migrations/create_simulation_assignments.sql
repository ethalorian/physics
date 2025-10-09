-- Create Simulation Assignment System Tables
-- Extends the existing assignment system with simulation-specific assignments

-- ============================================================================
-- SIMULATION ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS simulation_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
  
  -- Assignment target (either course or individual students)
  course_id TEXT, -- Google Classroom course ID
  assigned_students TEXT[], -- Array of student IDs
  
  -- Assignment details
  assigned_by TEXT NOT NULL, -- Teacher/admin email
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  
  -- Assignment configuration
  title TEXT,
  instructions TEXT,
  min_time_required INTEGER, -- Minimum time in simulation (minutes)
  requires_data_export BOOLEAN DEFAULT FALSE,
  
  -- Assessment
  rubric_id UUID REFERENCES simulation_rubrics(id) ON DELETE SET NULL,
  
  -- Status and tracking
  is_active BOOLEAN DEFAULT TRUE,
  published BOOLEAN DEFAULT TRUE,
  
  -- Analytics
  total_assigned INTEGER DEFAULT 0,
  total_started INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_submitted INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_simulation_assignments_simulation ON simulation_assignments(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_assignments_course ON simulation_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_simulation_assignments_assigned_by ON simulation_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_simulation_assignments_published ON simulation_assignments(published) WHERE published = TRUE;

-- ============================================================================
-- STUDENT SIMULATION ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_simulation_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_assignment_id UUID REFERENCES simulation_assignments(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  
  -- Individual student status
  status TEXT CHECK (status IN ('assigned', 'started', 'in_progress', 'completed', 'submitted', 'graded', 'overdue')) DEFAULT 'assigned',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  
  -- Simulation completion tracking
  simulation_completed BOOLEAN DEFAULT FALSE,
  time_spent_in_simulation INTEGER DEFAULT 0, -- seconds
  interactions_count INTEGER DEFAULT 0,
  data_exported BOOLEAN DEFAULT FALSE,
  
  -- Question responses (if assignment has questions)
  question_responses JSONB DEFAULT '[]'::jsonb,
  
  -- Time tracking
  total_time_spent INTEGER DEFAULT 0, -- Total time including questions (seconds)
  last_accessed TIMESTAMPTZ,
  
  -- Grading (Phase 1 - Standards-based)
  letter_grade TEXT CHECK (letter_grade IN ('A', 'B', 'C', 'Fail')),
  score INTEGER,
  max_score INTEGER,
  rubric_scores JSONB, -- Scores for each rubric criterion
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_sim_assignments_student ON student_simulation_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_sim_assignments_assignment ON student_simulation_assignments(simulation_assignment_id);
CREATE INDEX IF NOT EXISTS idx_student_sim_assignments_status ON student_simulation_assignments(status);
CREATE INDEX IF NOT EXISTS idx_student_sim_assignments_letter_grade ON student_simulation_assignments(letter_grade) WHERE letter_grade IS NOT NULL;

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_simulation_assignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_simulation_assignments_timestamp
  BEFORE UPDATE ON simulation_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_simulation_assignment_timestamp();

CREATE TRIGGER trigger_update_student_simulation_assignments_timestamp
  BEFORE UPDATE ON student_simulation_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_simulation_assignment_timestamp();

-- ============================================================================
-- ANALYTICS TRIGGER
-- ============================================================================

-- Update simulation assignment analytics when student status changes
CREATE OR REPLACE FUNCTION update_simulation_assignment_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update counts on simulation_assignments table
  UPDATE simulation_assignments
  SET 
    total_started = (
      SELECT COUNT(*) FROM student_simulation_assignments 
      WHERE simulation_assignment_id = NEW.simulation_assignment_id 
      AND status IN ('started', 'in_progress', 'completed', 'submitted', 'graded')
    ),
    total_completed = (
      SELECT COUNT(*) FROM student_simulation_assignments 
      WHERE simulation_assignment_id = NEW.simulation_assignment_id 
      AND simulation_completed = TRUE
    ),
    total_submitted = (
      SELECT COUNT(*) FROM student_simulation_assignments 
      WHERE simulation_assignment_id = NEW.simulation_assignment_id 
      AND status IN ('submitted', 'graded')
    )
  WHERE id = NEW.simulation_assignment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_simulation_assignment_analytics
  AFTER INSERT OR UPDATE ON student_simulation_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_simulation_assignment_analytics();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if a student has overdue assignments
CREATE OR REPLACE FUNCTION check_simulation_assignment_overdue(
  p_student_id TEXT
) RETURNS TABLE (
  assignment_id UUID,
  simulation_title TEXT,
  due_date TIMESTAMPTZ,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    s.title,
    sa.due_date,
    EXTRACT(DAY FROM NOW() - sa.due_date)::INTEGER
  FROM simulation_assignments sa
  JOIN simulations s ON s.id = sa.simulation_id
  JOIN student_simulation_assignments ssa ON ssa.simulation_assignment_id = sa.id
  WHERE ssa.student_id = p_student_id
  AND sa.due_date < NOW()
  AND ssa.status NOT IN ('completed', 'submitted', 'graded')
  AND sa.is_active = TRUE
  ORDER BY sa.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE simulation_assignments IS 'Simulation assignments created by teachers for students';
COMMENT ON TABLE student_simulation_assignments IS 'Individual student progress on simulation assignments';
COMMENT ON COLUMN student_simulation_assignments.letter_grade IS 'Standards-based grade: A, B, C, or Fail';
COMMENT ON COLUMN student_simulation_assignments.rubric_scores IS 'JSONB object with scores for each rubric criterion';
COMMENT ON FUNCTION check_simulation_assignment_overdue IS 'Returns overdue simulation assignments for a student';

-- Migration complete!
SELECT 'Simulation Assignment System Tables Created Successfully!' as status;
