import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import {
  ANSWER_GRACE_MS,
  REVEAL_MS,
  ROUND_MS,
  WINNER_BONUS,
  WINS_NEEDED,
  matchWinner,
  resolveRound,
  roundWins,
  type DuelMode,
  type DuelRole,
  type DuelRound,
  type DuelStatus,
} from '@/lib/duel'

// Vocab Duel — poll match state / submit an answer / cancel a challenge.
//
// There are no websockets here on purpose (the app's sync convention is
// polling — see src/app/lobby). Every state transition is executed inside
// these handlers: rounds resolve when both players have answered OR when the
// deadline passes, whichever a request observes first. Writes use an
// optimistic lock on updated_at so two simultaneous answers can't clobber
// each other's jsonb.
//
// Ghost mode adds two phases around the same engine:
//   recording — the host plays solo; answers are stored but rounds are NOT
//               adjudicated (there is no opponent yet). Ends → status 'open'.
//   playback  — a challenger joins later and races the recording; the host's
//               answers are final, so each round resolves the moment the
//               challenger answers (or the clock runs out).

interface MatchRow {
  id: string
  code: string
  mode: DuelMode
  vocabulary_set_id: string | null
  label: string
  host_id: string
  host_name: string
  guest_id: string | null
  guest_name: string | null
  status: DuelStatus
  rounds: DuelRound[]
  current_round: number
  winner: DuelRole | 'tie' | null
  host_seen_at: string | null
  guest_seen_at: string | null
  updated_at: string
}

async function loadMatch(id: string): Promise<MatchRow | null> {
  const { data } = await supabaseAdmin.from('duel_matches').select('*').eq('id', id).maybeSingle()
  return (data as MatchRow | null) ?? null
}

/**
 * Resolve every round that is due and arm the next one. `hostFinal` is true
 * during ghost playback: the host's recorded answers are all they will ever
 * give, so a round is "complete" once the guest alone has answered.
 * Pure on its inputs; returns null when nothing changed.
 */
function advance(rounds: DuelRound[], currentRound: number, now: number, hostFinal: boolean): {
  rounds: DuelRound[]
  currentRound: number
  finished: boolean
  winner: DuelRole | 'tie' | null
} | null {
  const rs = rounds.map((r) => ({ ...r }))
  let cur = currentRound
  let changed = false
  while (cur < rs.length) {
    const r = rs[cur]
    if (!r.startedAt || r.winner !== undefined) break
    const started = Date.parse(r.startedAt)
    if (now < started) break // countdown still running
    const both = (hostFinal || r.host !== undefined) && r.guest !== undefined
    const expired = now > started + ROUND_MS + ANSWER_GRACE_MS
    if (!both && !expired) break
    r.winner = resolveRound(r)
    changed = true
    const wins = roundWins(rs)
    if (wins.host >= WINS_NEEDED || wins.guest >= WINS_NEEDED || cur + 1 >= rs.length) {
      // Clinched or out of rounds: unplayed trailing rounds are dropped from
      // consideration by marking the match finished now.
      return { rounds: rs, currentRound: cur, finished: true, winner: matchWinner(rs.filter((x) => x.winner !== undefined)) }
    }
    cur += 1
    rs[cur] = { ...rs[cur], startedAt: new Date(now + REVEAL_MS).toISOString() }
  }
  return changed ? { rounds: rs, currentRound: cur, finished: false, winner: null } : null
}

/**
 * Ghost recording phase: move through rounds as the host answers (or lets
 * the clock expire). No winners are assigned — adjudication happens at
 * playback. Returns null when nothing changed.
 */
function advanceRecording(rounds: DuelRound[], currentRound: number, now: number): {
  rounds: DuelRound[]
  currentRound: number
  recordingDone: boolean
} | null {
  const rs = rounds.map((r) => ({ ...r }))
  let cur = currentRound
  let changed = false
  while (cur < rs.length) {
    const r = rs[cur]
    if (!r.startedAt) break
    const started = Date.parse(r.startedAt)
    if (now < started) break
    const answered = r.host !== undefined
    const expired = now > started + ROUND_MS + ANSWER_GRACE_MS
    if (!answered && !expired) break
    changed = true
    if (cur + 1 >= rs.length) return { rounds: rs, currentRound: cur, recordingDone: true }
    cur += 1
    rs[cur] = { ...rs[cur], startedAt: new Date(now + REVEAL_MS).toISOString() }
  }
  return changed ? { rounds: rs, currentRound: cur, recordingDone: false } : null
}

/** Persist with optimistic concurrency; caller retries on conflict. */
async function save(match: MatchRow, patch: Partial<MatchRow>): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('duel_matches')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', match.id)
    .eq('updated_at', match.updated_at)
    .select('id')
  return !!data && data.length > 0
}

