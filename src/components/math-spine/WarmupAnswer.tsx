'use client'

/**
 * WarmupAnswer — the warm-up work surface.
 *
 * One board (MathCanvas) where students TYPE numbers/equations directly onto the
 * canvas AND draw on the same surface — so they can write 6.7 × 10⁴, then circle
 * it, cross out a wrong step, or add an arrow/sketch to explain. A final "Answer"
 * field captures the result.
 *
 * Emits {answer, workStrokes, workTexts} — strokes + typed text both render in the
 * control-room review drawer.
 */
import { useState } from 'react'
import type { Stroke } from '@/components/blocks/DoodleCanvas'
import MathCanvas, { type CanvasText } from './MathCanvas'

export interface WarmupAnswerValue {
  given?: string
  equation?: string
  answer?: string
  workStrokes?: Stroke[]
  workTexts?: CanvasText[]
}

interface Props {
  strand?: string
  value?: WarmupAnswerValue
  onChange: (v: WarmupAnswerValue) => void
}

const inputCls = 'w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground'

export default function WarmupAnswer({ value, onChange }: Props) {
  const [strokes, setStrokes] = useState<Stroke[]>(value?.workStrokes ?? [])
  const [texts, setTexts] = useState<CanvasText[]>(value?.workTexts ?? [])
  const [answer, setAnswer] = useState(value?.answer ?? '')

  const emit = (patch: Partial<WarmupAnswerValue>) => {
    onChange({
      answer: patch.answer ?? answer,
      workStrokes: patch.workStrokes ?? strokes,
      workTexts: patch.workTexts ?? texts,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="text-sm font-semibold text-foreground">Show your work</span>
        <p className="text-xs text-muted-foreground mb-2">
          Type your numbers and equations right on the board, then draw on them — circle the answer, cross out a step, or sketch to explain.
        </p>
        <MathCanvas
          value={{ strokes, texts }}
          onChange={(v) => { setStrokes(v.strokes); setTexts(v.texts); emit({ workStrokes: v.strokes, workTexts: v.texts }) }}
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground">Final answer</label>
        <input
          className={`${inputCls} mt-1`}
          value={answer}
          onChange={(e) => { setAnswer(e.target.value); emit({ answer: e.target.value }) }}
          placeholder="Your answer, with units"
        />
      </div>
    </div>
  )
}
