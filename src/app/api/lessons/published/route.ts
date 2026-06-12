import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getStudentLessonWindowStatuses, type LessonWindowStatus } from '@/lib/lesson-windows'
import { withAuth } from '@/lib/api-auth'

/**
 * GET /api/lessons/published
 * Fetch published lessons with filtering and progress tracking
 * This bypasses RLS by using server-side auth check
 */
export const GET = withAuth(async (request, ctx) => {
    // Determine user role based on email
    const userRole = ctx.role
    const isAdmin = userRole === 'admin' || userRole === 'teacher'
    const userId = ctx.userId

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const unit = searchParams.get('unit')
    const lessonType = searchParams.get('lesson_type')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')

    console.log('Fetching lessons for:', ctx.email, 'Role:', userRole, 'Filters:', { unit, lessonType, difficulty, search })

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

    // Per-class release windows. A student sees every lesson their class has a
    // window for — open (with close date), scheduled (locked, with open date),
    // or closed (locked, with closed date) — so the grid shows "what's coming"
    // and "what's due" at a glance. Lessons with NO window stay invisible
    // (never released = no spoilers). Only the OPEN ones are clickable; the
    // lesson page enforces the same gate server-side, so locked cards can't be
    // bypassed by URL. Staff are ungated so they can preview/build.
    let visibleLessons = lessons ?? []
    const windowStatuses: Record<string, LessonWindowStatus> = {}
    if (!isAdmin && userId && visibleLessons.length > 0) {
      const statuses = await getStudentLessonWindowStatuses(userId)
      Object.assign(windowStatuses, statuses)
      visibleLessons = visibleLessons.filter((l) => statuses[l.id] !== undefined)
    }

    // Fetch user progress if available
    let progress: Record<string, number> = {}
    if (userId && visibleLessons.length > 0) {
      try {
        // Try to fetch from lesson_progress table (it exists in your schema)
        const { data: progressData } = await supabaseAdmin
          .from('lesson_progress')
          .select('lesson_id, progress_percentage, status')
          .eq('user_id', userId)
          .in('lesson_id', visibleLessons.map(l => l.id))

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
    const enhancedLessons = visibleLessons.map(lesson => {
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

      // Parse TA reactions if present
      let taReactions = null
      if (lesson.ta_reactions) {
        try {
          taReactions = typeof lesson.ta_reactions === 'string'
            ? JSON.parse(lesson.ta_reactions)
            : lesson.ta_reactions
        } catch (e) {
          console.warn('Failed to parse TA reactions:', e)
          taReactions = null
        }
      }

      // Parse key terms if present
      let keyTerms = []
      if (lesson.key_terms) {
        try {
          keyTerms = typeof lesson.key_terms === 'string'
            ? JSON.parse(lesson.key_terms)
            : lesson.key_terms
        } catch (e) {
          console.warn('Failed to parse key terms:', e)
          keyTerms = []
        }
      }

      // Parse check for understanding if present
      let checkForUnderstanding = []
      if (lesson.check_for_understanding) {
        try {
          checkForUnderstanding = typeof lesson.check_for_understanding === 'string'
            ? JSON.parse(lesson.check_for_understanding)
            : lesson.check_for_understanding
        } catch (e) {
          console.warn('Failed to parse check for understanding:', e)
          checkForUnderstanding = []
        }
      }

      // Parse generation metadata if present
      let generationMetadata = null
      if (lesson.generation_metadata) {
        try {
          generationMetadata = typeof lesson.generation_metadata === 'string'
            ? JSON.parse(lesson.generation_metadata)
            : lesson.generation_metadata
        } catch (e) {
          console.warn('Failed to parse generation metadata:', e)
          generationMetadata = null
        }
      }

      // Calculate if lesson is new (within last 7 days)
      const isNew = lesson.created_at ? new Date(lesson.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 : false

      return {
        ...lesson,
        videos,
        embedded_questions: embeddedQuestions,
        ta_reactions: taReactions,
        key_terms: keyTerms,
        check_for_understanding: checkForUnderstanding,
        generation_metadata: generationMetadata,
        progress: progress[lesson.id] || 0,
        isNew,
        // Release-window status for the student grid (absent for staff: ungated)
        window: windowStatuses[lesson.id] ?? null,
        // Set default lesson_type if not present
        lesson_type: lesson.lesson_type || 'markdown',
        // Simulation data will be null if column doesn't exist yet
        simulation: lesson.simulation || null
      }
    })

    console.log(`Fetched ${enhancedLessons?.length || 0} lessons for ${ctx.email}`)

    return NextResponse.json({
      lessons: enhancedLessons || [],
      progress,
      userRole,
      isAdmin
    })
})
