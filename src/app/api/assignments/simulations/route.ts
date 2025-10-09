import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/assignments/simulations - Fetch simulation assignments
 * POST /api/assignments/simulations - Create new simulation assignment
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')
    const studentId = searchParams.get('student_id')
    const published = searchParams.get('published')

    const userRole = getUserRole(session.user.email)

    // Build query
    let query = supabase
      .from('simulation_assignments')
      .select(`
        *,
        simulation:simulations(*),
        course:courses(id, name, section, student_count)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    if (published === 'true') {
      query = query.eq('published', true)
    }

    // Students can only see assignments assigned to them
    if (userRole === 'student') {
      query = query.or(`course_id.eq.${courseId},assigned_students.cs.{${session.user.id}}`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching simulation assignments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
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
    if (!body.simulation_id) {
      return NextResponse.json({ 
        error: 'Missing required field: simulation_id'
      }, { status: 400 })
    }

    if (!body.course_id && !body.assigned_students?.length) {
      return NextResponse.json({ 
        error: 'Must specify either course_id or assigned_students'
      }, { status: 400 })
    }

    // Get simulation details
    const { data: simulation } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', body.simulation_id)
      .single()

    if (!simulation) {
      return NextResponse.json({ 
        error: 'Simulation not found'
      }, { status: 404 })
    }

    // Count assigned students
    let totalAssigned = 0
    if (body.course_id) {
      const { data: course } = await supabase
        .from('courses')
        .select('student_count')
        .eq('id', body.course_id)
        .single()
      
      totalAssigned = course?.student_count || 0
    } else if (body.assigned_students) {
      totalAssigned = body.assigned_students.length
    }

    // Create simulation assignment
    const assignmentData = {
      simulation_id: body.simulation_id,
      course_id: body.course_id || null,
      assigned_students: body.assigned_students || null,
      assigned_by: session.user.email,
      assigned_at: new Date().toISOString(),
      due_date: body.due_date || null,
      title: body.title || simulation.title,
      instructions: body.instructions || null,
      min_time_required: body.min_time_required || simulation.estimated_time,
      requires_data_export: body.requires_data_export || false,
      rubric_id: body.rubric_id || null,
      is_active: true,
      published: body.published !== false,
      total_assigned: totalAssigned,
      total_started: 0,
      total_completed: 0,
      total_submitted: 0
    }

    const { data: assignment, error } = await supabase
      .from('simulation_assignments')
      .insert(assignmentData)
      .select(`
        *,
        simulation:simulations(*),
        course:courses(*)
      `)
      .single()

    if (error) {
      console.error('Error creating simulation assignment:', error)
      
      // Check if table doesn't exist
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database not set up',
          message: 'The simulation_assignments table does not exist. Please run the database migration.',
          hint: 'Contact your administrator to set up the simulation assignment system'
        }, { status: 500 })
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create individual student assignment records
    if (body.course_id) {
      // Get all students in course
      const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('course_id', body.course_id)
        .eq('enrollment_state', 'ACTIVE')

      if (students && students.length > 0) {
        const studentAssignments = students.map(student => ({
          simulation_assignment_id: assignment.id,
          student_id: student.id,
          status: 'assigned',
          simulation_completed: false,
          time_spent_in_simulation: 0,
          interactions_count: 0,
          data_exported: false,
          total_time_spent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        await supabase
          .from('student_simulation_assignments')
          .insert(studentAssignments)
      }
    } else if (body.assigned_students) {
      // Create records for individual students
      const studentAssignments = body.assigned_students.map((studentId: string) => ({
        simulation_assignment_id: assignment.id,
        student_id: studentId,
        status: 'assigned',
        simulation_completed: false,
        time_spent_in_simulation: 0,
        interactions_count: 0,
        data_exported: false,
        total_time_spent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      await supabase
        .from('student_simulation_assignments')
        .insert(studentAssignments)
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

