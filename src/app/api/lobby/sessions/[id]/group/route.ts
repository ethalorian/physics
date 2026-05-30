import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { buildGroups, type GroupMode, type RosterStudent } from '@/lib/lobby/grouping'

// POST /api/lobby/sessions/[id]/group — form (or re-form) groups from the
// students currently in the lobby, hand each member one passphrase word, and
// move the session to 'grouped'. Re-running reshuffles everyone.
export const POST = withRole(['teacher', 'admin'], async (request, ctx) => {
  const { id } = await ctx.params
  const body = (await request.json().catch(() => ({}))) as { seed?: number }

  const { data: session } = await supabaseAdmin
    .from('lobby_sessions')
    .select('id, created_by, grouping_mode, group_size, target_id')
    .eq('id', id)
    .maybeSingle()
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  const s = session as {
    id: string; created_by: string; grouping_mode: string; group_size: number; target_id: string | null
  }
  if (ctx.role !== 'admin' && s.created_by !== ctx.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Who's in the lobby?
  const { data: members } = await supabaseAdmin
    .from('lobby_members')
    .select('user_id')
    .eq('session_id', id)
  const gids = (members ?? []).map((m) => (m as { user_id: string }).user_id)
  if (gids.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 students in the lobby' }, { status: 400 })
  }

  // Names + mastery levels for the joined students (target-filtered when set).
  const { data: studs } = await supabaseAdmin
    .from('students').select('google_user_id, name').in('google_user_id', gids)
  const nameByGid = new Map<string, string>()
  for (const st of studs ?? []) if (st.google_user_id) nameByGid.set(st.google_user_id, st.name ?? 'Student')

  let mq = supabaseAdmin.from('mastery_records').select('user_id, level').in('user_id', gids)
  if (s.target_id) mq = mq.eq('target_id', s.target_id)
  const { data: mrows } = await mq
  const acc = new Map<string, { total: number; count: number }>()
  for (const r of mrows ?? []) {
    const uid = (r as { user_id: string }).user_id
    const lvl = (r as { level: number | null }).level
    if (uid == null || typeof lvl !== 'number') continue
    const a = acc.get(uid) ?? { total: 0, count: 0 }
    a.total += lvl; a.count += 1; acc.set(uid, a)
  }

  const roster: RosterStudent[] = gids.map((gid) => {
    const a = acc.get(gid)
    return { userId: gid, name: nameByGid.get(gid) ?? 'Student', level: a ? a.total / a.count : null }
  })

  const mode: GroupMode = (['random', 'near_peer', 'matched'].includes(s.grouping_mode)
    ? s.grouping_mode
    : 'random') as GroupMode
  const groups = buildGroups(roster, {
    mode,
    groupSize: s.group_size,
    seed: body.seed ?? Math.floor(Math.random() * 1e9),
  })

  // Replace any prior grouping.
  await supabaseAdmin.from('lobby_groups').delete().eq('session_id', id)
  await supabaseAdmin
    .from('lobby_members')
    .update({ group_id: null, word: null, word_entries: [], phrase_completed_at: null })
    .eq('session_id', id)

  // Persist groups, then stamp each member's group_id + word.
  for (const g of groups) {
    const { data: gRow, error: gErr } = await supabaseAdmin
      .from('lobby_groups')
      .insert({ session_id: id, label: g.label, passphrase: g.passphrase })
      .select('id')
      .single()
    if (gErr || !gRow) return NextResponse.json({ error: 'Failed to save groups' }, { status: 500 })
    const groupId = (gRow as { id: string }).id
    for (const m of g.members) {
      await supabaseAdmin
        .from('lobby_members')
        .update({ group_id: groupId, word: m.word })
        .eq('session_id', id)
        .eq('user_id', m.userId)
    }
  }

  await supabaseAdmin
    .from('lobby_sessions')
    .update({ status: 'grouped', updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({
    ok: true,
    groups: groups.map((g) => ({ label: g.label, size: g.members.length })),
  })
})
