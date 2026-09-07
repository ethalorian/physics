'use client'
import { useId } from 'react'
import EquationSandbox from '@/components/blocks/EquationSandbox'
import MathCanvas from './MathCanvas'
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
    <label className="block font-semibold" htmlFor={id+'-work'}>{t('Show your reasoning')}</label>
    <textarea id={id+'-work'} rows={3} className="w-full rounded-md border bg-background p-3" value={value.work ?? ''} onChange={e => set({ work: e.target.value })} placeholder={t('Explain a step, write an equation, or describe your graph. Drawing is optional.')} />
    {needsEquationBuilder && <EquationSandbox embedded value={value.sandbox ?? { lines: [] }} onChange={sandbox => set({ sandbox })} />}
    <MathCanvas gridded={needsGraph} value={{ strokes: value.workStrokes ?? [], texts: value.workTexts ?? [] }} onChange={v => set({ workStrokes:v.strokes, workTexts:v.texts })} lang={lang} />
    <label className="block font-semibold" htmlFor={id+'-answer'}>{t(checkMode==='teacher-only' ? 'Your answer and explanation' : 'Final answer')}</label>
    <textarea id={id+'-answer'} rows={checkMode==='teacher-only' ? 3 : 1} className="w-full rounded-md border bg-background p-3" value={value.answer ?? ''} onChange={e => set({ answer:e.target.value })} placeholder={t('Include all requested parts and units where needed.')} />
  </div>
}
