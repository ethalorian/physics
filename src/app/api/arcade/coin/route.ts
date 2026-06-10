import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getBalance } from '@/lib/points'
import { isStaff, type ArcadeGame } from '@/lib/arcade'

/**
 * POST /api/arcade/coin { slug } — buy one ranked run.
 *
 * Spends cost_xp from the shared pool by inserting an APPROVED
 * reward_redemption (the same committed-spend ledger the store uses — balance
 * is always re-derived, never mutated), then opens an arcade_plays row that
 * authorizes score posts for this run. Staff play free but never rank.
 */
export const POST = withAuth(async (request, ctx) => {
  const { slug } = await request.json().catch(() => ({}))
  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'Missing game slug' }, { status: 400 })
  }

  const { data: game } = await supabaseAdmin
    .from('arcade_games')
    .select('*')
    .eq('slug', slug)
    .eq('enabled', true)
    .single()
  if (!game) return NextResponse.json({ error: 'Unknown game' }, { status: 404 })
  const g = game as ArcadeGame

  const staff = isStaff(ctx)
  let redemptionId: string | null = null

  if (!staff && g.cost_xp > 0) {
    const before = await getBalance(ctx.userId)
    if (before.balance < g.cost_xp) {
      return NextResponse.json(
        { error: 'Not enough XP', needed: g.cost_xp, balance: before.balance },
        { status: 402 },
      )
    }
    const { data: redemption, error: redErr } = await supabaseAdmin
      .from('reward_redemptions')
      .insert({
        user_id: ctx.userId,
        user_email: ctx.email,
        reward_name: `Arcade credit — ${g.name}`,
        cost_points: g.cost_xp,
        status: 'approved', // committed immediately: a coin is spent, not pending
        note: `arcade:${g.slug}`,
      })
      .select('id')
      .single()
    if (redErr || !redemption) {
      console.error('[arcade/coin] redemption insert failed:', redErr)
      return NextResponse.json({ error: 'Could not spend XP' }, { status: 500 })
    }
    redemptionId = redemption.id
  }

  const { data: play, error: playErr } = await supabaseAdmin
    .from('arcade_plays')
    .insert({
      user_id: ctx.userId,
      user_email: ctx.email,
      game_slug: g.slug,
      redemption_id: redemptionId,
      status: 'active',
      meta: staff ? { staff: true } : {},
    })
    .select('id')
    .single()
  if (playErr || !play) {
    console.error('[arcade/coin] play insert failed:', playErr)
    return NextResponse.json({ error: 'Could not start run' }, { status: 500 })
  }

  const after = staff ? null : await getBalance(ctx.userId)
  return NextResponse.json({
    playId: play.id,
    costXp: staff ? 0 : g.cost_xp,
    balance: after?.balance ?? null,
    staff,
  })
})
