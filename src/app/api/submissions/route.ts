// Next.js imports
import { NextRequest, NextResponse } from 'next/server'

// Internal imports
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'
import { Submission } from '@/types/assignment'

// GET - Fetch submissions
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
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

    // Students can only see their own submissions
    if (userRole === 'student') {
      query = query.eq('user_id', session.user.id)
    } else if (userId) {
      // Teachers/admins can filter by student
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

  } catch (error) {
    console.error('Error in GET /api/submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new submission (or update existing)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      user_id: session.user.id,
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

  } catch (error) {
    console.error('Error in POST /api/submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update submission (for grading)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 })
    }

    // Check permissions - only teachers/admins or submission owner can update
    const userRole = getUserRole(session.user.email)
    
    if (userRole === 'student') {
      // Students can only update their own submissions and only if not yet submitted
      const { data: existingSubmission } = await supabaseAdmin
        .from('submissions')
        .select('user_id, status')
        .eq('id', id)
        .single()

      if (!existingSubmission || existingSubmission.user_id !== session.user.id) {
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

  } catch (error) {
    console.error('Error in PUT /api/submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete submission
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only teachers/admins can delete submissions
    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json(
        { error: 'Forbidden: Only teachers/admins can delete submissions' },
        { status: 403 }
      )
    }

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

  } catch (error) {
    console.error('Error in DELETE /api/submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

