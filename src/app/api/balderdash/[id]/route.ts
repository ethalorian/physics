import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import {
  BAL_REVEAL_MS,
  MAX_DEF_LEN,
  MIN_PLAYERS,
  PHASE_GRACE_MS,
  VOTE_MS,
  WRITE_MS,
  balScores,
  buildBallot,
  roundPhase,
  type BalPlayer,
  type BalRound,
  type BalStatus,
} from '@/lib/balderdash'

// Physics Balderdash — poll room state / act / cancel.
//
// Same engine pattern as Vocab Duel: no websockets, every phase transition is
// executed inside these handlers when a request observes it is due (everyone
// has acted, or the phase clock ran out). Optimistic lock on updated_at; the
// host's poll is the only heartbeat write, so a 12-player room doesn't
// thrash the row.
//
// Phase cycle per round:  writing → voting → reveal → next round.
// The real definition leaves the server ONLY inside the shuffled ballot.

interface SessionRow {
  id: string
  code: string
  vocabulary_set_id: string | null
  label: string
  host_id: string
  status: BalStatus
  players: BalPlayer[]
  rounds: BalRound[]
  current_round: number
  host_seen_at: string | null
  updated_at: string
}

async function load(id: string): Promise<SessionRow | null> {
  const { data } = await supabaseAdmin.from('balderdash_sessions').select('*').eq('id', id).maybeSingle()
  return (data as SessionRow | null) ?? null
}

async function save(m: SessionRow, patch: Partial<SessionRow>): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('balderdash_sessions')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', m.id)
    .eq('updated_at', m.updated_at)
    .select('id')
  return !!data && data.length > 0
}

/** Execute every due phase transition. Returns null when nothing changed. */
function advance(m: SessionRow, now: number): Partial<SessionRow> | null {
  if (m.status !== 'playing') return null
  const rounds = m.rounds.map((r) => ({ ...r }))
  let cur = m.current_round
  let status: BalStatus = m.status
  let changed = false

  while (cur < rounds.length) {
    const r = rounds[cur]
    const phase = roundPhase(r)
    if (phase === 'writing') {
      const started = Date.parse(r.startedAt!)
      const everyoneWrote = m.players.every((p) => (r.writings[p.id] ?? '').trim().length > 0)
      const expired = now > started + WRITE_MS + PHASE_GRACE_MS
      if (!everyoneWrote && !expired) break
      r.entries = buildBallot(r)
      r.votingAt = new Date(now).toISOString()
      changed = true
    } else if (phase === 'voting') {
      const opened = Date.parse(r.votingAt!)
      const everyoneVoted = m.players.every((p) => r.votes[p.id] !== undefined)
      const expired = now > opened + VOTE_MS + PHASE_GRACE_MS
      if (!everyoneVoted && !expired) break
      r.revealAt = new Date(now).toISOString()
      changed = true
    } else if (phase === 'reveal') {
      if (now < Date.parse(r.revealAt!) + BAL_REVEAL_MS) break
      changed = true
      if (cur + 1 >= rounds.length) {
        status = 'finished'
        break
      }
      cur += 1
      rounds[cur] = { ...rounds[cur], startedAt: new Date(now).toISOString() }
    } else {
      break // round not started (shouldn't happen while playing)
    }
  }

  if (!changed) return null
  const patch: Partial<SessionRow> = { rounds, current_round: cur }
  if (status !== m.status) patch.status = status
  return patch
}

