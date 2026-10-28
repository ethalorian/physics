import 'server-only'
import { byIds } from '@/lib/assessment-results/queries'
import type { ResultsData } from '@/lib/assessment-results/types'
import { quizAiRecoverable, type QuizAiReview } from './grading'
import { processQuizSubmission } from './grading-server'

/** Input is the teacher-authorized Results scope. SQL claims recheck current work and enrollment. */
export async function pendingQuizRecovery(results: ResultsData) {
  const ids = [...new Set(results.activities.filter(a => a.kind === 'quiz' && !a.archived)
    .flatMap(a => Object.values(a.cells).flatMap(c => c.needsReview && c.submissionId ? [c.submissionId] : [])))]
  if (!ids.length) return []
  const jobs = await byIds<QuizAiReview>('quiz_ai_reviews', 'submission_id,status,error,attempts,locked_until,updated_at', 'submission_id', ids, ['submission_id'])
  return jobs.filter(j => quizAiRecoverable(j)).sort((a,b) => a.updated_at.localeCompare(b.updated_at)).slice(0,3)
}
export async function recoverQuizJobs(jobs: Pick<QuizAiReview,'submission_id'>[]) {
  await Promise.allSettled(jobs.map(job => processQuizSubmission(job.submission_id,true)))
}
