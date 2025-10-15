-- ============================================================================
-- UNIFIED ASSIGNMENT HUB - Global Assignment Management System
-- ============================================================================
-- This migration creates a unified system for assigning and tracking ALL types
-- of content: lessons, homework assignments, vocabulary sets, and simulations

-- ============================================================================
-- UNIFIED ASSIGNMENTS TABLE
-- ============================================================================
-- Central table that represents ANY type of assignment
CREATE TABLE IF NOT EXISTS unified_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Assignment type and reference
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('lesson', 'homework', 'vocabulary', 'simulation', 'simulation_embedded')),
  reference_id TEXT NOT NULL, -- ID of the actual content (lesson.id, assignment.id, etc.)
  
  -- Assignment details
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  
  -- Target (course or specific students)
  course_id TEXT, -- Google Classroom course ID
  assigned_students TEXT[], -- Array of student IDs (if not assigning to whole course)
  
  -- Scheduling
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  available_from TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  closes_at TIMESTAMPTZ, -- Hard deadline (no submissions after)
  
  -- Configuration
  max_attempts INTEGER DEFAULT 1,
  time_limit INTEGER, -- Minutes (null = no limit)
  allow_late_submission BOOLEAN DEFAULT true,
  requires_completion BOOLEAN DEFAULT true, -- Whether this is required
  
  -- Grading
  max_score INTEGER,
  weight DECIMAL(5,2) DEFAULT 1.0, -- Weight for grade calculation (0-100)
  
  -- Status
  published BOOLEAN DEFAULT false,
  assigned_by TEXT NOT NULL, -- Teacher email
  
  -- Analytics (auto-updated by triggers)
  total_assigned INTEGER DEFAULT 0,
  total_started INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_submitted INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  average_time_spent INTEGER, -- Seconds
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STUDENT ASSIGNMENT PROGRESS TABLE
-- ============================================================================
-- Tracks individual student progress on any assignment type
CREATE TABLE IF NOT EXISTS student_assignment_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unified_assignment_id UUID REFERENCES unified_assignments(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_email TEXT NOT NULL,
  
  -- Progress tracking
  status TEXT CHECK (status IN ('assigned', 'started', 'in_progress', 'completed', 'submitted', 'graded', 'overdue', 'late_submitted')) DEFAULT 'assigned',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Time tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  first_viewed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  time_spent INTEGER DEFAULT 0, -- Total seconds spent
  
  -- Attempts
  attempt_number INTEGER DEFAULT 1,
  attempts_used INTEGER DEFAULT 0,
  
  -- Grading
  score DECIMAL(10,2),
  max_score INTEGER,
  percentage DECIMAL(5,2),
  letter_grade TEXT,
  rubric_scores JSONB, -- Detailed rubric scores
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by TEXT,
  
  -- Submission data (flexible JSONB for different assignment types)
  submission_data JSONB, -- Answers, responses, game data, etc.
  
  -- Flags
  is_late BOOLEAN DEFAULT false,
  is_excused BOOLEAN DEFAULT false,
  needs_attention BOOLEAN DEFAULT false, -- Flagged by teacher
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(unified_assignment_id, student_id, attempt_number)
);

