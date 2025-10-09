import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/simulations/assignments/submit - Submit or update a simulation assignment
 */

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      .eq('student_email', session.user.email)
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
        // Open response and essay questions need manual or AI grading
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

      // If submitted, trigger AI grading for open response/essay questions
      if (body.submit) {
        await triggerAIGrading(updated.id, assignment, body.answers)
      }

      return NextResponse.json({ submission: updated })

    } else if (!existingSubmission || existingSubmission.status !== 'in_progress') {
      // Check max attempts
      const { data: attempts } = await supabase
        .from('simulation_assignment_submissions')
        .select('attempt_number')
        .eq('assignment_id', body.assignment_id)
        .eq('student_email', session.user.email)
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
          .eq('student_email', session.user.email)
      }

      // Create new submission
      submissionData = {
        assignment_id: body.assignment_id,
        student_id: session.user.id || session.user.email,
        student_email: session.user.email,
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

      // If submitted, trigger AI grading for open response/essay questions
      if (body.submit) {
        await triggerAIGrading(created.id, assignment, body.answers)
      }

      return NextResponse.json({ submission: created }, { status: 201 })
    }

    return NextResponse.json({ 
      error: 'Cannot update submitted assignment'
    }, { status: 403 })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Failed to submit assignment',
      message: error.message 
    }, { status: 500 })
  }
}

// Helper function to trigger AI grading for open response questions
async function triggerAIGrading(submissionId: string, assignment: any, answers: any) {
  try {
    const questions = assignment.questions as any[]
    let additionalScore = 0
    const feedback: any = {}

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      const answer = answers[`question_${i}`]

      if ((question.type === 'open-response' || question.type === 'essay') && 
          question.autoGrade && answer) {
        
        // Call AI grading endpoint
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/grade-open-response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: question.question,
            studentAnswer: answer,
            rubric: question.rubric,
            correctConcepts: question.correctConcepts,
            commonMisconceptions: question.commonMisconceptions,
            maxPoints: question.points,
            gradePrompt: question.gradePrompt
          })
        })

        if (response.ok) {
          const result = await response.json()
          additionalScore += result.score || 0
          feedback[`question_${i}`] = {
            score: result.score,
            maxScore: question.points,
            feedback: result.feedback,
            suggestions: result.suggestions
          }
        }
      }
    }

    // Update submission with AI grading results
    if (Object.keys(feedback).length > 0) {
      const { data: currentSubmission } = await supabase
        .from('simulation_assignment_submissions')
        .select('score')
        .eq('id', submissionId)
        .single()

      const newScore = (currentSubmission?.score || 0) + additionalScore
      const percentage = (newScore / assignment.total_points) * 100

      await supabase
        .from('simulation_assignment_submissions')
        .update({
          score: newScore,
          percentage: percentage,
          feedback: feedback,
          status: 'graded'
        })
        .eq('id', submissionId)
    }
  } catch (error) {
    console.error('Error in AI grading:', error)
    // Don't throw - let submission succeed even if grading fails
  }
}