/** What the caller is allowed to see right now. */
function view(m: SessionRow, userId: string, now: number) {
  const nameOf = (pid: string | null) => (pid === null ? null : m.players.find((p) => p.id === pid)?.name ?? 'Player')
  const r = m.rounds[m.current_round]
  const phase = m.status === 'playing' && r ? roundPhase(r) : undefined
  const scores = balScores(m.rounds, m.players)

  let round: Record<string, unknown> | null = null
  if (r && m.status !== 'waiting') {
    const base = {
      term: r.term,
      wroteCount: Object.values(r.writings).filter((t) => t.trim()).length,
      votedCount: Object.keys(r.votes).length,
      myText: r.writings[userId] ?? null,
      myVote: r.votes[userId] ?? null,
    }
    if (phase === 'writing') {
      round = { ...base, phaseEndsAt: Date.parse(r.startedAt!) + WRITE_MS }
    } else if (phase === 'voting') {
      // Anonymous ballot: texts only, plus which index is the caller's own
      // fake (so the client can disable it) — never who wrote the others.
      round = {
        ...base,
        phaseEndsAt: Date.parse(r.votingAt!) + VOTE_MS,
        ballot: (r.entries ?? []).map((e) => e.text),
        myEntryIndex: (r.entries ?? []).findIndex((e) => e.pid === userId),
      }
    } else if (phase === 'reveal') {
      round = {
        ...base,
        phaseEndsAt: Date.parse(r.revealAt!) + BAL_REVEAL_MS,
        reveal: (r.entries ?? []).map((e, idx) => ({
          text: e.text,
          real: e.pid === null,
          author: nameOf(e.pid),
          mine: e.pid === userId,
          voters: Object.entries(r.votes).filter(([, v]) => v === idx).map(([pid]) => nameOf(pid)),
        })),
      }
    }
  }

  return {
    id: m.id,
    code: m.code,
    status: m.status,
    label: m.label,
    vocabularySetId: m.vocabulary_set_id,
    isHost: m.host_id === userId,
    you: userId,
    minPlayers: MIN_PLAYERS,
    players: m.players.map((p) => ({ name: p.name, score: scores[p.id] ?? 0, isYou: p.id === userId })),
    currentRound: m.current_round,
    totalRounds: m.rounds.length,
    phase: m.status === 'finished' ? undefined : phase,
    serverNow: now,
    round,
    // Full per-round recap for the finished screen.
    recap: m.status === 'finished'
      ? m.rounds.filter((x) => x.revealAt).map((x) => ({
          term: x.term,
          real: x.real,
          myText: x.writings[userId] ?? null,
          spotted: x.votes[userId] !== undefined && (x.entries ?? [])[x.votes[userId]]?.pid === null,
          fooled: Object.entries(x.votes).filter(([pid, v]) => pid !== userId && (x.entries ?? [])[v]?.pid === userId).length,
        }))
      : undefined,
  }
}

function isPlayer(m: SessionRow, userId: string): boolean {
  return m.players.some((p) => p.id === userId)
}

// GET /api/balderdash/[id] — poll. Drives all due phase transitions.
export const GET = withAuth(async (_request, ctx) => {
  const { id } = await ctx.params
  for (let attempt = 0; attempt < 3; attempt++) {
    const m = await load(id)
    if (!m) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    if (!isPlayer(m, ctx.userId)) return NextResponse.json({ error: 'Not your game' }, { status: 403 })

    const now = Date.now()
    const adv = advance(m, now)
    // Heartbeat: host only, throttled, so 12 pollers don't fight over the row.
    const heartbeatDue = m.host_id === ctx.userId && (!m.host_seen_at || now - Date.parse(m.host_seen_at) > 5000)
    if (!adv && !heartbeatDue) return NextResponse.json(view(m, ctx.userId, now))

    const patch: Partial<SessionRow> = { ...(adv ?? {}) }
    if (heartbeatDue) patch.host_seen_at = new Date(now).toISOString()
    if (await save(m, patch)) return NextResponse.json(view({ ...m, ...patch } as SessionRow, ctx.userId, now))
    // lost the write race — re-read and try again
  }
  const m = await load(id)
  if (!m) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  if (!isPlayer(m, ctx.userId)) return NextResponse.json({ error: 'Not your game' }, { status: 403 })
  return NextResponse.json(view(m, ctx.userId, Date.now()))
})