-- ============================================================================
-- ASSIGNMENT TAGS TABLE (for organization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assignment_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unified_assignment_id UUID REFERENCES unified_assignments(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  tag_category TEXT, -- e.g., 'unit', 'topic', 'standard'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(unified_assignment_id, tag_name)
);

-- ============================================================================
-- ASSIGNMENT COMMENTS TABLE (for teacher-student communication)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assignment_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_progress_id UUID REFERENCES student_assignment_progress(id) ON DELETE CASCADE,
  commenter_email TEXT NOT NULL,
  commenter_name TEXT,
  comment_text TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false, -- Visible only to teachers
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Unique constraint: prevent duplicate course assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_unified_assignments_unique_course
ON unified_assignments(assignment_type, reference_id, course_id)
WHERE course_id IS NOT NULL;

-- Note: Cannot create unique constraint on assigned_students array
-- The application layer and migration scripts handle duplicate prevention

-- Unified assignments indexes
CREATE INDEX IF NOT EXISTS idx_unified_assignments_type ON unified_assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_unified_assignments_reference ON unified_assignments(reference_id);
CREATE INDEX IF NOT EXISTS idx_unified_assignments_course ON unified_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_unified_assignments_assigned_by ON unified_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_unified_assignments_published ON unified_assignments(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_unified_assignments_due_date ON unified_assignments(due_date) WHERE due_date IS NOT NULL;

-- Student progress indexes
CREATE INDEX IF NOT EXISTS idx_student_progress_assignment ON student_assignment_progress(unified_assignment_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_student ON student_assignment_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_email ON student_assignment_progress(student_email);
CREATE INDEX IF NOT EXISTS idx_student_progress_status ON student_assignment_progress(status);
CREATE INDEX IF NOT EXISTS idx_student_progress_submitted ON student_assignment_progress(submitted_at) WHERE submitted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_student_progress_needs_attention ON student_assignment_progress(needs_attention) WHERE needs_attention = true;

-- Tags and comments indexes
CREATE INDEX IF NOT EXISTS idx_assignment_tags_assignment ON assignment_tags(unified_assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_tags_name ON assignment_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_assignment_comments_progress ON assignment_comments(student_progress_id);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATING
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_assignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_unified_assignments_timestamp
  BEFORE UPDATE ON unified_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_timestamp();

CREATE TRIGGER trigger_update_student_progress_timestamp
  BEFORE UPDATE ON student_assignment_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_timestamp();

-- Auto-update analytics on unified_assignments when student progress changes
CREATE OR REPLACE FUNCTION update_assignment_analytics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE unified_assignments
  SET 
    total_started = (
      SELECT COUNT(DISTINCT student_id) 
      FROM student_assignment_progress 
      WHERE unified_assignment_id = NEW.unified_assignment_id 
      AND status IN ('started', 'in_progress', 'completed', 'submitted', 'graded')
    ),
    total_completed = (
      SELECT COUNT(DISTINCT student_id) 
      FROM student_assignment_progress 
      WHERE unified_assignment_id = NEW.unified_assignment_id 
      AND status IN ('completed', 'submitted', 'graded')
    ),
    total_submitted = (
      SELECT COUNT(DISTINCT student_id) 
      FROM student_assignment_progress 
      WHERE unified_assignment_id = NEW.unified_assignment_id 
      AND status IN ('submitted', 'graded')
    ),
    average_score = (
      SELECT AVG(percentage) 
      FROM student_assignment_progress 
      WHERE unified_assignment_id = NEW.unified_assignment_id 
      AND percentage IS NOT NULL
    ),
    average_time_spent = (
      SELECT AVG(time_spent) 
      FROM student_assignment_progress 
      WHERE unified_assignment_id = NEW.unified_assignment_id 
      AND time_spent > 0
    )
  WHERE id = NEW.unified_assignment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_assignment_analytics
  AFTER INSERT OR UPDATE ON student_assignment_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_analytics();

-- Auto-detect overdue assignments
CREATE OR REPLACE FUNCTION mark_overdue_assignments()
RETURNS void AS $$
BEGIN
  UPDATE student_assignment_progress
  SET status = 'overdue'
  WHERE unified_assignment_id IN (
    SELECT id FROM unified_assignments
    WHERE due_date < NOW()
    AND published = true
  )
  AND status IN ('assigned', 'started', 'in_progress')
  AND NOT is_excused;
END;
$$ LANGUAGE plpgsql;

-- Create student assignment records when a new unified assignment is created
CREATE OR REPLACE FUNCTION create_student_assignment_records()
RETURNS TRIGGER AS $$
DECLARE
  student_record RECORD;
BEGIN
  -- If assigning to a course, create records for all students in that course
  IF NEW.course_id IS NOT NULL THEN
    FOR student_record IN 
      SELECT s.id, s.email, s.name
      FROM students s
      JOIN course_students cs ON cs.student_id = s.id
      JOIN courses c ON c.id = cs.course_id
      WHERE c.google_course_id = NEW.course_id
      AND cs.enrollment_state = 'ACTIVE'
    LOOP
      INSERT INTO student_assignment_progress (
        unified_assignment_id,
        student_id,
        student_email,
        status,
        max_score
      ) VALUES (
        NEW.id,
        student_record.id::TEXT,
        student_record.email,
        'assigned',
        NEW.max_score
      ) ON CONFLICT (unified_assignment_id, student_id, attempt_number) DO NOTHING;
    END LOOP;
    
    -- Update total_assigned count
    UPDATE unified_assignments
    SET total_assigned = (
      SELECT COUNT(*) FROM student_assignment_progress
      WHERE unified_assignment_id = NEW.id
    )
    WHERE id = NEW.id;
  END IF;
  
  -- If assigning to specific students
  IF NEW.assigned_students IS NOT NULL AND array_length(NEW.assigned_students, 1) > 0 THEN
    FOR student_record IN 
      SELECT s.id, s.email, s.name
      FROM students s
      WHERE s.id::TEXT = ANY(NEW.assigned_students)
    LOOP
      INSERT INTO student_assignment_progress (
        unified_assignment_id,
        student_id,
        student_email,
        status,
        max_score
      ) VALUES (
        NEW.id,
        student_record.id::TEXT,
        student_record.email,
        'assigned',
        NEW.max_score
      ) ON CONFLICT (unified_assignment_id, student_id, attempt_number) DO NOTHING;
    END LOOP;
    
    -- Update total_assigned count
    UPDATE unified_assignments
    SET total_assigned = array_length(NEW.assigned_students, 1)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_student_records
  AFTER INSERT ON unified_assignments
  FOR EACH ROW
  WHEN (NEW.published = true)
  EXECUTE FUNCTION create_student_assignment_records();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get all assignments for a student across all types
CREATE OR REPLACE FUNCTION get_student_assignments(
  p_student_id TEXT,
  p_status_filter TEXT DEFAULT NULL,
  p_assignment_type_filter TEXT DEFAULT NULL
) RETURNS TABLE (
  assignment_id UUID,
  assignment_type TEXT,
  title TEXT,
  description TEXT,
  due_date TIMESTAMPTZ,
  status TEXT,
  progress_percentage INTEGER,
  score DECIMAL(10,2),
  max_score INTEGER,
  percentage DECIMAL(5,2),
  time_spent INTEGER,
  is_late BOOLEAN,
  last_accessed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id,
    ua.assignment_type,
    ua.title,
    ua.description,
    ua.due_date,
    sap.status,
    sap.progress_percentage,
    sap.score,
    sap.max_score,
    sap.percentage,
    sap.time_spent,
    sap.is_late,
    sap.last_accessed_at
  FROM unified_assignments ua
  JOIN student_assignment_progress sap ON sap.unified_assignment_id = ua.id
  WHERE sap.student_id = p_student_id
  AND (p_status_filter IS NULL OR sap.status = p_status_filter)
  AND (p_assignment_type_filter IS NULL OR ua.assignment_type = p_assignment_type_filter)
  AND ua.published = true
  ORDER BY 
    CASE WHEN ua.due_date IS NULL THEN 1 ELSE 0 END,
    ua.due_date ASC,
    ua.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Get assignment overview for teacher
CREATE OR REPLACE FUNCTION get_assignment_overview(
  p_teacher_email TEXT,
  p_course_id TEXT DEFAULT NULL
) RETURNS TABLE (
  assignment_id UUID,
  assignment_type TEXT,
  title TEXT,
  due_date TIMESTAMPTZ,
  course_id TEXT,
  total_assigned INTEGER,
  total_started INTEGER,
  total_completed INTEGER,
  total_submitted INTEGER,
  average_score DECIMAL(5,2),
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id,
    ua.assignment_type,
    ua.title,
    ua.due_date,
    ua.course_id,
    ua.total_assigned,
    ua.total_started,
    ua.total_completed,
    ua.total_submitted,
    ua.average_score,
    ua.created_at
  FROM unified_assignments ua
  WHERE ua.assigned_by = p_teacher_email
  AND (p_course_id IS NULL OR ua.course_id = p_course_id)
  AND ua.published = true
  ORDER BY ua.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE unified_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assignment_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_comments ENABLE ROW LEVEL SECURITY;

-- Admins and teachers can manage all assignments
CREATE POLICY "Admins and teachers can manage unified assignments"
ON unified_assignments
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'antoccic@fitchburg.k12.ma.us',
    'craigantocci@gmail.com'
  )
);

-- Students can view their assigned assignments
CREATE POLICY "Students can view assigned assignments"
ON unified_assignments
FOR SELECT
TO authenticated
USING (
  published = true
  AND EXISTS (
    SELECT 1 FROM student_assignment_progress
    WHERE student_assignment_progress.unified_assignment_id = unified_assignments.id
    AND student_assignment_progress.student_email = auth.jwt() ->> 'email'
  )
);

-- Admins and teachers can view all student progress
CREATE POLICY "Admins and teachers can view all student progress"
ON student_assignment_progress
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'antoccic@fitchburg.k12.ma.us',
    'craigantocci@gmail.com'
  )
);

-- Admins and teachers can update student progress (for grading)
CREATE POLICY "Admins and teachers can update student progress"
ON student_assignment_progress
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'antoccic@fitchburg.k12.ma.us',
    'craigantocci@gmail.com'
  )
);

