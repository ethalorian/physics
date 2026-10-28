import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { GoogleClassroomAPI } from '@/lib/google-classroom'
import { ownerEmailsFor } from '@/lib/identity-aliases'

// Download the entire authoritative roster before making any database changes.
// The RPC reconciles membership in one transaction, preserving student records.
export const POST = withRole(['teacher', 'admin'], async (request, ctx) => {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.courseId !== 'string' || !body.courseId.trim() || typeof body.accessToken !== 'string' || !body.accessToken.trim()) {
    return NextResponse.json({ error: 'Course ID and access token are required' }, { status: 400 })
  }
  if (body.program === 'projects') return NextResponse.json({ error: 'Project Physics is retired. Choose Physics for video lessons.' }, { status: 400 })
  const track = body.track === 'honors' || body.track === 'cpa' ? body.track : null
  const program = body.program === 'physics' || body.program === 'trades' ? body.program : null
  const snapshotStartedAt = new Date().toISOString()
  const google = new GoogleClassroomAPI()
  google.setAccessToken(body.accessToken)

  let course
  let students
  try {
    course = await google.getCourse(body.courseId)
    if (!course?.id || typeof course.name !== 'string' || !course.name.trim()) throw new Error('Invalid course')
    students = await google.getStudents(course.id)
  } catch {
    return NextResponse.json({ error: 'Could not download the complete Google Classroom roster. Your class has not changed. Reconnect to Google Classroom and try again.' }, { status: 502 })
  }

  const { data, error } = await supabaseAdmin.rpc('sync_classroom_roster', {
    p_course: { id: course.id, name: course.name, section: course.section ?? null, description: course.description ?? null, room: course.room ?? null, track, program },
    p_students: students.map(student => {
      const name = student.profile.name.fullName.trim()
      const parts = name.split(/\s+/)
      return {
        google_id: student.userId,
        name,
        first_name: student.profile.name.givenName || parts[0],
        last_name: student.profile.name.familyName || parts.slice(1).join(' '),
        email: student.profile.emailAddress?.trim().toLowerCase() || null,
      }
    }),
    p_teacher_email: ctx.scopeEmail,
    p_owner_emails: ownerEmailsFor(ctx.scopeEmail),
    p_is_admin: ctx.role === 'admin',
    p_snapshot_started_at: snapshotStartedAt,
  })

  if (error) {
    if (error.message.includes('ROSTER_FORBIDDEN')) return NextResponse.json({ error: 'You can only refresh classes you manage.' }, { status: 403 })
    if (error.message.includes('ROSTER_STALE')) return NextResponse.json({ error: 'A newer roster refresh has already finished. Refresh again to get the latest roster.' }, { status: 409 })
    if (error.message.includes('ROSTER_AMBIGUOUS')) return NextResponse.json({ error: 'Some students could not be matched safely to their saved accounts. Your class has not changed. Check for duplicate student accounts before trying again.' }, { status: 409 })
    console.error('Roster reconciliation failed:', error.code)
    return NextResponse.json({ error: 'The roster could not be saved. Your class has not changed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, ...data, course: { id: course.id, name: course.name, section: course.section } })
})

export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
  const courseId = new URL(request.url).searchParams.get('course_id')
  if (!courseId) return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })

  let query = supabaseAdmin.from('courses').select('*').eq('google_course_id', courseId)
  if (ctx.role !== 'admin') query = query.in('teacher_email', ownerEmailsFor(ctx.scopeEmail))
  const { data: course, error: courseError } = await query.single()
  if (courseError || !course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const { data: students, error } = await supabaseAdmin.rpc('get_course_students', { p_course_id: course.id })
  if (error) return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  return NextResponse.json({ course, students: students ?? [], totalStudents: students?.length ?? 0 })
})
