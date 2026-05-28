import { supabaseAdmin } from '@/lib/supabase'

// Enrollment gate helpers. A student is "enrolled" if at least one row in
// course_students links the student row (resolved from google_user_id) to a
// course. Unenrolled students can sign in and build their avatar, but every
// content surface + every mutating API rejects until a teacher rosters them.

export interface EnrollmentInfo {
  enrolled: boolean
  courseCount: number
  studentRowId: string | null   // students.id (uuid) — useful for downstream queries
}

/**
 * Returns enrollment info for the given Google user id. Does NOT care about
 * role — callers must decide whether to apply the gate (staff bypass).
 */
export async function getEnrollment(googleUserId: string): Promise<EnrollmentInfo> {
  // 1) Resolve the students.id (uuid) for this google_user_id.
  const { data: stu } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('google_user_id', googleUserId)
    .maybeSingle()
  const studentRowId = (stu as { id?: string } | null)?.id ?? null
  if (!studentRowId) return { enrolled: false, courseCount: 0, studentRowId: null }

  // 2) Count enrollments.
  const { count } = await supabaseAdmin
    .from('course_students')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentRowId)
  const courseCount = count ?? 0
  return { enrolled: courseCount > 0, courseCount, studentRowId }
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
  googleUserId: string,
  role: 'student' | 'teacher' | 'admin' | string,
): Promise<Response | null> {
  // Staff (anyone not 'student') is never gated.
  if (role !== 'student') return null
  const { enrolled } = await getEnrollment(googleUserId)
  if (enrolled) return null
  return new Response(
    JSON.stringify({ error: 'You are not in a class yet. Ask your teacher to add you.' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } },
  )
}