// POST /api/balderdash/[id] — { action: 'start' } (host) |
//                              { action: 'write', text } | { action: 'vote', index }
export const POST = withAuth(async (request, ctx) => {
  const { id } = await ctx.params
  const body = (await request.json().catch(() => ({}))) as { action?: string; text?: string; index?: number }

  for (let attempt = 0; attempt < 4; attempt++) {
    const m = await load(id)
    if (!m) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    if (!isPlayer(m, ctx.userId)) return NextResponse.json({ error: 'Not your game' }, { status: 403 })
    const now = Date.now()

    let patch: Partial<SessionRow> | null = null

    if (body.action === 'start') {
      if (m.host_id !== ctx.userId) return NextResponse.json({ error: 'Only the host can start' }, { status: 403 })
      if (m.status !== 'waiting') return NextResponse.json({ error: 'Already started' }, { status: 409 })
      if (m.players.length < MIN_PLAYERS) {
        return NextResponse.json({ error: `Need at least ${MIN_PLAYERS} players` }, { status: 409 })
      }
      const rounds = m.rounds.map((r) => ({ ...r }))
      rounds[0] = { ...rounds[0], startedAt: new Date(now).toISOString() }
      patch = { status: 'playing', rounds, current_round: 0 }
    } else if (body.action === 'write') {
      if (m.status !== 'playing') return NextResponse.json({ error: 'Game is not running' }, { status: 409 })
      const r = m.rounds[m.current_round]
      if (!r || roundPhase(r) !== 'writing') return NextResponse.json({ error: 'Writing is closed for this round' }, { status: 409 })
      const text = (body.text ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_DEF_LEN)
      if (text.length < 3) return NextResponse.json({ error: 'Write a definition first' }, { status: 400 })
      const rounds = m.rounds.map((x, i) =>
        i === m.current_round ? { ...x, writings: { ...x.writings, [ctx.userId]: text } } : x,
      )
      patch = advance({ ...m, rounds } as SessionRow, now) ?? { rounds }
    } else if (body.action === 'vote') {
      if (m.status !== 'playing') return NextResponse.json({ error: 'Game is not running' }, { status: 409 })
      const r = m.rounds[m.current_round]
      if (!r || roundPhase(r) !== 'voting') return NextResponse.json({ error: 'Voting is closed for this round' }, { status: 409 })
      if (r.votes[ctx.userId] !== undefined) return NextResponse.json({ error: 'Already voted' }, { status: 409 })
      const idx = typeof body.index === 'number' ? Math.floor(body.index) : -1
      const entries = r.entries ?? []
      if (idx < 0 || idx >= entries.length) return NextResponse.json({ error: 'Invalid vote' }, { status: 400 })
      if (entries[idx].pid === ctx.userId) return NextResponse.json({ error: "You can't vote for your own definition" }, { status: 400 })
      const rounds = m.rounds.map((x, i) =>
        i === m.current_round ? { ...x, votes: { ...x.votes, [ctx.userId]: idx } } : x,
      )
      patch = advance({ ...m, rounds } as SessionRow, now) ?? { rounds }
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    if (await save(m, patch)) return NextResponse.json(view({ ...m, ...patch } as SessionRow, ctx.userId, now))
  }
  return NextResponse.json({ error: 'Busy, try again' }, { status: 503 })
})

// DELETE /api/balderdash/[id] — host cancels a room nobody is playing yet.
export const DELETE = withAuth(async (_request, ctx) => {
  const { id } = await ctx.params
  const m = await load(id)
  if (!m) return NextResponse.json({ ok: true })
  if (m.host_id !== ctx.userId) return NextResponse.json({ error: 'Not your room' }, { status: 403 })
  if (m.status !== 'waiting') return NextResponse.json({ error: 'Game already started' }, { status: 409 })
  await supabaseAdmin.from('balderdash_sessions').delete().eq('id', id).eq('status', 'waiting')
  return NextResponse.json({ ok: true })
})
