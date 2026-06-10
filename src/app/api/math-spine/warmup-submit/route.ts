import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAnswer, type SelfCheck } from '@/lib/math-answer-check'
import { instantiateTemplate, type ItemTemplate } from '@/lib/math-item-template'

// POST /api/math-spine/warmup-submit
// A student submits their daily warm-up answer as EVIDENCE. It lands in the
// control-room review queue (status='pending') for the teacher to read and rate.
// The student always submits for THEMSELVES (user_id is from the session, never
// the body). The answer may be structured (response_json: GEWA + canvas strokes)
// and/or plain text; we keep a flat text summary for listing/fallback.
//
// Redesign (warmup_remediation_redesign.md):
//  - Instant self-check: the answer is compared to the item's answer_key
//    server-side (numeric tolerance, unit-aware) and the verdict is returned to
//    the student immediately. The teacher's Marzano rating still gates the
//    ladder — the machine judges the answer, the teacher judges the thinking.
//  - The ✓ requires work shown: with no work beyond the answer field, the
//    check abstains ('unknown') by design (decision 3).
//  - One competency per warm-up (decision 12): tested_competency_ids is always
//    exactly the item's competency, so one rating resolves the submission.

interface GewaLike {
  given?: string
  equation?: string
  work?: string
  answer?: string
  workStrokes?: unknown[]
  workTexts?: { text?: unknown }[]
  sandbox?: { lines?: unknown[] }
}

function summarize(rj: GewaLike | null, text: string | null): string {
  if (text && text.trim()) return text.trim()
  if (!rj) return ''
  const parts: string[] = []
  if (rj.given) parts.push(`Given: ${rj.given}`)
  if (rj.equation) parts.push(`Equation: ${rj.equation}`)
  const eqn = Array.isArray(rj.sandbox?.lines) ? rj.sandbox!.lines!.map(String).filter((s) => s.trim()) : []
  if (eqn.length) parts.push(`Equation work: ${eqn.join(' | ')}`)
  const typed = Array.isArray(rj.workTexts) ? rj.workTexts.map((t) => String(t?.text ?? '')).filter((s) => s.trim()) : []
  if (typed.length) parts.push(`Typed: ${typed.join(' | ')}`)
  if (rj.answer) parts.push(`Answer: ${rj.answer}`)
  if (Array.isArray(rj.workStrokes) && rj.workStrokes.length) parts.push('[handwritten/drawn work]')
  return parts.join(' · ') || '[submitted]'
}

/** Work beyond the bare answer field — the gate on the instant ✓. */
function hasShownWork(rj: GewaLike | null): boolean {
  if (!rj) return false
  if (Array.isArray(rj.workStrokes) && rj.workStrokes.length > 0) return true
  if (Array.isArray(rj.workTexts) && rj.workTexts.some((t) => String(t?.text ?? '').trim())) return true
  if (Array.isArray(rj.sandbox?.lines) && rj.sandbox!.lines!.some((l) => String(l).trim())) return true
  if (rj.given?.trim() || rj.equation?.trim() || rj.work?.trim()) return true
  return false
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

  // Instant self-check, computed server-side from the item's answer key.
  // 'unknown' when: no item, no parseable key, or no work shown (the ✓ must be
  // earned with work, so an answer-only submission gets no machine verdict).
  let selfCheck: SelfCheck = 'unknown'
  let workShown = false
  if (body.spiral_item_id) {
    workShown = hasShownWork(responseJson)
    if (workShown) {
      const { data: itemRow } = await supabaseAdmin
        .from('math_spiral_items')
        .select('prompt, answer_key, template')
        .eq('id', body.spiral_item_id)
        .maybeSingle()
      const studentAnswer = responseJson?.answer ?? responseText
      if (itemRow?.template) {
        // Templated item: recompute the per-student key from the same
        // user+item+day seed the daily route used. A submission straddling
        // midnight checks yesterday's numbers too, so the verdict can't flip
        // to a false ✗ at 12:00am.
        const dayNum = Math.floor(Date.now() / 86_400_000)
        for (const dn of [dayNum, dayNum - 1]) {
          try {
            const inst = instantiateTemplate(itemRow.prompt, itemRow.template as ItemTemplate, `${ctx.userId}:${body.spiral_item_id}:${dn}`)
            const verdict = checkAnswer(studentAnswer, inst.answerKey)
            if (dn === dayNum || verdict === 'match') selfCheck = verdict
            if (selfCheck === 'match') break
          } catch {
            // malformed template — fall back to the static key below
            selfCheck = checkAnswer(studentAnswer, itemRow?.answer_key)
            break
          }
        }
      } else {
        selfCheck = checkAnswer(studentAnswer, itemRow?.answer_key)
      }
    }
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
      // One competency per warm-up: a single rating resolves the submission.
      tested_competency_ids: [competency_id],
      rated_competency_ids: [],
      self_check: selfCheck,
    })
    .select()
    .single()

  if (error) {
    console.error('Error submitting warm-up:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ...data, selfCheck, workShown }, { status: 201 })
})
