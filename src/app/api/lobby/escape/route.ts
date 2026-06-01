import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import {
  getRoom,
  decodeEscapeConfig,
  clueForMember,
  checkAnswer,
  freshState,
  WRONG_CODE_COOLDOWN_MS,
  type EscapeState,
} from '@/lib/lobby/escape'

// Escape Room API. Group run-state is stored as one block_responses row per
// group (block_type 'escape_state', synthetic user_id `escape:<group_id>` so it
// never collides with a student's own submission). No schema change required.

type SessionRow = { id: string; status: string; task_type: string; prompt: string | null }
type MemberRow = { group_id: string | null; joined_at: string }

async function loadContext(sessionId: string, userId: string) {
  const { data: sessionRaw } = await supabaseAdmin
    .from('lobby_sessions')
    .select('id, status, task_type, prompt:task_prompt')
    .eq('id', sessionId)
    .maybeSingle()
  const session = sessionRaw as SessionRow | null
  if (!session) return { error: 'Session not found' as const, status: 404 }
  if (session.task_type !== 'escape') return { error: 'Not an escape session' as const, status: 400 }

  const config = decodeEscapeConfig(session.prompt)
  const room = config ? getRoom(config.roomId) : null
  if (!config || !room) return { error: 'Escape room is not configured' as const, status: 500 }

  const { data: meRaw } = await supabaseAdmin
    .from('lobby_members')
    .select('group_id, joined_at')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .maybeSingle()
  const me = meRaw as MemberRow | null
  if (!me) return { error: 'Not in this lobby' as const, status: 404 }
  if (!me.group_id) return { error: 'Not grouped yet' as const, status: 409 }

  // Stable ordinal: position in the group ordered by joined_at (matches the
  // role/avatar ordering used elsewhere).
  const { data: matesRaw } = await supabaseAdmin
    .from('lobby_members')
    .select('user_id, joined_at')
    .eq('session_id', sessionId)
    .eq('group_id', me.group_id)
    .order('joined_at')
  const mates = (matesRaw ?? []) as { user_id: string; joined_at: string }[]
  const ordinal = Math.max(0, mates.findIndex((x) => x.user_id === userId))

  return { session, config, room, groupId: me.group_id, ordinal, groupSize: mates.length }
}

const stateKey = (groupId: string) => `escape:${groupId}`

async function readState(sessionId: string, groupId: string): Promise<{ id: string | null; state: EscapeState }> {
  const { data } = await supabaseAdmin
    .from('block_responses')
    .select('id, response')
    .eq('session_id', sessionId)
    .eq('block_id', stateKey(groupId))
    .maybeSingle()
  if (!data) return { id: null, state: freshState() }
  const row = data as { id: string; response: EscapeState }
  return { id: row.id, state: { ...freshState(), ...(row.response ?? {}) } }
}

async function writeState(args: {
  rowId: string | null
  sessionId: string
  groupId: string
  state: EscapeState
  email: string | null
}) {
  const { rowId, sessionId, groupId, state, email } = args
  if (rowId) {
    await supabaseAdmin.from('block_responses').update({ response: state }).eq('id', rowId)
  } else {
    await supabaseAdmin.from('block_responses').insert({
      user_id: stateKey(groupId), // synthetic group key (admin write bypasses RLS)
      user_email: email,
      session_id: sessionId,
      block_id: stateKey(groupId),
      block_type: 'escape_state',
      response: state,
    })
  }
}

// Credit the prize XP to every member of the group, once. dedupe_key makes the
// upsert idempotent, so the unlocker's finish (and any re-poll) never double-pays.
async function awardEscapeXp(args: {
  sessionId: string
  groupId: string
  xp: number
  note: string
}) {
  const { sessionId, groupId, xp, note } = args
  if (!Number.isFinite(xp) || xp <= 0) return
  const { data: membersRaw } = await supabaseAdmin
    .from('lobby_members')
    .select('user_id')
    .eq('session_id', sessionId)
    .eq('group_id', groupId)
  const members = (membersRaw ?? []) as { user_id: string }[]
  if (members.length === 0) return
  const specs = members.map((m) => ({
    user_id: m.user_id,
    source: 'escape-room',
    reference: sessionId,
    points: Math.round(xp),
    note,
    dedupe_key: `escape:${sessionId}:${groupId}:${m.user_id}`,
  }))
  await supabaseAdmin
    .from('economy_point_grants')
    .upsert(specs, { onConflict: 'dedupe_key', ignoreDuplicates: true })
}

