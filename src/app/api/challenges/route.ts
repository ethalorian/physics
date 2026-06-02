import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getLifetimeEarned } from '@/lib/points'

// Head-to-head "duels". A duel is opt-in (challenge → the other student accepts).
// On accept we snapshot both players' lifetime XP; the winner is whoever EARNED
// more during the window (snapshots make it tamper-proof). The winner takes a
// fixed XP bounty — but only if they actually earned XP during the window, so
// the prize rewards real work, not idle collusion. The loser keeps everything
// they earned; nothing is taken from them.
const WINDOW_DAYS = 3
const WINNER_PRIZE = 30   // XP awarded to a duel winner (tunable)

interface Challenge {
  id: string
  challenger_user_id: string
  opponent_user_id: string
  status: 'pending' | 'active' | 'declined' | 'cancelled' | 'complete'
  starts_at: string | null
  ends_at: string | null
  challenger_start: number | null
  opponent_start: number | null
  challenger_score: number | null
  opponent_score: number | null
  winner_user_id: string | null
}

async function resolveIfDue(c: Challenge): Promise<Challenge> {
  if (c.status !== 'active' || !c.ends_at || new Date(c.ends_at) > new Date()) return c
  const [cNow, oNow] = await Promise.all([
    getLifetimeEarned(c.challenger_user_id),
    getLifetimeEarned(c.opponent_user_id),
  ])
  const cScore = Math.max(0, cNow - (c.challenger_start ?? cNow))
  const oScore = Math.max(0, oNow - (c.opponent_start ?? oNow))
  const winner = cScore === oScore ? null : cScore > oScore ? c.challenger_user_id : c.opponent_user_id
  await supabaseAdmin.from('challenges')
    .update({ status: 'complete', challenger_score: cScore, opponent_score: oScore, winner_user_id: winner })
    .eq('id', c.id)

  // Winner's prize — a fixed XP bounty, paid once (idempotent via the unique
  // dedupe_key). Only if they actually earned during the window, so the prize
  // tracks real learning and can't be farmed by both players idling.
  const winnerScore = winner === c.challenger_user_id ? cScore : oScore
  if (winner && winnerScore > 0) {
    try {
      const { data: w } = await supabaseAdmin.from('students').select('email').eq('google_user_id', winner).limit(1).single()
      await supabaseAdmin.from('economy_point_grants').upsert(
        { user_id: winner, user_email: w?.email ?? null, source: 'duel-win', reference: c.id, points: WINNER_PRIZE, note: 'Won a duel', dedupe_key: `duel-win:${c.id}` },
        { onConflict: 'dedupe_key' },
      )
    } catch { /* prize is best-effort; never block resolution */ }
  }
  return { ...c, status: 'complete', challenger_score: cScore, opponent_score: oScore, winner_user_id: winner }
}

export const GET = withAuth(async (_req, ctx) => {
  const me = ctx.userId
  const { data } = await supabaseAdmin.from('challenges')
    .select('*')
    .or(`challenger_user_id.eq.${me},opponent_user_id.eq.${me}`)
    .in('status', ['pending', 'active', 'complete'])
    .order('created_at', { ascending: false })

  let rows = (data ?? []) as Challenge[]
  rows = await Promise.all(rows.map(resolveIfDue))

  // live (in-progress) scores for active duels
  const scored = await Promise.all(rows.map(async (c) => {
    if (c.status !== 'active') return c
    const [cNow, oNow] = await Promise.all([
      getLifetimeEarned(c.challenger_user_id),
      getLifetimeEarned(c.opponent_user_id),
    ])
    return {
      ...c,
      challenger_score: Math.max(0, cNow - (c.challenger_start ?? cNow)),
      opponent_score: Math.max(0, oNow - (c.opponent_start ?? oNow)),
    }
  }))

  // names (alias preferred, never email)
  const ids = new Set<string>()
  for (const c of scored) { ids.add(c.challenger_user_id); ids.add(c.opponent_user_id) }
  const { data: studs } = await supabaseAdmin.from('students').select('google_user_id, alias, name').in('google_user_id', [...ids])
  const nameByUser = new Map<string, string>()
  for (const s of (studs ?? []) as { google_user_id: string | null; alias: string | null; name: string | null }[]) {
    if (s.google_user_id) nameByUser.set(s.google_user_id, s.alias || s.name || 'Student')
  }

  const shape = (c: Challenge) => {
    const iAmChallenger = c.challenger_user_id === me
    const themId = iAmChallenger ? c.opponent_user_id : c.challenger_user_id
    return {
      id: c.id,
      status: c.status,
      ends_at: c.ends_at,
      them_name: nameByUser.get(themId) ?? 'Student',
      me_score: iAmChallenger ? c.challenger_score ?? 0 : c.opponent_score ?? 0,
      them_score: iAmChallenger ? c.opponent_score ?? 0 : c.challenger_score ?? 0,
      won: !!c.winner_user_id && c.winner_user_id === me,
      lost: !!c.winner_user_id && c.winner_user_id !== me,
      tie: c.status === 'complete' && !c.winner_user_id,
    }
  }

  return NextResponse.json({
    incoming: scored.filter((c) => c.status === 'pending' && c.opponent_user_id === me).map(shape),
    outgoing: scored.filter((c) => c.status === 'pending' && c.challenger_user_id === me).map(shape),
    active: scored.filter((c) => c.status === 'active').map(shape),
    done: scored.filter((c) => c.status === 'complete').slice(0, 8).map(shape),
  })
})

