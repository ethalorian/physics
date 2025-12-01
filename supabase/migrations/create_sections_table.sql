-- ============================================================================
-- SECTIONS TABLE - Class Period Management
-- ============================================================================
-- Creates a sections system for organizing students by class period
-- Sections are automatically created when importing from Google Classroom

-- Sections Table
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,  -- e.g., "Period 1", "Block A", "Section 101"
  description TEXT,
  google_section_name TEXT,  -- Original section name from Google Classroom
  teacher_email TEXT,
  max_capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, name)  -- Each section name must be unique within a course
);

-- Indexes for sections
CREATE INDEX IF NOT EXISTS idx_sections_course ON public.sections(course_id);
CREATE INDEX IF NOT EXISTS idx_sections_teacher ON public.sections(teacher_email);
CREATE INDEX IF NOT EXISTS idx_sections_active ON public.sections(is_active);

-- Student-Section Junction Table
-- This links students to specific sections within courses
CREATE TABLE IF NOT EXISTS public.student_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by TEXT,  -- Email of teacher/admin who assigned
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, section_id)  -- Prevent duplicate assignments
);

-- Indexes for student_sections
CREATE INDEX IF NOT EXISTS idx_student_sections_student ON public.student_sections(student_id);
CREATE INDEX IF NOT EXISTS idx_student_sections_section ON public.student_sections(section_id);
CREATE INDEX IF NOT EXISTS idx_student_sections_active ON public.student_sections(is_active);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on sections table
DROP TRIGGER IF EXISTS update_sections_updated_at ON public.sections;
CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on student_sections table
DROP TRIGGER IF EXISTS update_student_sections_updated_at ON public.student_sections;
CREATE TRIGGER update_student_sections_updated_at
  BEFORE UPDATE ON public.student_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get or create a section for a course
