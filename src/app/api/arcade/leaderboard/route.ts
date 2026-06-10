import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { weekStartISO, displayNames, rankPlays, type PlayRow } from '@/lib/arcade'

/**
 * GET /api/arcade/leaderboard?slug=<game> — the full board for one cabinet:
 * this week's top 10 (season resets Monday 00:00 UTC) plus the all-time
 * Hall of Fame top 5. Aliases only — this is a student-to-student surface.
 */
export const GET = withAuth(async (request, ctx) => {
  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const { data: playsRaw } = await supabaseAdmin
    .from('arcade_plays')
    .select('id, user_id, game_slug, status, score, meta, created_at')
    .eq('game_slug', slug)
    .gt('score', 0)
  const plays = (playsRaw ?? []) as PlayRow[]

  const weekStart = weekStartISO()
  const weekly = rankPlays(plays.filter((p) => p.created_at >= weekStart))
  const allTime = rankPlays(plays)

  const ids = [...new Set([...weekly.slice(0, 10), ...allTime.slice(0, 5)].map((r) => r.user_id))]
  const names = await displayNames(ids)
  const row = (r: { user_id: string; score: number }, i: number) => ({
    rank: i + 1,
    name: r.user_id === ctx.userId ? 'You' : (names.get(r.user_id) ?? 'Student'),
    score: r.score,
    isMe: r.user_id === ctx.userId,
  })

  return NextResponse.json({
    weekStart,
    weekly: weekly.slice(0, 10).map(row),
    myWeeklyRank: weekly.findIndex((r) => r.user_id === ctx.userId) + 1 || null,
    hallOfFame: allTime.slice(0, 5).map(row),
  })
})
