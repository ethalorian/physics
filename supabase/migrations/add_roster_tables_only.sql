-- Add Roster Tables Only (for existing installations)
-- Run this if you already have student activity tables and just want to add roster functionality

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

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_students_google_user_id ON students(google_user_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_students_enrollment_state ON students(enrollment_state);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_last_synced ON students(last_synced_at);

CREATE INDEX IF NOT EXISTS idx_courses_google_course_id ON courses(google_course_id);
CREATE INDEX IF NOT EXISTS idx_courses_owner_id ON courses(owner_id);
CREATE INDEX IF NOT EXISTS idx_courses_course_state ON courses(course_state);

-- Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at 
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at 
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
