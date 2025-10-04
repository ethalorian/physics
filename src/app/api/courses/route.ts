import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// GET - Get all courses for assignment creation
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
    const activeOnly = searchParams.get('active_only') !== 'false' // Default to true

    // Build query
    let query = supabase
      .from('courses')
      .select('id, google_course_id, name, section, description, room, course_state, student_count, created_at, updated_at')
      .order('name', { ascending: true })

    // Apply filters
    if (activeOnly) {
      query = query.eq('course_state', 'ACTIVE')
    }

    const { data: courses, error } = await query

    if (error) {
      console.error('Error fetching courses:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform courses to match the expected interface
    const transformedCourses = courses?.map(course => ({
      id: course.id,
      google_course_id: course.google_course_id,
      name: course.name,
      section: course.section || '',
      description: course.description || '',
      room: course.room || '',
      owner_id: '', // This would need to be fetched if needed
      course_state: course.course_state as 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED',
      creation_time: '',
      update_time: '',
      last_synced_at: '',
      student_count: course.student_count || 0,
      created_at: course.created_at,
      updated_at: course.updated_at
    })) || []

    return NextResponse.json({ 
      courses: transformedCourses,
      totalCount: transformedCourses.length
    })

  } catch (error) {
    console.error('Courses API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}


