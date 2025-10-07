import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// POST - Save vocabulary game score
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.vocabulary_set_id || !body.game_type || body.score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: vocabulary_set_id, game_type, score' },
        { status: 400 }
      )
    }

    const gameScoreData = {
      user_id: session.user.id,
      user_email: session.user.email,
      vocabulary_set_id: body.vocabulary_set_id,
      game_type: body.game_type,
      score: body.score,
      max_score: body.max_score || body.score,
      accuracy: body.accuracy || null,
      time_spent: body.time_spent || null,
      difficulty: body.difficulty || 'medium',
      terms_completed: body.terms_completed || 0,
      terms_total: body.terms_total || 0,
      perfect_game: body.perfect_game || false,
      hints_used: body.hints_used || 0,
      mistakes: body.mistakes || 0,
      game_data: body.game_data || {}
    }

    const { data, error } = await supabase
      .from('vocabulary_game_scores')
      .insert(gameScoreData)
      .select()
      .single()

    if (error) {
      console.error('Error saving game score:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/student-progress/game-scores:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Fetch game scores
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id') || session.user.id
    const gameType = searchParams.get('game_type')
    const vocabularySetId = searchParams.get('vocabulary_set_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('vocabulary_game_scores')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (gameType) {
      query = query.eq('game_type', gameType)
    }

    if (vocabularySetId) {
      query = query.eq('vocabulary_set_id', vocabularySetId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching game scores:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])

  } catch (error) {
    console.error('Error in GET /api/student-progress/game-scores:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
