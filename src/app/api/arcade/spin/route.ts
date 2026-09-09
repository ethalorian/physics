import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

import { SPIN_SEGMENTS as SEGMENTS, SPIN_PRIZES as PRIZES } from '@/lib/xp-policy'

// One small server-rolled bonus per UTC day. Existing awards remain intact.
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
    note: xp >= 25 ? 'Daily spin — JACKPOT!' : `Daily spin — ${xp} XP`,
    dedupe_key: dedupeKey(ctx.userId),
  })
  if (error) {
    return NextResponse.json({ error: 'Already spun today' }, { status: 409 })
  }

  // pick a wheel wedge matching the prize, randomly among duplicates
  const matching = SEGMENTS.map((v, i) => ({ v, i })).filter((s) => s.v === xp).map((s) => s.i)
  const segment = matching[Math.floor(Math.random() * matching.length)]

  return NextResponse.json({ prize: xp, segment, jackpot: xp >= 25 })
})
