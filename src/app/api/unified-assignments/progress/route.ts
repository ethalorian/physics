import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'
import { UpdateStudentProgressRequest } from '@/types/unified-assignment'

/**
 * GET /api/unified-assignments/progress
 * Get student progress records with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    const { searchParams } = new URL(request.url)

    const assignmentId = searchParams.get('assignment_id')
    const studentId = searchParams.get('student_id')
    const status = searchParams.get('status')
    const needsGrading = searchParams.get('needs_grading') === 'true'
    const needsAttention = searchParams.get('needs_attention') === 'true'

    // Build query
    let query = supabase
      .from('student_assignment_progress')
      .select(`
        *,
        assignment:unified_assignments!inner(
          id,
          title,
          assignment_type,
          due_date,
          max_score,
          course_id
        ),
        student:students!inner(
          id,
          name,
          email,
          photo_url
        ),
        comments:assignment_comments(
          id,
          commenter_email,
          commenter_name,
          comment_text,
          is_private,
          created_at
        )
      `)

    // Role-based filtering
    if (userRole === 'admin' || userRole === 'teacher') {
      // Teachers see all progress for their assignments
      if (assignmentId) {
        query = query.eq('unified_assignment_id', assignmentId)
      }
      if (studentId) {
        query = query.eq('student_id', studentId)
      }
    } else {
      // Students see only their own progress
      query = query.eq('student_email', session.user.email)
      if (assignmentId) {
        query = query.eq('unified_assignment_id', assignmentId)
      }
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (needsGrading) {
      query = query.in('status', ['submitted'])
    }

    if (needsAttention) {
      query = query.eq('needs_attention', true)
    }

    // Order by last accessed (most recent first)
    query = query.order('last_accessed_at', { ascending: false, nullsFirst: false })
                 .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching progress:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/unified-assignments/progress
 * Update student progress (for students and teachers)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    const body = await request.json()
    const { progress_id, ...updates }: { progress_id: string } & UpdateStudentProgressRequest = body

    if (!progress_id) {
      return NextResponse.json(
        { error: 'progress_id is required' },
        { status: 400 }
      )
    }

    // Get existing progress record
    const { data: existing, error: fetchError } = await supabase
      .from('student_assignment_progress')
      .select('*')
      .eq('id', progress_id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Progress record not found' },
        { status: 404 }
      )
    }

    // Authorization check
    if (userRole === 'student') {
      // Students can only update their own progress
      if (existing.student_email !== session.user.email) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Students cannot set certain fields
      const studentUpdates: Record<string, unknown> = {
        status: updates.status,
        progress_percentage: updates.progress_percentage,
        time_spent: updates.time_spent,
        submission_data: updates.submission_data,
        last_accessed_at: new Date().toISOString()
      }

      // Auto-update timestamps based on status
      if (updates.status === 'started' && !existing.started_at) {
        studentUpdates['started_at'] = new Date().toISOString()
      }
      if (updates.status === 'completed' && !existing.completed_at) {
        studentUpdates['completed_at'] = new Date().toISOString()
      }
      if (updates.status === 'submitted' && !existing.submitted_at) {
        studentUpdates['submitted_at'] = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('student_assignment_progress')
        .update(studentUpdates)
        .eq('id', progress_id)
        .select()
        .single()

      if (error) {
        console.error('Error updating progress:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    } else {
      // Teachers/admins can update all fields including grading
      const teacherUpdates: any = {
        ...updates,
        last_accessed_at: new Date().toISOString()
      }

      // If grading, set graded_at and graded_by
      if (updates.score !== undefined || updates.percentage !== undefined || updates.rubric_scores) {
        teacherUpdates.status = 'graded'
        teacherUpdates.graded_at = new Date().toISOString()
        teacherUpdates.graded_by = session.user.email
      }

      const { data, error } = await supabase
        .from('student_assignment_progress')
        .update(teacherUpdates)
        .eq('id', progress_id)
        .select(`
          *,
          assignment:unified_assignments(
            id,
            title,
            assignment_type,
            due_date,
            max_score
          ),
          student:students(
            id,
            name,
            email,
            photo_url
          )
        `)
        .single()

      if (error) {
        console.error('Error updating progress:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/unified-assignments/progress
 * Create a new progress record (usually done automatically, but can be manual)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { unified_assignment_id, student_id, student_email } = body

    if (!unified_assignment_id || !student_id || !student_email) {
      return NextResponse.json(
        { error: 'Missing required fields: unified_assignment_id, student_id, student_email' },
        { status: 400 }
      )
    }

    // Get assignment details for max_score
    const { data: assignment } = await supabase
      .from('unified_assignments')
      .select('max_score')
      .eq('id', unified_assignment_id)
      .single()

    const progressData = {
      unified_assignment_id,
      student_id,
      student_email,
      status: 'assigned',
      max_score: assignment?.max_score,
      attempt_number: 1
    }

    const { data, error } = await supabase
      .from('student_assignment_progress')
      .insert(progressData)
      .select(`
        *,
        assignment:unified_assignments(
          id,
          title,
          assignment_type,
          due_date,
          max_score
        ),
        student:students(
          id,
          name,
          email,
          photo_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating progress:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

