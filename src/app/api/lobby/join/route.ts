import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

async function findOpenSession(code: string) {
  const { data } = await supabaseAdmin
    .from('lobby_sessions')
    .select('id, code, status, task_type, prompt, group_size')
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

  let phraseLength = 0
  if (member && (member as { group_id: string | null }).group_id) {
    const { data: grp } = await supabaseAdmin
      .from('lobby_groups')
      .select('passphrase')
      .eq('id', (member as { group_id: string }).group_id)
      .maybeSingle()
    phraseLength = ((grp as { passphrase: string[] } | null)?.passphrase ?? []).length
  }

  // Has this student already submitted an artifact?
  const { data: existing } = await supabaseAdmin
    .from('block_responses')
    .select('id')
    .eq('session_id', session.id)
    .eq('user_id', ctx.userId)
    .maybeSingle()

  const m = member as
    | { group_id: string | null; word: string | null; phrase_completed_at: string | null; word_entries: { word: string; at: string }[] }
    | null

  return NextResponse.json({
    session_id: session.id,
    status: session.status,
    task_type: session.task_type,
    prompt: session.prompt,
    joined: !!m,
    grouped: !!(m && m.group_id),
    word: m?.word ?? null,
    phraseLength,
    enteredWords: (m?.word_entries ?? []).map((e) => e.word),
    completed: !!m?.phrase_completed_at,
    submitted: !!existing,
  })
})
