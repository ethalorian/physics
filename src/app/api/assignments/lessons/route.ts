import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'
import { CreateLessonAssignmentRequest, AssignmentFilters } from '@/types/assignment-system'

// GET - Get lesson assignments with filters
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
    const filters: AssignmentFilters = {
      course_id: searchParams.get('course_id') || undefined,
      assigned_by: searchParams.get('assigned_by') || undefined,
      status: searchParams.get('status') || undefined,
      due_date_from: searchParams.get('due_date_from') || undefined,
      due_date_to: searchParams.get('due_date_to') || undefined,
      is_active: searchParams.get('is_active') === 'true' ? true : undefined,
      published: searchParams.get('published') === 'true' ? true : undefined
    }

    // Build query
    let query = supabaseAdmin
      .from('lesson_assignments')
      .select(`
        *,
        lesson:lessons(id, title, slug, description, unit, lesson_number, estimated_time)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.course_id) {
      query = query.eq('course_id', filters.course_id)
    }
    if (filters.assigned_by) {
      query = query.eq('assigned_by', filters.assigned_by)
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    if (filters.published !== undefined) {
      query = query.eq('published', filters.published)
    }
    if (filters.due_date_from) {
      query = query.gte('due_date', filters.due_date_from)
    }
    if (filters.due_date_to) {
      query = query.lte('due_date', filters.due_date_to)
    }

    const { data: assignments, error } = await query

    if (error) {
      console.error('Error fetching lesson assignments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      assignments: assignments || [],
      totalCount: assignments?.length || 0
    })

  } catch (error) {
    console.error('Lesson assignments API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// POST - Create new lesson assignment
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Admin/Teacher access required' }, { status: 403 })
    }

    const body: CreateLessonAssignmentRequest = await request.json()

    // Validate required fields
    if (!body.lesson_id) {
      return NextResponse.json({ error: 'lesson_id is required' }, { status: 400 })
    }

    if (!body.course_id && !body.assigned_students) {
      return NextResponse.json({ 
        error: 'Either course_id or assigned_students must be provided' 
      }, { status: 400 })
    }

    if (body.course_id && body.assigned_students) {
      return NextResponse.json({ 
        error: 'Cannot assign to both course and individual students' 
      }, { status: 400 })
    }

    // Verify lesson exists
    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select('id, title, slug')
      .eq('id', body.lesson_id)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // If assigning to course, verify course exists
    if (body.course_id) {
      const { data: course, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('id, google_course_id')
        .eq('google_course_id', body.course_id)
        .single()

      if (courseError || !course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }
    }

    // If assigning to specific students, verify they exist
    if (body.assigned_students && body.assigned_students.length > 0) {
      const { data: students, error: studentsError } = await supabaseAdmin
        .from('students')
        .select('id')
        .in('id', body.assigned_students)

      if (studentsError) {
        return NextResponse.json({ error: 'Error validating students' }, { status: 500 })
      }

      if (!students || students.length !== body.assigned_students.length) {
        return NextResponse.json({ error: 'One or more students not found' }, { status: 404 })
      }
    }

    // Create the lesson assignment
    const assignmentData = {
      lesson_id: body.lesson_id,
      course_id: body.course_id || null,
      assigned_students: body.assigned_students || null,
      assigned_by: session.user.id,
      due_date: body.due_date || null,
      title: body.title || null,
      instructions: body.instructions || null,
      estimated_time: body.estimated_time || null,
      published: body.published !== undefined ? body.published : true
    }

    const { data: assignment, error: insertError } = await supabaseAdmin
      .from('lesson_assignments')
      .insert(assignmentData)
      .select(`
        *,
        lesson:lessons(id, title, slug, description, unit, lesson_number, estimated_time)
      `)
      .single()

    if (insertError) {
      console.error('Error creating lesson assignment:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      assignment,
      message: 'Lesson assignment created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Create lesson assignment error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
