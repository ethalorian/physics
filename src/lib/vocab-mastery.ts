import type { VocabTask } from './vocab-learning'
import { summarizeWords } from './vocab-learning'
import { quizSummary, type QuizCheck } from './vocab-quiz'

export type VocabEvidenceCheck = QuizCheck & { user_id: string; task_id: string }
export type VocabMasteryReview = {
  id: string; task_id: string; user_id: string; target_id: string; level: number
  evidence_key: string; note: string; created_at: string; reviewer_email: string
}
export function evidenceIdentity(checks: QuizCheck[]) {
  return checks.filter(c => c.completed_at).map(c => `${c.id}:${c.review_version ?? 0}`).sort().join(',')
}
export function vocabularyProgress(task: VocabTask, checks: VocabEvidenceCheck[], reviews: VocabMasteryReview[]) {
  const done = checks.filter(c => c.completed_at).sort((a, b) => b.completed_at!.localeCompare(a.completed_at!))
  const review = reviews.filter(r => r.target_id === task.target_id).sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
  const evidenceKey = evidenceIdentity(done)
  const needsQuizReview = done.some(c => c.requires_release&&!c.reviewed_at || c.result?.some(r => r.correct === null))
  return {
    ...summarizeWords(task, done), checks: done, evidenceKey, review,
    quiz: task.task_kind === 'quiz' ? quizSummary(done, true) : null,
    status: !done.length ? 'no-evidence' : needsQuizReview ? 'quiz-review' : review?.evidence_key === evidenceKey ? 'rated' : 'pending',
  }
}
export type VocabStudentProgress = ReturnType<typeof vocabularyProgress> & { studentId: string; name: string }
export type VocabMasteryTask = VocabTask & { courseLabel: string; program: string; progress: VocabStudentProgress[] }
export type VocabMasteryData = {
  tasks: VocabMasteryTask[]
  students?: { studentId: string; name: string }[]
  targets: { id: string; statement: string; program: string }[]
}
