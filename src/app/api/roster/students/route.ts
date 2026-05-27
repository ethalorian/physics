import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'
import { getEffectiveContext } from '@/lib/effective-context'
import { resolveRosterScope } from '@/lib/teacher-scope'

// GET - Get imported students, SCOPED to who's asking: a teacher sees only the
// students enrolled in their own classes; an admin sees everyone. Pass
// ?course_id= to narrow to a single class (used by the per-class page).
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ctx = await getEffectiveContext(session.user.email)
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Admin/Teacher access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')
    const activeOnly = searchParams.get('active_only') === 'true'

    // Build query
    let query = supabaseAdmin
      .from('students')
      .select('*')
      .order('name', { ascending: true })

    // Scope to the asker (teacher → own roster; admin → all) and optionally to
    // one class. scope.gids === null means "no filter" (admin, no class).
    const scope = await resolveRosterScope({ classId: courseId, role: ctx.role, scopeEmail: ctx.scopeEmail })
    if (scope.gids) query = query.in('google_user_id', scope.gids)
    if (activeOnly) {
      query = query.eq('is_active', true)
      query = query.eq('enrollment_state', 'ACTIVE')
    }

    const { data: students, error } = await query

    if (error) {
      console.error('Error fetching students:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get course information if courseId is provided
    let courseInfo = null
    if (courseId) {
      const { data: course } = await supabaseAdmin
        .from('courses')
        .select('*')
        .eq('google_course_id', courseId)
        .single()
      
      courseInfo = course
    }

    const response = {
      students: students || [],
      totalStudents: students?.length || 0,
      course: courseInfo
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Students API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PATCH - Update a student's name parts (first_name / last_name).
// Teachers/admins correct how a name splits so the Aspen X2 grade copy sorts
// the student to the right row. Does NOT touch the Google-synced `name`.
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Admin/Teacher access required' }, { status: 403 })
    }

    const body = await request.json()
    const id: string | undefined = body.id
    if (!id) {
      return NextResponse.json({ error: 'Student id is required' }, { status: 400 })
    }

    const update: { first_name?: string; last_name?: string } = {}
    if (typeof body.first_name === 'string') update.first_name = body.first_name.trim()
    if (typeof body.last_name === 'string') update.last_name = body.last_name.trim()
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('students')
      .update(update)
      .eq('id', id)
      .select('id, name, first_name, last_name')
      .single()

    if (error) {
      console.error('Error updating student name:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Students PATCH error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
