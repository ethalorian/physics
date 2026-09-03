import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { roleForIndex } from '@/lib/lobby/discourse'

// POST /api/lobby/submit { session_id, response }
// The collaboration gate: a student can only submit once they've assembled the
// full passphrase (phrase_completed_at set). The artifact lands in
// block_responses, reusing the existing capture machinery.
export const POST = withAuth(async (request, ctx) => {
  const { session_id, response } = (await request.json().catch(() => ({}))) as {
    session_id?: string
    response?: unknown
  }
  if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

  const { data: session } = await supabaseAdmin
    .from('lobby_sessions')
    .select('id, status, task_type, target_id, lesson_id, block_id')
    .eq('id', session_id)
    .maybeSingle()
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if ((session as { status: string }).status === 'closed') {
    return NextResponse.json({ error: 'This lobby is closed' }, { status: 410 })
  }

  const { data: member } = await supabaseAdmin
    .from('lobby_members')
    .select('phrase_completed_at')
    .eq('session_id', session_id)
    .eq('user_id', ctx.userId)
    .maybeSingle()
  if (!member) return NextResponse.json({ error: 'Not in this lobby' }, { status: 404 })
  if (!(member as { phrase_completed_at: string | null }).phrase_completed_at) {
    return NextResponse.json(
      { error: 'Assemble the full passphrase with your group before submitting.' },
      { status: 403 },
    )
  }

  const taskType = (session as { task_type: string }).task_type
  // E-4 / L-4 · the artifact carries the member's role (derived from join order, as the
  // device and the board do), the session's target and lesson, and evidence_source 'lobby'.
  const sess = session as { task_type: string; target_id?: string | null; lesson_id?: string | null; block_id?: string | null }
  const { data: mates } = await supabaseAdmin.from('lobby_members').select('user_id, group_id, joined_at').eq('session_id', session_id).order('joined_at', { ascending: true })
  const mine = (mates ?? []).find((m) => (m as { user_id: string }).user_id === ctx.userId) as { group_id: string | null } | undefined
  const groupMates = (mates ?? []).filter((m) => mine?.group_id && (m as { group_id: string | null }).group_id === mine.group_id)
  const myIdx = groupMates.findIndex((m) => (m as { user_id: string }).user_id === ctx.userId)
  const role = myIdx >= 0 ? roleForIndex(myIdx).label : null
  const payload =
    typeof response === 'string' ? { text: response } : (response as Record<string, unknown>) ?? {}

  // One artifact per student per session: update if present, else insert.
  const { data: existing } = await supabaseAdmin
    .from('block_responses')
    .select('id')
    .eq('session_id', session_id)
    .eq('user_id', ctx.userId)
    .maybeSingle()

  if (existing) {
    await supabaseAdmin
      .from('block_responses')
      .update({ response: payload })
      .eq('id', (existing as { id: string }).id)
  } else {
    const { error } = await supabaseAdmin.from('block_responses').insert({
      user_id: ctx.userId,
      user_email: ctx.email,
      session_id,
      lesson_id: sess.lesson_id ?? null,
      block_id: sess.block_id ? `lobby:${session_id}:${sess.block_id}` : `lobby:${session_id}`,
      block_type: `lobby_${taskType}`,
      response: payload,
      target_id: sess.target_id ?? null,
      evidence_source: 'lobby',
      role,
    })
    if (error) return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
})
