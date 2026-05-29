import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-auth'

/**
 * POST /api/simulations/assignments/submit - Submit or update a simulation assignment
 */

export const POST = withAuth(async (request, ctx) => {
    const body = await request.json()

    // Validation
    if (!body.assignment_id) {
      return NextResponse.json({ 
        error: 'Missing required field: assignment_id'
      }, { status: 400 })
    }

    if (!body.answers) {
      return NextResponse.json({ 
        error: 'Missing required field: answers'
      }, { status: 400 })
    }

    // Get assignment details to calculate score
    const { data: assignment, error: assignmentError } = await supabase
      .from('simulation_embedded_assignments')
      .select('*')
      .eq('id', body.assignment_id)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json({ 
        error: 'Assignment not found'
      }, { status: 404 })
    }

    // Check for existing submission
    const { data: existingSubmission } = await supabase
      .from('simulation_assignment_submissions')
      .select('*')
      .eq('assignment_id', body.assignment_id)
      .eq('student_email', ctx.email)
      .eq('is_latest_attempt', true)
      .single()

    let submissionData: any
    let score = 0
    const questions = assignment.questions as any[]

    // Auto-grade multiple choice and numerical questions
    if (body.submit) {
      questions.forEach((question: any, index: number) => {
        const answer = body.answers[`question_${index}`]
        
        if (question.type === 'multiple-choice') {
          if (answer === question.correctAnswer) {
            score += question.points || 0
          }
        } else if (question.type === 'numerical') {
          const numAnswer = parseFloat(answer)
          const correctValue = question.correctValue
          const tolerance = question.tolerance || 0.01
          
          if (!isNaN(numAnswer) && Math.abs(numAnswer - correctValue) <= tolerance) {
            score += question.points || 0
          }
        }
        // Open response questions need manual or AI grading
      })
    }

    if (existingSubmission && existingSubmission.status === 'in_progress') {
      // Update existing submission
      submissionData = {
        answers: body.answers,
        time_spent: existingSubmission.time_spent + (body.time_spent || 0),
        simulation_data: body.simulation_data || existingSubmission.simulation_data,
        simulation_completed: body.simulation_completed || existingSubmission.simulation_completed,
        ...(body.submit && {
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          score: score,
          max_score: assignment.total_points,
          percentage: (score / assignment.total_points) * 100
        })
      }

      const { data: updated, error: updateError } = await supabase
        .from('simulation_assignment_submissions')
        .update(submissionData)
        .eq('id', existingSubmission.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating submission:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ submission: updated })

    } else if (!existingSubmission || existingSubmission.status !== 'in_progress') {
      // Check max attempts
      const { data: attempts } = await supabase
        .from('simulation_assignment_submissions')
        .select('attempt_number')
        .eq('assignment_id', body.assignment_id)
        .eq('student_email', ctx.email)
        .order('attempt_number', { ascending: false })
        .limit(1)

      const nextAttempt = (attempts && attempts[0]?.attempt_number || 0) + 1

      if (nextAttempt > assignment.max_attempts) {
        return NextResponse.json({ 
          error: 'Maximum attempts exceeded'
        }, { status: 403 })
      }

      // Mark previous attempts as not latest
      if (attempts && attempts.length > 0) {
        await supabase
          .from('simulation_assignment_submissions')
          .update({ is_latest_attempt: false })
          .eq('assignment_id', body.assignment_id)
          .eq('student_email', ctx.email)
      }

      // Create new submission
      submissionData = {
        assignment_id: body.assignment_id,
        student_id: ctx.userId || ctx.email,
        student_email: ctx.email,
        answers: body.answers,
        attempt_number: nextAttempt,
        is_latest_attempt: true,
        time_spent: body.time_spent || 0,
        simulation_data: body.simulation_data || null,
        simulation_completed: body.simulation_completed || false,
        ...(body.submit && {
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          score: score,
          max_score: assignment.total_points,
          percentage: (score / assignment.total_points) * 100
        })
      }

      const { data: created, error: createError } = await supabase
        .from('simulation_assignment_submissions')
        .insert(submissionData)
        .select()
        .single()

      if (createError) {
        console.error('Error creating submission:', createError)
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      return NextResponse.json({ submission: created }, { status: 201 })
    }

    return NextResponse.json({
      error: 'Cannot update submitted assignment'
    }, { status: 403 })
})