function publicRoom(room: NonNullable<ReturnType<typeof getRoom>>) {
  return {
    id: room.id,
    title: room.title,
    tagline: room.tagline,
    intro: room.intro,
    finale: room.finale,
    lockTitles: room.locks.map((l) => l.title),
    lockCount: room.locks.length,
  }
}

// GET /api/lobby/escape?session_id=... — this student's escape view.
export const GET = withAuth(async (request, ctx) => {
  const sessionId = new URL(request.url).searchParams.get('session_id') ?? ''
  if (!sessionId) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

  const c = await loadContext(sessionId, ctx.userId)
  if ('error' in c) return NextResponse.json({ error: c.error }, { status: c.status })

  const { state } = await readState(sessionId, c.groupId)
  const finished = state.stage >= c.room.locks.length || !!state.finishedAt
  const lock = finished ? null : c.room.locks[state.stage]

  return NextResponse.json({
    room: publicRoom(c.room),
    stage: state.stage,
    finished,
    fragments: state.fragments,
    ordinal: c.ordinal,
    groupSize: c.groupSize,
    currentLock: lock ? { title: lock.title, narrative: lock.narrative } : null,
    myClue: lock ? clueForMember(lock, c.ordinal) : null,
    cooldownUntil: state.cooldownUntil ?? 0,
    prize: finished ? c.config.prize : null,
  })
})

// POST /api/lobby/escape { session_id, code } — attempt the current lock.
export const POST = withAuth(async (request, ctx) => {
  const { session_id, code } = (await request.json().catch(() => ({}))) as {
    session_id?: string
    code?: string
  }
  if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

  const c = await loadContext(session_id, ctx.userId)
  if ('error' in c) return NextResponse.json({ error: c.error }, { status: c.status })
  if (c.session.status === 'closed') return NextResponse.json({ error: 'This lobby is closed' }, { status: 410 })

  const { id: rowId, state } = await readState(session_id, c.groupId)

  if (state.stage >= c.room.locks.length || state.finishedAt) {
    return NextResponse.json({ correct: true, finished: true, stage: state.stage, fragments: state.fragments, prize: c.config.prize })
  }

  const now = Date.now()
  if (state.cooldownUntil && now < state.cooldownUntil) {
    return NextResponse.json({ correct: false, cooling: true, retryAfterMs: state.cooldownUntil - now }, { status: 429 })
  }

  const lock = c.room.locks[state.stage]
  const correct = checkAnswer(lock, code ?? '')

  if (!correct) {
    const next: EscapeState = { ...state, cooldownUntil: now + WRONG_CODE_COOLDOWN_MS }
    await writeState({ rowId, sessionId: session_id, groupId: c.groupId, state: next, email: ctx.email })
    return NextResponse.json({ correct: false, retryAfterMs: WRONG_CODE_COOLDOWN_MS })
  }

  const nowIso = new Date().toISOString()
  const stage = state.stage + 1
  const finished = stage >= c.room.locks.length
  const next: EscapeState = {
    stage,
    fragments: [...state.fragments, lock.reveal],
    unlocks: [...state.unlocks, { stage: state.stage, by: ctx.userId, at: nowIso }],
    finishedAt: finished ? nowIso : null,
    cooldownUntil: undefined,
  }
  await writeState({ rowId, sessionId: session_id, groupId: c.groupId, state: next, email: ctx.email })

  // On escape, credit the prize XP into the shared economy for every group member.
  if (finished && c.config.prize.xp) {
    await awardEscapeXp({
      sessionId: session_id,
      groupId: c.groupId,
      xp: c.config.prize.xp,
      note: `Escape Room: ${c.room.title}`,
    })
  }

  return NextResponse.json({
    correct: true,
    stage,
    finished,
    reveal: lock.reveal,
    fragments: next.fragments,
    prize: finished ? c.config.prize : null,
  })
})
