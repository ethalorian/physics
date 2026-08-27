import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateTargetReview, type ReviewQ, type ReteachBlock, type SimOption } from '@/lib/generate-review'
import { withAuth } from '@/lib/api-auth'

// GET /api/reviews/serve?target_id=
// Serve a targeted review for a learning target the student is weak on:
//  1. an APPROVED variant exists → serve one (shared across students);
//  2. else this student's OWN pending generation → serve it again;
//  3. else, if the target is CAPPED (learning_targets.reviews_capped), serve a
//     random existing pending draft from anyone — no new generation;
//  4. else Claude-generate a fresh review, store it as 'pending', and serve it.
// Approved reviews are the shared library; pending ones await teacher approval.

type Review = { id: string; reteach: string; blocks: ReteachBlock[] | null; questions: ReviewQ[]; status: string; shared: boolean }

// Pull the unit's published simulations as a candidate catalog the generator
// can pick from. Scoped by unit so the choice is at least topic-adjacent.
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

export const GET = withAuth(async (request, ctx) => {
    const email = ctx.email
    const targetId = new URL(request.url).searchParams.get('target_id')
    if (!targetId) return NextResponse.json({ error: 'target_id required' }, { status: 400 })

    const { data: tRow } = await supabaseAdmin
      .from('learning_targets')
      .select('statement, domain, unit_id, reviews_capped')
      .eq('id', targetId)
      .maybeSingle()
    const tInfo = tRow as { statement?: string; domain?: string; unit_id?: string; reviews_capped?: boolean } | null
    const statement = tInfo?.statement
    if (!statement) return NextResponse.json({ error: 'Unknown target' }, { status: 404 })
    // Sent with every review so the page can name the skill being practiced
    // (Surface 6: "name the skill + why you're here").
    const target = { statement, domain: tInfo?.domain ?? null }

    // 1. Approved variant (shared) — rotate by picking a random one.
    const { data: approved } = await supabaseAdmin
      .from('target_reviews')
      .select('id, reteach, blocks, questions, status')
      .eq('target_id', targetId)
      .eq('status', 'approved')
    const approvedList = (approved ?? []) as Review[]
    if (approvedList.length > 0) {
      const pick = approvedList[Math.floor(Math.random() * approvedList.length)]
      return NextResponse.json({ review: { ...pick, shared: true }, target })
    }

    // 2. This student's own pending generation.
    const { data: mine } = await supabaseAdmin
      .from('target_reviews')
      .select('id, reteach, blocks, questions, status')
      .eq('target_id', targetId)
      .eq('status', 'pending')
      .eq('created_by', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (mine) return NextResponse.json({ review: { ...(mine as Review), shared: false }, target })

    // 3. Capped target: reuse an existing draft rather than generating another.
    if (tInfo?.reviews_capped) {
      const { data: drafts } = await supabaseAdmin
        .from('target_reviews')
        .select('id, reteach, blocks, questions, status')
        .eq('target_id', targetId)
        .eq('status', 'pending')
      const draftList = (drafts ?? []) as Review[]
      if (draftList.length > 0) {
        const pick = draftList[Math.floor(Math.random() * draftList.length)]
        return NextResponse.json({ review: { ...pick, shared: false }, target })
      }
      // No drafts at all — fall through and generate the one this target will reuse.
    }

    // 4. Generate a fresh review with Claude (with the unit's sim catalog), store pending.
    const sims = await loadSimCatalog(tInfo?.unit_id)
    const gen = await generateTargetReview(statement, sims)
    if (gen.error || !gen.review) return NextResponse.json({ error: gen.error ?? 'Could not generate a review.' }, { status: 502 })

    const { data: inserted, error } = await supabaseAdmin
      .from('target_reviews')
      .insert({ target_id: targetId, reteach: gen.review.reteach, blocks: gen.review.blocks, questions: gen.review.questions, status: 'pending', created_by: email })
      .select('id, reteach, blocks, questions, status')
      .single()
    if (error || !inserted) return NextResponse.json({ error: 'Could not save the review.' }, { status: 500 })

    return NextResponse.json({ review: { ...(inserted as Review), shared: false }, target })
})
