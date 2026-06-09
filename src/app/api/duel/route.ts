import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { generateLobbyCode } from '@/lib/lobby/passphrase'
import { generateRounds, GHOST_TTL_MS, LIVE_PRESENCE_MS, MIN_TERMS, REVEAL_MS, type DuelMode, type DuelTermInput } from '@/lib/duel'

// Vocab Duel — create a match / list open challenges.
//
// Terms arrive from the client (resolved by VocabPlaySource → /api/vocab/play),
// the same trust model every other arcade game uses. Rounds are generated
// HERE, server-side, so both players get identical questions and the correct
// answers never need to ship to the client mid-round.
//
// Two modes:
//   live  — both players online now; the host waits in a lobby for a taker.
//   ghost — the host records a run immediately; the challenge stays open for
//           a week and a rival in ANY period replays the same rounds against
//           the recorded times. This is the cross-period mode.

async function displayName(userId: string, fallback: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('students')
    .select('alias, name')
    .eq('google_user_id', userId)
    .maybeSingle()
  const s = data as { alias: string | null; name: string | null } | null
  return s?.alias || s?.name || fallback
}

// POST /api/duel { terms, vocabularySetId, label, mode } — create a match.
export const POST = withAuth(async (request, ctx) => {
  const body = (await request.json().catch(() => ({}))) as {
    terms?: DuelTermInput[]
    vocabularySetId?: string | null
    label?: string
    mode?: DuelMode
  }
  const terms = Array.isArray(body.terms) ? body.terms : []
  if (terms.length < MIN_TERMS) {
    return NextResponse.json({ error: `Need at least ${MIN_TERMS} terms to duel` }, { status: 400 })
  }
  const mode: DuelMode = body.mode === 'ghost' ? 'ghost' : 'live'

  const rounds = generateRounds(terms)
  if (rounds.length === 0) return NextResponse.json({ error: 'Could not build rounds from these terms' }, { status: 400 })
  // A ghost recording starts immediately — arm round 0 with the countdown.
  if (mode === 'ghost' && rounds[0]) rounds[0] = { ...rounds[0], startedAt: new Date(Date.now() + REVEAL_MS).toISOString() }

  const name = await displayName(ctx.userId, ctx.session.user?.name || 'Player 1')

  // Retry on the (unlikely) code collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateLobbyCode(5)
    const { data, error } = await supabaseAdmin
      .from('duel_matches')
      .insert({
        code,
        mode,
        status: mode === 'ghost' ? 'recording' : 'waiting',
        vocabulary_set_id: body.vocabularySetId ?? null,
        label: (body.label ?? '').slice(0, 120),
        host_id: ctx.userId,
        host_name: name,
        rounds,
        host_seen_at: new Date().toISOString(),
      })
      .select('id, code')
      .single()
    if (!error && data) return NextResponse.json({ id: data.id, code: data.code }, { status: 201 })
    if (error && !/duplicate|unique/i.test(error.message)) {
      console.error('Duel create failed:', error)
      return NextResponse.json({ error: 'Failed to create duel' }, { status: 500 })
    }
  }
  return NextResponse.json({ error: 'Failed to create duel' }, { status: 500 })
})

// GET /api/duel — joinable challenges, presence-aware:
//   live:  only while the host's waiting-room heartbeat is fresh (no stale
//          clutter from earlier periods)
//   ghost: any open recording from the last 7 days
export const GET = withAuth(async (_request, ctx) => {
  const now = Date.now()
  const liveSince = new Date(now - LIVE_PRESENCE_MS).toISOString()
  const ghostSince = new Date(now - GHOST_TTL_MS).toISOString()

  const [{ data: live }, { data: ghosts }] = await Promise.all([
    supabaseAdmin
      .from('duel_matches')
      .select('id, code, label, host_id, host_name, created_at')
      .eq('status', 'waiting')
      .gte('host_seen_at', liveSince)
      .order('created_at', { ascending: false })
      .limit(20),
    supabaseAdmin
      .from('duel_matches')
      .select('id, code, label, host_id, host_name, created_at')
      .eq('status', 'open')
      .gte('created_at', ghostSince)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  type Row = { id: string; code: string; label: string; host_id: string; host_name: string; created_at: string }
  const shape = (rows: Row[] | null) =>
    ((rows ?? []) as Row[])
      .filter((m) => m.host_id !== ctx.userId)
      .map(({ id, code, label, host_name, created_at }) => ({ id, code, label, hostName: host_name, createdAt: created_at }))

  return NextResponse.json({ open: shape(live as Row[] | null), ghosts: shape(ghosts as Row[] | null) })
})
