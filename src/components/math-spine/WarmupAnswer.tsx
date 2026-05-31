'use client'

/**
 * WarmupAnswer — the universal warm-up work surface.
 *
 * Students can TYPE and DRAW at the same time: a typed equation sandbox (numbers
 * and equations, line by line, rendered cleanly) sits right alongside the InkPad
 * (handwrite / sketch). Both are always available — no toggle — so a student can
 * type 6.7 × 10⁴ on one line and draw their decimal-shift on the pad together.
 * A final "Answer" field captures the result.
 *
 * Emits {answer, workStrokes, sandbox} — the same shape the control-room review
 * drawer already renders (typed lines + handwritten strokes + answer).
 */
import { useState } from 'react'
import InkPad from '@/components/blocks/InkPad'
import EquationSandbox, { type SandboxValue } from '@/components/blocks/EquationSandbox'
import type { Stroke } from '@/components/blocks/DoodleCanvas'

export interface WarmupAnswerValue {
  given?: string
  equation?: string
  answer?: string
  workStrokes?: Stroke[]
  sandbox?: SandboxValue
}

interface Props {
  strand?: string
  value?: WarmupAnswerValue
  onChange: (v: WarmupAnswerValue) => void
}

const inputCls = 'w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground'

export default function WarmupAnswer({ value, onChange }: Props) {
  const [sandbox, setSandbox] = useState<SandboxValue>(value?.sandbox ?? { lines: [] })
  const [strokes, setStrokes] = useState<Stroke[]>(value?.workStrokes ?? [])
  const [answer, setAnswer] = useState(value?.answer ?? '')

  const emit = (patch: Partial<WarmupAnswerValue>) => {
    onChange({
      answer: patch.answer ?? answer,
      workStrokes: patch.workStrokes ?? strokes,
      sandbox: patch.sandbox ?? sandbox,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="text-sm font-semibold text-foreground">Show your work</span>
        <p className="text-xs text-muted-foreground mb-2">
          Type your steps, draw them, or both — set it up, work it out, and write your final answer below.
        </p>

        {/* Type numbers & equations */}
        <div className="mb-3">
          <div className="text-xs font-medium text-muted-foreground mb-1">Type it</div>
          <EquationSandbox embedded value={sandbox} onChange={(v) => { setSandbox(v); emit({ sandbox: v }) }} />
        </div>

        {/* …and/or draw at the same time */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Draw it</div>
          <InkPad value={strokes} onChange={(s) => { setStrokes(s); emit({ workStrokes: s }) }} />
        </div>
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
