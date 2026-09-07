'use client'
import MathCanvas from './MathCanvas'
import type { MathResponse } from '@/lib/math-response'

export default function MathWorkReview({ value, fallback }: { value?: MathResponse | null; fallback?: string }) {
  if (!value) return <p className="whitespace-pre-wrap">{fallback}</p>
  return <div className="space-y-2">
    {value.given && <p><b>Given:</b> {value.given}</p>}
    {value.equation && <p><b>Equation:</b> {value.equation}</p>}
    {value.work && <p className="whitespace-pre-wrap"><b>Reasoning:</b> {value.work}</p>}
    {!!value.sandbox?.lines?.length && <div><b>Equation work:</b>{value.sandbox.lines.map((line,i) => <p key={i}>{line}</p>)}</div>}
    {(value.needsGraph || value.workStrokes?.length || value.workTexts?.length) ? <MathCanvas readOnly gridded={value.needsGraph} value={{ strokes: value.workStrokes ?? [], texts: value.workTexts ?? [] }} onChange={() => {}} /> : null}
    <p className="whitespace-pre-wrap"><b>Answer:</b> {value.answer || 'See work above'}</p>
    {value.helpUsed && <p className="text-xs text-muted-foreground">Student reports using the how-to. Judge independence from the work or a follow-up; language access is not a rating penalty.</p>}
  </div>
}
