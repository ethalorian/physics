'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { GRADE_SCALE, gradeBand, letterGrade } from '@/lib/assessment-results/gradebook'
import s from './ResultsWorkspace.module.css'

export function GradeBadge({ percent, letter }: { percent: number | null; letter?: string }) {
  return percent == null ? <span className={s.muted}>—</span> : <span className={s.grade} data-tone={gradeBand(percent)}><strong>{percent.toFixed(1)}%</strong><span>{letter ?? letterGrade(percent)}</span></span>
}
export function GradeScale() { return <details className={s.scale}><summary title={GRADE_SCALE}>Letter-grade scale ⓘ</summary><p>{GRADE_SCALE}. Percentages round to one decimal before conversion.</p></details> }
export function CopyGrade({ value, label, disabled }: { value: string; label: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false), [fallback, setFallback] = useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1600) }
    catch { setFallback(true) }
  }
  return <span className={s.copyGroup}><button type="button" className={s.copy} disabled={disabled} onClick={() => void copy()} aria-label={label} title={label}>{copied ? <Check size={13}/> : <Copy size={13}/>}<span>{value}</span><span className="sr-only" role="status">{copied ? 'Copied' : ''}</span></button>{fallback && <label className={s.copyFallback}>Copy manually<input readOnly value={value} aria-label={`Copy manually: ${label}`} autoFocus onFocus={e => e.target.select()}/><button type="button" onClick={() => setFallback(false)}>Close</button></label>}</span>
}
