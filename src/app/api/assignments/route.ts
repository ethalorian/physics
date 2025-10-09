// Next.js imports
import { NextRequest, NextResponse } from 'next/server'

// Internal imports
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'
import { Assignment } from '@/types/assignment'

// GET - Fetch assignments
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    const { searchParams } = new URL(request.url)
    
    // Filter parameters
    const published = searchParams.get('published')
    const lessonId = searchParams.get('lesson_id')
    const includeStats = searchParams.get('include_stats') === 'true'

    // Build query
    let query = supabaseAdmin
      .from('assignments')
      .select(`
        *,
        lesson:lessons(id, title, slug)
      `)
      .order('created_at', { ascending: false })

    // Students can only see published assignments
    if (userRole === 'student') {
      query = query.eq('published', true)
    } else if (published !== null) {
      // Teachers/admins can filter by published status
      query = query.eq('published', published === 'true')
    }

    // Filter by lesson
    if (lessonId) {
      query = query.eq('lesson_id', lessonId)
    }

    const { data: assignments, error } = await query

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If stats requested, fetch submission counts
    if (includeStats && (userRole === 'admin' || userRole === 'teacher')) {
      const assignmentsWithStats = await Promise.all(
        (assignments || []).map(async (assignment) => {
          const { data: stats } = await supabaseAdmin
            .rpc('calculate_assignment_stats', { assignment_uuid: assignment.id })
            .single()

          return {
            ...assignment,
            stats: stats || {
              total_submissions: 0,
              submitted_count: 0,
              graded_count: 0,
              average_score: null,
              completion_rate: null
            }
          }
        })
      )

      return NextResponse.json(assignmentsWithStats)
    }

    return NextResponse.json(assignments || [])

  } catch (error) {
    console.error('Error in GET /api/assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new assignment
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json(
        { error: 'Forbidden: Only teachers/admins can create assignments' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.questions || !Array.isArray(body.questions)) {
      return NextResponse.json(
        { error: 'Missing required fields: title and questions' },
        { status: 400 }
      )
    }

    // Calculate total points
    const total_points = body.questions.reduce(
      (sum: number, q: any) => sum + (q.points || 0),
      0
    )

    // Prepare assignment data
    const assignmentData = {
      title: body.title,
      description: body.description || null,
      instructions: body.instructions || null,
      questions: body.questions,
      total_points,
      lesson_id: (body.lesson_id && body.lesson_id !== '') ? body.lesson_id : null,
      due_date: body.due_date || null,
      published: body.published || false,
      created_by: session.user.email
    }

    // Insert into database
    const { data, error } = await supabaseAdmin
      .from('assignments')
      .insert([assignmentData])
      .select(`
        *,
        lesson:lessons(id, title, slug)
      `)
      .single()

    if (error) {
      console.error('Error creating assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update assignment
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json(
        { error: 'Forbidden: Only teachers/admins can update assignments' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    // Recalculate total points if questions changed
    if (updates.questions && Array.isArray(updates.questions)) {
      updates.total_points = updates.questions.reduce(
        (sum: number, q: any) => sum + (q.points || 0),
        0
      )
    }

    // Update assignment
    const { data, error } = await supabaseAdmin
      .from('assignments')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        lesson:lessons(id, title, slug)
      `)
      .single()

    if (error) {
      console.error('Error updating assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in PUT /api/assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete assignment
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json(
        { error: 'Forbidden: Only teachers/admins can delete assignments' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    // Delete assignment (submissions will cascade delete)
    const { error } = await supabaseAdmin
      .from('assignments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Assignment deleted' })

  } catch (error) {
    console.error('Error in DELETE /api/assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

