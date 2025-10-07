import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// GET - Get specific lesson assignment
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Admin/Teacher access required' }, { status: 403 })
    }

    const { data: assignment, error } = await supabaseAdmin
      .from('lesson_assignments')
      .select(`
        *,
        lesson:lessons(id, title, slug, description, unit, lesson_number, estimated_time, objectives),
        student_assignments:student_lesson_assignments(
          id, student_id, status, started_at, completed_at, progress_percentage, 
          time_spent, last_accessed, score, max_score, feedback,
          student:students(id, name, email, profile_photo_url)
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching lesson assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return NextResponse.json({ assignment })

  } catch (error) {
    console.error('Get lesson assignment error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// PUT - Update lesson assignment
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Admin/Teacher access required' }, { status: 403 })
    }

    const body = await request.json()

    // Get existing assignment to check permissions
    const { data: existingAssignment, error: fetchError } = await supabaseAdmin
      .from('lesson_assignments')
      .select('id, assigned_by')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Only allow the creator or admin to update
    if (userRole !== 'admin' && existingAssignment.assigned_by !== session.user.id) {
      return NextResponse.json({ 
        error: 'Forbidden - Can only update your own assignments' 
      }, { status: 403 })
    }

    // Prepare update data (only allow certain fields to be updated)
    const updateData: any = {}
    
    if (body.due_date !== undefined) updateData.due_date = body.due_date
    if (body.title !== undefined) updateData.title = body.title
    if (body.instructions !== undefined) updateData.instructions = body.instructions
    if (body.estimated_time !== undefined) updateData.estimated_time = body.estimated_time
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.published !== undefined) updateData.published = body.published

    const { data: assignment, error: updateError } = await supabaseAdmin
      .from('lesson_assignments')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        lesson:lessons(id, title, slug, description, unit, lesson_number, estimated_time)
      `)
      .single()

    if (updateError) {
      console.error('Error updating lesson assignment:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      assignment,
      message: 'Assignment updated successfully'
    })

  } catch (error) {
    console.error('Update lesson assignment error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// DELETE - Delete lesson assignment
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Admin/Teacher access required' }, { status: 403 })
    }

    // Get existing assignment to check permissions
    const { data: existingAssignment, error: fetchError } = await supabaseAdmin
      .from('lesson_assignments')
      .select('id, assigned_by, total_started')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Only allow the creator or admin to delete
    if (userRole !== 'admin' && existingAssignment.assigned_by !== session.user.id) {
      return NextResponse.json({ 
        error: 'Forbidden - Can only delete your own assignments' 
      }, { status: 403 })
    }

    // Check if any students have started the assignment
    if (existingAssignment.total_started > 0) {
      // Instead of deleting, mark as inactive
      const { error: updateError } = await supabaseAdmin
        .from('lesson_assignments')
        .update({ is_active: false, published: false })
        .eq('id', params.id)

      if (updateError) {
        console.error('Error deactivating lesson assignment:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Assignment deactivated (students had already started)'
      })
    } else {
      // Safe to delete since no one has started
      const { error: deleteError } = await supabaseAdmin
        .from('lesson_assignments')
        .delete()
        .eq('id', params.id)

      if (deleteError) {
        console.error('Error deleting lesson assignment:', deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Assignment deleted successfully'
      })
    }

  } catch (error) {
    console.error('Delete lesson assignment error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
