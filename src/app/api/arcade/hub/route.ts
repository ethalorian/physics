import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/arcade/hub — the student's arcade reward loop, derived entirely from
// vocabulary_game_scores (no new tables): level/XP, daily streak, today's daily
// challenge progress, per-game personal bests, and the weekly leaderboard.

const XP_PER_LEVEL = 500
const DAILY_GAMES_GOAL = 3
const DAILY_POINTS_GOAL = 150
const ARCADE_GAMES = ['word-shoot', 'quiz-bowl', 'matching', 'concentration', 'letter-catch']

type ScoreRow = { user_id: string; user_email: string | null; score: number | null; game_type: string | null; completed_at: string }

function dayKey(iso: string): string { return new Date(iso).toISOString().slice(0, 10) }

export const GET = withAuth(async (request, ctx) => {
    const uid = ctx.userId

    // this student's scores (all-time)
    const { data: mineRaw } = await supabaseAdmin
      .from('vocabulary_game_scores')
      .select('user_id, score, game_type, completed_at')
      .eq('user_id', uid)
    const mine = (mineRaw ?? []) as ScoreRow[]

    // XP + level (all-time points = sum of scores)
    const totalXp = mine.reduce((s, r) => s + (r.score ?? 0), 0)
    const level = Math.floor(totalXp / XP_PER_LEVEL) + 1
    const xpInto = totalXp % XP_PER_LEVEL

    // daily streak: consecutive days (ending today or yesterday) with a play
    const playedDays = new Set(mine.map((r) => dayKey(r.completed_at)))
    let streakDays = 0
    {
      const d = new Date()
      d.setUTCHours(0, 0, 0, 0)
      const todayKey = d.toISOString().slice(0, 10)
      if (!playedDays.has(todayKey)) d.setUTCDate(d.getUTCDate() - 1) // allow streak to count through yesterday
      while (playedDays.has(d.toISOString().slice(0, 10))) {
        streakDays++
        d.setUTCDate(d.getUTCDate() - 1)
      }
    }

    // today's daily challenge
    const today = new Date().toISOString().slice(0, 10)
    const todays = mine.filter((r) => dayKey(r.completed_at) === today)
    const gamesPlayed = todays.length
    const pointsToday = todays.reduce((s, r) => s + (r.score ?? 0), 0)
    const dailyComplete = gamesPlayed >= DAILY_GAMES_GOAL && pointsToday >= DAILY_POINTS_GOAL

    // per-game personal bests
    const bestByGame = new Map<string, { best: number; plays: number }>()
    for (const r of mine) {
      const g = r.game_type ?? ''
      const cur = bestByGame.get(g) ?? { best: 0, plays: 0 }
      cur.best = Math.max(cur.best, r.score ?? 0)
      cur.plays++
      bestByGame.set(g, cur)
    }
    const games = ARCADE_GAMES.map((g) => ({ id: g, best: bestByGame.get(g)?.best ?? 0, plays: bestByGame.get(g)?.plays ?? 0 }))

    // weekly leaderboard (all rostered students) from the last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: weekRaw } = await supabaseAdmin
      .from('vocabulary_game_scores')
      .select('user_id, user_email, score, game_type, completed_at')
      .gte('completed_at', weekAgo)
    const week = (weekRaw ?? []) as ScoreRow[]
    const ptsByUser = new Map<string, number>()
    for (const r of week) ptsByUser.set(r.user_id, (ptsByUser.get(r.user_id) ?? 0) + (r.score ?? 0))

    const ranked = [...ptsByUser.entries()].map(([id, points]) => ({ id, points })).sort((a, b) => b.points - a.points)
    // Peer-facing leaderboard: prefer the student's chosen alias, fall back
    // to their real name. Teachers see real names elsewhere; this surface is
    // student-to-student.
    const nameById = new Map<string, string>()
    if (ranked.length > 0) {
      const { data: studs } = await supabaseAdmin
        .from('students')
        .select('google_user_id, name, alias')
        .in('google_user_id', ranked.map((r) => r.id))
      for (const s of (studs ?? []) as { google_user_id: string | null; name: string | null; alias: string | null }[]) {
        if (s.google_user_id) nameById.set(s.google_user_id, s.alias || s.name || 'Student')
      }
    }
    const myRank = ranked.findIndex((r) => r.id === uid) + 1 || null
    const leaderboard = ranked.slice(0, 5).map((r, i) => ({
      rank: i + 1,
      name: r.id === uid ? 'You' : (nameById.get(r.id) ?? 'Student'),
      points: r.points,
      isMe: r.id === uid,
    }))

    return NextResponse.json({
      level,
      xp: { into: xpInto, forNext: XP_PER_LEVEL, total: totalXp },
      streakDays,
      daily: { gamesPlayed, gamesGoal: DAILY_GAMES_GOAL, pointsToday, pointsGoal: DAILY_POINTS_GOAL, complete: dailyComplete },
      games,
      leaderboard,
      myRank,
    })
})
