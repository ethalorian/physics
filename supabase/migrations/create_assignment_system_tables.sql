-- Assignment System Tables
-- This migration creates tables to assign lessons and assignments to classes and students

-- Create lesson_assignments table
CREATE TABLE IF NOT EXISTS lesson_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  
  -- Assignment target (either course or individual students)
  course_id TEXT, -- Google Classroom course ID (optional)
  assigned_students UUID[], -- Array of student UUIDs (optional)
  
  -- Assignment details
  assigned_by TEXT NOT NULL, -- Teacher/admin user ID who made the assignment
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ, -- Optional due date
  
  -- Assignment configuration
  title TEXT, -- Override lesson title if needed
  instructions TEXT, -- Special instructions for this assignment
  estimated_time INTEGER, -- Override lesson estimated time (in minutes)
  
  -- Status and tracking
  is_active BOOLEAN DEFAULT TRUE,
  published BOOLEAN DEFAULT TRUE, -- Whether students can see this assignment
  
  -- Analytics
  total_assigned INTEGER DEFAULT 0, -- Number of students assigned
  total_started INTEGER DEFAULT 0, -- Number who started
  total_completed INTEGER DEFAULT 0, -- Number who completed
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (course_id IS NOT NULL OR assigned_students IS NOT NULL), -- Must assign to course or students
  CHECK (NOT (course_id IS NOT NULL AND assigned_students IS NOT NULL)) -- Cannot assign to both
);

-- Create assignment_assignments table (for homework assignments)
CREATE TABLE IF NOT EXISTS assignment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id TEXT NOT NULL, -- References assignment from localStorage system
  
  -- Assignment target (either course or individual students)
  course_id TEXT, -- Google Classroom course ID (optional)
  assigned_students UUID[], -- Array of student UUIDs (optional)
  
  -- Assignment details
  assigned_by TEXT NOT NULL, -- Teacher/admin user ID who made the assignment
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ, -- Optional due date
  
  -- Assignment configuration
  title TEXT, -- Override assignment title if needed
  instructions TEXT, -- Special instructions for this assignment
  max_attempts INTEGER DEFAULT 1, -- Number of attempts allowed
  time_limit INTEGER, -- Time limit in minutes (optional)
  
  -- Status and tracking
  is_active BOOLEAN DEFAULT TRUE,
  published BOOLEAN DEFAULT TRUE, -- Whether students can see this assignment
  
  -- Analytics
  total_assigned INTEGER DEFAULT 0, -- Number of students assigned
  total_started INTEGER DEFAULT 0, -- Number who started
  total_submitted INTEGER DEFAULT 0, -- Number who submitted
  total_completed INTEGER DEFAULT 0, -- Number who completed (graded)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (course_id IS NOT NULL OR assigned_students IS NOT NULL), -- Must assign to course or students
  CHECK (NOT (course_id IS NOT NULL AND assigned_students IS NOT NULL)) -- Cannot assign to both
);

-- Create student_lesson_assignments table (junction table for individual assignments)
CREATE TABLE IF NOT EXISTS student_lesson_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_assignment_id UUID NOT NULL REFERENCES lesson_assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Individual student status
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'started', 'in_progress', 'completed', 'overdue')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Progress tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_spent INTEGER DEFAULT 0, -- Total time in seconds
  last_accessed TIMESTAMPTZ,
  
  -- Grading (if applicable)
  score DECIMAL(5,2),
  max_score DECIMAL(5,2),
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(lesson_assignment_id, student_id)
);

-- Create student_assignment_assignments table (junction table for homework assignments)
CREATE TABLE IF NOT EXISTS student_assignment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_assignment_id UUID NOT NULL REFERENCES assignment_assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Individual student status
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'started', 'in_progress', 'submitted', 'graded', 'overdue')),
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  
  -- Submission tracking
  attempts_used INTEGER DEFAULT 0,
  current_submission_id TEXT, -- References submission from localStorage system
  
  -- Time tracking
  time_spent INTEGER DEFAULT 0, -- Total time in seconds
  last_accessed TIMESTAMPTZ,
  
  -- Grading
  score DECIMAL(5,2),
  max_score DECIMAL(5,2),
  percentage DECIMAL(5,2),
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(assignment_assignment_id, student_id)
);

