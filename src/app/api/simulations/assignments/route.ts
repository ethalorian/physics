import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import { supabase, supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/simulations/assignments - Fetch simulation assignments
 * POST /api/simulations/assignments - Create new simulation assignment
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const simulationSlug = searchParams.get('simulation_slug')
    const simulationId = searchParams.get('simulation_id')
    const published = searchParams.get('published')
    
    const userRole = getUserRole(session.user.email)
    const isAdminOrTeacher = userRole === 'admin' || userRole === 'teacher'
    
    // Use admin client for admin/teacher to bypass RLS, otherwise use regular client
    const client = isAdminOrTeacher ? supabaseAdmin : supabase

    // Build query
    let query = client
      .from('simulation_embedded_assignments')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (simulationSlug) {
      query = query.eq('simulation_slug', simulationSlug)
    }
    
    if (simulationId) {
      query = query.eq('simulation_id', simulationId)
    }

    // Students can only see published assignments
    if (userRole === 'student' || published === 'true') {
      query = query.eq('published', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching simulation assignments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get submission status for student
    if (userRole === 'student' && data && data.length > 0) {
      const assignmentIds = data.map(a => a.id)
      const { data: submissions } = await client
        .from('simulation_assignment_submissions')
        .select('*')
        .in('assignment_id', assignmentIds)
        .eq('student_email', session.user.email)
        .eq('is_latest_attempt', true)

      // Merge submission status with assignments
      const assignmentsWithStatus = data.map(assignment => {
        const submission = submissions?.find(s => s.assignment_id === assignment.id)
        return {
          ...assignment,
          submission: submission || null,
          completed: submission?.status === 'submitted' || submission?.status === 'graded'
        }
      })

      return NextResponse.json({ assignments: assignmentsWithStatus })
    }

    return NextResponse.json({ assignments: data || [] })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch simulation assignments',
      message: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin/Teacher only
    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validation
    if (!body.simulation_slug) {
      return NextResponse.json({ 
        error: 'Missing required field: simulation_slug'
      }, { status: 400 })
    }

    if (!body.title) {
      return NextResponse.json({ 
        error: 'Missing required field: title'
      }, { status: 400 })
    }

    if (!body.questions || !Array.isArray(body.questions)) {
      return NextResponse.json({ 
        error: 'Questions must be an array'
      }, { status: 400 })
    }

    // Calculate total points
    const totalPoints = body.questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0)

    // Create assignment data
    const assignmentData = {
      simulation_slug: body.simulation_slug,
      simulation_id: body.simulation_id || null,
      title: body.title,
      description: body.description || null,
      instructions: body.instructions || null,
      questions: body.questions,
      total_points: totalPoints,
      show_on_start: body.show_on_start || false,
      show_on_complete: body.show_on_complete || false,
      allow_skip: body.allow_skip !== false,
      required_for_progress: body.required_for_progress || false,
      time_limit: body.time_limit || null,
      available_after: body.available_after || 0,
      max_attempts: body.max_attempts || 1,
      allow_late_submission: body.allow_late_submission !== false,
      published: body.published !== false,
      created_by: session.user.email
    }

    const { data: assignment, error } = await supabaseAdmin
      .from('simulation_embedded_assignments')
      .insert(assignmentData)
      .select()
      .single()

    if (error) {
      console.error('Error creating simulation assignment:', error)
      
      // Check if duplicate
      if (error.message?.includes('duplicate')) {
        return NextResponse.json({ 
          error: 'An assignment with this title already exists for this simulation'
        }, { status: 409 })
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assignment }, { status: 201 })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Failed to create simulation assignment',
      message: error.message 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin/Teacher only
    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ 
        error: 'Missing required field: id'
      }, { status: 400 })
    }

    // Calculate total points if questions are updated
    const updates = { ...body }
    delete updates.id
    
    if (updates.questions) {
      updates.total_points = updates.questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0)
    }

    const { data: assignment, error } = await supabaseAdmin
      .from('simulation_embedded_assignments')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating simulation assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assignment })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Failed to update simulation assignment',
      message: error.message 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin only
    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ 
        error: 'Missing required parameter: id'
      }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('simulation_embedded_assignments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting simulation assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete simulation assignment',
      message: error.message 
    }, { status: 500 })
  }
}
