-- Complete Database Setup for Physics Classroom
-- This migration creates all necessary tables in the correct order
-- Run this ONCE to set up your entire database

-- ===============================
-- 1. UTILITY FUNCTIONS (First)
-- ===============================

-- Function to update updated_at timestamp (used by all tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 2. CORE CURRICULUM TABLES
-- ===============================

-- Create units table (physics curriculum units)
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lessons table (the main missing table)
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  unit TEXT NOT NULL, -- References units.id but not enforced for flexibility
  lesson_number INTEGER NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  
  -- Video support
  videos JSONB DEFAULT '[]'::jsonb,
  estimated_time INTEGER, -- in minutes
  objectives TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================
-- 3. QUESTION BANK SYSTEM
-- ===============================

-- Create question_bank table
CREATE TABLE IF NOT EXISTS question_bank (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  question_data JSONB NOT NULL, -- Stores the full question object
  unit_id TEXT REFERENCES units(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL,
  question_text TEXT NOT NULL, -- Extracted for easier searching
  points INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topics TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  cognitive_level TEXT CHECK (cognitive_level IN ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create')),
  estimated_time INTEGER, -- in minutes
  usage_count INTEGER DEFAULT 0,
  created_by TEXT, -- user_id of creator
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create question_usage_log table for tracking usage
CREATE TABLE IF NOT EXISTS question_usage_log (
  id SERIAL PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  assignment_id TEXT,
  user_id TEXT,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================
-- 4. VOCABULARY SYSTEM
-- ===============================

-- Vocabulary sets table
CREATE TABLE IF NOT EXISTS vocabulary_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  created_by TEXT, -- user_id of creator
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vocabulary terms table
CREATE TABLE IF NOT EXISTS vocabulary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vocabulary_set_id UUID NOT NULL REFERENCES vocabulary_sets(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  category TEXT, -- Optional categorization
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  order_index INTEGER DEFAULT 0, -- For ordering within a set
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vocabulary usage tracking
CREATE TABLE IF NOT EXISTS vocabulary_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vocabulary_set_id UUID NOT NULL REFERENCES vocabulary_sets(id) ON DELETE CASCADE,
  assignment_id TEXT,
  question_id TEXT,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================
-- 5. STUDENT ACTIVITY TRACKING
-- ===============================

-- Create student_activity table for general activity tracking
CREATE TABLE IF NOT EXISTS student_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('lesson_view', 'assignment_start', 'assignment_submit', 'assignment_complete')),
  
  -- Activity-specific data
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  assignment_id TEXT,
  
  -- Session and engagement data
  session_duration INTEGER, -- Duration in seconds for lesson views
  page_views INTEGER DEFAULT 1,
  
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
  assignment_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  
  -- Submission details
  submission_data JSONB NOT NULL,
  score DECIMAL(5,2),
  max_score DECIMAL(5,2),
  percentage DECIMAL(5,2),
  
  -- Timing data
  time_started TIMESTAMPTZ,
  time_submitted TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_spent INTEGER, -- Total time spent in seconds
  
  -- Grading information
  auto_graded BOOLEAN DEFAULT FALSE,
  manually_graded BOOLEAN DEFAULT FALSE,
  graded_by TEXT,
  graded_at TIMESTAMPTZ,
  feedback TEXT,
  
  -- Question-level scores
  question_scores JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per user per assignment
  UNIQUE(assignment_id, user_id)
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
  total_time_spent INTEGER DEFAULT 0,
  visit_count INTEGER DEFAULT 1,
  sections_viewed TEXT[] DEFAULT '{}',
  
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
  assignment_id TEXT NOT NULL UNIQUE,
  assignment_title TEXT NOT NULL,
  
  -- Aggregate statistics
  total_assigned INTEGER DEFAULT 0,
  total_submitted INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  
  -- Score statistics
  avg_score DECIMAL(5,2),
  median_score DECIMAL(5,2),
  min_score DECIMAL(5,2),
  max_score DECIMAL(5,2),
  
  -- Time statistics
  avg_time_spent INTEGER,
  median_time_spent INTEGER,
  
  -- Last updated
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================
-- 6. ROSTER MANAGEMENT (Google Classroom)
-- ===============================

-- Create courses table for Google Classroom course information
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_course_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  section TEXT,
  description TEXT,
  room TEXT,
  owner_id TEXT NOT NULL,
  
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

-- Create students table for roster management
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_user_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  profile_photo_url TEXT,
  
  -- Google Classroom specific data
  course_id TEXT NOT NULL,
  enrollment_state TEXT DEFAULT 'ACTIVE' CHECK (enrollment_state IN ('ACTIVE', 'INVITED', 'DECLINED')),
  
  -- Additional student information
  grade_level TEXT,
  student_id TEXT,
  
  -- Sync tracking
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================
-- 7. INDEXES FOR PERFORMANCE
-- ===============================

-- Units indexes
CREATE INDEX IF NOT EXISTS idx_units_order ON units(order_index);

-- Lessons indexes
CREATE INDEX IF NOT EXISTS idx_lessons_slug ON lessons(slug);
CREATE INDEX IF NOT EXISTS idx_lessons_unit ON lessons(unit);
CREATE INDEX IF NOT EXISTS idx_lessons_lesson_number ON lessons(lesson_number);
CREATE INDEX IF NOT EXISTS idx_lessons_published ON lessons(published);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons(created_at);
CREATE INDEX IF NOT EXISTS idx_lessons_videos ON lessons USING GIN (videos);
CREATE INDEX IF NOT EXISTS idx_lessons_objectives ON lessons USING GIN (objectives);

-- Question bank indexes
CREATE INDEX IF NOT EXISTS idx_question_bank_unit_id ON question_bank(unit_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_lesson_id ON question_bank(lesson_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_question_type ON question_bank(question_type);
CREATE INDEX IF NOT EXISTS idx_question_bank_difficulty ON question_bank(difficulty);
CREATE INDEX IF NOT EXISTS idx_question_bank_created_by ON question_bank(created_by);
CREATE INDEX IF NOT EXISTS idx_question_bank_question_text ON question_bank USING gin(to_tsvector('english', question_text));
CREATE INDEX IF NOT EXISTS idx_question_bank_topics ON question_bank USING gin(topics);
CREATE INDEX IF NOT EXISTS idx_question_bank_tags ON question_bank USING gin(tags);

-- Vocabulary indexes
CREATE INDEX IF NOT EXISTS idx_vocabulary_sets_unit ON vocabulary_sets(unit_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_sets_lesson ON vocabulary_sets(lesson_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_sets_created_by ON vocabulary_sets(created_by);
CREATE INDEX IF NOT EXISTS idx_vocabulary_terms_set_id ON vocabulary_terms(vocabulary_set_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_terms_difficulty ON vocabulary_terms(difficulty);
CREATE INDEX IF NOT EXISTS idx_vocabulary_usage_set_id ON vocabulary_usage(vocabulary_set_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_usage_assignment ON vocabulary_usage(assignment_id);

-- Student activity indexes
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

-- Roster indexes
CREATE INDEX IF NOT EXISTS idx_students_google_user_id ON students(google_user_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_students_enrollment_state ON students(enrollment_state);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_last_synced ON students(last_synced_at);

CREATE INDEX IF NOT EXISTS idx_courses_google_course_id ON courses(google_course_id);
CREATE INDEX IF NOT EXISTS idx_courses_owner_id ON courses(owner_id);
CREATE INDEX IF NOT EXISTS idx_courses_course_state ON courses(course_state);

-- ===============================
-- 8. TRIGGERS FOR UPDATED_AT
-- ===============================

-- Create triggers for all tables with updated_at columns
DROP TRIGGER IF EXISTS update_units_updated_at ON units;
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_question_bank_updated_at ON question_bank;
CREATE TRIGGER update_question_bank_updated_at BEFORE UPDATE ON question_bank
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vocabulary_sets_updated_at ON vocabulary_sets;
CREATE TRIGGER update_vocabulary_sets_updated_at BEFORE UPDATE ON vocabulary_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vocabulary_terms_updated_at ON vocabulary_terms;
CREATE TRIGGER update_vocabulary_terms_updated_at BEFORE UPDATE ON vocabulary_terms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_activity_updated_at ON student_activity;
CREATE TRIGGER update_student_activity_updated_at BEFORE UPDATE ON student_activity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignment_submissions_updated_at ON assignment_submissions;
CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_progress_updated_at ON lesson_progress;
CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignment_analytics_updated_at ON assignment_analytics;
CREATE TRIGGER update_assignment_analytics_updated_at BEFORE UPDATE ON assignment_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================
-- 9. UTILITY FUNCTIONS
-- ===============================

-- Function to validate video JSON structure
CREATE OR REPLACE FUNCTION validate_lesson_videos(videos_json JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if it's an array
  IF jsonb_typeof(videos_json) != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Check each video object has required fields
  FOR i IN 0..jsonb_array_length(videos_json) - 1 LOOP
    IF NOT (
      videos_json->i ? 'id' AND
      videos_json->i ? 'title' AND
      videos_json->i ? 'youtubeId' AND
      jsonb_typeof(videos_json->i->'id') = 'string' AND
      jsonb_typeof(videos_json->i->'title') = 'string' AND
      jsonb_typeof(videos_json->i->'youtubeId') = 'string'
    ) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to increment question usage count
CREATE OR REPLACE FUNCTION increment_question_usage(question_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE question_bank 
  SET usage_count = usage_count + 1 
  WHERE id = question_id;
END;
$$ LANGUAGE plpgsql;

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

-- ===============================
-- 10. COMMENTS
-- ===============================

-- Add helpful comments
COMMENT ON TABLE lessons IS 'Stores physics lessons with content, videos, and learning objectives';
COMMENT ON COLUMN lessons.videos IS 'Array of video objects: [{"id": "string", "title": "string", "youtubeId": "string", "duration": "string", "description": "string", "timestamp": number}]';
COMMENT ON COLUMN lessons.objectives IS 'Array of learning objectives as strings';
COMMENT ON COLUMN lessons.estimated_time IS 'Estimated time to complete lesson in minutes';
COMMENT ON COLUMN lessons.slug IS 'URL-friendly identifier for the lesson';
COMMENT ON COLUMN lessons.lesson_number IS 'Sequential number within the unit';

-- ===============================
-- 11. VERIFICATION
-- ===============================

-- Verify all tables were created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'units', 'lessons', 'question_bank', 'question_usage_log',
    'vocabulary_sets', 'vocabulary_terms', 'vocabulary_usage',
    'student_activity', 'assignment_submissions', 'lesson_progress',
    'assignment_analytics', 'courses', 'students'
  )
ORDER BY tablename;

SELECT 'Database setup completed successfully! All tables created.' AS status;
