// Next.js imports
import { NextResponse } from 'next/server'

// Internal imports
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, withRole } from '@/lib/api-auth'
import { getTeacherStudentGids } from '@/lib/teacher-scope'
import { Submission } from '@/types/assignment'

// GET - Fetch submissions
export const GET = withAuth(async (request, ctx) => {
    const userRole = ctx.role
    const { searchParams } = new URL(request.url)

    // Filter parameters
    const assignmentId = searchParams.get('assignment_id')
    const userId = searchParams.get('user_id')
    const status = searchParams.get('status')

    // Build query
    let query = supabaseAdmin
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })

    // Students can only see their own submissions.
    if (userRole === 'student') {
      query = query.eq('user_id', ctx.userId)
    } else if (userRole === 'teacher') {
      // Teachers are constrained to their own roster — they may narrow to a
      // single student only if that student is on their roster.
      const rosterGids = await getTeacherStudentGids(ctx.email)
      if (userId) {
        if (!rosterGids.includes(userId)) {
          return NextResponse.json({ error: 'Forbidden - student not in your roster' }, { status: 403 })
        }
        query = query.eq('user_id', userId)
      } else {
        query = query.in('user_id', rosterGids)
      }
    } else if (userId) {
      // Admins are unrestricted; may filter by any student.
      query = query.eq('user_id', userId)
    }

    // Filter by assignment
    if (assignmentId) {
      query = query.eq('assignment_id', assignmentId)
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status)
    }

    const { data: submissions, error } = await query

    if (error) {
      console.error('Error fetching submissions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(submissions || [])
})

// POST - Create new submission (or update existing)
export const POST = withAuth(async (request, ctx) => {
    const body = await request.json()

    // Validate required fields
    if (!body.assignment_id || !body.answers) {
      return NextResponse.json(
        { error: 'Missing required fields: assignment_id and answers' },
        { status: 400 }
      )
    }

    // Prepare submission data
    const submissionData: any = {
      assignment_id: body.assignment_id,
      user_id: ctx.userId,
      answers: body.answers,
      score: body.score || null,
      max_score: body.max_score || null,
      feedback: body.feedback || {},
      rubric_grades: body.rubric_grades || [],
      status: body.status || 'partial',
      submitted_at: body.status === 'submitted' || body.status === 'graded' 
        ? (body.submitted_at || new Date().toISOString())
        : null,
      graded_at: body.status === 'graded' 
        ? (body.graded_at || new Date().toISOString())
        : null
    }

    // Use upsert (insert or update if exists)
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .upsert(submissionData, {
        onConflict: 'assignment_id,user_id'  // Update if this combination exists
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating/updating submission:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
})

// PUT - Update submission (for grading)
export const PUT = withAuth(async (request, ctx) => {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 })
    }

    // Check permissions - only teachers/admins or submission owner can update
    const userRole = ctx.role

    if (userRole === 'student') {
      // Students can only update their own submissions and only if not yet submitted
      const { data: existingSubmission } = await supabaseAdmin
        .from('submissions')
        .select('user_id, status')
        .eq('id', id)
        .single()

      if (!existingSubmission || existingSubmission.user_id !== ctx.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if (existingSubmission.status !== 'partial') {
        return NextResponse.json(
          { error: 'Cannot update submitted assignment' },
          { status: 403 }
        )
      }
    }

    // Update graded_at if status changed to graded
    if (updates.status === 'graded' && !updates.graded_at) {
      updates.graded_at = new Date().toISOString()
    }

    // Update submission
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating submission:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json(data)
})

// DELETE - Delete submission (teachers/admins only)
export const DELETE = withRole(['teacher', 'admin'], async (request) => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 })
    }

    // Delete submission
    const { error } = await supabaseAdmin
      .from('submissions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting submission:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Submission deleted' })
})

