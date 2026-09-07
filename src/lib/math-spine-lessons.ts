/** Shared, authored lesson summaries for the warm-up viewer and bank editor.
 * Teachers may override summaries; the worked-example library remains available.
 */
import { MATH_TEACHING_GUIDES } from './math-teaching-guides'
export interface MiniLesson { title: string; steps: string[]; tip?: string }
export const TIER_LABELS = ['Understand the idea', 'Work step by step', 'Extend and check'] as const
/** A suggested starting point, never a restriction on available support. */
export function pickTier(value: number | null | undefined): number {
  if (value == null || value < 1.5) return 0
  return value < 2.5 ? 1 : 2
}
export const MINI_LESSONS: Record<string, MiniLesson[]> = Object.fromEntries(
  Object.entries(MATH_TEACHING_GUIDES).map(([code,g]) => [code,[
    { title: g.goal, steps: [g.idea, ...g.words.map(w=>`${w.term}: ${w.meaning}`)], tip: g.hints[0] },
    { title: g.examples[0].title, steps: [g.examples[0].prompt, ...g.examples[0].steps.map(s=>`${s.action} ${s.why}`)], tip: g.examples[0].check },
    { title: g.examples[1]?.title ?? 'Explain and check', steps: g.examples[1] ? [g.examples[1].prompt,...g.examples[1].steps.map(s=>`${s.action} ${s.why}`),g.examples[1].check] : [g.transfer], tip: g.transfer },
  ]]),
)
export function tieredLessonsForCode(code: string | undefined | null): MiniLesson[] | null {
  return code ? MINI_LESSONS[code] ?? null : null
}
export function miniLessonForCode(code: string | undefined | null, tier=0): MiniLesson | null {
  const tiers=tieredLessonsForCode(code)
  return tiers?.[Math.max(0,Math.min(2,Math.trunc(tier) || 0))] ?? null
}
/** Malformed/empty DB overrides must not remove help or crash the student view. */
export function resolveMiniLessons(code: string, value: unknown): MiniLesson[] | null {
  const defaults=tieredLessonsForCode(code)
  if (!Array.isArray(value) || value.length === 0) return defaults
  const valid=(v: unknown): v is MiniLesson => {
    if (!v || typeof v !== 'object') return false
    const t=v as MiniLesson
    return typeof t.title === 'string' && !!t.title.trim() && Array.isArray(t.steps) && t.steps.length>0 && t.steps.every(s=>typeof s === 'string' && !!s.trim()) && (t.tip === undefined || typeof t.tip === 'string')
  }
  return [0,1,2].map(i=>valid(value[i]) ? value[i] : defaults?.[i]).filter((v): v is MiniLesson => !!v)
}
