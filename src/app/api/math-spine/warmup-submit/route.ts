import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/math-spine/warmup-submit
// A student submits their daily warm-up answer as EVIDENCE. It lands in the
// control-room review queue (status='pending') for the teacher to read and rate.
// The student always submits for THEMSELVES (user_id is taken from the session,
// never the body), so a student cannot submit as someone else.
export const POST = withAuth(async (request, ctx) => {
  const body = await request.json()
  const { competency_id, response } = body
  if (!competency_id || !response || String(response).trim() === '') {
    return NextResponse.json({ error: 'Missing required fields: competency_id, response' }, { status: 400 })
  }

  // Resolve the FULL set of competencies this warm-up tests (authoritative,
  // server-side): the item's tagged competencies, or just the given one.
  const tested = new Set<string>([competency_id])
  if (body.spiral_item_id) {
    const { data: tags } = await supabaseAdmin
      .from('math_spiral_item_competencies')
      .select('competency_id')
      .eq('spiral_item_id', body.spiral_item_id)
    for (const t of tags ?? []) tested.add(t.competency_id)
  }

  const { data, error } = await supabaseAdmin
    .from('math_warmup_submissions')
    .insert({
      user_id: ctx.userId,
      user_email: ctx.email,
      competency_id,
      spiral_item_id: body.spiral_item_id ?? null,
      prompt: body.prompt ?? null,
      response: String(response),
      status: 'pending',
      tested_competency_ids: [...tested],
      rated_competency_ids: [],
    })
    .select()
    .single()

  if (error) {
    console.error('Error submitting warm-up:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
})