/**
 * Ghost defense bonus. The recorder has long since closed their end screen,
 * so when their ghost WINS the playback we credit the winner bonus with a
 * direct insert. This is the one deliberate exception to "ArcadeEndScreen is
 * the only save path" — annotated here so it stays the only one.
 */
async function creditGhostDefense(m: MatchRow): Promise<void> {
  if (!m.vocabulary_set_id) return
  try {
    const { data } = await supabaseAdmin
      .from('students')
      .select('email')
      .eq('google_user_id', m.host_id)
      .maybeSingle()
    await supabaseAdmin.from('vocabulary_game_scores').insert({
      user_id: m.host_id,
      user_email: (data as { email?: string | null } | null)?.email ?? null,
      vocabulary_set_id: m.vocabulary_set_id,
      game_type: 'duel',
      score: WINNER_BONUS,
      max_score: WINNER_BONUS,
      game_data: { ghost_defense: true, match_id: m.id, challenger: m.guest_name },
    })
  } catch (e) {
    console.error('Ghost defense bonus failed:', e)
  }
}

/**
 * Strip server-only fields from rounds the caller shouldn't see yet. When a
 * ghost recording completes (status 'open'), the HOST gets the correct
 * answers revealed so their end screen can pay participation points — only
 * the host can ever read an 'open' match (a challenger has no seat yet).
 */
function sanitize(rounds: DuelRound[], role: DuelRole, revealAll: boolean) {
  const opp: DuelRole = role === 'host' ? 'guest' : 'host'
  return rounds.map((r) => {
    if (r.winner !== undefined || revealAll) {
      return { prompt: r.prompt, options: r.options, correct: r.correct, startedAt: r.startedAt, winner: r.winner, mine: r[role] ?? null, theirs: r[opp] ?? null }
    }
    return { prompt: r.prompt, options: r.options, startedAt: r.startedAt, mine: r[role] ?? null, theirsAnswered: r[opp] !== undefined }
  })
}

function view(m: MatchRow, role: DuelRole, now: number) {
  const opp: DuelRole = role === 'host' ? 'guest' : 'host'
  const oppSeen = opp === 'host' ? m.host_seen_at : m.guest_seen_at
  const decided = m.rounds.filter((r) => r.winner !== undefined)
  return {
    id: m.id,
    code: m.code,
    mode: m.mode,
    status: m.status,
    label: m.label,
    vocabularySetId: m.vocabulary_set_id,
    role,
    hostName: m.host_name,
    guestName: m.guest_name,
    currentRound: m.current_round,
    totalRounds: m.rounds.length,
    wins: roundWins(decided),
    winner: m.winner,
    opponentSeenAgoMs: oppSeen ? Math.max(0, now - Date.parse(oppSeen)) : null,
    serverNow: now,
    rounds: sanitize(m.rounds, role, m.status === 'open' && role === 'host'),
  }
}

function roleOf(m: MatchRow, userId: string): DuelRole | null {
  if (m.host_id === userId) return 'host'
  if (m.guest_id === userId) return 'guest'
  return null
}

function seenPatch(role: DuelRole, now: number): Partial<MatchRow> {
  return role === 'host' ? { host_seen_at: new Date(now).toISOString() } : { guest_seen_at: new Date(now).toISOString() }
}

/** Apply due transitions for the caller's poll. Returns the patch (may be just the heartbeat). */
function transition(m: MatchRow, now: number): Partial<MatchRow> {
  if (m.status === 'recording') {
    const adv = advanceRecording(m.rounds, m.current_round, now)
    if (!adv) return {}
    return adv.recordingDone
      ? { rounds: adv.rounds, current_round: adv.currentRound, status: 'open' as DuelStatus }
      : { rounds: adv.rounds, current_round: adv.currentRound }
  }
  if (m.status === 'active') {
    const adv = advance(m.rounds, m.current_round, now, m.mode === 'ghost')
    if (!adv) return {}
    const patch: Partial<MatchRow> = { rounds: adv.rounds, current_round: adv.currentRound }
    if (adv.finished) {
      patch.status = 'finished'
      patch.winner = adv.winner
    }
    return patch
  }
  return {}
}

