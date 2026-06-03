import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { DEFAULT_WORD_POOL, makeRng, shuffle } from '@/lib/lobby/grouping'

// POST /api/lobby/sessions/[id]/reassign { user_id, to_group_id }
// Manual override: move one student into another group. Because a group's
// passphrase is split exactly across its members, both the source and the
// destination group are re-issued a fresh passphrase sized to their new
// membership, and the affected members' collection progress is reset. Intended
// for use before the activity opens (or accept that those members re-collect).
export const POST = withRole(['teacher', 'admin'], async (request, ctx) => {
  const { id } = await ctx.params
  const { user_id, to_group_id } = (await request.json().catch(() => ({}))) as {
    user_id?: string
    to_group_id?: string | null
  }
  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }
  const target: string | null = to_group_id || null // null = remove from group (back to waiting pool)

  const { data: session } = await supabaseAdmin
    .from('lobby_sessions').select('created_by, jigsaw_pieces').eq('id', id).maybeSingle()
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (ctx.role !== 'admin' && (session as { created_by: string }).created_by !== ctx.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const jp = (session as { jigsaw_pieces: string[] | null }).jigsaw_pieces
  const pieceCount = Array.isArray(jp) ? jp.length : 0

  // Destination (when moving) must be a group in this session.
  if (target) {
    const { data: destGroup } = await supabaseAdmin
      .from('lobby_groups').select('id').eq('id', target).eq('session_id', id).maybeSingle()
    if (!destGroup) return NextResponse.json({ error: 'Unknown target group' }, { status: 400 })
  }

  // Current group of the member (may be null if ungrouped).
  const { data: member } = await supabaseAdmin
    .from('lobby_members').select('group_id').eq('session_id', id).eq('user_id', user_id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'Student not in this lobby' }, { status: 404 })
  const fromGroupId = (member as { group_id: string | null }).group_id
  if (fromGroupId === target) return NextResponse.json({ ok: true, unchanged: true })

  // Move (or remove, when target is null).
  await supabaseAdmin
    .from('lobby_members').update({ group_id: target }).eq('session_id', id).eq('user_id', user_id)
  // When removing, clear the student's passphrase fields so no stale word lingers.
  if (!target) {
    await supabaseAdmin.from('lobby_members')
      .update({ word: null, word_index: null, word_entries: [], phrase_completed_at: null })
      .eq('session_id', id).eq('user_id', user_id)
  }

  // Re-issue passphrases for each affected group (delete emptied groups).
  const affected = [fromGroupId, target].filter((g): g is string => !!g)
  for (const gid of affected) {
    const { data: gm } = await supabaseAdmin
      .from('lobby_members').select('user_id').eq('session_id', id).eq('group_id', gid).order('joined_at')
    const uids = (gm ?? []).map((m) => (m as { user_id: string }).user_id)

    if (uids.length === 0) {
      await supabaseAdmin.from('lobby_groups').delete().eq('id', gid)
      continue
    }

    const words = shuffle(DEFAULT_WORD_POOL, makeRng(Date.now() + gid.length)).slice(0, uids.length)
    await supabaseAdmin.from('lobby_groups').update({ passphrase: words }).eq('id', gid)
    for (let i = 0; i < uids.length; i++) {
      await supabaseAdmin
        .from('lobby_members')
        .update({ word: words[i], word_entries: [], phrase_completed_at: null, word_index: pieceCount > 0 ? i % pieceCount : null })
        .eq('session_id', id)
        .eq('user_id', uids[i])
    }
  }

  return NextResponse.json({ ok: true })
})
