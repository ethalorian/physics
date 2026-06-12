import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getBalance } from '@/lib/points'
import { isStaff, type ArcadeGame, type PlayRow } from '@/lib/arcade'

/**
 * POST /api/arcade/payout { playId } — mastery-weighted XP for FREE cabinets.
 *
 * The arcade stays a pure XP sink for coin games; this is the one deliberate
 * exception allowed by docs/ARCADE_PATTERN.md ("grant it through
 * economy_point_grants with a dedupe_key, deliberately"). Rules:
 *
 *   - Only cabinets with cost_xp = 0 pay out (free-to-play learning games).
 *   - Only a FINISHED play belonging to the caller, never staff runs.
 *   - Pay = floor(min(25, solved × tier × accuracy²)), zero below 50% accuracy
 *     — precision earns, spam doesn't. Tier: 1 easy / 1.5 mid / 2 hard+physics.
 *   - Daily cap of 75 across all free-cabinet payouts — deliberately HIGHER
 *     than the vocab-game cap (25/day, points.ts): math remediation is the
 *     priority, so the math gym is the best-paying floor in the arcade.
 *   - Idempotent: dedupe_key = 'arcade-payout:<playId>' (unique index).
 */

const PER_RUN_CAP = 25
const DAILY_CAP = 75 // higher than vocab (25): math fluency is the priority paycheck
const MIN_ACCURACY = 0.5
const SOURCE = 'arcade-payout'

type RunStats = {
  solved: number; right: number; wrong: number
  bestStreak: number; startLv: number; mode: string
}

function computeXp(stats: RunStats): number {
  const attempts = stats.right + stats.wrong
  if (attempts === 0 || stats.solved === 0) return 0
  const acc = stats.right / attempts
  if (acc < MIN_ACCURACY) return 0
  const tier = stats.mode === 'physics' ? 2 : stats.startLv >= 7 ? 2 : stats.startLv >= 4 ? 1.5 : 1
  return Math.floor(Math.min(PER_RUN_CAP, stats.solved * tier * acc * acc))
}

export const POST = withAuth(async (request, ctx) => {
  const { playId } = await request.json().catch(() => ({}))
  if (!playId || typeof playId !== 'string') {
    return NextResponse.json({ error: 'Missing playId' }, { status: 400 })
  }

  const { data: playRaw } = await supabaseAdmin
    .from('arcade_plays')
    .select('id, user_id, user_email, game_slug, status, score, meta, created_at')
    .eq('id', playId)
    .single()
  const play = playRaw as (PlayRow & { user_email: string | null }) | null
  if (!play || play.user_id !== ctx.userId) {
    return NextResponse.json({ error: 'Unknown play' }, { status: 404 })
  }
  if (play.status !== 'finished') {
    return NextResponse.json({ error: 'Run not finished' }, { status: 409 })
  }
  if (isStaff(ctx) || (play.meta as Record<string, unknown> | null)?.staff) {
    return NextResponse.json({ xp: 0, staff: true })
  }

  const { data: game } = await supabaseAdmin
    .from('arcade_games')
    .select('slug, cost_xp')
    .eq('slug', play.game_slug)
    .single()
  if (!game || (game as Pick<ArcadeGame, 'slug' | 'cost_xp'>).cost_xp !== 0) {
    return NextResponse.json({ error: 'This cabinet does not pay XP' }, { status: 403 })
  }

  const stats = (play.meta as { stats?: RunStats } | null)?.stats
  if (!stats) return NextResponse.json({ xp: 0 })

  const earned = computeXp(stats)
  if (earned === 0) return NextResponse.json({ xp: 0, capped: false })

  // Daily cap across all free-cabinet payouts (UTC day, matching points.ts).
  const dayStart = new Date().toISOString().slice(0, 10) + 'T00:00:00Z'
  const { data: todays } = await supabaseAdmin
    .from('economy_point_grants')
    .select('points')
    .eq('user_id', ctx.userId)
    .eq('source', SOURCE)
    .gte('awarded_at', dayStart)
  const todayTotal = (todays ?? []).reduce((s, g) => s + (g.points || 0), 0)
  const xp = Math.max(0, Math.min(earned, DAILY_CAP - todayTotal))
  if (xp === 0) {
    const { balance } = await getBalance(ctx.userId)
    return NextResponse.json({ xp: 0, capped: true, balance })
  }

  const { error } = await supabaseAdmin.from('economy_point_grants').insert({
    user_id: ctx.userId,
    user_email: ctx.email ?? play.user_email,
    source: SOURCE,
    reference: play.game_slug,
    points: xp,
    note: `Arcade payout — ${play.game_slug} (${stats.mode}, ${stats.solved} solved)`,
    dedupe_key: `${SOURCE}:${play.id}`,
  })
  if (error) {
    // 23505 = unique violation on dedupe_key → already paid; report idempotently.
    if ((error as { code?: string }).code === '23505') {
      const { balance } = await getBalance(ctx.userId)
      return NextResponse.json({ xp: 0, alreadyPaid: true, balance })
    }
    console.error('[arcade/payout] grant insert failed:', error)
    return NextResponse.json({ error: 'Could not bank XP' }, { status: 500 })
  }

  const { balance } = await getBalance(ctx.userId)
  return NextResponse.json({ xp, capped: xp < earned, balance })
})
