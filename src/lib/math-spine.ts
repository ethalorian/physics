/**
 * Math-literacy spine — server helpers.
 *
 * Pure logic for the cross-cutting "quantitative spine": rolling competency
 * records up into a value (reusing the source-of-truth decaying average), and
 * deciding which celebration/point MILESTONES a new observation unlocks.
 *
 * Milestones feed the SAME economy as everything else: a GrantSpec is written to
 * math_spine_point_grants, which src/lib/points.ts sums into lifetime-earned.
 * Every milestone carries a dedupe_key so it can only ever be awarded once.
 */
import {
  MathStrand,
  decayingAverage,
  DEFAULT_RECENCY_WEIGHT,
} from '@/data/curriculum-types'

// Same thresholds the student-facing levelWord() uses: <1.5 Not yet, <2.5 Almost, >=2.5 Got it.
export const ALMOST_THRESHOLD = 1.5
export const FLUENT_THRESHOLD = 2.5

export const STRAND_ORDER: MathStrand[] = [
  'number-sense',
  'proportional-reasoning',
  'quantities-estimation',
  'symbolic-manipulation',
  'graphs-vectors',
]

export const STRAND_LABEL: Record<MathStrand, string> = {
  'number-sense': 'Number Sense',
  'proportional-reasoning': 'Proportional Reasoning',
  'quantities-estimation': 'Quantities & Estimation',
  'symbolic-manipulation': 'Symbolic Manipulation',
  'graphs-vectors': 'Graphs & Vectors',
}

/** Points each milestone is worth. Tunable in one place. */
export const POINT_VALUES = {
  'levelup-almost': 5,
  'competency-fluent': 20,
  'strand-complete': 75,
  'spotlight': 15,
  // Token point for an extra self-checked practice rep (capped 3/day in the
  // practice route). Deliberately tiny relative to 'competency-fluent' so
  // grinding reps can never beat honest ladder progress.
  'practice-rep': 1,
} as const

export type Milestone = keyof typeof POINT_VALUES

export interface GrantSpec {
  user_id: string
  user_email?: string | null
  milestone: Milestone
  competency_id?: string | null
  strand?: MathStrand | null
  points: number
  note?: string | null
  awarded_by?: string | null
  dedupe_key: string
}

/** Decaying value of one competency from its chronological levels. */
export function competencyValue(
  levels: number[],
  w: number = DEFAULT_RECENCY_WEIGHT,
): number | null {
  return decayingAverage(levels, w)
}

/**
 * Which per-competency milestones a new observation just unlocked.
 *
 * Compares the decaying value BEFORE and AFTER the latest observation, and emits
 * a grant for each threshold newly crossed. dedupe_key makes a re-cross a no-op
 * at write time, so callers can evaluate freely on every observation.
 */
export function evaluateCompetencyMilestones(args: {
  userId: string
  userEmail?: string | null
  competencyId: string
  competencySlug: string
  levelsChronological: number[] // INCLUDING the new observation, oldest -> newest
  w?: number
}): GrantSpec[] {
  const { userId, userEmail, competencyId, competencySlug } = args
  const w = args.w ?? DEFAULT_RECENCY_WEIGHT
  const after = competencyValue(args.levelsChronological, w)
  const before = competencyValue(args.levelsChronological.slice(0, -1), w)
  if (after === null) return []

  const crossed = (threshold: number) =>
    after >= threshold && (before === null || before < threshold)

  const grants: GrantSpec[] = []
  if (crossed(ALMOST_THRESHOLD)) {
    grants.push({
      user_id: userId,
      user_email: userEmail ?? null,
      milestone: 'levelup-almost',
      competency_id: competencyId,
      points: POINT_VALUES['levelup-almost'],
      dedupe_key: `${userId}:levelup-almost:${competencySlug}`,
    })
  }
  if (crossed(FLUENT_THRESHOLD)) {
    grants.push({
      user_id: userId,
      user_email: userEmail ?? null,
      milestone: 'competency-fluent',
      competency_id: competencyId,
      points: POINT_VALUES['competency-fluent'],
      dedupe_key: `${userId}:competency-fluent:${competencySlug}`,
    })
  }
  return grants
}

/**
 * A strand is "complete" when every ACTIVE competency in it is Fluent (>=2.5).
 * Returns a single grant or null. Idempotent via dedupe_key.
 */
export function evaluateStrandComplete(args: {
  userId: string
  userEmail?: string | null
  strand: MathStrand
  competencyValues: (number | null)[] // current value for each active competency in the strand
}): GrantSpec | null {
  const { userId, userEmail, strand, competencyValues } = args
  if (competencyValues.length === 0) return null
  const allFluent = competencyValues.every((v) => v !== null && v >= FLUENT_THRESHOLD)
  if (!allFluent) return null
  return {
    user_id: userId,
    user_email: userEmail ?? null,
    milestone: 'strand-complete',
    strand,
    points: POINT_VALUES['strand-complete'],
    dedupe_key: `${userId}:strand-complete:${strand}`,
  }
}

/** A teacher "spotlight" — a manual recognition grant. Repeatable (unique key per moment). */
export function buildSpotlightGrant(args: {
  userId: string
  userEmail?: string | null
  competencyId?: string | null
  note?: string | null
  awardedBy?: string | null
  points?: number
}): GrantSpec {
  const stamp = new Date().toISOString()
  return {
    user_id: args.userId,
    user_email: args.userEmail ?? null,
    milestone: 'spotlight',
    competency_id: args.competencyId ?? null,
    points: args.points ?? POINT_VALUES['spotlight'],
    note: args.note ?? null,
    awarded_by: args.awardedBy ?? null,
    dedupe_key: `${args.userId}:spotlight:${stamp}`,
  }
}
