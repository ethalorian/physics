/**
 * math-spine-picker — the one place that decides "which rung today?" and
 * "what state is each rung in?". Pure functions (no IO) shared by the daily
 * route, the practice route, and the student ladder map, so the ladder a
 * student SEES is computed by the same logic as the problem they GET.
 *
 * Design contract (warmup_remediation_redesign.md):
 *  - Rung states: Not yet (<1.5) / Almost (<2.5) / Got it (>=2.5), plus
 *    "Needs a refresh" — once Got-it, now decayed below 2.5 (decision 6).
 *  - Pick order (decisions 9, 10 + resolved fork "jump the queue"):
 *      1. refresh   — a cracked foundation outranks new construction
 *      2. recheck   — a Got-it rung whose evidence is >14 days old (oldest first)
 *      3. climb     — first rung (by sequence) not yet Got-it
 *      4. maintenance — all Got-it and fresh: oldest evidence first, stretch
 */
import { decayingAverage, DEFAULT_RECENCY_WEIGHT } from '@/data/curriculum-types'
import { FLUENT_THRESHOLD, ALMOST_THRESHOLD } from '@/lib/math-spine'

export const RECHECK_INTERVAL_DAYS = 14

export type RungState = 'not-yet' | 'almost' | 'got-it' | 'refresh'
export type PickKind = 'refresh' | 'recheck' | 'climb' | 'maintenance'

/** One student-facing word per state — the only vocabulary students see. */
export const RUNG_STATE_LABEL: Record<RungState, string> = {
  'not-yet': 'Not yet',
  'almost': 'Almost',
  'got-it': 'Got it',
  'refresh': 'Needs a refresh',
}

export interface RungInput {
  id: string
  /** ladder position (sequence_order, then order_index) */
  sequence: number
  /** chronological levels, oldest → newest */
  levels: number[]
  /** ISO timestamp of latest observation, null if none */
  latestObservedAt: string | null
}

export interface Pick {
  id: string
  kind: PickKind
}

/** Was this rung EVER at Got-it? (any prefix of the decaying average >= 2.5) */
export function everFluent(levels: number[], w: number = DEFAULT_RECENCY_WEIGHT): boolean {
  let acc = 0
  for (let i = 0; i < levels.length; i++) {
    acc = i === 0 ? levels[0] : w * levels[i] + (1 - w) * acc
    if (acc >= FLUENT_THRESHOLD) return true
  }
  return false
}

export function rungState(levels: number[], w: number = DEFAULT_RECENCY_WEIGHT): RungState {
  const value = decayingAverage(levels, w)
  if (value !== null && value >= FLUENT_THRESHOLD) return 'got-it'
  if (everFluent(levels, w)) return 'refresh'
  if (value !== null && value >= ALMOST_THRESHOLD) return 'almost'
  return 'not-yet'
}

function daysSince(iso: string | null, now: Date): number {
  if (!iso) return Infinity
  return (now.getTime() - new Date(iso).getTime()) / 86_400_000
}

/**
 * Which rung gets today's problem, and why. Returns null only for an empty
 * ladder. `kind` lets the UI frame the problem honestly: a re-check reads
 * "Still got it?", a refresh reads "Let's patch this one back up."
 */
export function pickTargetRung(rungs: RungInput[], now: Date = new Date()): Pick | null {
  if (rungs.length === 0) return null
  const ordered = [...rungs].sort((a, b) => a.sequence - b.sequence)
  const stateOf = new Map(ordered.map((r) => [r.id, rungState(r.levels)]))

  // 1. Refresh rungs jump the queue (lowest ladder position first).
  const refresh = ordered.find((r) => stateOf.get(r.id) === 'refresh')
  if (refresh) return { id: refresh.id, kind: 'refresh' }

  // 2. Due re-checks: Got-it rungs with stale evidence, oldest evidence first.
  const due = ordered
    .filter((r) => stateOf.get(r.id) === 'got-it' && daysSince(r.latestObservedAt, now) > RECHECK_INTERVAL_DAYS)
    .sort((a, b) => daysSince(b.latestObservedAt, now) - daysSince(a.latestObservedAt, now))
  if (due.length > 0) return { id: due[0].id, kind: 'recheck' }

  // 3. Climb: the first rung not yet at Got-it.
  const climb = ordered.find((r) => stateOf.get(r.id) !== 'got-it')
  if (climb) return { id: climb.id, kind: 'climb' }

  // 4. Maintenance: everything Got-it and fresh — keep the oldest evidence warm.
  const maintenance = [...ordered].sort(
    (a, b) => daysSince(b.latestObservedAt, now) - daysSince(a.latestObservedAt, now),
  )[0]
  return { id: maintenance.id, kind: 'maintenance' }
}
