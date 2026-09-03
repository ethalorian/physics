import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getStreaksForUsers, getStreakDetail } from '@/lib/streak'

// GET - Fetch platform leaderboard
export const GET = withAuth(async (request, ctx) => {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const period = searchParams.get('period') || 'all-time' // all-time, week, month

    // Calculate date filter for period
    let dateFilter = null
    if (period === 'week') {
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    } else if (period === 'month') {
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    // Aggregate points from all sources
    // Aggregate points server-side and return only the top-N rows. The point
    // formula lives in the get_leaderboard RPC (see
    // supabase/migrations/optimize_leaderboard_aggregation.sql) and mirrors
    // src/lib/points.ts. This replaces the previous approach of loading the
    // entire game/lesson/submission tables into JS on every request.
    const userDataMap = new Map<string, { name?: string; email: string; totalPoints: number; activities: Record<string, number>; xp_by_source: Record<string, number>; image?: string | null }>()

    const { data: aggregated, error: aggError } = await supabaseAdmin.rpc('get_leaderboard', {
      p_since: dateFilter,
      p_limit: limit,
    })

    if (aggError) {
      console.error('Error aggregating leaderboard:', aggError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Always ALSO pull the last-7-days window (independent of the selected
    // period): it powers the class stat band, weekly gains, rank movement,
    // and the rotating spotlights.
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: weeklyAgg } = await supabaseAdmin.rpc('get_leaderboard', {
      p_since: weekStart,
      p_limit: 500,
    })

    // Per-source XP so the row can say WHERE the points came from — a student
    // whose 170 XP is all math-gym arcade used to read "0 games · 0 lessons".
    type AggRow = {
      user_id: string; user_email: string; total_points: number
      games: number; lessons: number; assignments: number
      games_pts: number; lessons_pts: number; graded_pts: number; math_pts: number
      arcade_pts: number; spin_pts: number; other_pts: number
      arcade_runs: number; spins: number; math_grants: number
    }
    for (const row of (aggregated ?? []) as AggRow[]) {
      userDataMap.set(row.user_id, {
        email: row.user_email || '',
        totalPoints: Number(row.total_points) || 0,
        activities: {
          games: row.games || 0, lessons: row.lessons || 0, assignments: row.assignments || 0,
          arcade_runs: row.arcade_runs || 0, spins: row.spins || 0, math_grants: row.math_grants || 0,
        },
        xp_by_source: {
          arcade: Number(row.arcade_pts) || 0,
          math: Number(row.math_pts) || 0,
          lessons: Number(row.lessons_pts) || 0,
          games: Number(row.games_pts) || 0,
          graded: Number(row.graded_pts) || 0,
          spin: Number(row.spin_pts) || 0,
          other: Number(row.other_pts) || 0,
        },
        image: null,
      })
    }

    const weeklyBy = new Map<string, AggRow>()
    for (const row of (weeklyAgg ?? []) as AggRow[]) weeklyBy.set(row.user_id, row)

    // Rank movement (all-time view only): today's order vs the order with this
    // week's points removed — "where were you before this week happened?"
    const prevRankBy = new Map<string, number>()
    if (period === 'all-time') {
      const prev = Array.from(userDataMap.entries())
        .map(([uid, d]) => ({ uid, pts: d.totalPoints - Number(weeklyBy.get(uid)?.total_points ?? 0) }))
        .sort((a, b) => b.pts - a.pts)
      prev.forEach((r, i) => prevRankBy.set(r.uid, i + 1))
    }

    // Class-wide stat band — the whole class's week, so every student sees
    // something they contributed to.
    const weeklyRows = (weeklyAgg ?? []) as AggRow[]
    const classStats = {
      weeklyXp: Math.round(weeklyRows.reduce((a, r) => a + Number(r.total_points || 0), 0)),
      activeStudents: weeklyRows.filter((r) => Number(r.total_points) > 0).length,
      mathXp: Math.round(weeklyRows.reduce((a, r) => a + Number(r.math_pts || 0), 0)),
      arcadeRuns: weeklyRows.reduce((a, r) => a + Number(r.arcade_runs || 0), 0),
      streaksAlive: 0, // filled in below once streaks are loaded
    }

    // Get student names + aliases + images + avatar bundles from the roster.
    // Lookup is by `id` because the work tables (game_scores, lesson_progress,
    // submissions) key by session.user.id, which IS students.id (uuid).
    const userIds = Array.from(new Set([...userDataMap.keys(), ...weeklyBy.keys()]))
    // Carry the students.id (uuid) per user so we can resolve avatar rows below.
    // (It equals the work-table user_id now, but we keep the map for the
    // student_row_id field below.)
    const studentRowIdByUser = new Map<string, string>()
    const nameBy = new Map<string, string>()
    // Carry has_mii + traits + equipped per user for the client. A finished
    // Mii IS the student's site-wide avatar — there is no separate opt-in.
    const avatarByUser = new Map<string, { has_mii: boolean; traits: Record<string, string> | null; equipped: Record<string, string> }>()

    if (userIds.length > 0) {
      const { data: students } = await supabaseAdmin
        .from('students')
        .select('id, name, alias, email')
        .in('id', userIds)

      students?.forEach((student: { id: string; name: string | null; alias: string | null; email: string | null }) => {
        nameBy.set(student.id, student.alias || student.name || (student.email ?? '').split('@')[0] || 'Student')
        const userData = userDataMap.get(student.id)
        if (userData) {
          // Prefer alias for the peer-facing leaderboard; fall back to real name.
          userData.name = student.alias || student.name || undefined
          studentRowIdByUser.set(student.id, student.id)
        }
      })

      // Avatar bundles keyed by students.id (student_avatars.user_id).
      const { data: avs } = await supabaseAdmin
        .from('student_avatars')
        .select('user_id, traits, equipped, setup_completed')
        .in('user_id', userIds)
      for (const a of (avs ?? []) as { user_id: string; traits: Record<string, string> | null; equipped: Record<string, string> | null; setup_completed: boolean }[]) {
        avatarByUser.set(a.user_id, {
          has_mii: !!a.setup_completed,
          traits: a.traits ?? null,
          equipped: (a.equipped ?? {}) as Record<string, string>,
        })
      }
    }

    // Resolve the SVG layers for every equipped item across all leaderboard
    // rows in a single query, then attach the just-relevant items to each row.
    const allEquippedSlugs = new Set<string>()
    for (const av of avatarByUser.values()) {
      for (const slug of Object.values(av.equipped)) if (slug) allEquippedSlugs.add(slug)
    }
    const itemsBySlug = new Map<string, { slug: string; slot: string; name: string; svg_layer: string; z_order: number; cost_xp: number | null; unlock_target_id: string | null; unlock_min_level: number | null }>()
    if (allEquippedSlugs.size > 0) {
      const { data: items } = await supabaseAdmin
        .from('avatar_items')
        .select('slug, slot, name, svg_layer, z_order, cost_xp, unlock_target_id, unlock_min_level')
        .in('slug', [...allEquippedSlugs])
      for (const it of (items ?? []) as { slug: string; slot: string; name: string; svg_layer: string; z_order: number; cost_xp: number | null; unlock_target_id: string | null; unlock_min_level: number | null }[]) {
        itemsBySlug.set(it.slug, it)
      }
    }

    // Real consecutive-day streaks for everyone on the board, plus the current
    // user's full detail (longest + total) for the sidebar streak widget.
    const streaks = await getStreaksForUsers(userIds)
    const meStreak = await getStreakDetail(ctx.userId)
    classStats.streaksAlive = [...streaks.values()].filter((v) => v > 0).length

    // Rotating spotlights — growth-based recognition so the same top-XP names
    // don't win every category. All computed on the LAST 7 DAYS.
    const topBy = (metric: (r: AggRow) => number) => {
      let best: AggRow | null = null
      for (const r of weeklyRows) if (metric(r) > (best ? metric(best) : 0)) best = r
      return best
    }
    let bestStreakId: string | null = null
    for (const [uid, v] of streaks) if (v > 0 && (bestStreakId === null || v > (streaks.get(bestStreakId) ?? 0))) bestStreakId = uid
    const climber = topBy((r) => Number(r.total_points))
    const mathTop = topBy((r) => Number(r.math_pts))
    const arcadeTop = topBy((r) => Number(r.arcade_pts))
    const spotlights = [
      climber && { key: 'climber', label: 'Biggest climber', name: nameBy.get(climber.user_id) ?? 'Student', user_id: climber.user_id, value: Math.round(Number(climber.total_points)), unit: 'XP this week' },
      mathTop && Number(mathTop.math_pts) > 0 && { key: 'math', label: 'Math machine', name: nameBy.get(mathTop.user_id) ?? 'Student', user_id: mathTop.user_id, value: Math.round(Number(mathTop.math_pts)), unit: 'math XP this week' },
      arcadeTop && Number(arcadeTop.arcade_pts) > 0 && { key: 'arcade', label: 'Arcade legend', name: nameBy.get(arcadeTop.user_id) ?? 'Student', user_id: arcadeTop.user_id, value: Math.round(Number(arcadeTop.arcade_pts)), unit: 'arcade XP this week' },
      bestStreakId && { key: 'streak', label: 'Streak keeper', name: nameBy.get(bestStreakId) ?? 'Student', user_id: bestStreakId, value: streaks.get(bestStreakId) ?? 0, unit: (streaks.get(bestStreakId) ?? 0) === 1 ? 'day in a row' : 'days in a row' },
    ].filter(Boolean)

    // Convert to array and sort by points
    const leaderboard = Array.from(userDataMap.entries())
      .map(([userId, data]) => {
        const av = avatarByUser.get(userId)
        const equippedItems = av
          ? (Object.values(av.equipped).filter((s): s is string => !!s).map((slug) => itemsBySlug.get(slug)).filter((x): x is NonNullable<typeof x> => !!x))
          : []
        return {
          user_id: userId,
          student_row_id: studentRowIdByUser.get(userId) ?? null,
          weekly_gain: Math.round(Number(weeklyBy.get(userId)?.total_points ?? 0)),
          name: data.name || data.email.split('@')[0],
          email: data.email,
          image: data.image || null,
          total_points: Math.round(data.totalPoints),
          streak: streaks.get(userId) ?? 0,
          streak_longest: userId === ctx.userId ? meStreak.longest : 0,
          streak_total: userId === ctx.userId ? meStreak.total : 0,
          activities: data.activities,
          xp_by_source: data.xp_by_source,
          is_current_user: userId === ctx.userId,
          has_mii: av?.has_mii ?? false,
          avatar_traits: av?.traits ?? null,
          avatar_equipped: av?.equipped ?? {},
          avatar_items: equippedItems,
        }
      })
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        // + = climbed since last week, − = slipped, 0/undefined = held or n/a
        rank_delta: period === 'all-time' && prevRankBy.has(entry.user_id)
          ? (prevRankBy.get(entry.user_id) as number) - (index + 1)
          : null,
      }))

    return NextResponse.json({ entries: leaderboard, classStats, spotlights })
})
