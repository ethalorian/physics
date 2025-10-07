-- ============================================================================
-- Create Missing course_students Junction Table
-- ============================================================================
-- This table links students to courses (many-to-many relationship)

-- Create course_students table
CREATE TABLE IF NOT EXISTS public.course_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  enrollment_state TEXT DEFAULT 'ACTIVE',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_course_students_course ON public.course_students(course_id);
CREATE INDEX IF NOT EXISTS idx_course_students_student ON public.course_students(student_id);
CREATE INDEX IF NOT EXISTS idx_course_students_enrollment ON public.course_students(enrollment_state);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_course_students_updated_at ON public.course_students;
CREATE TRIGGER update_course_students_updated_at
  BEFORE UPDATE ON public.course_students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.course_students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Course students viewable by teachers" ON public.course_students;
DROP POLICY IF EXISTS "Course students writable by teachers" ON public.course_students;

-- RLS Policies: Teachers can manage, students can view their own enrollments
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

-- Verify table was created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_students') THEN
    RAISE NOTICE '✅ course_students table created successfully';
  ELSE
    RAISE WARNING '❌ course_students table was NOT created';
  END IF;
END $$;

-- Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'course_students' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'course_students'
ORDER BY indexname;

-- Show RLS policies
SELECT 
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'course_students'
ORDER BY policyname;

COMMENT ON TABLE public.course_students IS 'Junction table linking students to courses (many-to-many relationship)';
COMMENT ON COLUMN public.course_students.enrollment_state IS 'Student enrollment state: ACTIVE, INACTIVE, WITHDRAWN';
