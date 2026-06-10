import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { generateLobbyCode } from '@/lib/lobby/passphrase'
import { BAL_ROUNDS, pickRounds, type BalTermInput } from '@/lib/balderdash'

// Physics Balderdash — create a room / list joinable rooms.
// Rounds (terms + real definitions) are fixed server-side at creation so the
// real definition never ships to clients until the voting ballot.

const LIVE_PRESENCE_MS = 15_000

async function displayName(userId: string, fallback: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('students')
    .select('alias, name')
    .eq('google_user_id', userId)
    .maybeSingle()
  const s = data as { alias: string | null; name: string | null } | null
  return s?.alias || s?.name || fallback
}

// POST /api/balderdash { terms, vocabularySetId, label } — create a room.
export const POST = withAuth(async (request, ctx) => {
  const body = (await request.json().catch(() => ({}))) as {
    terms?: BalTermInput[]
    vocabularySetId?: string | null
    label?: string
  }
  const terms = Array.isArray(body.terms) ? body.terms : []
  const rounds = pickRounds(terms)
  if (rounds.length === 0) {
    return NextResponse.json({ error: `Need at least ${BAL_ROUNDS} terms with definitions` }, { status: 400 })
  }

  const name = await displayName(ctx.userId, ctx.session.user?.name || 'Player 1')

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateLobbyCode(5)
    const { data, error } = await supabaseAdmin
      .from('balderdash_sessions')
      .insert({
        code,
        vocabulary_set_id: body.vocabularySetId ?? null,
        label: (body.label ?? '').slice(0, 120),
        host_id: ctx.userId,
        players: [{ id: ctx.userId, name }],
        rounds,
        host_seen_at: new Date().toISOString(),
      })
      .select('id, code')
      .single()
    if (!error && data) return NextResponse.json({ id: data.id, code: data.code }, { status: 201 })
    if (error && !/duplicate|unique/i.test(error.message)) {
      console.error('Balderdash create failed:', error)
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
    }
  }
  return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
})

// GET /api/balderdash — joinable rooms whose host is still in the lobby
// (same presence rule as live duels: no stale clutter from other periods).
export const GET = withAuth(async (_request, ctx) => {
  const liveSince = new Date(Date.now() - LIVE_PRESENCE_MS).toISOString()
  const { data } = await supabaseAdmin
    .from('balderdash_sessions')
    .select('id, code, label, host_id, players, created_at')
    .eq('status', 'waiting')
    .gte('host_seen_at', liveSince)
    .order('created_at', { ascending: false })
    .limit(20)
  type Row = { id: string; code: string; label: string; host_id: string; players: { id: string; name: string }[]; created_at: string }
  const open = ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    code: r.code,
    label: r.label,
    hostName: r.players?.[0]?.name ?? 'Player',
    playerCount: r.players?.length ?? 0,
    joined: (r.players ?? []).some((p) => p.id === ctx.userId),
  }))
  return NextResponse.json({ open })
})
