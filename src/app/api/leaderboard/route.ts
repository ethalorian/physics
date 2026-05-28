import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Fetch platform leaderboard
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    const leaderboardData = []

    // Get all unique users from different tables
    const usersSet = new Set<string>()
    const userDataMap = new Map<string, { name?: string; email: string; totalPoints: number; activities: any; image?: string | null }>()

    // Fetch game scores
    let gameQuery = supabaseAdmin
      .from('vocabulary_game_scores')
      .select('user_id, user_email, score')
    if (dateFilter) {
      gameQuery = gameQuery.gte('completed_at', dateFilter)
    }
    const { data: gameScores } = await gameQuery

    // Fetch lesson progress
    let lessonQuery = supabaseAdmin
      .from('lesson_progress')
      .select('user_id, user_email, progress_percentage, video_questions_correct')
    if (dateFilter) {
      lessonQuery = lessonQuery.gte('completed_at', dateFilter)
    }
    const { data: lessonProgress } = await lessonQuery

    // Fetch assignment submissions
    let submissionQuery = supabaseAdmin
      .from('submissions')
      .select('user_id, score')
      .eq('status', 'graded')
    if (dateFilter) {
      submissionQuery = submissionQuery.gte('graded_at', dateFilter)
    }
    const { data: submissions } = await submissionQuery

    // Aggregate points per user
    gameScores?.forEach(game => {
      if (!userDataMap.has(game.user_id)) {
        userDataMap.set(game.user_id, {
          email: game.user_email,
          totalPoints: 0,
          activities: { games: 0, lessons: 0, assignments: 0 },
          image: null
        })
      }
      const userData = userDataMap.get(game.user_id)!
      userData.totalPoints += game.score || 0
      userData.activities.games += 1
    })

    lessonProgress?.forEach(lesson => {
      if (!userDataMap.has(lesson.user_id)) {
        userDataMap.set(lesson.user_id, {
          email: lesson.user_email,
          totalPoints: 0,
          activities: { games: 0, lessons: 0, assignments: 0 },
          image: null
        })
      }
      const userData = userDataMap.get(lesson.user_id)!
      // Award points for completion: 1 point per % complete + bonus for video questions
      userData.totalPoints += lesson.progress_percentage + (lesson.video_questions_correct * 5)
      userData.activities.lessons += 1
    })

    submissions?.forEach(submission => {
      if (!userDataMap.has(submission.user_id)) {
        userDataMap.set(submission.user_id, {
          email: '',
          totalPoints: 0,
          activities: { games: 0, lessons: 0, assignments: 0 },
          image: null
        })
      }
      const userData = userDataMap.get(submission.user_id)!
      userData.totalPoints += submission.score || 0
      userData.activities.assignments += 1
    })

    // Get student names + aliases + images + avatar bundles from the roster.
    // Lookup is by `google_user_id` because the work tables (game_scores,
    // lesson_progress, submissions) key by session.user.id, which lives in
    // students.google_user_id — NOT in students.id (uuid).
    const userIds = Array.from(userDataMap.keys())
    // Carry the students.id (uuid) per user so we can resolve avatar rows below.
    const studentRowIdByUser = new Map<string, string>()
    // Carry use_custom_avatar + traits + equipped per user for the client.
    const avatarByUser = new Map<string, { use_custom_avatar: boolean; traits: Record<string, string> | null; equipped: Record<string, string> }>()

    if (userIds.length > 0) {
      const { data: students } = await supabaseAdmin
        .from('students')
        .select('id, google_user_id, name, alias, email, profile_image')
        .in('google_user_id', userIds)

      students?.forEach((student: { id: string; google_user_id: string | null; name: string | null; alias: string | null; email: string | null; profile_image: string | null }) => {
        if (!student.google_user_id) return
        const userData = userDataMap.get(student.google_user_id)
        if (userData) {
          // Prefer alias for the peer-facing leaderboard; fall back to real name.
          userData.name = student.alias || student.name || undefined
          userData.image = student.profile_image
          studentRowIdByUser.set(student.google_user_id, student.id)
        }
      })

      // Avatar bundles keyed by google_user_id (student_avatars.user_id).
      const { data: avs } = await supabaseAdmin
        .from('student_avatars')
        .select('user_id, traits, equipped, use_custom_avatar, setup_completed')
        .in('user_id', userIds)
      for (const a of (avs ?? []) as { user_id: string; traits: Record<string, string> | null; equipped: Record<string, string> | null; use_custom_avatar: boolean; setup_completed: boolean }[]) {
        avatarByUser.set(a.user_id, {
          use_custom_avatar: !!a.use_custom_avatar && !!a.setup_completed,
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
          activities: data.activities,
          is_current_user: userId === session.user.id,
          use_custom_avatar: av?.use_custom_avatar ?? false,
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

  } catch (error) {
    console.error('Error in GET /api/leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
