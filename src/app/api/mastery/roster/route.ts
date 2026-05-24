import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'
import { getTeacherStudentGids } from '@/lib/teacher-scope'

// GET /api/mastery/roster
// Returns the signed-in teacher's students as { id, name, email }.
//
// CRITICAL: `id` is the student's google_user_id — the SAME value stored as
// session.user.id (token.sub) when the student signs in, and therefore the value
// that mastery_records.user_id must use. (courses/enroll sets
// google_user_id = session.user.id.) Returning students.id (the table UUID) here
// would silently break the loop: records would save but never match the student's
// own dashboard query.
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = getUserRole(session.user.email)
    if (role !== 'admin' && role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can view a roster' }, { status: 403 })
    }

    let query = supabaseAdmin
      .from('students')
      .select('google_user_id, name, email')
      .order('name', { ascending: true })

    // Admins see all students; teachers see students enrolled in courses they own
    // (students has no teacher_email column — scope flows through courses).
    if (role === 'teacher') {
      query = query.in('google_user_id', await getTeacherStudentGids(session.user.email))
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching roster:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const students = (data ?? [])
      .filter((s) => s.google_user_id)
      .map((s) => ({ id: s.google_user_id, name: s.name, email: s.email }))

    return NextResponse.json({ students })
  } catch (error) {
    console.error('Error in GET /api/mastery/roster:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
