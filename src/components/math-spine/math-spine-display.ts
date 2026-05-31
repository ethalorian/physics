/**
 * Shared display helpers for the math-literacy spine UI.
 * Pure functions over the source-of-truth model in src/data/curriculum-types.ts.
 *
 * Reuses the mastery palette + level language (Not yet / Almost / Got it) so the
 * spine reads exactly like the rest of the growth UI — every signal doubled
 * (number + word + trend) to survive grayscale and colorblindness.
 */
import {
  MathCompetencyRecord,
  decayingAverage,
  DEFAULT_RECENCY_WEIGHT,
} from '@/data/curriculum-types'
import { PALETTE, levelWord, levelColor, Trend } from '@/components/mastery/mastery-display'

export { PALETTE, levelWord, levelColor }
export type { Trend }

export function buildRecordsByCompetency(
  records: MathCompetencyRecord[],
): Map<string, MathCompetencyRecord[]> {
  const m = new Map<string, MathCompetencyRecord[]>()
  for (const r of records) {
    const arr = m.get(r.competencyId) ?? []
    arr.push(r)
    m.set(r.competencyId, arr)
  }
  return m
}

/** Decaying value of one competency from its records. */
export function competencyValue(
  records: MathCompetencyRecord[] | undefined,
  w: number = DEFAULT_RECENCY_WEIGHT,
): number | null {
  if (!records || records.length === 0) return null
  const levels = [...records]
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt))
    .map((r) => r.level)
  return decayingAverage(levels, w)
}

/** Strand value = mean of its competencies' decaying values (those with evidence). */
export function strandValue(
  competencyIds: string[],
  byCompetency: Map<string, MathCompetencyRecord[]>,
  w: number = DEFAULT_RECENCY_WEIGHT,
): number | null {
  const vals = competencyIds
    .map((id) => competencyValue(byCompetency.get(id), w))
    .filter((v): v is number => v !== null)
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

/** Running decaying-average series across a strand's records (chronological) — the sparkline. */
export function strandSeries(
  competencyIds: string[],
  records: MathCompetencyRecord[],
  w: number = DEFAULT_RECENCY_WEIGHT,
): number[] {
  const ids = new Set(competencyIds)
  const levels = records
    .filter((r) => ids.has(r.competencyId))
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt))
    .map((r) => r.level)
  const series: number[] = []
  let acc = 0
  levels.forEach((lvl, i) => {
    acc = i === 0 ? lvl : w * lvl + (1 - w) * acc
    series.push(acc)
  })
  return series
}

export function trendForCompetency(
  records: MathCompetencyRecord[] | undefined,
  w: number = DEFAULT_RECENCY_WEIGHT,
): Trend {
  if (!records || records.length < 2) return 'none'
  const levels = [...records]
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt))
    .map((r) => r.level)
  const cur = decayingAverage(levels, w)
  const prev = decayingAverage(levels.slice(0, -1), w)
  if (cur === null || prev === null) return 'none'
  const d = cur - prev
  if (d > 0.05) return 'up'
  if (d < -0.05) return 'down'
  return 'flat'
}
