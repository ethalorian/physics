import { NextResponse } from 'next/server'
import { withAuth, withRole } from '@/lib/api-auth'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/rubrics/assessments - Fetch assessments (teacher/student)
 * POST /api/rubrics/assessments - Create/save assessment (teacher only)
 */

export const GET = withAuth(async (request, ctx) => {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const assignmentId = searchParams.get('assignment_id')
    const rubricId = searchParams.get('rubric_id')

    const userRole = ctx.role

    let query = supabase
      .from('rubric_assessments')
      .select('*')
      .order('graded_at', { ascending: false })

    // Students can only see their own assessments
    if (userRole === 'student') {
      query = query.eq('student_id', ctx.userId || ctx.email)
    } else if (studentId) {
      query = query.eq('student_id', studentId)
    }

    if (assignmentId) {
      query = query.eq('student_simulation_assignment_id', assignmentId)
    }

    if (rubricId) {
      query = query.eq('rubric_id', rubricId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching assessments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assessments: data || [] })
})

export const POST = withRole(['teacher', 'admin'], async (request, ctx) => {
    const body = await request.json()

    // Validation
    if (!body.rubric_id || !body.student_id || !body.student_simulation_assignment_id) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['rubric_id', 'student_id', 'student_simulation_assignment_id']
      }, { status: 400 })
    }

    // Check if assessment already exists
    const { data: existing } = await supabase
      .from('rubric_assessments')
      .select('id')
      .eq('student_simulation_assignment_id', body.student_simulation_assignment_id)
      .single()

    const assessmentData = {
      rubric_id: body.rubric_id,
      student_id: body.student_id,
      student_simulation_assignment_id: body.student_simulation_assignment_id,
      criterion_scores: body.criterion_scores,
      total_score: body.total_score,
      letter_grade: body.letter_grade,
      feedback: body.feedback,
      strengths: body.strengths || [],
      improvements: body.improvements || [],
      graded_by: ctx.email,
      graded_at: new Date().toISOString(),
      auto_graded: body.auto_graded || false,
      manual_override: body.manual_override || false
    }

    let result

    if (existing) {
      // Update existing assessment
      const { data, error } = await supabase
        .from('rubric_assessments')
        .update(assessmentData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating assessment:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      result = data
    } else {
      // Create new assessment
      const { data, error } = await supabase
        .from('rubric_assessments')
        .insert(assessmentData)
        .select()
        .single()

      if (error) {
        console.error('Error creating assessment:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json({ assessment: result }, { status: existing ? 200 : 201 })
})
