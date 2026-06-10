import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { PLAY_MAX_AGE_MS, type PlayRow } from '@/lib/arcade'

/**
 * POST /api/arcade/score { playId, score, act?, final? } — report a run score.
 *
 * Only a coin-backed, still-active play belonging to the caller can post.
 * Scores are clamped to the game's max_plausible_score and only ever move up
 * (best of the run). `final: true` closes the run; until then a run may post
 * checkpoint scores (e.g. after each cleared act).
 */
export const POST = withAuth(async (request, ctx) => {
  const body = await request.json().catch(() => ({}))
  const { playId, score, act, final } = body as {
    playId?: string; score?: number; act?: number; final?: boolean
  }
  if (!playId || typeof score !== 'number' || !Number.isFinite(score)) {
    return NextResponse.json({ error: 'Missing playId or score' }, { status: 400 })
  }

  const { data: playRaw } = await supabaseAdmin
    .from('arcade_plays')
    .select('id, user_id, game_slug, status, score, meta, created_at')
    .eq('id', playId)
    .single()
  const play = playRaw as PlayRow | null
  if (!play || play.user_id !== ctx.userId) {
    return NextResponse.json({ error: 'Unknown play' }, { status: 404 })
  }
  if (play.status !== 'active') {
    return NextResponse.json({ error: 'Run already closed' }, { status: 409 })
  }
  if (Date.now() - new Date(play.created_at).getTime() > PLAY_MAX_AGE_MS) {
    await supabaseAdmin.from('arcade_plays').update({ status: 'expired' }).eq('id', play.id)
    return NextResponse.json({ error: 'Coin expired' }, { status: 410 })
  }

  const { data: game } = await supabaseAdmin
    .from('arcade_games')
    .select('max_plausible_score')
    .eq('slug', play.game_slug)
    .single()
  const cap = game?.max_plausible_score ?? 100000

  const newScore = Math.max(play.score, Math.min(cap, Math.max(0, Math.round(score))))
  const meta = { ...(play.meta ?? {}), ...(typeof act === 'number' ? { act } : {}) }

  const { error } = await supabaseAdmin
    .from('arcade_plays')
    .update({
      score: newScore,
      meta,
      ...(final ? { status: 'finished', finished_at: new Date().toISOString() } : {}),
    })
    .eq('id', play.id)
  if (error) {
    console.error('[arcade/score] update failed:', error)
    return NextResponse.json({ error: 'Could not record score' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, score: newScore, finished: !!final })
})
