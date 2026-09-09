'use client'
import { useId } from 'react'
import ReasoningWorkspace from './ReasoningWorkspace'
import styles from './StudentMathInput.module.css'
import { useTranslator } from '@/lib/math-translate-store'
import type { MathResponse } from '@/lib/math-response'
export type WarmupAnswerValue = MathResponse
interface Props {
  strand?: string
  needsGraph?: boolean
  needsEquationBuilder?: boolean
  checkMode?: string
  value?: MathResponse
  onChange: (v: MathResponse) => void
  lang?: string
}
export default function WarmupAnswer({ needsGraph=false, needsEquationBuilder=false, checkMode='numeric', value={}, onChange, lang='' }: Props) {
  const id = useId()
  const t = useTranslator(lang)
  const set = (patch: Partial<MathResponse>) => onChange({ ...value, needsGraph, ...patch })
  return <div className="space-y-3">
    <ReasoningWorkspace value={value} onChange={set} needsGraph={needsGraph} needsEquationBuilder={needsEquationBuilder} lang={lang} />
    <div className={styles.answer}>
    <label className="block font-semibold" htmlFor={id+'-answer'}>{t(checkMode==='teacher-only' ? 'Your answer and explanation' : 'Final answer')}</label>
    <textarea id={id+'-answer'} rows={checkMode==='teacher-only' ? 3 : 1} className={styles.input} value={value.answer ?? ''} onChange={e => set({ answer:e.target.value })} placeholder={t('Include all requested parts and units where needed.')} />
    </div>
  </div>
}
