import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth } from '@/lib/api-auth'
import { roleForIndex } from '@/lib/lobby/discourse'

// POST /api/lobby/reflect { session_id, note? }
// MC-5 · one-line role reflection at the lobby debrief (+5 XP, once per session).
// Lands in block_responses (evidence_source 'lobby', role) — never in mastery.

export const POST = withAuth(async (request, ctx) => {
    const body = (await request.json().catch(() => ({}))) as { session_id?: string; note?: string }
    const sessionId = body.session_id
    if (!sessionId) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

    const { data: session } = await supabaseAdmin.from('lobby_sessions').select('id, lesson_id, target_id, status').eq('id', sessionId).maybeSingle()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    const sess = session as { id: string; lesson_id: string | null; target_id: string | null; status: string }

    const { data: mates } = await supabaseAdmin.from('lobby_members').select('user_id, group_id').eq('session_id', sessionId).order('joined_at', { ascending: true })
    const rows = (mates ?? []) as { user_id: string; group_id: string | null }[]
    const mine = rows.find((m) => m.user_id === ctx.userId)
    if (!mine) return NextResponse.json({ error: 'Not a member of this lobby' }, { status: 403 })
    const groupMates = rows.filter((m) => mine.group_id && m.group_id === mine.group_id)
    const idx = groupMates.findIndex((m) => m.user_id === ctx.userId)
    const role = idx >= 0 ? roleForIndex(idx) : null

    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 400) : ''
    const blockId = `lobby-reflection:${sessionId}`
    const { data: existing } = await supabaseAdmin.from('block_responses').select('id').eq('user_id', ctx.userId).eq('block_id', blockId).maybeSingle()
    if (!existing) {
      const { error } = await supabaseAdmin.from('block_responses').insert({
        user_id: ctx.userId, user_email: ctx.email, session_id: sessionId, lesson_id: sess.lesson_id, block_id: blockId, block_type: 'lobby_reflection',
        response: { role: role?.label ?? null, did_role_move: true, note, mode: 'text' },
        target_id: sess.target_id, evidence_source: 'lobby', role: role?.label ?? null, response_mode: 'text',
      })
      if (error) return NextResponse.json({ error: 'Could not save' }, { status: 500 })
    }
    const { data: g } = await supabaseAdmin.from('economy_point_grants').upsert(
      { user_id: ctx.userId, user_email: ctx.email, source: 'lobby-reflection', reference: sessionId, points: 5, note: `Role reflection · ${role?.label ?? 'member'}`, dedupe_key: `lobby-reflection:${sessionId}:${ctx.userId}` },
      { onConflict: 'dedupe_key', ignoreDuplicates: true },
    ).select('id')
    return NextResponse.json({ ok: true, xp: Array.isArray(g) && g.length > 0 ? 5 : 0, role: role?.label ?? null })
})
