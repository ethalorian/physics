import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// ADMIN-ONLY review queue for generated skill reviews. The application admin is
// the single quality gate app-wide: pending reviews are shown only to the
// student who generated them until the admin APPROVES one — approval puts it in
// the shared library served to every student weak on that target.

type Row = { id: string; target_id: string; reteach: string; blocks: unknown; questions: unknown; status: string; created_by: string | null; created_at: string }

export const GET = withRole('admin', async () => {
    const { data } = await supabaseAdmin
      .from('target_reviews')
      .select('id, target_id, reteach, blocks, questions, status, created_by, created_at')
      .order('created_at', { ascending: false })
    const all = (data ?? []) as Row[]
    const pending = all.filter((r) => r.status === 'pending')

    // Attach each review's target statement for context.
    const targetIds = [...new Set(all.map((r) => r.target_id))]
    const stmtById = new Map<string, string>()
    if (targetIds.length > 0) {
      const { data: ts } = await supabaseAdmin.from('learning_targets').select('id, statement').in('id', targetIds)
      for (const t of (ts ?? []) as { id: string; statement: string }[]) stmtById.set(t.id, t.statement)
    }
    const decorate = (r: Row) => ({ ...r, targetStatement: stmtById.get(r.target_id) ?? r.target_id })

    return NextResponse.json({
      pending: pending.map(decorate),
      pendingCount: pending.length,
      recent: all.slice(0, 40).map(decorate),
    })
})

// POST { id, decision: 'approve' | 'reject', blocks? }
// When approving, the admin may pass an edited `blocks` array (e.g. they
// removed a wrong diagram, reordered, or fixed a prose paragraph). We persist
// what they send so the shared variant matches what they actually approved.
export const POST = withRole('admin', async (request, ctx) => {
    const body = await request.json()
    const id: string | undefined = body.id
    const decision: 'approve' | 'reject' = body.decision
    const editedBlocks: unknown = body.blocks
    if (!id || (decision !== 'approve' && decision !== 'reject')) {
      return NextResponse.json({ error: 'id and decision (approve|reject) required' }, { status: 400 })
    }

    const update: Record<string, unknown> = {
      status: decision === 'approve' ? 'approved' : 'rejected',
      reviewed_by: ctx.email,
      reviewed_at: new Date().toISOString(),
    }
    // Trust the admin's edited blocks on approve (the admin IS the gate).
    if (decision === 'approve' && Array.isArray(editedBlocks)) update.blocks = editedBlocks

    const { error } = await supabaseAdmin.from('target_reviews').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
})
