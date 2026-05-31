'use client'

/**
 * WarmupAnswer — the universal warm-up work surface.
 *
 * The InkPad is ALWAYS shown: every warm-up, whatever the skill, gives students
 * a place to show their work by hand (set up a proportion, cancel units, draw a
 * vector, solve an equation). A final "Answer" field is always there too.
 *
 * A structured Given/Equation set-up is OPTIONAL and only really fits equation
 * "solve" problems — so it's collapsed by default and auto-opens only for the
 * symbolic-manipulation strand. This avoids forcing ratio/conversion work into a
 * Given/Equation frame it doesn't fit.
 *
 * Emits the same {given, equation, answer, workStrokes} shape the control-room
 * review drawer already renders.
 */
import { useState } from 'react'
import InkPad from '@/components/blocks/InkPad'
import type { Stroke } from '@/components/blocks/DoodleCanvas'

export interface WarmupAnswerValue {
  given?: string
  equation?: string
  answer?: string
  workStrokes?: Stroke[]
}

interface Props {
  strand?: string
  value?: WarmupAnswerValue
  onChange: (v: WarmupAnswerValue) => void
}

const inputCls = 'w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground'

export default function WarmupAnswer({ strand, value, onChange }: Props) {
  const [given, setGiven] = useState(value?.given ?? '')
  const [equation, setEquation] = useState(value?.equation ?? '')
  const [answer, setAnswer] = useState(value?.answer ?? '')
  const [strokes, setStrokes] = useState<Stroke[]>(value?.workStrokes ?? [])
  const [showSetup, setShowSetup] = useState(strand === 'symbolic-manipulation')

  const emit = (patch: Partial<WarmupAnswerValue>) => {
    const next: WarmupAnswerValue = {
      given: patch.given ?? given,
      equation: patch.equation ?? equation,
      answer: patch.answer ?? answer,
      workStrokes: patch.workStrokes ?? strokes,
    }
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {/* Show your work — ALWAYS */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-foreground">Show your work</span>
          <button
            type="button"
            onClick={() => setShowSetup((s) => !s)}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            {showSetup ? 'Hide set-up' : '+ Add a set-up (given / equation)'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Write your full solution by hand — set it up, work the steps, and circle your final answer.
        </p>
        <InkPad value={strokes} onChange={(s) => { setStrokes(s); emit({ workStrokes: s }) }} />
      </div>

      {/* Optional structured set-up — only when it fits */}
      {showSetup && (
        <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/30">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Given / set-up</label>
            <input
              className={inputCls}
              value={given}
              onChange={(e) => { setGiven(e.target.value); emit({ given: e.target.value }) }}
              placeholder="What you know, or your proportion / set-up"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Equation / relationship (if any)</label>
            <input
              className={inputCls}
              value={equation}
              onChange={(e) => { setEquation(e.target.value); emit({ equation: e.target.value }) }}
              placeholder="e.g. a = F / m,  or  new = old × scale factor"
            />
          </div>
        </div>
      )}

      {/* Final answer — ALWAYS */}
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
