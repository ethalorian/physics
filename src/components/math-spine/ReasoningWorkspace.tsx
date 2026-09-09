'use client'

import { useId } from 'react'
import EquationSandbox from '@/components/blocks/EquationSandbox'
import MathCanvas from './MathCanvas'
import { useTranslator } from '@/lib/math-translate-store'
import type { MathResponse } from '@/lib/math-response'
import styles from './StudentMathInput.module.css'

export default function ReasoningWorkspace({ value, onChange, needsGraph = false, needsEquationBuilder = false, lang = '', reasoningId }: {
  value: MathResponse
  onChange: (value: MathResponse) => void
  needsGraph?: boolean
  needsEquationBuilder?: boolean
  lang?: string
  reasoningId?: string
}) {
  const id = useId()
  const fieldId = reasoningId ?? id + '-reasoning'
  const t = useTranslator(lang)
  const set = (patch: Partial<MathResponse>) => onChange({ ...value, ...patch })
  const hasBoard = Boolean(value.workStrokes?.length || value.workTexts?.some(text => text.text.trim()))
  return <div className={styles.workspace}>
    <div>
      <label className={styles.label} htmlFor={fieldId}>{t('Show your reasoning')}</label>
      <p id={fieldId + '-hint'} className={styles.hint}>{t('Explain a step, write an equation, or use the drawing board below.')}</p>
      <textarea id={fieldId} aria-describedby={fieldId + '-hint'} rows={4} className={styles.input} value={value.work ?? ''} onChange={event => set({ work: event.target.value })} placeholder={t('What did you do first? Show how you reached your answer.')} />
    </div>
    {needsEquationBuilder && <div className={styles.tool}><p className={styles.label}>{t('Build your equation')}</p><EquationSandbox embedded value={value.sandbox ?? { lines: [] }} onChange={sandbox => set({ sandbox })} /></div>}
    <details className={styles.board} open={needsGraph || hasBoard || undefined}>
      <summary><span>{t(needsGraph ? 'Graph & drawing board' : 'Drawing board')}</span><span className={styles.hint}>{t(needsGraph ? 'Plot and label your graph' : hasBoard ? 'Drawing included' : 'Optional · draw or type on the board')}</span></summary>
      <div className={styles.boardBody}><MathCanvas compact gridded={needsGraph} value={{ strokes: value.workStrokes ?? [], texts: value.workTexts ?? [] }} onChange={board => set({ workStrokes: board.strokes, workTexts: board.texts })} lang={lang} /></div>
    </details>
  </div>
}
