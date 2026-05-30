import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getAvatarData } from '@/lib/lobby/avatars'

async function findOpenSession(code: string) {
  const { data } = await supabaseAdmin
    .from('lobby_sessions')
    .select('id, code, status, task_type, prompt:task_prompt, group_size')
    .eq('code', code.toUpperCase())
    .maybeSingle()
  return data as
    | { id: string; code: string; status: string; task_type: string; prompt: string | null; group_size: number }
    | null
}

// POST /api/lobby/join { code } — enter a lobby. Idempotent per (session,user).
export const POST = withAuth(async (request, ctx) => {
  const { code } = (await request.json().catch(() => ({}))) as { code?: string }
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 })

  const session = await findOpenSession(code)
  if (!session) return NextResponse.json({ error: 'No lobby with that code' }, { status: 404 })
  if (session.status === 'closed') return NextResponse.json({ error: 'This lobby is closed' }, { status: 410 })

  const { error } = await supabaseAdmin
    .from('lobby_members')
    .upsert(
      { session_id: session.id, user_id: ctx.userId, joined_at: new Date().toISOString() },
      { onConflict: 'session_id,user_id', ignoreDuplicates: true },
    )
  if (error) return NextResponse.json({ error: 'Failed to join' }, { status: 500 })

  return NextResponse.json({ ok: true, code: session.code, status: session.status })
})

// GET /api/lobby/join?code=XXXX — poll the signed-in student's state.
export const GET = withAuth(async (request, ctx) => {
  const code = new URL(request.url).searchParams.get('code') ?? ''
  const session = await findOpenSession(code)
  if (!session) return NextResponse.json({ error: 'No lobby with that code' }, { status: 404 })

  const { data: member } = await supabaseAdmin
    .from('lobby_members')
    .select('group_id, word, phrase_completed_at, word_entries')
    .eq('session_id', session.id)
    .eq('user_id', ctx.userId)
    .maybeSingle()

  const m = member as
    | { group_id: string | null; word: string | null; phrase_completed_at: string | null; word_entries: { word: string; at: string }[] }
    | null
  const groupId = m?.group_id ?? null

  // Group roster (alias + avatar) so students can find their partners. We pull
  // the whole group's members; aliases only — emails never leave the server here.
  let phraseLength = 0
  let groupMates: { user_id: string; phrase_completed_at: string | null }[] = []
  if (groupId) {
    const [{ data: grp }, { data: gm }] = await Promise.all([
      supabaseAdmin.from('lobby_groups').select('passphrase').eq('id', groupId).maybeSingle(),
      supabaseAdmin.from('lobby_members').select('user_id, phrase_completed_at').eq('session_id', session.id).eq('group_id', groupId).order('joined_at'),
    ])
    phraseLength = ((grp as { passphrase: string[] } | null)?.passphrase ?? []).length
    groupMates = (gm ?? []) as { user_id: string; phrase_completed_at: string | null }[]
  }

  // alias + avatar for self and every groupmate
  const gids = Array.from(new Set([ctx.userId, ...groupMates.map((x) => x.user_id)]))
  const [{ data: studs }, avatars] = await Promise.all([
    supabaseAdmin.from('students').select('google_user_id, alias, name').in('google_user_id', gids),
    getAvatarData(gids),
  ])
  const aliasByGid = new Map<string, string>()
  for (const s of (studs ?? []) as { google_user_id: string | null; alias: string | null; name: string | null }[]) {
    if (s.google_user_id) aliasByGid.set(s.google_user_id, s.alias || s.name || 'Student')
  }
  const bundle = (gid: string) => ({
    alias: aliasByGid.get(gid) ?? 'Student',
    traits: avatars.byUser[gid]?.traits ?? {},
    equipped: avatars.byUser[gid]?.equipped ?? {},
  })

  const group = groupMates.map((x) => ({
    ...bundle(x.user_id),
    completed: !!x.phrase_completed_at,
    isMe: x.user_id === ctx.userId,
  }))

  // Has this student already submitted an artifact?
  const { data: existing } = await supabaseAdmin
    .from('block_responses')
    .select('id')
    .eq('session_id', session.id)
    .eq('user_id', ctx.userId)
    .maybeSingle()

  return NextResponse.json({
    session_id: session.id,
    status: session.status,
    task_type: session.task_type,
    prompt: session.prompt,
    joined: !!m,
    grouped: !!groupId,
    word: m?.word ?? null,
    phraseLength,
    enteredWords: (m?.word_entries ?? []).map((e) => e.word),
    completed: !!m?.phrase_completed_at,
    submitted: !!existing,
    self: bundle(ctx.userId),
    group,
    avatarItems: avatars.items,
  })
})
