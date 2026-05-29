import { NextResponse } from 'next/server'
import { withAuth, withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Retrieve assignment submissions (admin/teacher only)
export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignment_id')
    const studentEmail = searchParams.get('student_email')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabaseAdmin
      .from('assignment_submissions')
      .select('*')
      .order('time_submitted', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (assignmentId) {
      query = query.eq('assignment_id', assignmentId)
    }
    if (studentEmail) {
      query = query.eq('user_email', studentEmail)
    }

    const { data: submissions, error } = await query

    if (error) {
      console.error('Error fetching assignment submissions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ submissions })
})

// POST - Record assignment submission
export const POST = withAuth(async (request, ctx) => {
    const body = await request.json()
    const {
      assignment_id,
      submission_data,
      score,
      max_score,
      time_started,
      time_spent,
      question_scores
    } = body

    // Validate required fields
    if (!assignment_id || !submission_data) {
      return NextResponse.json({ error: 'assignment_id and submission_data are required' }, { status: 400 })
    }

    // Use the database function to record submission
    const { data, error } = await supabaseAdmin
      .rpc('record_assignment_submission', {
        p_assignment_id: assignment_id,
        p_user_id: ctx.userId || ctx.email,
        p_user_email: ctx.email,
        p_user_name: ctx.session.user.name || 'Unknown User',
        p_submission_data: submission_data,
        p_score: score || null,
        p_max_score: max_score || null,
        p_time_started: time_started || null,
        p_time_spent: time_spent || null
      })

    if (error) {
      console.error('Error recording assignment submission:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If question scores provided, update the submission record
    if (question_scores && data) {
      const { error: updateError } = await supabaseAdmin
        .from('assignment_submissions')
        .update({ question_scores })
        .eq('id', data)

      if (updateError) {
        console.error('Error updating question scores:', updateError)
      }
    }

    return NextResponse.json({ success: true, submission_id: data })
})

// PUT - Update assignment submission (for grading)
export const PUT = withRole(['teacher', 'admin'], async (request, ctx) => {
    const body = await request.json()
    const {
      submission_id,
      score,
      max_score,
      feedback,
      question_scores
    } = body

    if (!submission_id) {
      return NextResponse.json({ error: 'submission_id is required' }, { status: 400 })
    }

    const updates: any = {
      updated_at: new Date().toISOString()
    }

    if (score !== undefined) updates.score = score
    if (max_score !== undefined) updates.max_score = max_score
    if (feedback !== undefined) updates.feedback = feedback
    if (question_scores !== undefined) updates.question_scores = question_scores

    // Calculate percentage if both scores provided
    if (score !== undefined && max_score !== undefined && max_score > 0) {
      updates.percentage = (score / max_score) * 100
    }

    // Mark as manually graded
    if (score !== undefined || feedback !== undefined) {
      updates.manually_graded = true
      updates.graded_by = ctx.userId || ctx.email
      updates.graded_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('assignment_submissions')
      .update(updates)
      .eq('id', submission_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating assignment submission:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, submission: data })
})
