import { DEFAULT_RECENCY_WEIGHT, targetValue, type LearningTarget, type MasteryRecord } from '@/data/curriculum-types'
import { buildRecordsByTarget, trendFor } from '@/components/mastery/mastery-display'

/** Only teacher-rated, included targets count. Unrated work is never a zero. */
export function growthSnapshot(targets: LearningTarget[], records: MasteryRecord[], weight = DEFAULT_RECENCY_WEIGHT) {
  const byTarget = buildRecordsByTarget(records)
  const items = targets.filter(t => !t.excludeFromGrowth).map(target => {
    const history = [...(byTarget.get(target.id) ?? [])].sort((a, b) => a.observedAt.localeCompare(b.observedAt))
    return { target, history, value: targetValue(history, weight), trend: trendFor(history, weight), latest: history.at(-1) }
  })
  const reviewed = items.filter(t => t.value !== null)
  return {
    items, reviewed: reviewed.length,
    secure: reviewed.filter(t => t.value! >= 2.5).length,
    improving: reviewed.filter(t => t.trend === 'up').length,
    observations: reviewed.reduce((n, t) => n + t.history.length, 0),
    // A recent improvement is a comparison with this target's previous weighted
    // rating, not with another student's work or a new target's starting score.
    recent: [...reviewed].sort((a, b) => b.latest!.observedAt.localeCompare(a.latest!.observedAt)),
  }
}

export type GrowthTarget = ReturnType<typeof growthSnapshot>['items'][number]
export function growthNextStep(item: GrowthTarget) {
  if (item.value === null) return 'Complete your assigned work and submit it for feedback. Your first teacher rating will start this story.'
  if (item.history.length === 1) return 'This is your first piece of rated evidence. Try another task to show what you can apply again.'
  if (item.value >= 2.5) return 'Put this idea to work in a new situation. Explain why your approach works, then check what you can still do later.'
  return 'Use your teacher’s feedback to choose one thing to improve. Practice it, then show your thinking in your next submission.'
}
export function growthDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
