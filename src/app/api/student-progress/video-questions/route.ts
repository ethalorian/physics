import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// POST - Save video question response
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.lesson_id || !body.video_id || !body.question_id) {
      return NextResponse.json(
        { error: 'Missing required fields: lesson_id, video_id, question_id' },
        { status: 400 }
      )
    }

    const responseData = {
      user_id: session.user.id,
      user_email: session.user.email,
      lesson_id: body.lesson_id,
      video_id: body.video_id,
      question_id: body.question_id,
      answer: body.answer,
      is_correct: body.is_correct || false,
      score: body.score || 0,
      max_score: body.max_score || 0,
      feedback: body.feedback || null,
      attempt_number: body.attempt_number || 1,
      time_to_answer: body.time_to_answer || null
    }

    const { data, error } = await supabase
      .from('video_question_responses')
      .insert(responseData)
      .select()
      .single()

    if (error) {
      console.error('Error saving video question response:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/student-progress/video-questions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Fetch video question responses
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id') || session.user.id
    const lessonId = searchParams.get('lesson_id')
    const videoId = searchParams.get('video_id')

    let query = supabase
      .from('video_question_responses')
      .select('*')
      .eq('user_id', userId)
      .order('answered_at', { ascending: false })

    if (lessonId) {
      query = query.eq('lesson_id', lessonId)
    }

    if (videoId) {
      query = query.eq('video_id', videoId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching video question responses:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])

  } catch (error) {
    console.error('Error in GET /api/student-progress/video-questions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
