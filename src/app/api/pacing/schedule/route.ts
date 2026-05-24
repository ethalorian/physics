import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// Per-section calendar: start date, which weekdays it meets, no-school dates.
// GET /api/pacing/schedule?course_id=...
// PUT /api/pacing/schedule  { course_id, start_date, meeting_days, no_school_dates }

type CourseRow = { id: string; teacher_email: string | null }

async function canAccessCourse(courseId: string, email: string, role: string): Promise<boolean> {
  if (role === 'admin') return true
  const { data } = await supabaseAdmin.from('courses').select('id, teacher_email').eq('id', courseId).maybeSingle()
  return Boolean((data as CourseRow | null)?.teacher_email && (data as CourseRow).teacher_email === email)
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = getUserRole(session.user.email)
    if (role !== 'admin' && role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const courseId = new URL(request.url).searchParams.get('course_id')
    if (!courseId) return NextResponse.json({ error: 'course_id required' }, { status: 400 })
    if (!(await canAccessCourse(courseId, session.user.email, role))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data } = await supabaseAdmin
      .from('section_schedules')
      .select('course_id, start_date, meeting_days, no_school_dates')
      .eq('course_id', courseId)
      .maybeSingle()

    return NextResponse.json({
      schedule: data ?? { course_id: courseId, start_date: null, meeting_days: [1, 2, 3, 4, 5], no_school_dates: [] },
    })
  } catch (error) {
    console.error('Error in GET /api/pacing/schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = getUserRole(session.user.email)
    if (role !== 'admin' && role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = (await request.json()) as {
      course_id: string
      start_date?: string | null
      meeting_days?: number[]
      no_school_dates?: string[]
    }
    if (!body.course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })
    if (!(await canAccessCourse(body.course_id, session.user.email, role))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const row = {
      course_id: body.course_id,
      start_date: body.start_date ?? null,
      meeting_days: Array.isArray(body.meeting_days) && body.meeting_days.length > 0 ? body.meeting_days : [1, 2, 3, 4, 5],
      no_school_dates: Array.isArray(body.no_school_dates) ? body.no_school_dates : [],
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabaseAdmin.from('section_schedules').upsert(row, { onConflict: 'course_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, schedule: row })
  } catch (error) {
    console.error('Error in PUT /api/pacing/schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
