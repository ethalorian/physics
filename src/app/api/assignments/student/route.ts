import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'
import { StudentAssignmentFilters } from '@/types/assignment-system'

// GET - Get student assignments (for student view)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userRole = getUserRole(session.user.email)
    
    // Students can only see their own assignments, teachers/admins can see any student's assignments
    let targetStudentId = searchParams.get('student_id')
    
    if (userRole === 'student') {
      // Find student record for this user
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('email', session.user.email)
        .single()

      if (studentError || !student) {
        return NextResponse.json({ error: 'Student record not found' }, { status: 404 })
      }
      
      targetStudentId = student.id
    } else if (!targetStudentId) {
      return NextResponse.json({ error: 'student_id parameter required for admin/teacher' }, { status: 400 })
    }

    const filters: StudentAssignmentFilters = {
      student_id: targetStudentId || undefined,
      course_id: searchParams.get('course_id') || undefined,
      status: searchParams.get('status') || undefined,
      assignment_type: searchParams.get('assignment_type') as 'lesson' | 'assignment' | undefined,
      due_date_from: searchParams.get('due_date_from') || undefined,
      due_date_to: searchParams.get('due_date_to') || undefined,
      overdue_only: searchParams.get('overdue_only') === 'true'
    }

    const results = {
      lesson_assignments: [] as any[],
      assignment_assignments: [] as any[],
      totalCount: 0
    }

    // Fetch lesson assignments if not filtered to assignments only
    if (!filters.assignment_type || filters.assignment_type === 'lesson') {
      let lessonQuery = supabaseAdmin
        .from('student_lesson_assignments')
        .select(`
          id, lesson_assignment_id, student_id, status, started_at, completed_at,
          progress_percentage, time_spent, last_accessed, score, max_score, feedback,
          graded_at, graded_by, created_at, updated_at,
          lesson_assignment:lesson_assignments(
            id, lesson_id, course_id, assigned_by, assigned_at, due_date, 
            title, instructions, estimated_time, is_active, published,
            lesson:lessons(id, title, slug, description, unit, lesson_number, estimated_time, objectives),
            course:courses!lesson_assignments_course_id_fkey(id, name, section)
          ),
          student:students(id, name, email, profile_photo_url)
        `)
        .eq('student_id', targetStudentId)
        .eq('lesson_assignment.is_active', true)
        .eq('lesson_assignment.published', true)
        .order('lesson_assignment.assigned_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        lessonQuery = lessonQuery.eq('status', filters.status)
      }
      if (filters.due_date_from) {
        lessonQuery = lessonQuery.gte('lesson_assignment.due_date', filters.due_date_from)
      }
      if (filters.due_date_to) {
        lessonQuery = lessonQuery.lte('lesson_assignment.due_date', filters.due_date_to)
      }

      const { data: lessonAssignments, error: lessonError } = await lessonQuery

      if (lessonError) {
        console.error('Error fetching student lesson assignments:', lessonError)
      } else {
        let filteredLessonAssignments = lessonAssignments || []
        
        // Apply overdue filter
        if (filters.overdue_only) {
          const now = new Date()
          filteredLessonAssignments = filteredLessonAssignments.filter(assignment => {
            const dueDate = assignment.lesson_assignment?.[0]?.due_date
            return dueDate && new Date(dueDate) < now && assignment.status !== 'completed'
          })
        }

        results.lesson_assignments = filteredLessonAssignments
      }
    }

    // Fetch assignment assignments if not filtered to lessons only
    if (!filters.assignment_type || filters.assignment_type === 'assignment') {
      let assignmentQuery = supabaseAdmin
        .from('student_assignment_assignments')
        .select(`
          id, assignment_assignment_id, student_id, status, started_at, submitted_at,
          attempts_used, current_submission_id, time_spent, last_accessed,
          score, max_score, percentage, feedback, graded_at, graded_by,
          created_at, updated_at,
          assignment_assignment:assignment_assignments(
            id, assignment_id, course_id, assigned_by, assigned_at, due_date,
            title, instructions, max_attempts, time_limit, is_active, published,
            course:courses!assignment_assignments_course_id_fkey(id, name, section)
          ),
          student:students(id, name, email, profile_photo_url)
        `)
        .eq('student_id', targetStudentId)
        .eq('assignment_assignment.is_active', true)
        .eq('assignment_assignment.published', true)
        .order('assignment_assignment.assigned_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        assignmentQuery = assignmentQuery.eq('status', filters.status)
      }
      if (filters.due_date_from) {
        assignmentQuery = assignmentQuery.gte('assignment_assignment.due_date', filters.due_date_from)
      }
      if (filters.due_date_to) {
        assignmentQuery = assignmentQuery.lte('assignment_assignment.due_date', filters.due_date_to)
      }

      const { data: assignmentAssignments, error: assignmentError } = await assignmentQuery

      if (assignmentError) {
        console.error('Error fetching student assignment assignments:', assignmentError)
      } else {
        let filteredAssignmentAssignments = assignmentAssignments || []
        
        // Apply overdue filter
        if (filters.overdue_only) {
          const now = new Date()
          filteredAssignmentAssignments = filteredAssignmentAssignments.filter(assignment => {
            const dueDate = assignment.assignment_assignment?.[0]?.due_date
            return dueDate && new Date(dueDate) < now && !['submitted', 'graded'].includes(assignment.status)
          })
        }

        results.assignment_assignments = filteredAssignmentAssignments
      }
    }

    results.totalCount = results.lesson_assignments.length + results.assignment_assignments.length

    return NextResponse.json(results)

  } catch (error) {
    console.error('Student assignments API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// PUT - Update student assignment status (for progress tracking)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { assignment_type, assignment_id, student_id, ...updateData } = body

    if (!assignment_type || !assignment_id) {
      return NextResponse.json({ 
        error: 'assignment_type and assignment_id are required' 
      }, { status: 400 })
    }

    const userRole = getUserRole(session.user.email)
    let targetStudentId = student_id

    // Students can only update their own assignments
    if (userRole === 'student') {
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('email', session.user.email)
        .single()

      if (studentError || !student) {
        return NextResponse.json({ error: 'Student record not found' }, { status: 404 })
      }
      
      targetStudentId = student.id
    } else if (!targetStudentId) {
      return NextResponse.json({ error: 'student_id required for admin/teacher updates' }, { status: 400 })
    }

    // Prepare update data
    const allowedFields = [
      'status', 'progress_percentage', 'time_spent', 'score', 'max_score', 
      'feedback', 'started_at', 'completed_at', 'submitted_at', 'last_accessed',
      'attempts_used', 'current_submission_id'
    ]
    
    const filteredUpdateData: any = {}
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = updateData[key]
      }
    })

    // Add grading info if score is being set
    if (filteredUpdateData.score !== undefined) {
      filteredUpdateData.graded_at = new Date().toISOString()
      filteredUpdateData.graded_by = session.user.id
    }

    let result
    if (assignment_type === 'lesson') {
      const { data, error } = await supabaseAdmin
        .from('student_lesson_assignments')
        .update(filteredUpdateData)
        .eq('lesson_assignment_id', assignment_id)
        .eq('student_id', targetStudentId)
        .select()
        .single()

      if (error) {
        console.error('Error updating student lesson assignment:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      result = data
    } else if (assignment_type === 'assignment') {
      const { data, error } = await supabaseAdmin
        .from('student_assignment_assignments')
        .update(filteredUpdateData)
        .eq('assignment_assignment_id', assignment_id)
        .eq('student_id', targetStudentId)
        .select()
        .single()

      if (error) {
        console.error('Error updating student assignment assignment:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      result = data
    } else {
      return NextResponse.json({ error: 'Invalid assignment_type' }, { status: 400 })
    }

    return NextResponse.json({ 
      assignment: result,
      message: 'Assignment status updated successfully'
    })

  } catch (error) {
    console.error('Update student assignment error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