-- This is called during Google Classroom import
CREATE OR REPLACE FUNCTION public.get_or_create_section(
  p_course_id UUID,
  p_section_name TEXT,
  p_teacher_email TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_section_id UUID;
  v_section_name TEXT;
BEGIN
  -- Use provided section name or default to "Default Section"
  v_section_name := COALESCE(NULLIF(TRIM(p_section_name), ''), 'Default Section');
  
  -- Try to find existing section
  SELECT id INTO v_section_id
  FROM public.sections
  WHERE course_id = p_course_id
    AND name = v_section_name;
  
  -- If not found, create new section
  IF v_section_id IS NULL THEN
    INSERT INTO public.sections (
      course_id,
      name,
      google_section_name,
      teacher_email
    ) VALUES (
      p_course_id,
      v_section_name,
      v_section_name,
      p_teacher_email
    )
    RETURNING id INTO v_section_id;
  END IF;
  
  RETURN v_section_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign a student to a section
CREATE OR REPLACE FUNCTION public.assign_student_to_section(
  p_student_id UUID,
  p_section_id UUID,
  p_assigned_by TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_assignment_id UUID;
BEGIN
  -- Insert or update student-section assignment
  INSERT INTO public.student_sections (
    student_id,
    section_id,
    assigned_by,
    is_active
  ) VALUES (
    p_student_id,
    p_section_id,
    p_assigned_by,
    true
  )
  ON CONFLICT (student_id, section_id) 
  DO UPDATE SET
    is_active = true,
    assigned_by = COALESCE(EXCLUDED.assigned_by, student_sections.assigned_by),
    updated_at = NOW()
  RETURNING id INTO v_assignment_id;
  
  RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync student with section (called during import)
-- This combines sync_student with automatic section assignment
CREATE OR REPLACE FUNCTION public.sync_student_with_section(
  p_google_user_id TEXT,
  p_email TEXT,
  p_name TEXT,
  p_photo_url TEXT DEFAULT NULL,
  p_course_id UUID DEFAULT NULL,
  p_section_name TEXT DEFAULT NULL,
  p_teacher_email TEXT DEFAULT NULL
) RETURNS TABLE (student_id UUID, section_id UUID) AS $$
DECLARE
  v_student_id UUID;
  v_section_id UUID;
  v_internal_email TEXT;
BEGIN
  -- Use provided email or generate internal identifier
  v_internal_email := COALESCE(p_email, p_google_user_id || '@classroom.local');
  
  -- Insert or update student
  INSERT INTO public.students (
    google_user_id,
    email,
    name,
    photo_url,
    last_sync
  ) VALUES (
    p_google_user_id,
    v_internal_email,
    p_name,
    NULL,
    NOW()
  )
  ON CONFLICT (google_user_id) 
  DO UPDATE SET
    name = EXCLUDED.name,
    email = CASE 
      WHEN students.email LIKE '%@classroom.local' THEN EXCLUDED.email
      ELSE students.email
    END,
    photo_url = NULL,
    last_sync = NOW()
  RETURNING id INTO v_student_id;
  
  -- Link student to course if course_id provided
  IF p_course_id IS NOT NULL THEN
    INSERT INTO public.course_students (
      course_id,
      student_id,
      enrollment_state,
      joined_at
    ) VALUES (
      p_course_id,
      v_student_id,
      'ACTIVE',
      NOW()
    )
    ON CONFLICT (course_id, student_id) 
    DO UPDATE SET
      enrollment_state = 'ACTIVE',
      updated_at = NOW();
    
    -- Get or create section and assign student
    v_section_id := public.get_or_create_section(p_course_id, p_section_name, p_teacher_email);
    
    PERFORM public.assign_student_to_section(v_student_id, v_section_id, p_teacher_email);
  END IF;
  
  RETURN QUERY SELECT v_student_id, v_section_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get students by section
CREATE OR REPLACE FUNCTION public.get_section_students(p_section_id UUID)
RETURNS TABLE (
  student_id UUID,
  google_user_id TEXT,
  name TEXT,
  email TEXT,
  assigned_at TIMESTAMPTZ,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as student_id,
    s.google_user_id,
    s.name,
    s.email,
    ss.assigned_at,
    ss.is_active
  FROM public.students s
  JOIN public.student_sections ss ON s.id = ss.student_id
  WHERE ss.section_id = p_section_id
    AND ss.is_active = true
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get sections for a course with student counts
CREATE OR REPLACE FUNCTION public.get_course_sections(p_course_id UUID)
RETURNS TABLE (
  section_id UUID,
  section_name TEXT,
  description TEXT,
  student_count BIGINT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sec.id as section_id,
    sec.name as section_name,
    sec.description,
    COUNT(ss.id) FILTER (WHERE ss.is_active = true) as student_count,
    sec.is_active,
    sec.created_at
  FROM public.sections sec
  LEFT JOIN public.student_sections ss ON sec.id = ss.section_id
  WHERE sec.course_id = p_course_id
  GROUP BY sec.id, sec.name, sec.description, sec.is_active, sec.created_at
  ORDER BY sec.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student's section for a course
CREATE OR REPLACE FUNCTION public.get_student_section(
  p_student_id UUID,
  p_course_id UUID
) RETURNS TABLE (
  section_id UUID,
  section_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sec.id as section_id,
    sec.name as section_name
  FROM public.sections sec
  JOIN public.student_sections ss ON sec.id = ss.section_id
  WHERE ss.student_id = p_student_id
    AND sec.course_id = p_course_id
    AND ss.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_sections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Sections viewable by teachers and enrolled students" ON public.sections;
DROP POLICY IF EXISTS "Sections writable by teachers" ON public.sections;
DROP POLICY IF EXISTS "Student sections viewable by teachers and self" ON public.student_sections;
DROP POLICY IF EXISTS "Student sections writable by teachers" ON public.student_sections;

-- Sections: Teachers can manage, students can view their sections
CREATE POLICY "Sections viewable by teachers and enrolled students"
  ON public.sections FOR SELECT
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid())) OR
    EXISTS (
      SELECT 1 
      FROM public.student_sections ss
      JOIN public.students s ON ss.student_id = s.id
      WHERE ss.section_id = sections.id
      AND s.google_user_id = (SELECT email FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Sections writable by teachers"
  ON public.sections FOR ALL
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- Student Sections: Teachers can manage, students can view their own
CREATE POLICY "Student sections viewable by teachers and self"
  ON public.student_sections FOR SELECT
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid())) OR
    EXISTS (
      SELECT 1 
      FROM public.students s 
      WHERE s.id = student_sections.student_id
      AND s.google_user_id = (SELECT email FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Student sections writable by teachers"
  ON public.student_sections FOR ALL
  TO authenticated
  USING (
    is_admin_or_teacher((SELECT email FROM public.users WHERE id = auth.uid()))
  );

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.sections IS 'Class sections/periods within courses';
COMMENT ON TABLE public.student_sections IS 'Many-to-many relationship between students and sections';

COMMENT ON COLUMN public.sections.name IS 'Section name (e.g., Period 1, Block A)';
COMMENT ON COLUMN public.sections.google_section_name IS 'Original section name from Google Classroom';
COMMENT ON COLUMN public.sections.max_capacity IS 'Maximum number of students allowed in section';

COMMENT ON COLUMN public.student_sections.assigned_by IS 'Email of teacher/admin who assigned the student';
COMMENT ON COLUMN public.student_sections.is_active IS 'Whether the assignment is currently active';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sections' AND table_schema = 'public') THEN
    RAISE NOTICE '✅ sections table created successfully';
  ELSE
    RAISE WARNING '❌ sections table was NOT created';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_sections' AND table_schema = 'public') THEN
    RAISE NOTICE '✅ student_sections table created successfully';
  ELSE
    RAISE WARNING '❌ student_sections table was NOT created';
  END IF;
END $$;

