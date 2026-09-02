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
  /** How this item is checked — sizes and words the answer field to match. */
  checkMode?: 'numeric' | 'short-answer' | 'teacher-only' | 'exact-form' | 'estimate'
  value?: WarmupAnswerValue
  onChange: (v: WarmupAnswerValue) => void
  lang?: string
}

const inputCls = 'w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground'

export default function WarmupAnswer({ needsGraph = false, needsEquationBuilder = false, checkMode = 'numeric', value, onChange, lang = '' }: Props) {
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
      {/* ANSWER FIRST — the one field the instant check needs, so it can't be
          missed at the bottom of a long canvas. Sized to the question type. */}
      <div className="rounded-lg border-l-4 px-3 py-2.5" style={{ borderColor: 'var(--success)', background: 'color-mix(in oklch, var(--success) 6%, transparent)' }}>
        <label className="text-sm font-bold text-foreground">
          {t(checkMode === 'teacher-only' ? 'Your answer & reasoning' : 'Your answer')}
        </label>
        {checkMode === 'teacher-only' ? (
          <>
            <textarea
              className={`${inputCls} mt-1.5`}
              rows={3}
              style={{ fontSize: 15, lineHeight: 1.5, resize: 'vertical' }}
              value={answer}
              onChange={(e) => { setAnswer(e.target.value); emit({ answer: e.target.value }) }}
              placeholder={t('A sentence or two — your teacher reads this one.')}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('No instant check on this question — your teacher reads and rates it.')}</p>
          </>
        ) : (
          <>
            <input
              className={`${inputCls} mt-1.5`}
              style={{ fontSize: 16, padding: '10px 12px' }}
              value={answer}
              onChange={(e) => { setAnswer(e.target.value); emit({ answer: e.target.value }) }}
              placeholder={t(checkMode === 'short-answer' ? 'A word or short formula — e.g. t = d/v' : 'Your answer, with units — e.g. 3.5 m/s')}
              inputMode={checkMode === 'numeric' ? 'text' : undefined}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('Checked instantly when you submit.')}</p>
          </>
        )}
      </div>

      {/* Equation builder — only when the question calls for it */}
      {needsEquationBuilder && (
        <div>
          <span className="text-sm font-semibold text-foreground">{t('Build your equation')}</span>
          <p className="text-xs text-muted-foreground mb-2">{t('Type your rearrangement / substitution step by step.')}</p>
          <EquationSandbox embedded value={sandbox} onChange={(v) => { setSandbox(v); emit({ sandbox: v }) }} />
        </div>
      )}

      <div>
        <span className="text-sm font-semibold text-foreground">{t(needsGraph ? 'Graph & show your work' : 'Show your thinking')}</span>
        <p className="text-xs text-muted-foreground mb-2">
          {t(needsGraph
            ? 'Plot or sketch on the graph paper, and type/label values right on it.'
            : 'Your teacher rates the thinking, not just the answer — type or draw how you got there.')}
        </p>
        <MathCanvas
          gridded={needsGraph}
          value={{ strokes, texts }}
          onChange={(v) => { setStrokes(v.strokes); setTexts(v.texts); emit({ workStrokes: v.strokes, workTexts: v.texts }) }}
          lang={lang}
        />
      </div>
    </div>
  )
}
