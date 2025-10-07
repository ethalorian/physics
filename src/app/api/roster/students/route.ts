import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// GET - Get all imported students
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
    const courseId = searchParams.get('course_id')
    const activeOnly = searchParams.get('active_only') === 'true'

    // Build query
    let query = supabase
      .from('students')
      .select('*')
      .order('name', { ascending: true })

    // Apply filters
    if (courseId) {
      query = query.eq('course_id', courseId)
    }
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
      const { data: course } = await supabase
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