-- Create assignment_reminders table for due date notifications
CREATE TABLE IF NOT EXISTS assignment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to assignment (either lesson or homework)
  lesson_assignment_id UUID REFERENCES lesson_assignments(id) ON DELETE CASCADE,
  assignment_assignment_id UUID REFERENCES assignment_assignments(id) ON DELETE CASCADE,
  
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Reminder details
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('due_soon', 'overdue', 'incomplete')),
  days_before_due INTEGER, -- For 'due_soon' reminders
  
  -- Status
  sent_at TIMESTAMPTZ,
  is_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (lesson_assignment_id IS NOT NULL OR assignment_assignment_id IS NOT NULL),
  CHECK (NOT (lesson_assignment_id IS NOT NULL AND assignment_assignment_id IS NOT NULL))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_assignments_lesson_id ON lesson_assignments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_assignments_course_id ON lesson_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_assignments_assigned_by ON lesson_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_lesson_assignments_due_date ON lesson_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_lesson_assignments_published ON lesson_assignments(published);

CREATE INDEX IF NOT EXISTS idx_assignment_assignments_assignment_id ON assignment_assignments(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_assignments_course_id ON assignment_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignment_assignments_assigned_by ON assignment_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_assignment_assignments_due_date ON assignment_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignment_assignments_published ON assignment_assignments(published);

CREATE INDEX IF NOT EXISTS idx_student_lesson_assignments_lesson_assignment_id ON student_lesson_assignments(lesson_assignment_id);
CREATE INDEX IF NOT EXISTS idx_student_lesson_assignments_student_id ON student_lesson_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_lesson_assignments_status ON student_lesson_assignments(status);
CREATE INDEX IF NOT EXISTS idx_student_lesson_assignments_due_date ON student_lesson_assignments(completed_at);

CREATE INDEX IF NOT EXISTS idx_student_assignment_assignments_assignment_assignment_id ON student_assignment_assignments(assignment_assignment_id);
CREATE INDEX IF NOT EXISTS idx_student_assignment_assignments_student_id ON student_assignment_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assignment_assignments_status ON student_assignment_assignments(status);
CREATE INDEX IF NOT EXISTS idx_student_assignment_assignments_submitted_at ON student_assignment_assignments(submitted_at);

CREATE INDEX IF NOT EXISTS idx_assignment_reminders_student_id ON assignment_reminders(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_reminders_lesson_assignment_id ON assignment_reminders(lesson_assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_reminders_assignment_assignment_id ON assignment_reminders(assignment_assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_reminders_sent_at ON assignment_reminders(sent_at);

-- Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_lesson_assignments_updated_at ON lesson_assignments;
CREATE TRIGGER update_lesson_assignments_updated_at 
  BEFORE UPDATE ON lesson_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignment_assignments_updated_at ON assignment_assignments;
CREATE TRIGGER update_assignment_assignments_updated_at 
  BEFORE UPDATE ON assignment_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_lesson_assignments_updated_at ON student_lesson_assignments;
CREATE TRIGGER update_student_lesson_assignments_updated_at 
  BEFORE UPDATE ON student_lesson_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_assignment_assignments_updated_at ON student_assignment_assignments;
CREATE TRIGGER update_student_assignment_assignments_updated_at 
  BEFORE UPDATE ON student_assignment_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create functions for automatic student assignment creation

-- Function to create individual student assignments when a course assignment is made
CREATE OR REPLACE FUNCTION create_student_lesson_assignments()
RETURNS TRIGGER AS $$
BEGIN
  -- If assigning to a course, create individual student assignments
  IF NEW.course_id IS NOT NULL THEN
    INSERT INTO student_lesson_assignments (lesson_assignment_id, student_id)
    SELECT NEW.id, s.id
    FROM students s
    WHERE s.course_id = NEW.course_id
      AND s.is_active = TRUE
      AND s.enrollment_state = 'ACTIVE';
    
    -- Update total_assigned count
    UPDATE lesson_assignments 
    SET total_assigned = (
      SELECT COUNT(*)
      FROM students 
      WHERE course_id = NEW.course_id 
        AND is_active = TRUE 
        AND enrollment_state = 'ACTIVE'
    )
    WHERE id = NEW.id;
  
  -- If assigning to specific students
  ELSIF NEW.assigned_students IS NOT NULL THEN
    INSERT INTO student_lesson_assignments (lesson_assignment_id, student_id)
    SELECT NEW.id, unnest(NEW.assigned_students);
    
    -- Update total_assigned count
    UPDATE lesson_assignments 
    SET total_assigned = array_length(NEW.assigned_students, 1)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create individual student assignments for homework assignments
CREATE OR REPLACE FUNCTION create_student_assignment_assignments()
RETURNS TRIGGER AS $$
BEGIN
  -- If assigning to a course, create individual student assignments
  IF NEW.course_id IS NOT NULL THEN
    INSERT INTO student_assignment_assignments (assignment_assignment_id, student_id)
    SELECT NEW.id, s.id
    FROM students s
    WHERE s.course_id = NEW.course_id
      AND s.is_active = TRUE
      AND s.enrollment_state = 'ACTIVE';
    
    -- Update total_assigned count
    UPDATE assignment_assignments 
    SET total_assigned = (
      SELECT COUNT(*)
      FROM students 
      WHERE course_id = NEW.course_id 
        AND is_active = TRUE 
        AND enrollment_state = 'ACTIVE'
    )
    WHERE id = NEW.id;
  
  -- If assigning to specific students
  ELSIF NEW.assigned_students IS NOT NULL THEN
    INSERT INTO student_assignment_assignments (assignment_assignment_id, student_id)
    SELECT NEW.id, unnest(NEW.assigned_students);
    
    -- Update total_assigned count
    UPDATE assignment_assignments 
    SET total_assigned = array_length(NEW.assigned_students, 1)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically create student assignments
DROP TRIGGER IF EXISTS trigger_create_student_lesson_assignments ON lesson_assignments;
CREATE TRIGGER trigger_create_student_lesson_assignments
  AFTER INSERT ON lesson_assignments
  FOR EACH ROW EXECUTE FUNCTION create_student_lesson_assignments();

DROP TRIGGER IF EXISTS trigger_create_student_assignment_assignments ON assignment_assignments;
CREATE TRIGGER trigger_create_student_assignment_assignments
  AFTER INSERT ON assignment_assignments
  FOR EACH ROW EXECUTE FUNCTION create_student_assignment_assignments();

-- Function to update assignment analytics
CREATE OR REPLACE FUNCTION update_lesson_assignment_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the analytics in the main lesson_assignments table
  UPDATE lesson_assignments 
  SET 
    total_started = (
      SELECT COUNT(*)
      FROM student_lesson_assignments 
      WHERE lesson_assignment_id = NEW.lesson_assignment_id
        AND status IN ('started', 'in_progress', 'completed')
    ),
    total_completed = (
      SELECT COUNT(*)
      FROM student_lesson_assignments 
      WHERE lesson_assignment_id = NEW.lesson_assignment_id
        AND status = 'completed'
    ),
    updated_at = NOW()
  WHERE id = NEW.lesson_assignment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_assignment_assignment_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the analytics in the main assignment_assignments table
  UPDATE assignment_assignments 
  SET 
    total_started = (
      SELECT COUNT(*)
      FROM student_assignment_assignments 
      WHERE assignment_assignment_id = NEW.assignment_assignment_id
        AND status IN ('started', 'in_progress', 'submitted', 'graded')
    ),
    total_submitted = (
      SELECT COUNT(*)
      FROM student_assignment_assignments 
      WHERE assignment_assignment_id = NEW.assignment_assignment_id
        AND status IN ('submitted', 'graded')
    ),
    total_completed = (
      SELECT COUNT(*)
      FROM student_assignment_assignments 
      WHERE assignment_assignment_id = NEW.assignment_assignment_id
        AND status = 'graded'
    ),
    updated_at = NOW()
  WHERE id = NEW.assignment_assignment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update analytics
DROP TRIGGER IF EXISTS trigger_update_lesson_assignment_analytics ON student_lesson_assignments;
CREATE TRIGGER trigger_update_lesson_assignment_analytics
  AFTER INSERT OR UPDATE ON student_lesson_assignments
  FOR EACH ROW EXECUTE FUNCTION update_lesson_assignment_analytics();

DROP TRIGGER IF EXISTS trigger_update_assignment_assignment_analytics ON student_assignment_assignments;
CREATE TRIGGER trigger_update_assignment_assignment_analytics
  AFTER INSERT OR UPDATE ON student_assignment_assignments
  FOR EACH ROW EXECUTE FUNCTION update_assignment_assignment_analytics();

-- Add comments for documentation
COMMENT ON TABLE lesson_assignments IS 'Assignments of lessons to classes or individual students';
COMMENT ON TABLE assignment_assignments IS 'Assignments of homework assignments to classes or individual students';
COMMENT ON TABLE student_lesson_assignments IS 'Individual student progress on assigned lessons';
COMMENT ON TABLE student_assignment_assignments IS 'Individual student progress on assigned homework assignments';
COMMENT ON TABLE assignment_reminders IS 'Reminders for upcoming or overdue assignments';

COMMENT ON COLUMN lesson_assignments.course_id IS 'Google Classroom course ID if assigning to entire class';
COMMENT ON COLUMN lesson_assignments.assigned_students IS 'Array of student UUIDs if assigning to specific students';
COMMENT ON COLUMN assignment_assignments.max_attempts IS 'Number of submission attempts allowed (default 1)';
COMMENT ON COLUMN assignment_assignments.time_limit IS 'Time limit for assignment completion in minutes';
COMMENT ON COLUMN student_assignment_assignments.attempts_used IS 'Number of submission attempts used by student';
