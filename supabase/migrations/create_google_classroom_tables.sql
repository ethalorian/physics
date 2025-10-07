-- ============================================================================
-- Google Classroom Integration Tables
-- ============================================================================
-- Creates tables for syncing courses and students from Google Classroom

-- Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_course_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  section TEXT,
  description TEXT,
  room TEXT,
  teacher_email TEXT,
  student_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for courses
CREATE INDEX IF NOT EXISTS idx_courses_google_id ON public.courses(google_course_id);
CREATE INDEX IF NOT EXISTS idx_courses_teacher_email ON public.courses(teacher_email);

-- Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for students
CREATE INDEX IF NOT EXISTS idx_students_google_id ON public.students(google_user_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);

-- Course-Student Junction Table (many-to-many)
CREATE TABLE IF NOT EXISTS public.course_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  enrollment_state TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

-- Indexes for course_students
CREATE INDEX IF NOT EXISTS idx_course_students_course ON public.course_students(course_id);
CREATE INDEX IF NOT EXISTS idx_course_students_student ON public.course_students(student_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on courses table
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on students table
DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Courses viewable by teachers" ON public.courses;
DROP POLICY IF EXISTS "Courses writable by teachers" ON public.courses;
DROP POLICY IF EXISTS "Students viewable by teachers" ON public.students;
DROP POLICY IF EXISTS "Students writable by teachers" ON public.students;
DROP POLICY IF EXISTS "Course students viewable by teachers" ON public.course_students;
DROP POLICY IF EXISTS "Course students writable by teachers" ON public.course_students;

-- Courses: Teachers can manage, students in course can view
CREATE POLICY "Courses viewable by teachers"
  ON public.courses FOR SELECT
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid())) OR
    EXISTS (
      SELECT 1 
      FROM public.course_students cs
      JOIN public.students s ON cs.student_id = s.id
      WHERE cs.course_id = courses.id
      AND s.google_user_id = (SELECT email FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Courses writable by teachers"
  ON public.courses FOR ALL
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- Students: Teachers can manage
CREATE POLICY "Students viewable by teachers"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid())) OR
    google_user_id = (SELECT email FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Students writable by teachers"
  ON public.students FOR ALL
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- Course Students: Teachers can manage
CREATE POLICY "Course students viewable by teachers"
  ON public.course_students FOR SELECT
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid())) OR
    EXISTS (
      SELECT 1 
      FROM public.students s 
      WHERE s.id = course_students.student_id
      AND s.google_user_id = (SELECT email FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Course students writable by teachers"
  ON public.course_students FOR ALL
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.courses IS 'Google Classroom courses synced to the system';
COMMENT ON TABLE public.students IS 'Students from Google Classroom';
COMMENT ON TABLE public.course_students IS 'Many-to-many relationship between courses and students';

COMMENT ON COLUMN public.courses.google_course_id IS 'Google Classroom course ID';
COMMENT ON COLUMN public.courses.teacher_email IS 'Email of the teacher who owns this course';
COMMENT ON COLUMN public.students.google_user_id IS 'Google user ID from Classroom API';
COMMENT ON COLUMN public.course_students.enrollment_state IS 'Student enrollment state in the course';
