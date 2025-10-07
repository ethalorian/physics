-- ============================================================================
-- Check if Students Are Actually in the Database
-- ============================================================================

-- Check students table
SELECT 
  'Students in database:' as info,
  COUNT(*) as total_students
FROM public.students;

-- Check course_students links
SELECT 
  'Student-course links:' as info,
  COUNT(*) as total_links
FROM public.course_students;

-- Check courses
SELECT 
  'Courses in database:' as info,
  COUNT(*) as total_courses
FROM public.courses;

-- Show course details
SELECT 
  id,
  google_course_id,
  name,
  section,
  student_count,
  teacher_email
FROM public.courses
ORDER BY created_at DESC;

-- Show students (first 10)
SELECT 
  id,
  google_user_id,
  email,
  name
FROM public.students
ORDER BY created_at DESC
LIMIT 10;

-- Show course-student relationships
SELECT 
  cs.id,
  c.name as course_name,
  s.name as student_name,
  s.email as student_email
FROM public.course_students cs
JOIN public.courses c ON cs.course_id = c.id
JOIN public.students s ON cs.student_id = s.id
ORDER BY cs.created_at DESC
LIMIT 10;

