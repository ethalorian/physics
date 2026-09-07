import type { Stroke } from '@/components/blocks/DoodleCanvas'
import type { CanvasText } from '@/components/math-spine/MathCanvas'
import type { SandboxValue } from '@/components/blocks/EquationSandbox'

export interface MathResponse {
  given?: string
  equation?: string
  answer?: string
  work?: string
  workStrokes?: Stroke[]
  workTexts?: CanvasText[]
  sandbox?: SandboxValue
  needsGraph?: boolean
  helpUsed?: boolean
}
export function hasMathWork(r: MathResponse): boolean {
  return !!(r.work?.trim() || r.workStrokes?.length || r.workTexts?.some(t => t.text.trim()) || r.sandbox?.lines?.some(l => l.trim()))
}
export function validateMathResponse(value: unknown): value is MathResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  if (JSON.stringify(value).length > 250000) return false
  const r = value as MathResponse
  for (const field of [r.given, r.equation]) if (field !== undefined && (typeof field !== 'string' || field.length > 12000)) return false
  if (r.helpUsed !== undefined && typeof r.helpUsed !== 'boolean') return false
  if (r.answer !== undefined && (typeof r.answer !== 'string' || r.answer.length > 4000)) return false
  if (r.work !== undefined && (typeof r.work !== 'string' || r.work.length > 12000)) return false
  if (r.workTexts !== undefined && (!Array.isArray(r.workTexts) || r.workTexts.some(t => !t || typeof t.text !== 'string' || !Number.isFinite(t.x) || !Number.isFinite(t.y)))) return false
  if (r.workStrokes !== undefined && (!Array.isArray(r.workStrokes) || r.workStrokes.some(s => !s || typeof s.color !== 'string' || (s.width !== undefined && !Number.isFinite(s.width)) || !Array.isArray(s.points) || s.points.some(p => !p || !Number.isFinite(p.x) || !Number.isFinite(p.y))))) return false
  if (r.sandbox !== undefined && (!r.sandbox || !Array.isArray(r.sandbox.lines) || r.sandbox.lines.some(l => typeof l !== 'string'))) return false
  return true
}
export function summarizeMathResponse(r: MathResponse): string {
  return [r.work, ...(r.sandbox?.lines ?? []), ...(r.workTexts?.map(t => t.text) ?? []), r.workStrokes?.length ? '[drawn work]' : '', r.answer].filter(Boolean).join(' · ')
}
