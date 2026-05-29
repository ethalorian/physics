import { NextResponse } from 'next/server'
import { withAuth, withRole } from '@/lib/api-auth'
import { supabase } from '@/lib/supabase'

/**
 * Unified Assignment API
 * Handles all assignment types: lesson, homework, vocabulary, simulation, simulation_embedded
 */

export const GET = withAuth(async (request, ctx) => {
    const userRole = ctx.role
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const assignmentType = searchParams.get('type')
    const courseId = searchParams.get('course_id')
    const published = searchParams.get('published')
    const assignedBy = searchParams.get('assigned_by')

    // Build query
    let query = supabase
      .from('unified_assignments')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (assignmentType) {
      query = query.eq('assignment_type', assignmentType)
    }
    
    if (courseId) {
      query = query.eq('course_id', courseId)
    }
    
    if (published === 'true') {
      query = query.eq('published', true)
    } else if (published === 'false') {
      query = query.eq('published', false)
    }
    
    // Teachers can only see their own assignments (unless admin)
    if (userRole === 'teacher' && !assignedBy) {
      query = query.eq('assigned_by', ctx.email)
    } else if (assignedBy) {
      query = query.eq('assigned_by', assignedBy)
    }

    // Students can only see published assignments assigned to them
    if (userRole === 'student') {
      query = query
        .eq('published', true)
        .or(`course_id.eq.${courseId},assigned_students.cs.{${ctx.userId}}`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assignments: data || [] })
})

export const POST = withRole(['teacher', 'admin'], async (request, ctx) => {
    const body = await request.json()

    // Validation
    if (!body.assignment_type) {
      return NextResponse.json(
        { error: 'Assignment type is required' },
        { status: 400 }
      )
    }

    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!body.course_id && !body.assigned_students?.length) {
      return NextResponse.json(
        { error: 'Must specify either course_id or assigned_students' },
        { status: 400 }
      )
    }

    // Handle reference_id based on type
    let referenceId = body.reference_id

    // For homework type, ensure we have questions
    if (body.assignment_type === 'homework' && !referenceId) {
      if (!body.questions || body.questions.length === 0) {
        return NextResponse.json(
          { error: 'Homework assignments require questions or a reference_id' },
          { status: 400 }
        )
      }
      // Questions will be stored in the submission_data field for now
      // In production, you might want to create a separate homework record first
      referenceId = `homework_${Date.now()}`
    }

    // For simulations, validate the reference exists
    if (body.assignment_type === 'simulation' || body.assignment_type === 'simulation_embedded') {
      if (!referenceId) {
        return NextResponse.json(
          { error: 'Simulation assignments require a simulation reference' },
          { status: 400 }
        )
      }
    }

    // Calculate total assigned students
    let totalAssigned = 0
    if (body.course_id) {
      // Get course student count
      const { data: course } = await supabase
        .from('courses')
        .select('student_count')
        .eq('id', body.course_id)
        .single()
      
      totalAssigned = course?.student_count || 0
    } else if (body.assigned_students) {
      totalAssigned = body.assigned_students.length
    }

    // Create assignment
    const assignmentData = {
      assignment_type: body.assignment_type,
      reference_id: referenceId || null,
      title: body.title,
      description: body.description || null,
      instructions: body.instructions || null,
      course_id: body.course_id || null,
      assigned_students: body.assigned_students || null,
      assigned_at: new Date().toISOString(),
      available_from: body.available_from || new Date().toISOString(),
      due_date: body.due_date || null,
      closes_at: body.closes_at || null,
      max_attempts: body.max_attempts || 1,
      time_limit: body.time_limit || null,
      allow_late_submission: body.allow_late_submission !== false,
      requires_completion: body.requires_completion !== false,
      max_score: body.max_score || body.total_points || null,
      weight: body.weight || 1.0,
      published: body.published !== false,
      assigned_by: ctx.email,
      total_assigned: totalAssigned,
      total_started: 0,
      total_completed: 0,
      total_submitted: 0
    }

    // Insert into database
    const { data: assignment, error } = await supabase
      .from('unified_assignments')
      .insert(assignmentData)
      .select()
      .single()

    if (error) {
      console.error('Error creating assignment:', error)
      
      // Check if table doesn't exist
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database not configured',
            message: 'The unified_assignments table does not exist. Please run the migration.',
            hint: 'Run the create_unified_assignment_hub.sql migration'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create individual student progress records
    if (assignment && (body.course_id || body.assigned_students)) {
      if (body.course_id) {
        // Get all students in the course
        const { data: enrollments } = await supabase
          .from('student_courses')
          .select('student_id, student_email')
          .eq('course_id', body.course_id)
        
        if (enrollments) {
          for (const enrollment of enrollments) {
            const progressData = {
              unified_assignment_id: assignment.id,
              student_id: enrollment.student_id,
              student_email: enrollment.student_email || enrollment.student_id,
              status: 'assigned',
              progress_percentage: 0,
              attempt_number: 1,
              attempts_used: 0,
              time_spent: 0,
              is_late: false,
              is_excused: false,
              needs_attention: false
            }
            
            await supabase
              .from('student_assignment_progress')
              .insert(progressData)
          }
        }
      } else if (body.assigned_students) {
        // Create progress for specific students
        for (const studentId of body.assigned_students) {
          const progressData = {
            unified_assignment_id: assignment.id,
            student_id: studentId,
            student_email: studentId, // Will need to lookup email
            status: 'assigned',
            progress_percentage: 0,
            attempt_number: 1,
            attempts_used: 0,
            time_spent: 0,
            is_late: false,
            is_excused: false,
            needs_attention: false
          }
          
          await supabase
            .from('student_assignment_progress')
            .insert(progressData)
        }
      }
    }

    // Store questions if it's a homework assignment with inline questions
    if (body.assignment_type === 'homework' && body.questions) {
      // Store questions in a separate table or as part of the assignment metadata
      // For now, we'll store them in the assignment record itself
      await supabase
        .from('unified_assignments')
        .update({ 
          submission_data: { questions: body.questions } 
        })
        .eq('id', assignment.id)
    }

    return NextResponse.json(assignment)
})