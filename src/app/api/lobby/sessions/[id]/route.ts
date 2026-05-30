import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getAvatarData } from '@/lib/lobby/avatars'

type Member = {
  user_id: string
  group_id: string | null
  word: string | null
  joined_at: string
  phrase_completed_at: string | null
  word_entries: { word: string; at: string }[]
}

// GET /api/lobby/sessions/[id] — full state for the teacher live + review view.
export const GET = withRole(['teacher', 'admin'], async (_request, ctx) => {
  const { id } = await ctx.params

  const { data: session } = await supabaseAdmin
    .from('lobby_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (ctx.role !== 'admin' && (session as { created_by: string }).created_by !== ctx.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [{ data: groups }, { data: members }, { data: artifacts }] = await Promise.all([
    supabaseAdmin.from('lobby_groups').select('id, label, passphrase').eq('session_id', id).order('label'),
    supabaseAdmin
      .from('lobby_members')
      .select('user_id, group_id, word, joined_at, phrase_completed_at, word_entries')
      .eq('session_id', id)
      .order('joined_at'),
    supabaseAdmin
      .from('block_responses')
      .select('user_id, response, created_at')
      .eq('session_id', id)
      .order('created_at'),
  ])

  const memberRows = (members ?? []) as Member[]
  const gids = memberRows.map((m) => m.user_id)
  const nameByGid = new Map<string, string>()
  const emailByGid = new Map<string, string>()
  let avatars: Awaited<ReturnType<typeof getAvatarData>> = { items: [], byUser: {} }
  if (gids.length) {
    const [{ data: studs }, av] = await Promise.all([
      supabaseAdmin.from('students').select('google_user_id, name, email').in('google_user_id', gids),
      getAvatarData(gids),
    ])
    for (const s of (studs ?? []) as { google_user_id: string | null; name: string | null; email: string | null }[]) {
      if (s.google_user_id) {
        nameByGid.set(s.google_user_id, s.name ?? 'Student')
        if (s.email) emailByGid.set(s.google_user_id, s.email)
      }
    }
    avatars = av
  }

  const artifactByUid = new Map<string, { response: unknown; created_at: string }>()
  for (const a of artifacts ?? []) {
    artifactByUid.set((a as { user_id: string }).user_id, {
      response: (a as { response: unknown }).response,
      created_at: (a as { created_at: string }).created_at,
    })
  }

  const enriched = memberRows.map((m) => ({
    ...m,
    name: nameByGid.get(m.user_id) ?? 'Student',
    email: emailByGid.get(m.user_id) ?? null,
    traits: avatars.byUser[m.user_id]?.traits ?? {},
    equipped: avatars.byUser[m.user_id]?.equipped ?? {},
    artifact: artifactByUid.get(m.user_id) ?? null,
  }))

  const sessionOut = { ...(session as Record<string, unknown>), prompt: (session as { task_prompt?: string | null }).task_prompt ?? null }
  return NextResponse.json({ session: sessionOut, groups: groups ?? [], members: enriched, avatarItems: avatars.items })
})

// PATCH /api/lobby/sessions/[id] — change status (lobby|grouped|open|closed).
export const PATCH = withRole(['teacher', 'admin'], async (request, ctx) => {
  const { id } = await ctx.params
  const body = (await request.json().catch(() => ({}))) as { status?: string }
  const status = body.status
  if (!status || !['lobby', 'grouped', 'open', 'closed'].includes(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 })
  }

  const { data: session } = await supabaseAdmin
    .from('lobby_sessions')
    .select('created_by')
    .eq('id', id)
    .maybeSingle()
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (ctx.role !== 'admin' && (session as { created_by: string }).created_by !== ctx.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date().toISOString()
  const stamp =
    status === 'grouped' ? { grouped_at: now }
    : status === 'open' ? { opened_at: now }
    : status === 'closed' ? { closed_at: now }
    : {}
  const { error } = await supabaseAdmin
    .from('lobby_sessions')
    .update({ status, ...stamp })
    .eq('id', id)
  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  return NextResponse.json({ ok: true, status })
})
