import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// GET - Retrieve student activity data (admin/teacher only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Admin/Teacher access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const studentEmail = searchParams.get('student_email')
    const activityType = searchParams.get('activity_type')
    const lessonId = searchParams.get('lesson_id')
    const assignmentId = searchParams.get('assignment_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabaseAdmin
      .from('student_activity')
      .select(`
        *,
        lesson:lessons(id, title, slug)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (studentEmail) {
      query = query.eq('user_email', studentEmail)
    }
    if (activityType) {
      query = query.eq('activity_type', activityType)
    }
    if (lessonId) {
      query = query.eq('lesson_id', lessonId)
    }
    if (assignmentId) {
      query = query.eq('assignment_id', assignmentId)
    }

    const { data: activities, error } = await query

    if (error) {
      console.error('Error fetching student activity:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ activities })

  } catch (error) {
    console.error('Student activity API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Record student activity
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      activity_type,
      lesson_id,
      assignment_id,
      session_duration,
      page_views,
      metadata
    } = body

    // Validate required fields
    if (!activity_type) {
      return NextResponse.json({ error: 'activity_type is required' }, { status: 400 })
    }

    const validActivityTypes = ['lesson_view', 'assignment_start', 'assignment_submit', 'assignment_complete']
    if (!validActivityTypes.includes(activity_type)) {
      return NextResponse.json({ error: 'Invalid activity_type' }, { status: 400 })
    }

    // Get user agent and IP for tracking (optional)
    const userAgent = request.headers.get('user-agent')
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip')

    const activityData = {
      user_id: session.user.id || session.user.email,
      user_email: session.user.email,
      user_name: session.user.name || 'Unknown User',
      activity_type,
      lesson_id: lesson_id || null,
      assignment_id: assignment_id || null,
      session_duration: session_duration || null,
      page_views: page_views || 1,
      user_agent: userAgent,
      ip_address: ip,
      referrer: metadata?.referrer || null
    }

    // Use the database function for lesson views to update progress
    if (activity_type === 'lesson_view' && lesson_id) {
      const { data, error } = await supabaseAdmin
        .rpc('record_lesson_view', {
          p_user_id: activityData.user_id,
          p_user_email: activityData.user_email,
          p_user_name: activityData.user_name,
          p_lesson_id: lesson_id,
          p_session_duration: session_duration
        })

      if (error) {
        console.error('Error recording lesson view:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, activity_id: data })
    }

    // For other activity types, insert directly
    const { data, error } = await supabaseAdmin
      .from('student_activity')
      .insert(activityData)
      .select()
      .single()

    if (error) {
      console.error('Error recording activity:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, activity: data })

  } catch (error) {
    console.error('Student activity recording error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
