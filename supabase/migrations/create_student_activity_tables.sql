-- Student Activity Tracking Tables
-- This migration creates tables to track student engagement and progress

-- Create students table for roster management
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_user_id TEXT UNIQUE NOT NULL, -- Google Classroom user ID
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  profile_photo_url TEXT,
  
  -- Google Classroom specific data
  course_id TEXT NOT NULL, -- Google Classroom course ID
  enrollment_state TEXT DEFAULT 'ACTIVE' CHECK (enrollment_state IN ('ACTIVE', 'INVITED', 'DECLINED')),
  
  -- Additional student information
  grade_level TEXT,
  student_id TEXT, -- School student ID if available
  
  -- Sync tracking
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create courses table for Google Classroom course information
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_course_id TEXT UNIQUE NOT NULL, -- Google Classroom course ID
  name TEXT NOT NULL,
  section TEXT,
  description TEXT,
  room TEXT,
  owner_id TEXT NOT NULL, -- Teacher's Google user ID
  
  -- Course settings
  course_state TEXT DEFAULT 'ACTIVE' CHECK (course_state IN ('ACTIVE', 'ARCHIVED', 'PROVISIONED', 'DECLINED', 'SUSPENDED')),
  creation_time TIMESTAMPTZ,
  update_time TIMESTAMPTZ,
  
  -- Sync tracking
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  student_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student_activity table for general activity tracking
CREATE TABLE IF NOT EXISTS student_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- NextAuth user ID (email or user id)
  user_email TEXT NOT NULL, -- For easier querying and reporting
  user_name TEXT, -- Cache user name for reporting
  activity_type TEXT NOT NULL CHECK (activity_type IN ('lesson_view', 'assignment_start', 'assignment_submit', 'assignment_complete')),
  
  -- Activity-specific data
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  assignment_id TEXT, -- Assignment ID from localStorage system
  
  -- Session and engagement data
  session_duration INTEGER, -- Duration in seconds for lesson views
  page_views INTEGER DEFAULT 1, -- Number of page views in this session
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assignment_submissions table for detailed submission tracking
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id TEXT NOT NULL, -- Assignment ID from localStorage system
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  
  -- Submission details
  submission_data JSONB NOT NULL, -- Full submission object
  score DECIMAL(5,2), -- Calculated score
  max_score DECIMAL(5,2), -- Maximum possible score
  percentage DECIMAL(5,2), -- Percentage score
  
  -- Timing data
  time_started TIMESTAMPTZ,
  time_submitted TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_spent INTEGER, -- Total time spent in seconds
  
  -- Grading information
  auto_graded BOOLEAN DEFAULT FALSE,
  manually_graded BOOLEAN DEFAULT FALSE,
  graded_by TEXT, -- User ID of grader
  graded_at TIMESTAMPTZ,
  feedback TEXT,
  
  -- Question-level scores
  question_scores JSONB, -- Array of {questionId, score, maxScore, correct}
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lesson_progress table for detailed lesson tracking
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  
  -- Progress tracking
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Engagement metrics
  total_time_spent INTEGER DEFAULT 0, -- Total seconds spent
  visit_count INTEGER DEFAULT 1, -- Number of times visited
  sections_viewed TEXT[] DEFAULT '{}', -- Array of section IDs viewed
  
  -- Progress percentage (0-100)
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per user per lesson
  UNIQUE(lesson_id, user_id)
);

-- Create assignment_analytics table for aggregated assignment data
CREATE TABLE IF NOT EXISTS assignment_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id TEXT NOT NULL,
  assignment_title TEXT NOT NULL,
  
  -- Aggregate statistics
  total_assigned INTEGER DEFAULT 0, -- How many students assigned
  total_submitted INTEGER DEFAULT 0, -- How many submitted
  total_completed INTEGER DEFAULT 0, -- How many completed (graded)
  
  -- Score statistics
  avg_score DECIMAL(5,2),
  median_score DECIMAL(5,2),
  min_score DECIMAL(5,2),
  max_score DECIMAL(5,2),
  
  -- Time statistics
  avg_time_spent INTEGER, -- Average time in seconds
  median_time_spent INTEGER,
  
  -- Last updated
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(assignment_id)
);