// GET /api/duel/[id] — poll. Also the engine that resolves expired rounds.
export const GET = withAuth(async (_request, ctx) => {
  const { id } = await ctx.params
  for (let attempt = 0; attempt < 3; attempt++) {
    const m = await loadMatch(id)
    if (!m) return NextResponse.json({ error: 'Duel not found' }, { status: 404 })
    const role = roleOf(m, ctx.userId)
    if (!role) return NextResponse.json({ error: 'Not your duel' }, { status: 403 })

    const now = Date.now()
    const patch: Partial<MatchRow> = { ...seenPatch(role, now), ...transition(m, now) }
    if (await save(m, patch)) {
      if (patch.status === 'finished' && m.mode === 'ghost' && patch.winner === 'host') {
        await creditGhostDefense({ ...m, ...patch } as MatchRow)
      }
      return NextResponse.json(view({ ...m, ...patch } as MatchRow, role, now))
    }
    // lost the write race — re-read and try again
  }
  // Heartbeat conflicts are harmless; serve the latest state read-only.
  const m = await loadMatch(id)
  if (!m) return NextResponse.json({ error: 'Duel not found' }, { status: 404 })
  const role = roleOf(m, ctx.userId)
  if (!role) return NextResponse.json({ error: 'Not your duel' }, { status: 403 })
  return NextResponse.json(view(m, role, Date.now()))
})

// POST /api/duel/[id] { round, answer, ms } — lock in an answer.
// During 'recording' only the host answers; during 'active' ghost playback
// only the guest has a live seat (the host's slot is already filled).
export const POST = withAuth(async (request, ctx) => {
  const { id } = await ctx.params
  const body = (await request.json().catch(() => ({}))) as { round?: number; answer?: number; ms?: number }
  if (typeof body.round !== 'number' || typeof body.answer !== 'number') {
    return NextResponse.json({ error: 'round and answer required' }, { status: 400 })
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    const m = await loadMatch(id)
    if (!m) return NextResponse.json({ error: 'Duel not found' }, { status: 404 })
    const role = roleOf(m, ctx.userId)
    if (!role) return NextResponse.json({ error: 'Not your duel' }, { status: 403 })
    if (m.status !== 'active' && m.status !== 'recording') {
      return NextResponse.json({ error: 'Duel is not accepting answers' }, { status: 409 })
    }
    if (m.status === 'recording' && role !== 'host') return NextResponse.json({ error: 'Not your recording' }, { status: 403 })
    if (body.round !== m.current_round) return NextResponse.json({ error: 'That round is over' }, { status: 409 })

    const now = Date.now()
    const r = m.rounds[m.current_round]
    if (!r?.startedAt || now < Date.parse(r.startedAt)) {
      return NextResponse.json({ error: 'Round has not started' }, { status: 409 })
    }
    if (r[role] !== undefined) return NextResponse.json({ error: 'Already answered' }, { status: 409 })
    const started = Date.parse(r.startedAt)
    if (now > started + ROUND_MS + ANSWER_GRACE_MS) {
      return NextResponse.json({ error: 'Too late — time expired' }, { status: 409 })
    }

    // Client-reported elapsed (when the question was painted) clamped by the
    // server clock, so a tampered tiny ms can't beat physics.
    const claimed = typeof body.ms === 'number' && body.ms >= 0 ? body.ms : ROUND_MS
    const ms = Math.min(Math.max(claimed, 150), now - started + 500, ROUND_MS)
    const answer = Math.max(0, Math.min(Math.floor(body.answer), r.options.length - 1))

    const withAnswer = m.rounds.map((x, i) => (i === m.current_round ? { ...x, [role]: { answer, ms } } : { ...x }))
    const patch: Partial<MatchRow> = { ...seenPatch(role, now), ...transition({ ...m, rounds: withAnswer } as MatchRow, now) }
    if (!patch.rounds) patch.rounds = withAnswer
    if (await save(m, patch)) {
      if (patch.status === 'finished' && m.mode === 'ghost' && patch.winner === 'host') {
        await creditGhostDefense({ ...m, ...patch } as MatchRow)
      }
      return NextResponse.json(view({ ...m, ...patch } as MatchRow, role, now))
    }
  }
  return NextResponse.json({ error: 'Busy, try again' }, { status: 503 })
})

// DELETE /api/duel/[id] — the host retracts a challenge that no one has
// claimed: a live lobby ('waiting'), an in-progress recording, or an open
// ghost. Leaving the waiting room calls this, which is what keeps the open
// list free of dead challenges.
export const DELETE = withAuth(async (_request, ctx) => {
  const { id } = await ctx.params
  const m = await loadMatch(id)
  if (!m) return NextResponse.json({ ok: true }) // already gone
  if (m.host_id !== ctx.userId) return NextResponse.json({ error: 'Not your duel' }, { status: 403 })
  if (m.status === 'active' || m.status === 'finished') {
    return NextResponse.json({ error: 'Too late to cancel — the duel has a challenger' }, { status: 409 })
  }
  await supabaseAdmin.from('duel_matches').delete().eq('id', id).in('status', ['waiting', 'recording', 'open'])
  return NextResponse.json({ ok: true })
})
