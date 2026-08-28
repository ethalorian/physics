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

    // Get student names + aliases + images + avatar bundles from the roster.
    // Lookup is by `id` because the work tables (game_scores, lesson_progress,
    // submissions) key by session.user.id, which IS students.id (uuid).
    const userIds = Array.from(userDataMap.keys())
    // Carry the students.id (uuid) per user so we can resolve avatar rows below.
    // (It equals the work-table user_id now, but we keep the map for the
    // student_row_id field below.)
    const studentRowIdByUser = new Map<string, string>()
    // Carry has_mii + traits + equipped per user for the client. A finished
    // Mii IS the student's site-wide avatar — there is no separate opt-in.
    const avatarByUser = new Map<string, { has_mii: boolean; traits: Record<string, string> | null; equipped: Record<string, string> }>()

    if (userIds.length > 0) {
      const { data: students } = await supabaseAdmin
        .from('students')
        .select('id, name, alias, email')
        .in('id', userIds)

      students?.forEach((student: { id: string; name: string | null; alias: string | null; email: string | null }) => {
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
        rank: index + 1
      }))

    return NextResponse.json(leaderboard)
})
