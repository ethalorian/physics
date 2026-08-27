import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// ADMIN-ONLY review queue for generated skill reviews. The application admin is
// the single quality gate app-wide: pending reviews are shown only to the
// student who generated them until the admin APPROVES one — approval puts it in
// the shared library served to every student weak on that target.
//
// The queue is organised BY TARGET: one row per learning target that has any
// review, with pending/approved/rejected counts and the per-target cap flag
// (learning_targets.reviews_capped — see /api/reviews/serve). The admin scans
// targets, expands one, and approves from there.

type Row = { id: string; target_id: string; reteach: string; blocks: unknown; questions: unknown; status: string; created_by: string | null; created_at: string }
type TargetRow = { id: string; statement: string; domain: string | null; unit_id: string | null; order_index: number | null; reviews_capped: boolean | null }

export interface ReviewTargetGroup {
  target_id: string
  statement: string
  domain: string | null
  unit_id: string | null
  unit_name: string | null
  order_index: number
  reviews_capped: boolean
  counts: { pending: number; approved: number; rejected: number; total: number }
  pending: (Row & { targetStatement: string })[]
}

export const GET = withRole('admin', async () => {
    const { data } = await supabaseAdmin
      .from('target_reviews')
      .select('id, target_id, reteach, blocks, questions, status, created_by, created_at')
      .order('created_at', { ascending: false })
    const all = (data ?? []) as Row[]
    const pending = all.filter((r) => r.status === 'pending')

    // Targets (statement, unit, cap flag) for every target that has a review.
    const targetIds = [...new Set(all.map((r) => r.target_id))]
    const targetById = new Map<string, TargetRow>()
    if (targetIds.length > 0) {
      const { data: ts } = await supabaseAdmin
        .from('learning_targets')
        .select('id, statement, domain, unit_id, order_index, reviews_capped')
        .in('id', targetIds)
      for (const t of (ts ?? []) as TargetRow[]) targetById.set(t.id, t)
    }
    const { data: unitRows } = await supabaseAdmin.from('units').select('id, name, order_index').order('order_index', { ascending: true })
    const unitName = new Map<string, string>()
    const unitOrder = new Map<string, number>()
    for (const u of (unitRows ?? []) as { id: string; name: string; order_index: number | null }[]) {
      unitName.set(u.id, u.name)
      unitOrder.set(u.id, u.order_index ?? 0)
    }

    const decorate = (r: Row) => ({ ...r, targetStatement: targetById.get(r.target_id)?.statement ?? r.target_id })

    // Group by target.
    const groups = new Map<string, ReviewTargetGroup>()
    for (const r of all) {
      let g = groups.get(r.target_id)
      if (!g) {
        const t = targetById.get(r.target_id)
        g = {
          target_id: r.target_id,
          statement: t?.statement ?? r.target_id,
          domain: t?.domain ?? null,
          unit_id: t?.unit_id ?? null,
          unit_name: t?.unit_id ? (unitName.get(t.unit_id) ?? t.unit_id) : null,
          order_index: t?.order_index ?? 0,
          reviews_capped: !!t?.reviews_capped,
          counts: { pending: 0, approved: 0, rejected: 0, total: 0 },
          pending: [],
        }
        groups.set(r.target_id, g)
      }
      g.counts.total += 1
      if (r.status === 'pending') { g.counts.pending += 1; g.pending.push(decorate(r)) }
      else if (r.status === 'approved') g.counts.approved += 1
      else if (r.status === 'rejected') g.counts.rejected += 1
    }

    // Curriculum order: unit, then target order within the unit.
    const targets = [...groups.values()].sort((a, b) => {
      const ua = a.unit_id ? (unitOrder.get(a.unit_id) ?? 0) : 999
      const ub = b.unit_id ? (unitOrder.get(b.unit_id) ?? 0) : 999
      return ua - ub || a.order_index - b.order_index || a.statement.localeCompare(b.statement)
    })

    return NextResponse.json({
      targets,
      units: [...unitName.entries()].map(([id, name]) => ({ id, name })),
      // Legacy shape, kept for any other consumer of this route.
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

// PATCH { target_id, reviews_capped } — flip the per-target cap. When capped,
// /api/reviews/serve reuses an existing draft for the target instead of
// generating a new one per student.
export const PATCH = withRole('admin', async (request) => {
    const body = await request.json()
    const targetId: string | undefined = body.target_id
    const capped: unknown = body.reviews_capped
    if (!targetId || typeof capped !== 'boolean') {
      return NextResponse.json({ error: 'target_id and reviews_capped (boolean) required' }, { status: 400 })
    }
    const { error } = await supabaseAdmin
      .from('learning_targets')
      .update({ reviews_capped: capped })
      .eq('id', targetId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, target_id: targetId, reviews_capped: capped })
})
