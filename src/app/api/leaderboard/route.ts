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

    // Get student names and images from roster
    const userIds = Array.from(userDataMap.keys())
    if (userIds.length > 0) {
      const { data: students } = await supabaseAdmin
        .from('students')
        .select('id, name, email, profile_image')
        .in('id', userIds)

      students?.forEach(student => {
        const userData = userDataMap.get(student.id)
        if (userData) {
          userData.name = student.name
          userData.image = student.profile_image
        }
      })
    }

    // Convert to array and sort by points
    const leaderboard = Array.from(userDataMap.entries())
      .map(([userId, data]) => ({
        user_id: userId,
        name: data.name || data.email.split('@')[0],
        email: data.email,
        image: data.image || null,
        total_points: Math.round(data.totalPoints),
        activities: data.activities,
        is_current_user: userId === session.user.id
      }))
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
