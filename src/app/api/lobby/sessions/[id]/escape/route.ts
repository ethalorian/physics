import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getRoom, decodeEscapeConfig, freshState, type EscapeState } from '@/lib/lobby/escape'

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

  const [{ data: groupsRaw }, { data: statesRaw }] = await Promise.all([
    supabaseAdmin.from('lobby_groups').select('id, label').eq('session_id', id),
    supabaseAdmin
      .from('block_responses')
      .select('block_id, response')
      .eq('session_id', id)
      .eq('block_type', 'escape_state'),
  ])
  const groups = (groupsRaw ?? []) as GroupRow[]
  const states = (statesRaw ?? []) as StateRow[]

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
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))

  return NextResponse.json({
    room: { title: room.title, lockTitles: room.locks.map((l) => l.title), lockCount },
    groups: groupViews,
    summary: {
      total: groupViews.length,
      finished: groupViews.filter((g) => g.finished).length,
      stuck: groupViews.filter((g) => !g.finished && g.wrongAttempts >= 3).length,
    },
  })
})
