import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getRoom, decodeEscapeConfig, freshState, clueForMember, type EscapeState } from '@/lib/lobby/escape'

// GET /api/lobby/sessions/[id]/escape — live, per-group escape progress for the
// teacher dashboard. Reads the same block_responses run-state the student API
// writes (block_type 'escape_state'), so it needs no extra storage.

type GroupRow = { id: string; label: string }
type StateRow = { block_id: string; response: EscapeState }

export const GET = withRole(['teacher', 'admin'], async (_request, ctx) => {
  const { id } = await ctx.params

  const { data: sessionRaw } = await supabaseAdmin
    .from('lobby_sessions')
    .select('id, created_by, task_type, prompt:task_prompt')
    .eq('id', id)
    .maybeSingle()
  const session = sessionRaw as
    | { id: string; created_by: string; task_type: string; prompt: string | null }
    | null
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (ctx.role !== 'admin' && session.created_by !== ctx.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (session.task_type !== 'escape') {
    return NextResponse.json({ error: 'Not an escape session' }, { status: 400 })
  }

  const config = decodeEscapeConfig(session.prompt)
  const room = config ? getRoom(config.roomId) : null
  if (!room) return NextResponse.json({ error: 'Escape room is not configured' }, { status: 500 })

  const [{ data: groupsRaw }, { data: statesRaw }, { data: membersRaw }] = await Promise.all([
    supabaseAdmin.from('lobby_groups').select('id, label').eq('session_id', id),
    supabaseAdmin
      .from('block_responses')
      .select('block_id, response')
      .eq('session_id', id)
      .eq('block_type', 'escape_state'),
    supabaseAdmin.from('lobby_members').select('user_id, group_id, joined_at').eq('session_id', id).order('joined_at'),
  ])
  const groups = (groupsRaw ?? []) as GroupRow[]
  const states = (statesRaw ?? []) as StateRow[]
  const members = (membersRaw ?? []) as { user_id: string; group_id: string | null; joined_at: string }[]

  // group_id → ordered member ids (by joined_at) — drives the count + clue ordinals.
  const membersByGroup = new Map<string, string[]>()
  for (const m of members) {
    if (!m.group_id) continue
    const arr = membersByGroup.get(m.group_id) ?? []
    arr.push(m.user_id)
    membersByGroup.set(m.group_id, arr)
  }
  const sizeByGroup = new Map<string, number>()
  for (const [gid, arr] of membersByGroup) sizeByGroup.set(gid, arr.length)

  // block_id is `escape:<group_id>` — index state by group.
  const stateByGroup = new Map<string, EscapeState>()
  for (const s of states) {
    const gid = s.block_id.startsWith('escape:') ? s.block_id.slice('escape:'.length) : null
    if (gid) stateByGroup.set(gid, { ...freshState(), ...(s.response ?? {}) })
  }

  const lockCount = room.locks.length
  const groupViews = groups
    .map((g) => {
      const st = stateByGroup.get(g.id) ?? freshState()
      const finished = st.stage >= lockCount || !!st.finishedAt
      const currentLock = finished ? null : room.locks[st.stage]
      const ids = membersByGroup.get(g.id) ?? []
      const solvedBy = st.solvedBy ?? []
      // who holds which clue on the CURRENT lock, in join order (ordinal)
      const memberClues = ids.map((uid, ordinal) => ({
        user_id: uid,
        ordinal,
        clue: currentLock ? clueForMember(currentLock, ordinal) : null,
        solved: solvedBy.includes(uid),
      }))
      return {
        group_id: g.id,
        label: g.label,
        stage: Math.min(st.stage, lockCount),
        lockCount,
        finished,
        currentLockTitle: currentLock ? currentLock.title : null,
        fragmentCount: st.fragments.length,
        wrongAttempts: st.wrongAttempts ?? 0,
        finishedAt: st.finishedAt ?? null,
        lastAt: st.lastAt ?? null,
        // per-member gate: how many of the group have entered the CURRENT code
        solvedCount: solvedBy.filter((u) => ids.includes(u)).length,
        groupSize: ids.length,
        members: memberClues,
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))

  return NextResponse.json({
    // Teacher-only: each lock's title AND its answer code, so the teacher can
    // read out / verify codes. Never sent to the student API.
    room: {
      id: room.id,
      title: room.title,
      lockCount,
      accent: room.accent ?? null,
      locks: room.locks.map((l) => ({ title: l.title, code: l.answers[0] ?? '' })),
      lockTitles: room.locks.map((l) => l.title),
    },
    groups: groupViews,
    summary: {
      total: groupViews.length,
      finished: groupViews.filter((g) => g.finished).length,
      stuck: groupViews.filter((g) => !g.finished && g.wrongAttempts >= 3).length,
    },
  })
})