export const POST = withAuth(async (req, ctx) => {
  const me = ctx.userId
  const body = await req.json().catch(() => ({}))
  const opponent = String(body.opponent_user_id || '')
  if (!opponent || opponent === me) return NextResponse.json({ error: 'Pick a classmate to duel.' }, { status: 400 })

  // opponent must be a real student
  const { data: opp } = await supabaseAdmin.from('students').select('google_user_id').eq('google_user_id', opponent).limit(1)
  if (!opp || opp.length === 0) return NextResponse.json({ error: 'Unknown opponent.' }, { status: 400 })

  // no existing open duel between us (compare in JS; only `me` is interpolated)
  const { data: mine } = await supabaseAdmin.from('challenges')
    .select('challenger_user_id, opponent_user_id')
    .in('status', ['pending', 'active'])
    .or(`challenger_user_id.eq.${me},opponent_user_id.eq.${me}`)
  const dup = (mine ?? []).some((c) => c.challenger_user_id === opponent || c.opponent_user_id === opponent)
  if (dup) return NextResponse.json({ error: 'You already have a duel going with them.' }, { status: 409 })

  const { data, error } = await supabaseAdmin.from('challenges')
    .insert({ challenger_user_id: me, opponent_user_id: opponent, status: 'pending', metric: 'xp' })
    .select('id').single()
  if (error) return NextResponse.json({ error: 'Could not start the duel.' }, { status: 500 })
  return NextResponse.json({ id: data.id })
})

export const PATCH = withAuth(async (req, ctx) => {
  const me = ctx.userId
  const body = await req.json().catch(() => ({}))
  const { id, action } = body as { id?: string; action?: string }
  if (!id || !action) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const { data } = await supabaseAdmin.from('challenges').select('*').eq('id', id).single()
  const c = data as Challenge | null
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'accept') {
    if (c.opponent_user_id !== me || c.status !== 'pending') return NextResponse.json({ error: 'Cannot accept' }, { status: 400 })
    const [cs, os] = await Promise.all([getLifetimeEarned(c.challenger_user_id), getLifetimeEarned(c.opponent_user_id)])
    const now = new Date()
    const ends = new Date(now.getTime() + WINDOW_DAYS * 86400000)
    await supabaseAdmin.from('challenges')
      .update({ status: 'active', starts_at: now.toISOString(), ends_at: ends.toISOString(), challenger_start: cs, opponent_start: os })
      .eq('id', id)
  } else if (action === 'decline') {
    if (c.opponent_user_id !== me || c.status !== 'pending') return NextResponse.json({ error: 'Cannot decline' }, { status: 400 })
    await supabaseAdmin.from('challenges').update({ status: 'declined' }).eq('id', id)
  } else if (action === 'cancel') {
    if (c.challenger_user_id !== me || c.status !== 'pending') return NextResponse.json({ error: 'Cannot cancel' }, { status: 400 })
    await supabaseAdmin.from('challenges').update({ status: 'cancelled' }).eq('id', id)
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
})
