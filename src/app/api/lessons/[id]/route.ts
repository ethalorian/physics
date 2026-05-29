import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, withRole } from '@/lib/api-auth'

/**
 * GET /api/lessons/[id]
 * Get a single lesson by ID
 */
export const GET = withAuth<{ id: string }>(async (request, ctx) => {
  const params = await ctx.params
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching lesson:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    return NextResponse.json({ lesson: data })
})

/**
 * PUT /api/lessons/[id]
 * Update a lesson (admin/teacher only)
 */
export const PUT = withRole<{ id: string }>(['teacher', 'admin'], async (request, ctx) => {
  const params = await ctx.params
    const body = await request.json()

    // Remove fields that shouldn't be updated directly
    const { id, created_at, created_by, ...updateData } = body

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('lessons')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating lesson:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    return NextResponse.json({ lesson: data })
})

/**
 * DELETE /api/lessons/[id]
 * Delete a lesson (admin/teacher only)
 */
export const DELETE = withRole<{ id: string }>(['teacher', 'admin'], async (request, ctx) => {
  const params = await ctx.params
    console.log(`Attempting to delete lesson with ID: ${params.id}`)

    // First check if the lesson exists - use maybeSingle() to avoid error on no rows
    const { data: existingLesson, error: fetchError } = await supabaseAdmin
      .from('lessons')
      .select('id, title')
      .eq('id', params.id)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching lesson for deletion:', fetchError)
      return NextResponse.json({ error: `Database error: ${fetchError.message}` }, { status: 500 })
    }

    if (!existingLesson) {
      console.log(`Lesson not found with ID: ${params.id}`)
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    console.log(`Found lesson: ${existingLesson.title}`)

    // Check if there are any lesson assignments using this lesson
    const { data: assignments, error: assignmentError } = await supabaseAdmin
      .from('lesson_assignments')
      .select('id')
      .eq('lesson_id', params.id)
      .limit(1)

    // If the lesson_assignments table doesn't exist, that's fine - just continue
    if (assignmentError && !assignmentError.message.includes('does not exist')) {
      console.error('Error checking assignments:', assignmentError)
    }

    if (assignments && assignments.length > 0) {
      // Mark as unpublished instead of deleting if assignments exist
      const { error: updateError } = await supabaseAdmin
        .from('lessons')
        .update({ published: false })
        .eq('id', params.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Lesson has existing assignments and was unpublished instead of deleted',
        unpublished: true
      })
    }

    // Safe to delete
    const { error: deleteError } = await supabaseAdmin
      .from('lessons')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting lesson:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log(`Lesson "${existingLesson.title}" deleted successfully by ${ctx.email}`)

    return NextResponse.json({
      success: true,
      message: 'Lesson deleted successfully'
    })
})

