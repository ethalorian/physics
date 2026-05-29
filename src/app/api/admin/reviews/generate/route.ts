import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { generateTargetReview, type SimOption } from '@/lib/generate-review'

async function loadSimCatalog(unitId: string | null | undefined): Promise<SimOption[]> {
  if (!unitId) return []
  const { data } = await supabaseAdmin
    .from('simulations')
    .select('slug, title, description, topic, sort_order')
    .eq('unit', unitId)
    .eq('published', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
  return ((data ?? []) as { slug: string; title: string; description: string | null; topic: string | null }[])
    .map((s) => ({ slug: s.slug, title: s.title, description: s.description ?? undefined, topic: s.topic ?? undefined }))
}

// POST { target_id } — ADMIN-ONLY: seeds the review library by generating a
// review for a learning target. It lands as 'pending' (same approval gate), so
// the admin still eyeballs it in the queue before it's shared with students.

export const POST = withRole('admin', async (request, ctx) => {
    const body = await request.json()
    const targetId: string | undefined = body.target_id
    if (!targetId) return NextResponse.json({ error: 'target_id required' }, { status: 400 })

    const { data: tRow } = await supabaseAdmin
      .from('learning_targets')
      .select('statement, unit_id')
      .eq('id', targetId)
      .maybeSingle()
    const tInfo = tRow as { statement?: string; unit_id?: string } | null
    const statement = tInfo?.statement
    if (!statement) return NextResponse.json({ error: 'Unknown target' }, { status: 404 })

    const sims = await loadSimCatalog(tInfo?.unit_id)
    const gen = await generateTargetReview(statement, sims)
    if (gen.error || !gen.review) {
      console.error('[admin/reviews/generate] generator returned error:', gen.error, 'target=', targetId, 'unit=', tInfo?.unit_id, 'sims=', sims.length)
      return NextResponse.json({ error: gen.error ?? 'Generation failed' }, { status: 502 })
    }

    const { error } = await supabaseAdmin
      .from('target_reviews')
      .insert({ target_id: targetId, reteach: gen.review.reteach, blocks: gen.review.blocks, questions: gen.review.questions, status: 'pending', created_by: ctx.email })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
})
