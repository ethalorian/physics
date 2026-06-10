import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { MAX_PLAYERS, type BalPlayer } from '@/lib/balderdash'

// POST /api/balderdash/join { code } — take a seat in a waiting room.
// Idempotent for someone already seated (including rejoining after a refresh,
// even mid-game). Optimistic lock on updated_at keeps simultaneous joins safe.
export const POST = withAuth(async (request, ctx) => {
  const { code } = (await request.json().catch(() => ({}))) as { code?: string }
  if (!code?.trim()) return NextResponse.json({ error: 'code required' }, { status: 400 })

  for (let attempt = 0; attempt < 4; attempt++) {
    const { data } = await supabaseAdmin
      .from('balderdash_sessions')
      .select('id, status, players, updated_at')
      .eq('code', code.trim().toUpperCase())
      .maybeSingle()
    const m = data as { id: string; status: string; players: BalPlayer[]; updated_at: string } | null
    if (!m) return NextResponse.json({ error: 'No room with that code' }, { status: 404 })

    const players = Array.isArray(m.players) ? m.players : []
    if (players.some((p) => p.id === ctx.userId)) return NextResponse.json({ id: m.id }) // already seated
    if (m.status !== 'waiting') return NextResponse.json({ error: 'That game already started' }, { status: 409 })
    if (players.length >= MAX_PLAYERS) return NextResponse.json({ error: 'Room is full' }, { status: 409 })

    const { data: student } = await supabaseAdmin
      .from('students')
      .select('alias, name')
      .eq('google_user_id', ctx.userId)
      .maybeSingle()
    const s = student as { alias: string | null; name: string | null } | null
    const name = s?.alias || s?.name || ctx.session.user?.name || `Player ${players.length + 1}`

    const { data: updated } = await supabaseAdmin
      .from('balderdash_sessions')
      .update({ players: [...players, { id: ctx.userId, name }], updated_at: new Date().toISOString() })
      .eq('id', m.id)
      .eq('updated_at', m.updated_at)
      .select('id')
    if (updated && updated.length > 0) return NextResponse.json({ id: m.id })
    // lost the write race — re-read and retry
  }
  return NextResponse.json({ error: 'Busy, try again' }, { status: 503 })
})
