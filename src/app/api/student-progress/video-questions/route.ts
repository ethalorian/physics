import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveTargetStudent } from '@/lib/teacher-scope'
import { getScopedDb } from '@/lib/user-db'

// POST - Save video question response
export const POST = withAuth(async (request, ctx) => {
    const body = await request.json()

    // Validate required fields
    if (!body.lesson_id || !body.video_id || !body.question_id) {
      return NextResponse.json(
        { error: 'Missing required fields: lesson_id, video_id, question_id' },
        { status: 400 }
      )
    }

    const responseData = {
      user_id: ctx.userId,
      user_email: ctx.email,
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

    const { data, error } = await supabaseAdmin
      .from('video_question_responses')
      .insert(responseData)
      .select()
      .single()

    if (error) {
      console.error('Error saving video question response:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
})

// GET - Fetch video question responses
export const GET = withAuth(async (request, ctx) => {
    const { searchParams } = new URL(request.url)
    // Own data only; teachers limited to their roster; admins unrestricted.
    // (Previously this trusted ?user_id= from any caller — an IDOR.)
    const resolved = await resolveTargetStudent({
      role: ctx.role,
      selfId: ctx.userId,
      scopeEmail: ctx.email,
      requestedUserId: searchParams.get('user_id'),
    })
    if (!resolved.ok) {
      return NextResponse.json({ error: 'Forbidden - student not in your roster' }, { status: 403 })
    }
    const userId = resolved.userId
    const lessonId = searchParams.get('lesson_id')
    const videoId = searchParams.get('video_id')

    // Defense in depth: when the RLS net is enabled this query runs as the user,
    // so the database itself limits rows even if scoping above were ever missed.
    let query = getScopedDb(ctx)
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
})
