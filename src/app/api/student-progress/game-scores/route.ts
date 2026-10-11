import { NextResponse } from 'next/server'
import { withAuth, withEnrolledStudent } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveTargetStudent } from '@/lib/teacher-scope'
import { getScopedDb } from '@/lib/user-db'
import { randomUUID } from 'node:crypto'
import { UUID } from '@/lib/vocab-learning'
import { getBalance } from '@/lib/points'
import { VOCABULARY_DAILY_XP_CAP } from '@/lib/xp-policy'

// POST - Save vocabulary game score
export const POST = withEnrolledStudent(async (request, ctx) => {
    const body = await request.json().catch(() => null)

    // Validate required fields
    if (!body || !UUID.test(body.vocabulary_set_id ?? '') || !body.game_type || !Number.isInteger(body.score) || body.score < 0 || body.score > 2147483647 || (body.event_id !== undefined && !UUID.test(body.event_id))) {
      return NextResponse.json(
        { error: 'A vocabulary set, game type, nonnegative integer score and valid save ID are required.' },
        { status: 400 }
      )
    }

    const gameScoreData = {
      id: body.event_id ?? randomUUID(),
      user_id: ctx.userId,
      user_email: ctx.email,
      vocabulary_set_id: body.vocabulary_set_id,
      game_type: body.game_type,
      score: body.score,
      max_score: body.max_score ?? body.score,
      accuracy: body.accuracy ?? null,
      time_spent: body.time_spent ?? null,
      difficulty: body.difficulty || 'medium',
      terms_completed: body.terms_completed || 0,
      terms_total: body.terms_total || 0,
      perfect_game: body.perfect_game || false,
      hints_used: body.hints_used || 0,
      mistakes: body.mistakes || 0,
      game_data: body.game_data || {}
    }

    const { data: inserted, error } = await supabaseAdmin
      .from('vocabulary_game_scores')
      .insert(gameScoreData)
      .select()
      .single()

    if (error && error.code !== '23505') {
      console.error('Error saving game score:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // The client keeps one ID per completed game. A lost response can be
    // retried without creating another score, play count, bounty or XP award.
    let data = inserted
    if (error) {
      const existing = await supabaseAdmin.from('vocabulary_game_scores')
        .select('*').eq('id', gameScoreData.id).eq('user_id', ctx.userId).maybeSingle()
      if (existing.error) throw existing.error
      data = existing.data
      if (!data || data.game_type !== gameScoreData.game_type || data.vocabulary_set_id !== gameScoreData.vocabulary_set_id || data.score !== gameScoreData.score || data.max_score !== gameScoreData.max_score) {
        return NextResponse.json({ error: 'This save ID belongs to a different game.' }, { status: 409 })
      }
    }

    // Read the same earning calculation used by Home, including the daily
    // cap. Never present raw game points as an XP receipt.
    const midnight = new Date()
    midnight.setUTCHours(0, 0, 0, 0)
    const tomorrow = new Date(midnight.getTime() + 86400000)
    const [daily, balance] = await Promise.all([
      supabaseAdmin.rpc('economy_earning_events')
        .eq('user_id', ctx.userId).eq('source', 'vocabulary')
        .gte('earned_at', midnight.toISOString()).lt('earned_at', tomorrow.toISOString()).select('points').maybeSingle(),
      getBalance(ctx.userId),
    ])
    if (daily.error) throw daily.error
    const dailyEarned = Number(daily.data?.points ?? 0)
    if (!Number.isFinite(dailyEarned)) throw new Error('Invalid vocabulary XP total')
    return NextResponse.json({ ...data, xp: { dailyEarned, dailyCap: VOCABULARY_DAILY_XP_CAP, lifetimeEarned: balance.lifetimeEarned } }, { status: error ? 200 : 201 })
})

// GET - Fetch game scores
export const GET = withAuth(async (request, ctx) => {
    const { searchParams } = new URL(request.url)
    // A student may only read their own scores; admins anyone; a teacher only
    // students on their own roster. (Previously this trusted ?user_id= from any caller.)
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
    const gameType = searchParams.get('game_type')
    const vocabularySetId = searchParams.get('vocabulary_set_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Defense in depth: scoped to the caller when the RLS net is enabled.
    let query = getScopedDb(ctx)
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
})
