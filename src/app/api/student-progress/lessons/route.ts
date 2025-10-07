import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST - Update lesson progress
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.lesson_id) {
      return NextResponse.json(
        { error: 'Missing required field: lesson_id' },
        { status: 400 }
      )
    }

    const progressData = {
      user_id: session.user.id,
      user_email: session.user.email,
      lesson_id: body.lesson_id,
      lesson_slug: body.lesson_slug || null,
      status: body.status || 'in_progress',
      progress_percentage: body.progress_percentage || 0,
      objectives_completed: body.objectives_completed || 0,
      objectives_total: body.objectives_total || 0,
      videos_watched: body.videos_watched || 0,
      videos_total: body.videos_total || 0,
      video_questions_answered: body.video_questions_answered || 0,
      video_questions_correct: body.video_questions_correct || 0,
      video_questions_total: body.video_questions_total || 0,
      time_spent: body.time_spent || 0,
      started_at: body.started_at || new Date().toISOString(),
      completed_at: body.status === 'completed' ? new Date().toISOString() : null,
      last_accessed_at: new Date().toISOString()
    }

    // Upsert (insert or update if exists)
    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert(progressData, {
        onConflict: 'user_id,lesson_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving lesson progress:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/student-progress/lessons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Fetch lesson progress
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id') || session.user.id
    const lessonId = searchParams.get('lesson_id')
    const status = searchParams.get('status')

    let query = supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .order('last_accessed_at', { ascending: false })

    if (lessonId) {
      query = query.eq('lesson_id', lessonId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching lesson progress:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])

  } catch (error) {
    console.error('Error in GET /api/student-progress/lessons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
