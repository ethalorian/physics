import { projectedBlockPages } from '@/lib/projected-block'
import type { InlineQuestion } from '@/data/content-blocks'
import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'node:crypto'
import { classLesson } from '@/lib/present-server'
import { paginateBlocks } from '@/data/content-blocks'
import { sectionAnchor, sectionIndexForAnchor } from '@/lib/lesson-anchors'

// PATCH /api/present/sessions/[id] — P-3 live controls. Every field optional.
//   current_slide, current_section, poll_block_id (null closes the poll),
//   poll_locked, poll_revealed, blackout, timer_seconds (null clears), status 'ended'.
type Patch = {
  projected_block_id?: string | null; projected_block_page?: number
  current_anchor?: string | null; current_slide?: number; current_section?: number; poll_block_id?: string | null
  poll_locked?: boolean; poll_revealed?: boolean; blackout?: boolean
  timer_seconds?: number | null; status?: 'live' | 'ended'; discussion?: 'start' | 'revote'
}

export const PATCH = withRole<{ id: string }>(['teacher', 'admin'], async (request, ctx) => {
  const { id } = await ctx.params
  const body = (await request.json().catch(() => ({}))) as Patch
  const { data: s } = await supabaseAdmin.from('present_sessions').select('id, teacher_id, lesson_id, course_id, projected_block_id, poll_block_id, poll_run_id').eq('id', id).maybeSingle()
  if (!s) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (ctx.role !== 'admin' && (s as { teacher_id: string }).teacher_id !== ctx.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Ending requires ownership, not a still-published/reachable class lesson.
  if (body.status === 'ended') {
    const pulse = await supabaseAdmin.from('present_pulses').update({ status: 'closed' }).eq('session_id', id).eq('status', 'open')
    if (pulse.error) return NextResponse.json({ error: 'Could not close the pulse check. Retry ending the presentation.' }, { status: 503 })
    const { data, error } = await supabaseAdmin.from('present_sessions').update({ status: 'ended', poll_block_id: null, poll_run_id: null, poll_locked: true, poll_revealed: false, timer_ends_at: null, projected_block_id: null, projected_block_page: 0, blackout: true, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
    if (error) return NextResponse.json({ error: 'Could not end the presentation. Please retry.' }, { status: 503 })
    return NextResponse.json({ session: data })
  }

  const lesson = s.course_id ? await classLesson(s.lesson_id, s.course_id, ctx, { hydrate: Boolean(body.projected_block_id) || 'projected_block_page' in body }) : null
  if (!lesson) return NextResponse.json({ error: 'Class lesson unavailable' }, { status: 403 })
  const pages = paginateBlocks(lesson.content_blocks.blocks)
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.timer_seconds != null && (!Number.isFinite(body.timer_seconds) || body.timer_seconds < 0 || body.timer_seconds > 3600)) return NextResponse.json({ error: 'Timer must be 0–3600 seconds' }, { status: 400 })
  if (typeof body.current_slide === 'number') update.current_slide = Math.max(0, Math.floor(body.current_slide))
  if ('current_anchor' in body) {
    const index = sectionIndexForAnchor(pages, body.current_anchor)
    if (index < 0 && body.current_anchor !== null) return NextResponse.json({ error: 'Unknown section anchor' }, { status: 400 })
    update.current_anchor = body.current_anchor
    if (index >= 0) update.current_section = index
  } else if (typeof body.current_section === 'number') {
    const index = Math.floor(body.current_section)
    if (!pages[index]) return NextResponse.json({ error: 'Unknown section' }, { status: 400 })
    update.current_section = index; update.current_anchor = sectionAnchor(pages[index])
  }
  if ('poll_block_id' in body) {
    if (body.poll_block_id && !lesson.content_blocks.blocks.some(b => b.id === body.poll_block_id && b.type === 'question' && (b.question as InlineQuestion).options?.length)) return NextResponse.json({ error: 'Invalid poll block' }, { status: 400 })
    update.poll_run_id = body.poll_block_id ? randomUUID() : null
    update.poll_block_id = body.poll_block_id ?? null
    // Opening a new poll resets lock + reveal.
    if (body.poll_block_id) { update.poll_locked = false; update.poll_revealed = false }
  }
  if ('projected_block_id' in body) {
    if (body.projected_block_id !== null) {
      const block = lesson.content_blocks.blocks.find(b => b.id === body.projected_block_id)
      const index = pages.findIndex(p => p.blocks.some(b => b.id === body.projected_block_id))
      if (!block || block.type === 'deck' || index < 0) return NextResponse.json({ error: 'This lesson block is unavailable for this class.' }, { status: 400 })
      update.current_anchor = sectionAnchor(pages[index]); update.current_section = index
    }
    update.projected_block_id = body.projected_block_id
    update.projected_block_page = 0
  }
  if ('projected_block_page' in body) {
    const selected = 'projected_block_id' in body ? body.projected_block_id : s.projected_block_id
    const block = lesson.content_blocks.blocks.find(b => b.id === selected)
    if (!block || !Number.isInteger(body.projected_block_page) || body.projected_block_page! < 0 || body.projected_block_page! >= projectedBlockPages(block).length) return NextResponse.json({ error: 'Unknown block continuation' }, { status: 400 })
    update.projected_block_page = body.projected_block_page
  }
  if (typeof body.poll_locked === 'boolean') update.poll_locked = body.poll_locked
  if (typeof body.poll_revealed === 'boolean') { update.poll_revealed = body.poll_revealed; if (body.poll_revealed) update.poll_locked = true }
  if (typeof body.blackout === 'boolean') update.blackout = body.blackout
  if ('timer_seconds' in body) update.timer_ends_at = body.timer_seconds ? new Date(Date.now() + body.timer_seconds * 1000).toISOString() : null

  if (body.discussion) {
    if (!s.poll_block_id || !s.poll_run_id || !['start', 'revote'].includes(body.discussion)) return NextResponse.json({ error: 'Open a lesson poll first' }, { status: 409 })
    if (body.discussion === 'start') {
      update.poll_locked = true; update.poll_revealed = false
      update.timer_ends_at = new Date(Date.now() + 90000).toISOString()
      const tools = await supabaseAdmin.from('present_session_tools').upsert({ session_id: id, discussion_block_id: s.poll_block_id, discussion_poll_run_id: s.poll_run_id, updated_at: new Date().toISOString() })
      if (tools.error) throw tools.error
    } else {
      const tools = await supabaseAdmin.from('present_session_tools').select('discussion_block_id').eq('session_id', id).maybeSingle()
      if (tools.error) throw tools.error
      if (tools.data?.discussion_block_id !== s.poll_block_id) return NextResponse.json({ error: 'Start a discussion on this poll before re-voting' }, { status: 409 })
      update.poll_run_id = randomUUID(); update.poll_locked = false; update.poll_revealed = false; update.timer_ends_at = null
      const cleared = await supabaseAdmin.from('present_session_tools').update({ discussion_block_id: null, updated_at: new Date().toISOString() }).eq('session_id', id)
      if (cleared.error) throw cleared.error
    }
  }
  if (body.poll_block_id) {
    const pulse = await supabaseAdmin.from('present_pulses').update({ status: 'closed' }).eq('session_id', id).eq('status', 'open')
    if (pulse.error) throw pulse.error
  }
  const { data, error } = await supabaseAdmin.from('present_sessions').update(update).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ error: 'Could not update' }, { status: 500 })
  return NextResponse.json({ session: data })
})

