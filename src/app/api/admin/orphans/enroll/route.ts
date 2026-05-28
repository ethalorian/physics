import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getEffectiveContext } from '@/lib/effective-context'

// POST /api/admin/orphans/enroll  { student_id, course_id }
// Manual enrollment by an admin: inserts a row into course_students linking
// the student to the chosen course. `enrolled_via='admin_manual'` so a future
// roster re-sync from Google Classroom doesn't overwrite this assignment by
// accident (downstream code can choose to respect this marker).

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ctx = await getEffectiveContext(session.user.email)
    if (ctx.realRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const studentId = (body?.student_id ?? '') as string
    const courseId = (body?.course_id ?? '') as string
    if (!studentId || !courseId) {
      return NextResponse.json({ error: 'student_id and course_id required' }, { status: 400 })
    }

    // Validate both exist.
    const [{ data: stu }, { data: course }] = await Promise.all([
      supabaseAdmin.from('students').select('id').eq('id', studentId).maybeSingle(),
      supabaseAdmin.from('courses').select('id').eq('id', courseId).maybeSingle(),
    ])
    if (!stu) return NextResponse.json({ error: 'Unknown student' }, { status: 404 })
    if (!course) return NextResponse.json({ error: 'Unknown course' }, { status: 404 })

    // Idempotent: if the link already exists, treat as success so the UI can
    // proceed without surfacing an error.
    const { data: existing } = await supabaseAdmin
      .from('course_students')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle()
    if (existing) return NextResponse.json({ ok: true, already_enrolled: true })

    const { error } = await supabaseAdmin.from('course_students').insert({
      student_id: studentId,
      course_id: courseId,
      enrollment_state: 'ACTIVE',
      enrolled_at: new Date().toISOString(),
      enrolled_via: 'admin_manual',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in POST /api/admin/orphans/enroll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
