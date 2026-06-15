import { supabaseAdmin } from '@/lib/supabase'

// Enrollment gate helpers. A student is "enrolled" if at least one row in
// course_students links the student (by students.id) to a course. Unenrolled
// students can sign in and build their avatar, but every content surface + every
// mutating API rejects until a teacher rosters them.

export interface EnrollmentInfo {
  enrolled: boolean
  courseCount: number
  studentRowId: string | null   // students.id (uuid) — useful for downstream queries
}

/**
 * Returns enrollment info for the given user id (which IS students.id). Does NOT
 * care about role — callers must decide whether to apply the gate (staff bypass).
 */
export async function getEnrollment(userId: string): Promise<EnrollmentInfo> {
  // The user id is already students.id; course_students.student_id == students.id,
  // so we can count enrollments directly.
  if (!userId) return { enrolled: false, courseCount: 0, studentRowId: null }
  const { count } = await supabaseAdmin
    .from('course_students')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', userId)
  const courseCount = count ?? 0
  return { enrolled: courseCount > 0, courseCount, studentRowId: userId }
}

/**
 * Throw-style guard for API routes. Returns null if the request should proceed
 * (staff bypass, or enrolled student). Returns a NextResponse with 403 if the
 * caller is an un-enrolled student. Use like:
 *
 *   const gate = await requireEnrolledStudent(userId, role)
 *   if (gate) return gate
 */
export async function requireEnrolledStudent(
  userId: string,
  role: 'student' | 'teacher' | 'admin' | string,
): Promise<Response | null> {
  // Staff (anyone not 'student') is never gated.
  if (role !== 'student') return null
  const { enrolled } = await getEnrollment(userId)
  if (enrolled) return null
  return new Response(
    JSON.stringify({ error: 'You are not in a class yet. Ask your teacher to add you.' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } },
  )
}
