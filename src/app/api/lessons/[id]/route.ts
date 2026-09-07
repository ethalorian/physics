import { authorizeLesson, lessonForReader } from '@/lib/lesson-access'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, withContentEditor } from '@/lib/api-auth'
import { seiLint } from '@/lib/sei'
import { targetIdsForLesson } from '@/lib/lesson-targets'
import { remainsPublished, validateBlockDocument } from '@/data/block-registry'
import type { ContentBlock } from '@/data/content-blocks'

/**
 * GET /api/lessons/[id]
 * Get a single lesson by ID
 */
export const GET = withAuth<{ id: string }>(async (request, ctx) => {
  const { id } = await ctx.params
  const access = await authorizeLesson(ctx, id)
  if (!access.ok) return access.response
  return NextResponse.json({ lesson: access.viewer.role === 'admin' ? { ...access.lesson, content_blocks: access.document } : lessonForReader(access.lesson, access.document) })
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

    const { data: current, error: currentError } = await supabaseAdmin.from('lessons').select('published, unit_id, content_blocks').eq('id', params.id).maybeSingle()
    if (currentError) return NextResponse.json({ error: 'Could not load the current lesson.' }, { status: 500 })
    if (!current) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    if (updateData.published !== undefined && typeof updateData.published !== 'boolean') return NextResponse.json({ error: 'Published must be true or false.' }, { status: 400 })
    const effectiveDoc = updateData.content_blocks !== undefined ? updateData.content_blocks : current.content_blocks
    const publishing = remainsPublished(Boolean(current.published), updateData)
    if (effectiveDoc != null) {
      const issues = validateBlockDocument(effectiveDoc, publishing)
      if (issues.length) return NextResponse.json({ error: issues.map((i) => i.message).join(' '), block_issues: issues }, { status: 422 })
    }

    // Guardrail: refuse to publish a lesson that has no learning target. Without a
    // target the control room can't open or grade that lesson's work (the cell is
    // dead and the drawer can't resolve the work), so a published-but-targetless
    // lesson silently strands student work — and, in Unit 8, blocks car-part grants.
    if (publishing) {
      // A target counts if this lesson owns it OR its blocks capture against it —
      // MVP day lessons share their week's targets (lib/lesson-targets).
      const owned = await targetIdsForLesson(params.id, effectiveDoc)
      const count = owned.length
      if (!count) {
        return NextResponse.json(
          { error: 'Cannot publish: this lesson has no learning target. Add at least one learning target first — without it, students’ work can’t be opened or graded in the control room.' },
          { status: 422 },
        )
      }

      // SEI publishing rules apply to every program. Resolve the canonical
      // vocabulary before validation; a failed lookup is not an empty set.
      const doc = effectiveDoc as { blocks?: ContentBlock[] } | null
      const blocks = Array.isArray(doc?.blocks) ? doc!.blocks! : []
      if (blocks.length > 0) {
        const { data: setRow, error: setError } = await supabaseAdmin.from('vocabulary_sets').select('id').eq('lesson_id', params.id).maybeSingle()
        if (setError) return NextResponse.json({ error: 'Could not validate lesson vocabulary. Try saving again.' }, { status: 500 })
        let vocab: string[] = []
        const setId = (setRow as { id: string } | null)?.id
        if (setId) {
          const { data: terms, error: termsError } = await supabaseAdmin.from('vocabulary_terms').select('term').eq('vocabulary_set_id', setId)
          if (termsError) return NextResponse.json({ error: 'Could not validate vocabulary terms. Try saving again.' }, { status: 500 })
          vocab = ((terms ?? []) as { term: string }[]).map((t) => t.term)
        }
        if (blocks.some((block) => block.type === 'lesson_vocab') && !vocab.length) return NextResponse.json({ error: 'Cannot publish: the lesson vocabulary block has no associated terms. Add terms to this lesson’s vocabulary set first.' }, { status: 422 })
        const issues = seiLint(blocks, vocab)
        const errors = issues.filter((i) => i.severity === 'error')
        if (errors.length > 0) {
          return NextResponse.json(
            { error: `Cannot publish: ${errors.length} rule${errors.length === 1 ? '' : 's'} fail (SEI-2 / C-1: every capture block needs a visual and a frame; gated questions need per-option feedback; the lesson ends with an exit ticket or transfer prompt). Fix them in the builder or add sei{} to the block.`, sei_issues: issues },
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
