import { supabaseAdmin } from '@/lib/supabase'

// The set of students a TEACHER is allowed to see.
//
// The students table has NO teacher_email column — a teacher's students are those
// enrolled in the courses that teacher owns. So scoping flows:
//   courses (teacher_email) -> course_students (student_id UUID) -> students (google_user_id)
//
// Returns google_user_ids, because every mastery surface keys students by
// google_user_id (== session.user.id == mastery_records.user_id), NOT the table UUID.
// An empty array means "this teacher has no rostered students" — callers should pass
// it straight to `.in('google_user_id', gids)`, which correctly yields no rows.
export async function getTeacherStudentGids(teacherEmail: string): Promise<string[]> {
  const { data: courseRows } = await supabaseAdmin
    .from('courses')
    .select('id')
    .eq('teacher_email', teacherEmail)
  const courseIds = ((courseRows ?? []) as { id: string }[]).map((c) => c.id)
  if (courseIds.length === 0) return []

  const { data: csRows } = await supabaseAdmin
    .from('course_students')
    .select('student_id')
    .in('course_id', courseIds)
  const studentUuids = [...new Set(((csRows ?? []) as { student_id: string }[]).map((r) => r.student_id))]
  if (studentUuids.length === 0) return []

  const { data: studentRows } = await supabaseAdmin
    .from('students')
    .select('google_user_id')
    .in('id', studentUuids)
  return [...new Set(
    ((studentRows ?? []) as { google_user_id: string | null }[])
      .map((s) => s.google_user_id)
      .filter((g): g is string => Boolean(g)),
  )]
}
