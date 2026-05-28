import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getEffectiveContext } from '@/lib/effective-context'
import { generateTargetReview } from '@/lib/generate-review'

// POST { target_id } — ADMIN-ONLY: seeds the review library by generating a
// review for a learning target. It lands as 'pending' (same approval gate), so
// the admin still eyeballs it in the queue before it's shared with students.

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ctx = await getEffectiveContext(session.user.email)
    if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const targetId: string | undefined = body.target_id
    if (!targetId) return NextResponse.json({ error: 'target_id required' }, { status: 400 })

    const { data: tRow } = await supabaseAdmin
      .from('learning_targets')
      .select('statement')
      .eq('id', targetId)
      .maybeSingle()
    const statement = (tRow as { statement?: string } | null)?.statement
    if (!statement) return NextResponse.json({ error: 'Unknown target' }, { status: 404 })

    const gen = await generateTargetReview(statement)
    if (gen.error || !gen.review) return NextResponse.json({ error: gen.error ?? 'Generation failed' }, { status: 502 })

    const { error } = await supabaseAdmin
      .from('target_reviews')
      .insert({ target_id: targetId, reteach: gen.review.reteach, questions: gen.review.questions, status: 'pending', created_by: ctx.realEmail })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in POST /api/admin/reviews/generate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
