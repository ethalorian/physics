import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getBalance } from '@/lib/points'
import { weekStartISO, displayNames, rankPlays, type ArcadeGame, type PlayRow } from '@/lib/arcade'

/**
 * GET /api/arcade/cabinet — everything the arcade floor needs in one call:
 * the student's XP balance, every enabled cabinet, and for each game the
 * caller's best, this week's leader, and the all-time record (Hall of Fame).
 */
export const GET = withAuth(async (request, ctx) => {
  const [{ data: gamesRaw }, balance] = await Promise.all([
    supabaseAdmin
      .from('arcade_games')
      .select('*')
      .eq('enabled', true)
      .order('sort_order', { ascending: true }),
    getBalance(ctx.userId),
  ])
  const games = (gamesRaw ?? []) as ArcadeGame[]

  // First arcade play ever (any cabinet) is free — see /api/arcade/coin.
  const { count: priorPlays } = await supabaseAdmin
    .from('arcade_plays')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', ctx.userId)
  const freeCreditAvailable = (priorPlays ?? 0) === 0

  if (games.length === 0) {
    return NextResponse.json({ balance, freeCreditAvailable, games: [] })
  }

  const { data: playsRaw } = await supabaseAdmin
    .from('arcade_plays')
    .select('id, user_id, game_slug, status, score, meta, created_at')
    .in('game_slug', games.map((g) => g.slug))
    .gt('score', 0)
  const plays = (playsRaw ?? []) as PlayRow[]

  const weekStart = weekStartISO()
  const ids = new Set<string>()
  const perGame = games.map((g) => {
    const gp = plays.filter((p) => p.game_slug === g.slug)
    const allTime = rankPlays(gp)
    const weekly = rankPlays(gp.filter((p) => p.created_at >= weekStart))
    const myBest = gp
      .filter((p) => p.user_id === ctx.userId)
      .reduce((m, p) => Math.max(m, p.score), 0)
    const myWeeklyRank = weekly.findIndex((r) => r.user_id === ctx.userId) + 1 || null
    if (allTime[0]) ids.add(allTime[0].user_id)
    if (weekly[0]) ids.add(weekly[0].user_id)
    return { g, allTime: allTime[0] ?? null, weekly: weekly[0] ?? null, myBest, myWeeklyRank }
  })

  const names = await displayNames([...ids])
  const label = (r: { user_id: string; score: number } | null) =>
    r ? { name: r.user_id === ctx.userId ? 'You' : (names.get(r.user_id) ?? 'Student'), score: r.score } : null

  return NextResponse.json({
    balance,
    freeCreditAvailable,
    weekStart,
    games: perGame.map(({ g, allTime, weekly, myBest, myWeeklyRank }) => ({
      slug: g.slug,
      name: g.name,
      blurb: g.blurb,
      unit: g.unit,
      accent: g.accent,
      costXp: g.cost_xp,
      srcPath: g.src_path,
      myBest,
      myWeeklyRank,
      weeklyLeader: label(weekly),
      hallOfFame: label(allTime),
    })),
  })
})
