import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAnswerWithMode, type SelfCheck } from '@/lib/math-answer-check'
import { instantiateTemplate, type ItemTemplate } from '@/lib/math-item-template'
import { matchSlip, type Slip, type SlipFeedback } from '@/lib/math-misconceptions'

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
  let selfCheck: SelfCheck | null = 'unknown'
  // Why the machine abstained, so the UI can say it in student language:
  //   no-work   → answer without board work (the ✓ must be earned with work)
  //   no-answer → board work but an empty answer box
  //   unparsed  → couldn't read the answer or key confidently
  let selfCheckReason: 'no-work' | 'no-answer' | 'unparsed' | null = null
  let workShown = false
  // On a ✗, which predicted slip (if any) the answer matched — descriptive
  // feedback for the student, a tag for the teacher's dashboard.
  let feedback: SlipFeedback | null = null
  let templateValues: Record<string, number> | null = null
  type ItemRowT = { prompt: string; answer_key: string | null; template: unknown; check_mode: string | null; misconceptions: unknown; competency: { misconception_fallback: string | null } | null }
  let itemRow: ItemRowT | null = null
  if (body.spiral_item_id) {
    workShown = hasShownWork(responseJson)
    if (!workShown) selfCheckReason = 'no-work'
    else if (!String(responseJson?.answer ?? responseText ?? '').trim()) selfCheckReason = 'no-answer'
    if (workShown) {
      const { data: row } = await supabaseAdmin
        .from('math_spiral_items')
        .select('prompt, answer_key, template, check_mode, misconceptions, competency:math_competencies(misconception_fallback)')
        .eq('id', body.spiral_item_id)
        .maybeSingle()
      itemRow = (row as unknown as ItemRowT | null) ?? null
      const studentAnswer = responseJson?.answer ?? responseText
      if (itemRow?.check_mode === 'teacher-only') {
        // Prose/explain prompt: the machine never judges — the teacher reads
        // it. selfCheck stays null so the drawer shows no verdict chip.
        selfCheck = null
      } else if (itemRow?.template) {
        // Templated item: recompute the per-student key from the same
        // user+item+day seed the daily route used. A submission straddling
        // midnight checks yesterday's numbers too, so the verdict can't flip
        // to a false ✗ at 12:00am.
        const dayNum = Math.floor(Date.now() / 86_400_000)
        for (const dn of [dayNum, dayNum - 1]) {
          try {
            const inst = instantiateTemplate(itemRow.prompt, itemRow.template as ItemTemplate, `${ctx.userId}:${body.spiral_item_id}:${dn}`)
            const verdict = checkAnswerWithMode(studentAnswer, inst.answerKey, itemRow.check_mode)
            if (dn === dayNum || verdict === 'match') { selfCheck = verdict; templateValues = inst.values }
            if (selfCheck === 'match') break
          } catch {
            // malformed template — fall back to the static key below
            selfCheck = checkAnswerWithMode(studentAnswer, itemRow?.answer_key, itemRow?.check_mode)
            break
          }
        }
      } else {
        selfCheck = checkAnswerWithMode(studentAnswer, itemRow?.answer_key, itemRow?.check_mode)
      }
    }
  }

  if (selfCheck === 'unknown' && selfCheckReason === null) selfCheckReason = 'unparsed'
  if (selfCheck !== 'unknown') selfCheckReason = null

  if (selfCheck === 'mismatch' && itemRow) {
    const slips = Array.isArray(itemRow.misconceptions) ? (itemRow.misconceptions as Slip[]) : null
    feedback = matchSlip(
      String(responseJson?.answer ?? responseText ?? ''),
      slips,
      (itemRow.template as ItemTemplate | null) ?? null,
      templateValues,
      itemRow.check_mode,
      (Array.isArray(itemRow.competency) ? itemRow.competency[0] : itemRow.competency)?.misconception_fallback ?? null,
    )
  }

  // Feed the Check Lab: any non-empty answer the checker didn't confirm.
  const missAnswer = (responseJson?.answer ?? responseText ?? '').trim()
  if (body.spiral_item_id && missAnswer && (selfCheck === 'unknown' || selfCheck === 'mismatch')) {
    supabaseAdmin.from('math_check_misses').insert({
      item_id: body.spiral_item_id, user_id: ctx.userId, answer: missAnswer.slice(0, 500),
      verdict: selfCheck, source: 'warmup',
    }).then(() => {}, () => {}) // best-effort — never blocks the submit
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
      misconception_tag: feedback?.tag ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error submitting warm-up:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ...data, selfCheck, selfCheckReason, workShown, feedback }, { status: 201 })
})