-- Create indexes for better query performance (with IF NOT EXISTS to prevent conflicts)
CREATE INDEX IF NOT EXISTS idx_student_activity_user_id ON student_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_student_activity_user_email ON student_activity(user_email);
CREATE INDEX IF NOT EXISTS idx_student_activity_type ON student_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_student_activity_lesson_id ON student_activity(lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_activity_assignment_id ON student_activity(assignment_id);
CREATE INDEX IF NOT EXISTS idx_student_activity_created_at ON student_activity(created_at);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user_id ON assignment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user_email ON assignment_submissions(user_email);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_submitted_at ON assignment_submissions(time_submitted);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_score ON assignment_submissions(score);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_email ON lesson_progress(user_email);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_last_accessed ON lesson_progress(last_accessed);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_progress ON lesson_progress(progress_percentage);

CREATE INDEX IF NOT EXISTS idx_assignment_analytics_assignment_id ON assignment_analytics(assignment_id);

-- Students and courses table indexes
CREATE INDEX IF NOT EXISTS idx_students_google_user_id ON students(google_user_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_students_enrollment_state ON students(enrollment_state);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_last_synced ON students(last_synced_at);

CREATE INDEX IF NOT EXISTS idx_courses_google_course_id ON courses(google_course_id);
CREATE INDEX IF NOT EXISTS idx_courses_owner_id ON courses(owner_id);
CREATE INDEX IF NOT EXISTS idx_courses_course_state ON courses(course_state);

-- Create triggers for updated_at timestamps (drop if exists to prevent conflicts)
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at 
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at 
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_activity_updated_at ON student_activity;
CREATE TRIGGER update_student_activity_updated_at 
  BEFORE UPDATE ON student_activity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignment_submissions_updated_at ON assignment_submissions;
CREATE TRIGGER update_assignment_submissions_updated_at 
  BEFORE UPDATE ON assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_progress_updated_at ON lesson_progress;
CREATE TRIGGER update_lesson_progress_updated_at 
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignment_analytics_updated_at ON assignment_analytics;
CREATE TRIGGER update_assignment_analytics_updated_at 
  BEFORE UPDATE ON assignment_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for activity tracking

-- Function to record lesson view
CREATE OR REPLACE FUNCTION record_lesson_view(
  p_user_id TEXT,
  p_user_email TEXT,
  p_user_name TEXT,
  p_lesson_id UUID,
  p_session_duration INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  -- Insert activity record
  INSERT INTO student_activity (
    user_id, user_email, user_name, activity_type, lesson_id, session_duration
  ) VALUES (
    p_user_id, p_user_email, p_user_name, 'lesson_view', p_lesson_id, p_session_duration
  ) RETURNING id INTO activity_id;
  
  -- Update or insert lesson progress
  INSERT INTO lesson_progress (
    lesson_id, user_id, user_email, user_name, total_time_spent, visit_count
  ) VALUES (
    p_lesson_id, p_user_id, p_user_email, p_user_name, COALESCE(p_session_duration, 0), 1
  )
  ON CONFLICT (lesson_id, user_id) DO UPDATE SET
    last_accessed = NOW(),
    visit_count = lesson_progress.visit_count + 1,
    total_time_spent = lesson_progress.total_time_spent + COALESCE(p_session_duration, 0),
    updated_at = NOW();
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record assignment submission
CREATE OR REPLACE FUNCTION record_assignment_submission(
  p_assignment_id TEXT,
  p_user_id TEXT,
  p_user_email TEXT,
  p_user_name TEXT,
  p_submission_data JSONB,
  p_score DECIMAL DEFAULT NULL,
  p_max_score DECIMAL DEFAULT NULL,
  p_time_started TIMESTAMPTZ DEFAULT NULL,
  p_time_spent INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  submission_id UUID;
  calculated_percentage DECIMAL(5,2);
BEGIN
  -- Calculate percentage if both scores provided
  IF p_score IS NOT NULL AND p_max_score IS NOT NULL AND p_max_score > 0 THEN
    calculated_percentage := (p_score / p_max_score) * 100;
  END IF;
  
  -- Insert or update submission
  INSERT INTO assignment_submissions (
    assignment_id, user_id, user_email, user_name, submission_data,
    score, max_score, percentage, time_started, time_spent, auto_graded
  ) VALUES (
    p_assignment_id, p_user_id, p_user_email, p_user_name, p_submission_data,
    p_score, p_max_score, calculated_percentage, p_time_started, p_time_spent, 
    CASE WHEN p_score IS NOT NULL THEN TRUE ELSE FALSE END
  )
  ON CONFLICT (assignment_id, user_id) DO UPDATE SET
    submission_data = p_submission_data,
    score = COALESCE(p_score, assignment_submissions.score),
    max_score = COALESCE(p_max_score, assignment_submissions.max_score),
    percentage = COALESCE(calculated_percentage, assignment_submissions.percentage),
    time_spent = COALESCE(p_time_spent, assignment_submissions.time_spent),
    time_submitted = NOW(),
    updated_at = NOW()
  RETURNING id INTO submission_id;
  
  -- Record activity
  INSERT INTO student_activity (
    user_id, user_email, user_name, activity_type, assignment_id
  ) VALUES (
    p_user_id, p_user_email, p_user_name, 'assignment_submit', p_assignment_id
  );
  
  RETURN submission_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get student activity summary
CREATE OR REPLACE FUNCTION get_student_activity_summary(p_user_email TEXT DEFAULT NULL)
RETURNS TABLE (
  user_email TEXT,
  user_name TEXT,
  total_lessons_viewed INTEGER,
  total_assignments_submitted INTEGER,
  avg_assignment_score DECIMAL(5,2),
  last_activity TIMESTAMPTZ,
  lessons_in_progress INTEGER,
  assignments_completed INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.user_email,
    sa.user_name,
    COUNT(DISTINCT CASE WHEN sa.activity_type = 'lesson_view' THEN sa.lesson_id END)::INTEGER as total_lessons_viewed,
    COUNT(DISTINCT CASE WHEN sa.activity_type = 'assignment_submit' THEN sa.assignment_id END)::INTEGER as total_assignments_submitted,
    COALESCE(AVG(asub.percentage), 0)::DECIMAL(5,2) as avg_assignment_score,
    MAX(sa.created_at) as last_activity,
    COUNT(DISTINCT lp.lesson_id)::INTEGER as lessons_in_progress,
    COUNT(DISTINCT CASE WHEN asub.score IS NOT NULL THEN asub.assignment_id END)::INTEGER as assignments_completed
  FROM student_activity sa
  LEFT JOIN assignment_submissions asub ON sa.user_email = asub.user_email
  LEFT JOIN lesson_progress lp ON sa.user_email = lp.user_email AND lp.progress_percentage > 0 AND lp.completed_at IS NULL
  WHERE (p_user_email IS NULL OR sa.user_email = p_user_email)
  GROUP BY sa.user_email, sa.user_name
  ORDER BY last_activity DESC;
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint for assignment submissions (one per user per assignment)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_assignment_user'
  ) THEN
    ALTER TABLE assignment_submissions ADD CONSTRAINT unique_assignment_user 
      UNIQUE(assignment_id, user_id);
  END IF;
END $$;

-- Functions for roster management

-- Function to sync course from Google Classroom
CREATE OR REPLACE FUNCTION sync_course(
  p_google_course_id TEXT,
  p_name TEXT,
  p_section TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_room TEXT DEFAULT NULL,
  p_owner_id TEXT DEFAULT NULL,
  p_course_state TEXT DEFAULT 'ACTIVE',
  p_creation_time TIMESTAMPTZ DEFAULT NULL,
  p_update_time TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  course_uuid UUID;
BEGIN
  -- Insert or update course
  INSERT INTO courses (
    google_course_id, name, section, description, room, owner_id,
    course_state, creation_time, update_time, last_synced_at
  ) VALUES (
    p_google_course_id, p_name, p_section, p_description, p_room, p_owner_id,
    p_course_state, p_creation_time, p_update_time, NOW()
  )
  ON CONFLICT (google_course_id) DO UPDATE SET
    name = p_name,
    section = COALESCE(p_section, courses.section),
    description = COALESCE(p_description, courses.description),
    room = COALESCE(p_room, courses.room),
    owner_id = COALESCE(p_owner_id, courses.owner_id),
    course_state = p_course_state,
    creation_time = COALESCE(p_creation_time, courses.creation_time),
    update_time = COALESCE(p_update_time, courses.update_time),
    last_synced_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO course_uuid;
  
  RETURN course_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to sync student from Google Classroom
CREATE OR REPLACE FUNCTION sync_student(
  p_google_user_id TEXT,
  p_email TEXT,
  p_name TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_profile_photo_url TEXT DEFAULT NULL,
  p_course_id TEXT DEFAULT NULL,
  p_enrollment_state TEXT DEFAULT 'ACTIVE'
)
RETURNS UUID AS $$
DECLARE
  student_uuid UUID;
BEGIN
  -- Insert or update student
  INSERT INTO students (
    google_user_id, email, name, first_name, last_name, 
    profile_photo_url, course_id, enrollment_state, last_synced_at
  ) VALUES (
    p_google_user_id, p_email, p_name, p_first_name, p_last_name,
    p_profile_photo_url, p_course_id, p_enrollment_state, NOW()
  )
  ON CONFLICT (google_user_id) DO UPDATE SET
    email = p_email,
    name = p_name,
    first_name = COALESCE(p_first_name, students.first_name),
    last_name = COALESCE(p_last_name, students.last_name),
    profile_photo_url = COALESCE(p_profile_photo_url, students.profile_photo_url),
    course_id = COALESCE(p_course_id, students.course_id),
    enrollment_state = p_enrollment_state,
    last_synced_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO student_uuid;
  
  RETURN student_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get students for a course
CREATE OR REPLACE FUNCTION get_course_students(p_course_id TEXT)
RETURNS TABLE (
  id UUID,
  google_user_id TEXT,
  email TEXT,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  profile_photo_url TEXT,
  enrollment_state TEXT,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.google_user_id,
    s.email,
    s.name,
    s.first_name,
    s.last_name,
    s.profile_photo_url,
    s.enrollment_state,
    s.last_synced_at,
    s.is_active
  FROM students s
  WHERE s.course_id = p_course_id 
    AND s.is_active = TRUE
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql;

-- Function to update student count for courses
CREATE OR REPLACE FUNCTION update_course_student_counts()
RETURNS void AS $$
BEGIN
  UPDATE courses 
  SET student_count = (
    SELECT COUNT(*)
    FROM students 
    WHERE students.course_id = courses.google_course_id 
      AND students.is_active = TRUE 
      AND students.enrollment_state = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql;
