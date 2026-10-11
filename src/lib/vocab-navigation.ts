import { UUID, type LearningWord, type VocabResult } from './vocab-learning'

export function vocabReviewHref(taskId: string, courseId: string, unitId?: string | null) {
  const query = new URLSearchParams({ view: 'vocabulary', class: courseId, task_id: taskId })
  if (unitId) query.set('unit', unitId)
  return `/admin/control-room?${query}`
}

/** Older recognition checks stored an option UUID. Resolve it against the assignment snapshot. */
export function vocabResponseText(result: VocabResult, words: LearningWord[]) {
  if (!UUID.test(result.response)) return result.response || 'No written response'
  return words.find(word => word.id === result.response)?.term ?? 'Selected word unavailable'
}
