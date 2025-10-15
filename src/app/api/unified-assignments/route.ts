import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'
import { CreateUnifiedAssignmentRequest, AssignmentFilters } from '@/types/unified-assignment'

/**
 * GET /api/unified-assignments
 * Fetch unified assignments with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    const { searchParams } = new URL(request.url)

    // Parse filters
    const filters: AssignmentFilters = {
      assignment_type: searchParams.get('assignment_type') as any,
      course_id: searchParams.get('course_id') || undefined,
      student_id: searchParams.get('student_id') || undefined,
      status: searchParams.get('status') as any,
      due_before: searchParams.get('due_before') || undefined,
      due_after: searchParams.get('due_after') || undefined,
      search_query: searchParams.get('search') || undefined,
      include_drafts: searchParams.get('include_drafts') === 'true',
      overdue_only: searchParams.get('overdue_only') === 'true',
      needs_grading: searchParams.get('needs_grading') === 'true'
    }

    // Build query based on user role
    let query = supabase
      .from('unified_assignments')
      .select(`
        *,
        course:courses!inner(
          id,
          name,
          google_course_id
        ),
        tags:assignment_tags(
          id,
          tag_name,
          tag_category
        )
      `)

    // Teachers see their own assignments
    if (userRole === 'admin' || userRole === 'teacher') {
      if (!filters.include_drafts) {
        query = query.eq('published', true)
      }
      query = query.eq('assigned_by', session.user.email)
    } else {
      // Students see only their assigned assignments
      query = query
        .eq('published', true)
        .in('id', 
          supabase
            .from('student_assignment_progress')
            .select('unified_assignment_id')
            .eq('student_email', session.user.email)
        )
    }

    // Apply filters
    if (filters.assignment_type) {
      if (Array.isArray(filters.assignment_type)) {
        query = query.in('assignment_type', filters.assignment_type)
      } else {
        query = query.eq('assignment_type', filters.assignment_type)
      }
    }

    if (filters.course_id) {
      query = query.eq('course_id', filters.course_id)
    }

    if (filters.due_before) {
      query = query.lte('due_date', filters.due_before)
    }

    if (filters.due_after) {
      query = query.gte('due_date', filters.due_after)
    }

    if (filters.overdue_only) {
      query = query
        .lt('due_date', new Date().toISOString())
        .not('due_date', 'is', null)
    }

    if (filters.search_query) {
      query = query.or(`title.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`)
    }

    // Order by due date (upcoming first) then created date
    query = query.order('due_date', { ascending: true, nullsFirst: false })
                 .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching unified assignments:', error)
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
 * POST /api/unified-assignments
 * Create a new unified assignment
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

    const body: CreateUnifiedAssignmentRequest = await request.json()

    // Validate required fields
    if (!body.assignment_type || !body.reference_id || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: assignment_type, reference_id, title' },
        { status: 400 }
      )
    }

    // Must assign to either a course or specific students
    if (!body.course_id && (!body.assigned_students || body.assigned_students.length === 0)) {
      return NextResponse.json(
        { error: 'Must assign to either a course_id or assigned_students' },
        { status: 400 }
      )
    }

    // Prepare assignment data
    const assignmentData = {
      assignment_type: body.assignment_type,
      reference_id: body.reference_id,
      title: body.title,
      description: body.description,
      instructions: body.instructions,
      course_id: body.course_id,
      assigned_students: body.assigned_students,
      available_from: body.available_from || new Date().toISOString(),
      due_date: body.due_date,
      closes_at: body.closes_at,
      max_attempts: body.max_attempts || 1,
      time_limit: body.time_limit,
      allow_late_submission: body.allow_late_submission ?? true,
      requires_completion: body.requires_completion ?? true,
      max_score: body.max_score,
      weight: body.weight || 1.0,
      published: body.published ?? false,
      assigned_by: session.user.email
    }

    // Create the assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('unified_assignments')
      .insert(assignmentData)
      .select(`
        *,
        course:courses(
          id,
          name,
          google_course_id
        )
      `)
      .single()

    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError)
      return NextResponse.json(
        { error: assignmentError.message },
        { status: 500 }
      )
    }

    // Create tags if provided
    if (body.tags && body.tags.length > 0) {
      const tagData = body.tags.map(tag => ({
        unified_assignment_id: assignment.id,
        tag_name: tag,
        tag_category: 'custom'
      }))

      await supabase
        .from('assignment_tags')
        .insert(tagData)
    }

    // Trigger will automatically create student_assignment_progress records

    return NextResponse.json(assignment, { status: 201 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/unified-assignments
 * Update an existing unified assignment
 */
export async function PUT(request: NextRequest) {
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
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('unified_assignments')
      .select('assigned_by')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    if (existing.assigned_by !== session.user.email && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'You can only update your own assignments' },
        { status: 403 }
      )
    }

    // Update the assignment
    const { data, error } = await supabase
      .from('unified_assignments')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        course:courses(
          id,
          name,
          google_course_id
        ),
        tags:assignment_tags(
          id,
          tag_name,
          tag_category
        )
      `)
      .single()

    if (error) {
      console.error('Error updating assignment:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/unified-assignments
 * Delete a unified assignment
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('unified_assignments')
      .select('assigned_by')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    if (existing.assigned_by !== session.user.email && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'You can only delete your own assignments' },
        { status: 403 }
      )
    }

    // Delete the assignment (cascade will delete related records)
    const { error } = await supabase
      .from('unified_assignments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting assignment:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

