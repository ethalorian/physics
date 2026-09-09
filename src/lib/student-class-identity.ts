import { supabaseAdmin } from '@/lib/supabase'
import type { StudentClassIdentity } from '@/lib/class-identity'

interface CourseIdentityRow {
  id: string
  name: string
  section: string | null
  track: string | null
  program: string | null
  teacher_email: string | null
  archived_at: string | null
}

export async function getStudentClassIdentity(userId: string): Promise<StudentClassIdentity[]> {
  const { data, error } = await supabaseAdmin.from('course_students')
    .select('courses ( id, name, section, track, program, teacher_email, archived_at )')
    .eq('student_id', userId)
    .eq('enrollment_state', 'ACTIVE')
  if (error) throw error
  const courses = ((data ?? []) as { courses: CourseIdentityRow | CourseIdentityRow[] | null }[])
    .flatMap(row => Array.isArray(row.courses) ? row.courses : row.courses ? [row.courses] : [])
    .filter(course => !course.archived_at)
  const emails = [...new Set(courses.map(course => course.teacher_email).filter((email): email is string => Boolean(email)))]
  // All signed-in accounts, including staff, have a students identity row.
  // Only resolve the instructors of this student's active classes.
  const teacherNames = new Map<string, string>()
  if (emails.length) {
    const { data: teachers, error: teacherError } = await supabaseAdmin.from('students').select('email, name').in('email', emails)
    if (teacherError) throw teacherError
    for (const teacher of (teachers ?? []) as { email: string; name: string | null }[]) {
      if (teacher.name?.trim()) teacherNames.set(teacher.email.toLowerCase(), teacher.name.trim())
    }
  }
  return [...new Map(courses.map(course => [course.id, course])).values()]
    .sort((a, b) => a.name.localeCompare(b.name) || (a.section ?? '').localeCompare(b.section ?? ''))
    .map(course => ({
      id: course.id, name: course.name, section: course.section, track: course.track,
      program: course.program,
      teacher: course.teacher_email ? teacherNames.get(course.teacher_email.toLowerCase()) ?? course.teacher_email : null,
    }))
}
