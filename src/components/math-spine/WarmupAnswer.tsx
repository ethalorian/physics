'use client'

/**
 * WarmupAnswer — the warm-up work surface.
 *
 * One board (MathCanvas) where students TYPE numbers/equations directly onto the
 * canvas AND draw on the same surface. Per-item tools appear only when the
 * question calls for them:
 *   • needsGraph → the board becomes graph paper (axes + grid) to sketch/plot.
 *   • needsEquationBuilder → the EquationSandbox equation builder is shown too.
 * A final "Answer" field always captures the result.
 *
 * Emits {answer, workStrokes, workTexts, sandbox} — all render in the control-room
 * review drawer.
 */
import { useState } from 'react'
import type { Stroke } from '@/components/blocks/DoodleCanvas'
import EquationSandbox, { type SandboxValue } from '@/components/blocks/EquationSandbox'
import MathCanvas, { type CanvasText } from './MathCanvas'
import { useTranslator } from '@/lib/math-translate-store'

export interface WarmupAnswerValue {
  given?: string
  equation?: string
  answer?: string
  workStrokes?: Stroke[]
  workTexts?: CanvasText[]
  sandbox?: SandboxValue
}

interface Props {
  strand?: string
  needsGraph?: boolean
  needsEquationBuilder?: boolean
  value?: WarmupAnswerValue
  onChange: (v: WarmupAnswerValue) => void
  lang?: string
}

const inputCls = 'w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground'

export default function WarmupAnswer({ needsGraph = false, needsEquationBuilder = false, value, onChange, lang = '' }: Props) {
  const t = useTranslator(lang)
  const [strokes, setStrokes] = useState<Stroke[]>(value?.workStrokes ?? [])
  const [texts, setTexts] = useState<CanvasText[]>(value?.workTexts ?? [])
  const [sandbox, setSandbox] = useState<SandboxValue>(value?.sandbox ?? { lines: [] })
  const [answer, setAnswer] = useState(value?.answer ?? '')

  const emit = (patch: Partial<WarmupAnswerValue>) => {
    onChange({
      answer: patch.answer ?? answer,
      workStrokes: patch.workStrokes ?? strokes,
      workTexts: patch.workTexts ?? texts,
      sandbox: patch.sandbox ?? sandbox,
    })
  }

  return (
    <div className="space-y-4">
      {/* Equation builder — only when the question calls for it */}
      {needsEquationBuilder && (
        <div>
          <span className="text-sm font-semibold text-foreground">{t('Build your equation')}</span>
          <p className="text-xs text-muted-foreground mb-2">{t('Type your rearrangement / substitution step by step.')}</p>
          <EquationSandbox embedded value={sandbox} onChange={(v) => { setSandbox(v); emit({ sandbox: v }) }} />
        </div>
      )}

      <div>
        <span className="text-sm font-semibold text-foreground">{t(needsGraph ? 'Graph & show your work' : 'Show your work')}</span>
        <p className="text-xs text-muted-foreground mb-2">
          {t(needsGraph
            ? 'Plot or sketch on the graph paper, and type/label values right on it.'
            : 'Type your numbers and equations right on the board, then draw on them — circle the answer, cross out a step, or sketch to explain.')}
        </p>
        <MathCanvas
          gridded={needsGraph}
          value={{ strokes, texts }}
          onChange={(v) => { setStrokes(v.strokes); setTexts(v.texts); emit({ workStrokes: v.strokes, workTexts: v.texts }) }}
          lang={lang}
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground">{t('Final answer')}</label>
        <input
          className={`${inputCls} mt-1`}
          value={answer}
          onChange={(e) => { setAnswer(e.target.value); emit({ answer: e.target.value }) }}
          placeholder={t('Your answer, with units')}
        />
      </div>
    </div>
  )
}
