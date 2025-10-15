import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

/**
 * GET /api/lessons/published
 * Fetch published lessons with filtering and progress tracking
 * This bypasses RLS by using server-side auth check
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication using NextAuth
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Determine user role based on email
    const userRole = getUserRole(session.user.email)
    const isAdmin = userRole === 'admin' || userRole === 'teacher'
    const userId = session.user.id

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const unit = searchParams.get('unit')
    const lessonType = searchParams.get('lesson_type')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')

    console.log('Fetching lessons for:', session.user.email, 'Role:', userRole, 'Filters:', { unit, lessonType, difficulty, search })

    // Build query with filters
    // Note: Simulation join is optional for backward compatibility
    let query = supabaseAdmin
      .from('lessons')
      .select('*')

    // Students only see published lessons
    if (!isAdmin) {
      query = query.eq('published', true)
    }

    // Apply filters
    if (unit && unit !== 'all') {
      query = query.eq('unit', unit)
    }

    // Skip lesson_type filter if column doesn't exist yet
    // (After migration, this will work)
    if (lessonType && lessonType !== 'all') {
      // Silently skip - will work after migration
    }

    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Order by unit and lesson number
    query = query
      .order('unit', { ascending: true })
      .order('lesson_number', { ascending: true })

    const { data: lessons, error } = await query

    if (error) {
      console.error('Supabase error fetching lessons:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: `Database error: ${error.message || 'Failed to fetch lessons'}` },
        { status: 500 }
      )
    }

    // Fetch user progress if available
    let progress: Record<string, number> = {}
    if (userId && lessons && lessons.length > 0) {
      try {
        // Try to fetch from lesson_progress table (it exists in your schema)
        const { data: progressData } = await supabaseAdmin
          .from('lesson_progress')
          .select('lesson_id, progress_percentage, status')
          .eq('user_id', userId)
          .in('lesson_id', lessons.map(l => l.id))

        if (progressData) {
          progress = progressData.reduce((acc, item) => {
            acc[item.lesson_id] = item.status === 'completed' ? 100 : (item.progress_percentage || 0)
            return acc
          }, {} as Record<string, number>)
        }
      } catch (progressError) {
        console.warn('Could not fetch progress:', progressError)
        // Progress is optional, continue without it
      }
    }

    // Parse JSONB fields and enhance lesson data
    const enhancedLessons = lessons?.map(lesson => {
      // Parse videos if present
      let videos = []
      if (lesson.videos) {
        try {
          videos = typeof lesson.videos === 'string' 
            ? JSON.parse(lesson.videos) 
            : lesson.videos
        } catch (e) {
          console.warn('Failed to parse lesson videos:', e)
          videos = []
        }
      }

      // Parse embedded questions if present (backward compatible)
      let embeddedQuestions = []
      if (lesson.embedded_questions) {
        try {
          embeddedQuestions = typeof lesson.embedded_questions === 'string'
            ? JSON.parse(lesson.embedded_questions)
            : lesson.embedded_questions
        } catch (e) {
          console.warn('Failed to parse embedded questions:', e)
          embeddedQuestions = []
        }
      }

      // Calculate if lesson is new (within last 7 days)
      const isNew = lesson.created_at ? new Date(lesson.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 : false

      return {
        ...lesson,
        videos,
        embedded_questions: embeddedQuestions,
        progress: progress[lesson.id] || 0,
        isNew,
        // Set default lesson_type if not present
        lesson_type: lesson.lesson_type || 'markdown',
        // Simulation data will be null if column doesn't exist yet
        simulation: lesson.simulation || null
      }
    })

    console.log(`Fetched ${enhancedLessons?.length || 0} lessons for ${session.user.email}`)

    return NextResponse.json({
      lessons: enhancedLessons || [],
      progress,
      userRole,
      isAdmin
    })

  } catch (error) {
    console.error('Error in lessons API:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
