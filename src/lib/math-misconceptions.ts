/**
 * math-misconceptions — turns a ✗ self-check into descriptive feedback.
 *
 * Each spiral item may carry `misconceptions`: predicted wrong answers ("slips")
 * with a tag, a short label of what the student did, and a message written in
 * the Chappuis register (what was right → where it went sideways → next move).
 * On a mismatch we compare the student's answer against every slip using the
 * SAME checker (and check mode) that judged the key; the first match wins.
 * Nothing here ever runs on 'match' or 'unknown'.
 *
 * Pure functions, no IO — the submit route supplies rows and values.
 */
import { checkAnswerWithMode } from './math-answer-check'
import { evaluateExpression, type ItemTemplate } from './math-item-template'

export interface Slip {
  tag: string
  label: string
  wrong?: string
  expr?: string
  unit?: string
  message: string
}

export interface SlipFeedback {
  tag: string | null      // null → the competency fallback was used
  label: string | null
  message: string
  source: 'slip' | 'fallback'
}

function roundSig(v: number, sig: number): number {
  if (v === 0) return 0
  const mag = Math.floor(Math.log10(Math.abs(v)))
  const factor = Math.pow(10, sig - 1 - mag)
  return Math.round(v * factor) / factor
}
const fmt = (v: number) => String(parseFloat(v.toPrecision(12)))

/** Same slot syntax the prompt uses: {a} → the student's drawn value. */
export function fillSlots(text: string, values: Record<string, number> | null | undefined): string {
  if (!values) return text
  return text.replace(/\{\s*([a-zA-Z_][a-zA-Z_0-9]*)\s*\}/g, (whole, name) =>
    name in values ? fmt(values[name]) : whole,
  )
}

/** Render one slip's predicted wrong answer for THIS student's numbers. */
export function slipCandidate(slip: Slip, template: ItemTemplate | null | undefined, values: Record<string, number> | null | undefined): string | null {
  if (slip.wrong) return slip.wrong
  if (slip.expr && values) {
    try {
      const raw = evaluateExpression(slip.expr, values)
      const rounded = roundSig(raw, template?.sigFigs ?? 3)
      const unit = slip.unit ?? template?.answerUnit
      return unit ? `${fmt(rounded)} ${unit}` : fmt(rounded)
    } catch {
      return null
    }
  }
  return null
}

export function matchSlip(
  studentAnswer: string,
  slips: Slip[] | null | undefined,
  template: ItemTemplate | null | undefined,
  values: Record<string, number> | null | undefined,
  checkMode: string | null | undefined,
  fallback: string | null | undefined,
): SlipFeedback | null {
  for (const slip of slips ?? []) {
    const candidate = slipCandidate(slip, template, values)
    if (!candidate) continue
    if (checkAnswerWithMode(studentAnswer, candidate, checkMode) === 'match') {
      return { tag: slip.tag, label: slip.label, message: fillSlots(slip.message, values), source: 'slip' }
    }
  }
  if (fallback && fallback.trim()) return { tag: null, label: null, message: fallback, source: 'fallback' }
  return null
}
