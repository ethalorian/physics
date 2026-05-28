import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getEffectiveContext } from '@/lib/effective-context'

// GET /api/admin/orphans
// Admin-only: students who have signed in (a row exists in students) but have
// NO row in course_students — i.e. they slipped through the enrollment gate
// and need a teacher to roster them. Returns rows sorted by created_at DESC so
// the freshest orphans are at the top.

export interface OrphanRow {
  id: string                   // students.id (uuid)
  google_user_id: string | null
  email: string | null
  name: string | null
  first_name: string | null
  last_name: string | null
  created_at: string | null
  last_synced_at: string | null
  is_active: boolean | null
}

export interface CourseChoice {
  id: string                   // courses.id (uuid)
  name: string
  section: string | null
  teacher_email: string | null
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ctx = await getEffectiveContext(session.user.email)
    if (ctx.realRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Three queries instead of a NOT EXISTS join — supabase-js doesn't expose
    // that pattern cleanly. The dataset is small (low hundreds of students),
    // so the round-trips are fine.
    const [{ data: allStudents }, { data: enrolled }, { data: courseRows }] = await Promise.all([
      supabaseAdmin
        .from('students')
        .select('id, google_user_id, email, name, first_name, last_name, created_at, last_synced_at, is_active')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('course_students')
        .select('student_id'),
      supabaseAdmin
        .from('courses')
        .select('id, name, section, teacher_email')
        .order('name', { ascending: true }),
    ])
    const enrolledIds = new Set((enrolled ?? []).map((r) => (r as { student_id: string }).student_id))
    const orphans = ((allStudents ?? []) as OrphanRow[]).filter((s) => !enrolledIds.has(s.id))
    const courses = (courseRows ?? []) as CourseChoice[]

    return NextResponse.json({
      orphans,
      courses,
      count: orphans.length,
      totalStudents: allStudents?.length ?? 0,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/orphans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