-- Students can view their own progress
CREATE POLICY "Students can view own progress"
ON student_assignment_progress
FOR SELECT
TO authenticated
USING (student_email = auth.jwt() ->> 'email');

-- Students can update their own in-progress assignments
CREATE POLICY "Students can update own progress"
ON student_assignment_progress
FOR UPDATE
TO authenticated
USING (
  student_email = auth.jwt() ->> 'email'
  AND status IN ('assigned', 'started', 'in_progress')
);

-- Tags policies
CREATE POLICY "Admins and teachers can manage tags"
ON assignment_tags
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'antoccic@fitchburg.k12.ma.us',
    'craigantocci@gmail.com'
  )
);

-- Comments policies
CREATE POLICY "Authenticated users can view comments"
ON assignment_comments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON assignment_comments
FOR INSERT
TO authenticated
WITH CHECK (commenter_email = auth.jwt() ->> 'email');

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE unified_assignments IS 'Central table for all assignment types (lessons, homework, vocabulary, simulations)';
COMMENT ON TABLE student_assignment_progress IS 'Tracks individual student progress on any assignment type';
COMMENT ON TABLE assignment_tags IS 'Tags for organizing and filtering assignments';
COMMENT ON TABLE assignment_comments IS 'Teacher-student comments on assignments';

COMMENT ON COLUMN unified_assignments.assignment_type IS 'Type: lesson, homework, vocabulary, simulation, simulation_embedded';
COMMENT ON COLUMN unified_assignments.reference_id IS 'ID of the actual content item';
COMMENT ON COLUMN unified_assignments.weight IS 'Weight for grade calculation (0-100)';

COMMENT ON FUNCTION get_student_assignments IS 'Returns all assignments for a student with filtering';
COMMENT ON FUNCTION get_assignment_overview IS 'Returns assignment overview for teacher with analytics';
COMMENT ON FUNCTION mark_overdue_assignments IS 'Marks assignments as overdue based on due_date';

-- Migration complete!
SELECT 'Unified Assignment Hub Tables Created Successfully!' as status;

