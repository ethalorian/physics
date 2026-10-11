import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { weekStartISO, displayNames, rankPlays, type PlayRow } from '@/lib/arcade'
import { DEFAULT_PULSE_CHART, pulseChart } from '@/lib/pulse-charts'

/**
 * GET /api/arcade/leaderboard?slug=<game> — the full board for one cabinet:
 * this week's top 10 (season resets Monday 00:00 UTC) plus the all-time
 * Hall of Fame top 5. Aliases only — this is a student-to-student surface.
 */
export const GET = withAuth(async (request, ctx) => {
  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  if (slug === 'pulse') {
    const chart = pulseChart(request.nextUrl.searchParams.get('chart') ?? DEFAULT_PULSE_CHART)
    if (!chart) return NextResponse.json({ error: 'Unknown Pulse chart' }, { status: 400 })
    const weekStart = weekStartISO()
    // Aggregate in Postgres so the REST row limit cannot truncate a chart's ranks.
    const { data, error } = await supabaseAdmin.rpc('pulse_chart_leaderboard', { p_chart_id: chart.id, p_user_id: ctx.userId, p_week_start: weekStart })
    if (error) return NextResponse.json({ error: 'Could not load rankings' }, { status: 503 })
    type Ranked = { user_id: string; score: number; rank: number }
    const result = data as { weekly: Ranked[]; hallOfFame: Ranked[]; myWeeklyRank: number | null }
    const names = await displayNames([...new Set([...result.weekly, ...result.hallOfFame].map(r => r.user_id))])
    const row = (r: Ranked) => ({ rank: r.rank, score: r.score, isMe: r.user_id === ctx.userId, name: r.user_id === ctx.userId ? 'You' : (names.get(r.user_id) ?? 'Student') })
    return NextResponse.json({ chartId: chart.id, weekStart, weekly: result.weekly.map(row), hallOfFame: result.hallOfFame.map(row), myWeeklyRank: result.myWeeklyRank })
  }

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
