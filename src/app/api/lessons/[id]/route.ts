import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, withContentEditor } from '@/lib/api-auth'
import { seiLint } from '@/lib/sei'
import type { ContentBlock } from '@/data/content-blocks'

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
export const PUT = withContentEditor<{ id: string }>('lessons', async (request, ctx) => {
  const params = await ctx.params
    const body = await request.json()

    // Remove fields that shouldn't be updated directly
    const { id, created_at, created_by, ...updateData } = body

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString()

    // Guardrail: refuse to publish a lesson that has no learning target. Without a
    // target the control room can't open or grade that lesson's work (the cell is
    // dead and the drawer can't resolve the work), so a published-but-targetless
    // lesson silently strands student work — and, in Unit 8, blocks car-part grants.
    if (updateData.published === true) {
      const { count } = await supabaseAdmin
        .from('learning_targets')
        .select('id', { count: 'exact', head: true })
        .eq('lesson_id', params.id)
      if (!count) {
        return NextResponse.json(
          { error: 'Cannot publish: this lesson has no learning target. Add at least one learning target first — without it, students’ work can’t be opened or graded in the control room.' },
          { status: 422 },
        )
      }

      // SEI authoring rule (design "SEI in Blocks"): a capture block with no
      // visual, no frame, or Tier 2 terms missing from the lesson's vocab set
      // does not publish for program `projects`; other programs get warnings
      // back (the asteroid course predates the rule). Blocks come from the body
      // when the save carries them, else from the stored row.
      const { data: cur } = await supabaseAdmin.from('lessons').select('unit_id, content_blocks').eq('id', params.id).maybeSingle()
      const curRow = cur as { unit_id: string | null; content_blocks: { blocks?: ContentBlock[] } | null } | null
      const doc = (updateData.content_blocks as { blocks?: ContentBlock[] } | undefined) ?? curRow?.content_blocks ?? null
      const blocks = Array.isArray(doc?.blocks) ? doc!.blocks! : []
      if (blocks.length > 0) {
        const [{ data: unitRow }, { data: setRow }] = await Promise.all([
          curRow?.unit_id ? supabaseAdmin.from('units').select('program').eq('id', curRow.unit_id).maybeSingle() : Promise.resolve({ data: null }),
          supabaseAdmin.from('vocabulary_sets').select('id').eq('lesson_id', params.id).maybeSingle(),
        ])
        let vocab: string[] = []
        const setId = (setRow as { id: string } | null)?.id
        if (setId) {
          const { data: terms } = await supabaseAdmin.from('vocabulary_terms').select('term').eq('vocabulary_set_id', setId)
          vocab = ((terms ?? []) as { term: string }[]).map((t) => t.term)
        }
        const issues = seiLint(blocks, vocab)
        const program = (unitRow as { program?: string } | null)?.program ?? 'physics'
        if (issues.length > 0 && program === 'projects') {
          return NextResponse.json(
            { error: `Cannot publish: ${issues.length} capture block${issues.length === 1 ? '' : 's'} fail the SEI rule (every capture block needs a visual and a frame, and its Tier 2 terms must be in the lesson vocab). Fix them in the builder or add sei{} to the block.`, sei_issues: issues },
            { status: 422 },
          )
        }
        if (issues.length > 0) updateData.__sei_warnings = issues
      }
    }
    const seiWarnings = updateData.__sei_warnings as unknown[] | undefined
    delete updateData.__sei_warnings

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

    return NextResponse.json(seiWarnings && seiWarnings.length > 0 ? { lesson: data, sei_warnings: seiWarnings } : { lesson: data })
})

/**
 * DELETE /api/lessons/[id]
 * Delete a lesson (admin/teacher only)
 */
export const DELETE = withContentEditor<{ id: string }>('lessons', async (request, ctx) => {
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

