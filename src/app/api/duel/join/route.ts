import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { REVEAL_MS, type DuelRound } from '@/lib/duel'

// POST /api/duel/join { code } — claim the guest seat.
//
// Works for both modes: a live match in 'waiting' (host is in the lobby right
// now) or a ghost in 'open' (host recorded earlier, maybe in another period).
// For a ghost we wipe the recording-era startedAt stamps and re-arm round 0 so
// the challenger gets a fresh clock; the recorded host answers carry only
// elapsed ms, so adjudication is wall-clock independent.
//
// The conditional update (status = the joinable status we read) makes two
// simultaneous joiners race safely: only one row mutation can win.
export const POST = withAuth(async (request, ctx) => {
  const { code } = (await request.json().catch(() => ({}))) as { code?: string }
  if (!code?.trim()) return NextResponse.json({ error: 'code required' }, { status: 400 })

  const { data: match } = await supabaseAdmin
    .from('duel_matches')
    .select('id, status, mode, host_id, rounds')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle()

  const m = match as { id: string; status: string; mode: string; host_id: string; rounds: DuelRound[] } | null
  if (!m) return NextResponse.json({ error: 'No duel with that code' }, { status: 404 })
  if (m.host_id === ctx.userId) {
    if (m.status === 'waiting' || m.status === 'recording') return NextResponse.json({ id: m.id, role: 'host' }) // rejoin own lobby/recording
    return NextResponse.json({ error: "That's your own challenge — you can't race your own ghost" }, { status: 409 })
  }
  if (m.status === 'finished' || m.status === 'active') return NextResponse.json({ error: 'That duel already has two players' }, { status: 409 })
  if (m.status === 'recording') return NextResponse.json({ error: 'The ghost is still being recorded — try again in a minute' }, { status: 409 })
  if (m.status !== 'waiting' && m.status !== 'open') return NextResponse.json({ error: 'That duel cannot be joined' }, { status: 410 })

  const { data: student } = await supabaseAdmin
    .from('students')
    .select('alias, name')
    .eq('google_user_id', ctx.userId)
    .maybeSingle()
  const s = student as { alias: string | null; name: string | null } | null
  const guestName = s?.alias || s?.name || ctx.session.user?.name || 'Player 2'

  // Fresh clocks: clear every startedAt (ghosts carry stale recording stamps),
  // then arm round 0 with the countdown.
  const rounds = (m.rounds ?? []).map((r) => {
    const { startedAt: _drop, ...rest } = r
    return rest as DuelRound
  })
  if (rounds[0]) rounds[0] = { ...rounds[0], startedAt: new Date(Date.now() + REVEAL_MS).toISOString() }

  const { data: updated } = await supabaseAdmin
    .from('duel_matches')
    .update({
      guest_id: ctx.userId,
      guest_name: guestName,
      status: 'active',
      current_round: 0,
      rounds,
      guest_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', m.id)
    .eq('status', m.status) // lose the race → no rows updated
    .select('id')

  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: 'Someone else grabbed that seat first' }, { status: 409 })
  }
  return NextResponse.json({ id: m.id, role: 'guest' })
})
