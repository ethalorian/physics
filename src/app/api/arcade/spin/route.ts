import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * The Daily Spin — one wheel spin per student per day (UTC).
 *
 * SERVER-AUTHORITATIVE: the prize is rolled here, never in the browser; the
 * client only animates to the segment we tell it. The grant row's UNIQUE
 * dedupe_key (`daily-spin:<user>:<date>`) is simultaneously the XP award and
 * the once-per-day lock — a second spin violates the constraint and is
 * rejected. XP flows through economy_point_grants, the same earning ledger
 * as the Escape Room, so balance and leaderboard pick it up automatically.
 *
 * Odds (must sum to 1): mostly crumbs, one distant jackpot.
 *   500 XP  ★ JACKPOT   0.33%   (~once per student per school year of daily spins)
 *    25 XP                4%
 *    10 XP               10%
 *     5 XP               25%
 *     3 XP               30%
 *     2 XP            30.67%
 * Expected value ≈ 6 XP/day — pocket change next to the 50/day vocab cap.
 */

const PRIZES: { xp: number; weight: number }[] = [
  { xp: 500, weight: 0.0033 },
  { xp: 25, weight: 0.04 },
  { xp: 10, weight: 0.10 },
  { xp: 5, weight: 0.25 },
  { xp: 3, weight: 0.30 },
  { xp: 2, weight: 0.3067 },
]
/** Visual wheel, 12 segments. Index 9 is the lone jackpot wedge.
 *  (Mirrored in DailySpinWheel.tsx — route files may not export consts.) */
const SEGMENTS = [2, 5, 3, 10, 2, 25, 3, 5, 2, 500, 3, 5]

function todayUTC(): string { return new Date().toISOString().slice(0, 10) }
function dedupeKey(uid: string): string { return `daily-spin:${uid}:${todayUTC()}` }

export const GET = withAuth(async (request, ctx) => {
  const { data } = await supabaseAdmin
    .from('economy_point_grants')
    .select('points')
    .eq('dedupe_key', dedupeKey(ctx.userId))
    .limit(1)
  const row = (data ?? [])[0] as { points: number } | undefined
  return NextResponse.json({ spunToday: !!row, prize: row?.points ?? null, segments: SEGMENTS })
})

export const POST = withAuth(async (request, ctx) => {
  // roll the prize server-side
  const r = Math.random()
  let acc = 0, xp = PRIZES[PRIZES.length - 1].xp
  for (const p of PRIZES) { acc += p.weight; if (r < acc) { xp = p.xp; break } }

  // the insert IS the daily lock: unique dedupe_key rejects a second spin
  const { error } = await supabaseAdmin.from('economy_point_grants').insert({
    user_id: ctx.userId,
    user_email: ctx.email,
    source: 'daily-spin',
    reference: todayUTC(),
    points: xp,
    note: xp >= 500 ? 'Daily spin — JACKPOT!' : `Daily spin — ${xp} XP`,
    dedupe_key: dedupeKey(ctx.userId),
  })
  if (error) {
    return NextResponse.json({ error: 'Already spun today' }, { status: 409 })
  }

  // pick a wheel wedge matching the prize, randomly among duplicates
  const matching = SEGMENTS.map((v, i) => ({ v, i })).filter((s) => s.v === xp).map((s) => s.i)
  const segment = matching[Math.floor(Math.random() * matching.length)]

  return NextResponse.json({ prize: xp, segment, jackpot: xp >= 500 })
})
