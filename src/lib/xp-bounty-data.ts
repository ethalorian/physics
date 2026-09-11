import { supabaseAdmin } from '@/lib/supabase'

// Supabase caps responses at 1,000 rows; monthly activity and rosters can exceed it.
export async function bountyRows<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += 500) {
    const { data, error } = await page(from, from + 499)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < 500) return rows
  }
}

export async function bountyRoster(email: string) {
  const courses = await bountyRows((from, to) => supabaseAdmin.from('courses')
    .select('id, name, section').eq('teacher_email', email).order('id').range(from, to))
  const ids = courses.map(c => c.id)
  const enrollments = ids.length ? await bountyRows((from, to) => supabaseAdmin.from('course_students')
    .select('course_id, student_id').in('course_id', ids).eq('enrollment_state', 'ACTIVE')
    .order('course_id').order('student_id').range(from, to)) : []
  const studentIds = [...new Set(enrollments.map(e => e.student_id).filter(Boolean))]
  const students = studentIds.length ? await bountyRows((from, to) => supabaseAdmin.from('students')
    .select('id, name, email').in('id', studentIds).order('id').range(from, to)) : []
  return {
    courses: courses.map(c => ({ id: c.id, label: [c.name, c.section].filter(Boolean).join(' · ') })),
    students: students.map(s => ({ ...s, courseIds: enrollments.filter(e => e.student_id === s.id).map(e => e.course_id) })),
  }
}
