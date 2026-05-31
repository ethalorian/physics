import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/math-spine/warmup-submit
// A student submits their daily warm-up answer as EVIDENCE. It lands in the
// control-room review queue (status='pending') for the teacher to read and rate.
// The student always submits for THEMSELVES (user_id is from the session, never
// the body). The answer may be structured (response_json: GEWA + InkPad strokes)
// and/or plain text; we keep a flat text summary for listing/fallback.

interface GewaLike {
  given?: string
  equation?: string
  work?: string
  answer?: string
  workStrokes?: unknown[]
  workTexts?: { text?: unknown }[]
}

function summarize(rj: GewaLike | null, text: string | null): string {
  if (text && text.trim()) return text.trim()
  if (!rj) return ''
  const parts: string[] = []
  if (rj.given) parts.push(`Given: ${rj.given}`)
  if (rj.equation) parts.push(`Equation: ${rj.equation}`)
  const typed = Array.isArray(rj.workTexts) ? rj.workTexts.map((t) => String(t?.text ?? '')).filter((s) => s.trim()) : []
  if (typed.length) parts.push(`Typed: ${typed.join(' | ')}`)
  if (rj.answer) parts.push(`Answer: ${rj.answer}`)
  if (Array.isArray(rj.workStrokes) && rj.workStrokes.length) parts.push('[handwritten/drawn work]')
  return parts.join(' · ') || '[submitted]'
}

export const POST = withAuth(async (request, ctx) => {
  const body = await request.json()
  const { competency_id } = body
  const responseJson: GewaLike | null = body.response_json ?? null
  const responseText: string | null = typeof body.response === 'string' ? body.response : null

  if (!competency_id) {
    return NextResponse.json({ error: 'Missing required field: competency_id' }, { status: 400 })
  }
  // Require *some* evidence: structured answer or text.
  const hasStructured = responseJson && Object.keys(responseJson).length > 0
  if (!hasStructured && !(responseText && responseText.trim())) {
    return NextResponse.json({ error: 'Nothing to submit — show some work first.' }, { status: 400 })
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
      response: summarize(responseJson, responseText),
      response_json: responseJson,
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
