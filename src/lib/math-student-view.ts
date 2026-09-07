import type { MathCompetencyRecord } from '@/data/curriculum-types'
import { decayingAverage, DEFAULT_RECENCY_WEIGHT } from '@/data/curriculum-types'

export const OBSERVATION_LABEL: Record<number, string> = {
  1: 'Developing with mathematical support',
  2: 'Independent on a familiar problem',
  3: 'Fluent reasoning and transfer',
}
export const REVISION_OUTCOME = {
  'fresh-check': 'Ready for a fresh independent check',
  'practice': 'Work on the next step with this feedback',
  'help': 'Connect with your teacher for help',
} as const
export type RevisionOutcome = keyof typeof REVISION_OUTCOME
export function isRevisionOutcome(value: unknown): value is RevisionOutcome {
  return typeof value === 'string' && Object.hasOwn(REVISION_OUTCOME, value)
}
export function skillEvidence(records: MathCompetencyRecord[], weight = DEFAULT_RECENCY_WEIGHT) {
  const ordered = [...records].sort((a,b) => a.observedAt.localeCompare(b.observedAt))
  const value = decayingAverage(ordered.map(r => r.level), weight)
  const latest = ordered.at(-1)
  return {
    ordered, value, latest,
    status: !latest ? 'Not assessed yet' : ordered.length === 1 ? 'Initial demonstration' : 'Evidence across multiple observations',
    // Counts describe evidence; they do not certify independent occasions or mastery.
    next: !latest ? 'Your first teacher-reviewed task will start your evidence history.'
      : ordered.length === 1 ? 'Try another task to show what you can apply again.'
      : latest.level === 1 ? 'Use your feedback to choose one step to work on.'
      : latest.level === 2 ? 'Apply this skill in a different context and explain your reasoning.'
      : 'Revisit this skill later to see what you can still apply.',
  }
}

export function pendingFreshCheck(
  followups: { competencyId: string; acknowledgedAt: string | null }[],
  activeIds: string[], latestBySkill: Map<string, string>,
): string | null {
  const active = new Set(activeIds)
  return [...followups].filter(f => f.acknowledgedAt && active.has(f.competencyId))
    .sort((a,b) => a.acknowledgedAt!.localeCompare(b.acknowledgedAt!))
    .find(f => !latestBySkill.has(f.competencyId) || latestBySkill.get(f.competencyId)! < f.acknowledgedAt!)?.competencyId ?? null
}
