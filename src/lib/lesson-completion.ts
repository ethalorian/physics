import { isBlockComplete, isRequiredCaptureBlock, type ContentBlock } from '@/data/content-blocks'

export interface LessonCompletion {
  state: 'not_started' | 'in_progress' | 'ready' | 'submitted' | 'reviewed' | 'revision'
  answered: number
  required: number
  progress: number
  submittedAt: string | null
}
export const LESSON_COMPLETION_LABELS: Record<LessonCompletion['state'], string> = {
  not_started: 'Not submitted', in_progress: 'Not submitted', ready: 'Ready to submit',
  submitted: 'Submitted · awaiting review', reviewed: 'Submitted · reviewed', revision: 'Changes not submitted',
}
export interface SavedLessonAnswer { block_id: string; response: unknown; created_at: string }
export function missingLessonAnswers(blocks: ContentBlock[], answers: SavedLessonAnswer[]) {
  const latest = new Map<string, SavedLessonAnswer>()
  for (const answer of answers) {
    if (!latest.has(answer.block_id) || Date.parse(answer.created_at) >= Date.parse(latest.get(answer.block_id)!.created_at)) latest.set(answer.block_id, answer)
  }
  return blocks.filter(isRequiredCaptureBlock).filter(block => !isBlockComplete(block, latest.get(block.id)?.response))
}

/** A saved response and its XP are not a turned-in lesson. Submission is the final step. */
export function lessonCompletion(blocks: ContentBlock[], answers: SavedLessonAnswer[], submission?: { submitted_at: string; reviewed: boolean }, drafts: { block_id: string; updated_at: string }[] = []): LessonCompletion {
  const required = blocks.filter(isRequiredCaptureBlock).length
  const answered = required - missingLessonAnswers(blocks, answers).length
  const ids = new Set(blocks.map(b => b.id))
  const visibleAnswers = answers.filter(a => ids.has(a.block_id)), visibleDrafts = drafts.filter(d => ids.has(d.block_id))
  const changed = submission && (visibleAnswers.some(a => Date.parse(a.created_at) > Date.parse(submission.submitted_at)) || visibleDrafts.some(d => Date.parse(d.updated_at) > Date.parse(submission.submitted_at)))
  const turnedIn = Boolean(submission && (!submission.reviewed || !changed))
  const state: LessonCompletion['state'] = turnedIn ? submission!.reviewed ? 'reviewed' : 'submitted'
    : submission ? 'revision' : answered === required && !visibleDrafts.length && required > 0 ? 'ready'
    : visibleAnswers.length || visibleDrafts.length ? 'in_progress' : 'not_started'
  return { state, answered, required, progress: turnedIn ? 100 : Math.min(99, Math.round(answered / (required + 1) * 100)), submittedAt: submission?.submitted_at ?? null }
}
