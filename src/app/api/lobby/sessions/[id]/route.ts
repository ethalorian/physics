import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getAvatarData } from '@/lib/lobby/avatars'
import { roleForIndex } from '@/lib/lobby/discourse'

type Member = {
  user_id: string
  group_id: string | null
  word: string | null
  word_index: number | null
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
      .select('user_id, group_id, word, word_index, joined_at, phrase_completed_at, word_entries')
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

  // Role + within-group index per member, derived from join order (no schema).
  const idxInGroup = new Map<string, number>()
  const roleByUser = new Map<string, string>()
  const groupIdxToUser = new Map<string, string>()
  for (const m of memberRows) {
    if (!m.group_id) continue
    const i = idxInGroup.get(m.group_id) ?? 0
    roleByUser.set(m.user_id, roleForIndex(i).label)
    groupIdxToUser.set(`${m.group_id}:${i}`, m.user_id)
    idxInGroup.set(m.group_id, i + 1)
  }

  // Peer attribution: parse each student's "built on" and tally who got credited.
  const builtOnByUser = new Map<string, { who_alias: string; note: string }>()
  const creditCount = new Map<string, number>()
  for (const m of memberRows) {
    const resp = artifactByUid.get(m.user_id)?.response as
      | { built_on?: { who_idx?: number; who_alias?: string; note?: string } }
      | undefined
    const bo = resp?.built_on
    if (!bo) continue
    builtOnByUser.set(m.user_id, { who_alias: bo.who_alias ?? '', note: bo.note ?? '' })
    if (m.group_id && typeof bo.who_idx === 'number') {
      const credited = groupIdxToUser.get(`${m.group_id}:${bo.who_idx}`)
      if (credited) creditCount.set(credited, (creditCount.get(credited) ?? 0) + 1)
    }
  }

  const pieces = Array.isArray((session as { jigsaw_pieces?: unknown }).jigsaw_pieces)
    ? ((session as { jigsaw_pieces: string[] }).jigsaw_pieces)
    : null

  const enriched = memberRows.map((m) => ({
    ...m,
    name: nameByGid.get(m.user_id) ?? 'Student',
    email: emailByGid.get(m.user_id) ?? null,
    role: roleByUser.get(m.user_id) ?? null,
    builtOn: builtOnByUser.get(m.user_id) ?? null,
    creditedBy: creditCount.get(m.user_id) ?? 0,
    piece: pieces && typeof m.word_index === 'number' ? (pieces[m.word_index] ?? null) : null,
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

// DELETE /api/lobby/sessions/[id] — remove a session entirely. The FK cascades
// take its groups, members, and any submitted artifacts (block_responses) with it.
export const DELETE = withRole(['teacher', 'admin'], async (_request, ctx) => {
  const { id } = await ctx.params
  const { data: session } = await supabaseAdmin
    .from('lobby_sessions').select('created_by').eq('id', id).maybeSingle()
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (ctx.role !== 'admin' && (session as { created_by: string }).created_by !== ctx.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { error } = await supabaseAdmin.from('lobby_sessions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  return NextResponse.json({ ok: true })
})