// GET /api/present/sessions/[id]?block_id=… — P-3 response bars + "N of M saved".
// Counts the LATEST live_poll answer per student for the open poll block.
export const GET = withRole<{ id: string }>(['teacher', 'admin'], async (request, ctx) => {
  const { id } = await ctx.params
  const blockId = new URL(request.url).searchParams.get('block_id')
  const { data: s } = await supabaseAdmin.from('present_sessions').select('id, teacher_id, lesson_id, course_id, command_revision, status, projected_block_id, projected_block_page, current_slide, current_section, current_anchor, poll_block_id, poll_run_id, poll_locked, poll_revealed, blackout, timer_ends_at, created_at, updated_at').eq('id', id).maybeSingle()
  if (!s) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  const sess = s as { id: string; teacher_id: string; lesson_id: string; course_id: string | null; poll_block_id: string | null; poll_run_id: string | null }
  if (ctx.role !== 'admin' && sess.teacher_id !== ctx.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // One small read for live notifications; no roster, lobby, or answer aggregation.
  if (new URL(request.url).searchParams.get('state_only') === '1') return NextResponse.json({ session: s }, { headers: { 'Cache-Control': 'no-store' } })

  // A lobby launched during this presentation temporarily takes the board.
  // Read existing session relationships; no second presentation state store.
  const { data: lobby, error: lobbyError } = await supabaseAdmin.from('lobby_sessions')
    .select('id, code, status').eq('created_by', sess.teacher_id).eq('course_id', sess.course_id ?? '')
    .eq('lesson_id', sess.lesson_id).gte('created_at', s.created_at)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (lobbyError) return NextResponse.json({ error: 'Could not refresh live activity' }, { status: 503 })
  const liveState = { session: s, lobby: lobby?.status === 'closed' ? null : lobby ?? null }
  const block = blockId ?? sess.poll_block_id
  if (block && block !== sess.poll_block_id) return NextResponse.json({ error: 'Poll not active' }, { status: 400 })
  let enrolled = 0
  if (sess.course_id) {
    const { count } = await supabaseAdmin.from('course_students').select('student_id', { count: 'exact', head: true }).eq('course_id', sess.course_id)
    enrolled = count ?? 0
  }
  if (!block) return NextResponse.json({ ...liveState, block_id: null, enrolled, saved: 0, tally: {}, wrongSure: 0 })

  const { data: rows } = await supabaseAdmin.from('block_responses')
    .select('user_id, response, confidence, created_at')
    .eq('lesson_id', sess.lesson_id).eq('present_session_id', id).eq('poll_run_id', sess.poll_run_id ?? '__none__').eq('block_id', block).eq('evidence_source', 'live_poll')
    .order('created_at', { ascending: false })
  const latest = new Map<string, { optionId?: string; autoCheck?: string; confidence: string | null }>()
  for (const r of (rows ?? []) as { user_id: string; response: { optionId?: string; autoCheck?: string } | null; confidence: string | null }[]) {
    if (!latest.has(r.user_id)) latest.set(r.user_id, { optionId: r.response?.optionId, autoCheck: r.response?.autoCheck, confidence: r.confidence })
  }
  const tally: Record<string, number> = {}
  let wrongSure = 0
  for (const v of latest.values()) {
    if (v.optionId) tally[v.optionId] = (tally[v.optionId] ?? 0) + 1
    if (v.autoCheck === 'mismatch' && v.confidence === 'sure') wrongSure++
  }
  return NextResponse.json({ ...liveState, block_id: block, enrolled, saved: latest.size, tally, wrongSure })
})
