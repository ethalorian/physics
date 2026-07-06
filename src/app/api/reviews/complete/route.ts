import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getBalance } from '@/lib/points'

/**
 * POST /api/reviews/complete { targetId, correct, total } — effort XP for
 * finishing a targeted skill review.
 *
 * PRODUCT RULE (see README handoff, Surface 6): mastery is teacher-rated from
 * class work. This endpoint NEVER touches mastery_records — it pays for
 * effort only, through economy_point_grants (the deliberate-grant channel,
 * same pattern as /api/arcade/payout):
 *
 *   - Pay = 5 for finishing + 1 per correct answer, capped at 10 per review.
 *   - Dedupe: one grant per target per day (dedupe_key unique index) — redoing
 *     the same review the same day is allowed but doesn't pay twice.
 *   - Daily cap of 30 across all review completions — kept well under the
 *     math-gym cap (75/day) so remediation stays the priority paycheck.
 *   - Also logs student_activity so the review counts toward the streak.
 */

const PER_REVIEW_CAP = 10
const DAILY_CAP = 30
const SOURCE = 'review-complete'

export const POST = withAuth(async (request, ctx) => {
  const body = await request.json().catch(() => ({}))
  const { targetId, correct, total } = body as { targetId?: string; correct?: number; total?: number }
  if (!targetId || typeof targetId !== 'string') {
    return NextResponse.json({ error: 'Missing targetId' }, { status: 400 })
  }
  const nCorrect = Math.max(0, Math.min(20, Math.floor(Number(correct) || 0)))
  const nTotal = Math.max(1, Math.min(20, Math.floor(Number(total) || 0)))

  // The target must be real — the reference for the grant.
  const { data: target } = await supabaseAdmin
    .from('learning_targets')
    .select('id, statement')
    .eq('id', targetId)
    .maybeSingle()
  if (!target) return NextResponse.json({ error: 'Unknown target' }, { status: 404 })

  // Streak feed (best-effort — never block the payout on this).
  try {
    await supabaseAdmin.from('student_activity').insert({
      user_id: ctx.userId,
      user_email: ctx.email,
      activity_type: 'skill_review',
    })
  } catch { /* activity table hiccup — XP still proceeds */ }

  const earned = Math.min(PER_REVIEW_CAP, 5 + Math.min(nCorrect, nTotal))

  // Daily cap across all review completions.
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
  const { data: todays } = await supabaseAdmin
    .from('economy_point_grants')
    .select('points')
    .eq('user_id', ctx.userId)
    .eq('source', SOURCE)
    .gte('awarded_at', dayStart.toISOString())
  const todayTotal = (todays ?? []).reduce((s, g) => s + (g.points || 0), 0)
  const xp = Math.max(0, Math.min(earned, DAILY_CAP - todayTotal))
  if (xp === 0) {
    const { balance } = await getBalance(ctx.userId)
    return NextResponse.json({ xp: 0, capped: true, balance })
  }

  const day = new Date().toISOString().slice(0, 10)
  const { error } = await supabaseAdmin.from('economy_point_grants').insert({
    user_id: ctx.userId,
    user_email: ctx.email,
    source: SOURCE,
    reference: targetId,
    points: xp,
    note: `Skill review — ${nCorrect}/${nTotal} on "${String(target.statement).slice(0, 80)}"`,
    dedupe_key: `${SOURCE}:${ctx.userId}:${targetId}:${day}`,
  })
  if (error) {
    // 23505 = unique violation on dedupe_key → already paid today; idempotent.
    if ((error as { code?: string }).code === '23505') {
      const { balance } = await getBalance(ctx.userId)
      return NextResponse.json({ xp: 0, alreadyPaid: true, balance })
    }
    console.error('[reviews/complete] grant insert failed:', error)
    return NextResponse.json({ error: 'Could not bank XP' }, { status: 500 })
  }

  const { balance } = await getBalance(ctx.userId)
  return NextResponse.json({ xp, balance })
})
