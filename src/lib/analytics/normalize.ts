import { BLOOMS } from '@/lib/assessment-demand'
import type { QuizSubmission, QuizReview } from '@/lib/quizzes/types'
import type { QuestionEvidence, ActivityEvidence } from './types'

export function deviceCategory(agent: string | null): ActivityEvidence['device'] {
  if (!agent) return 'Unknown'
  if (/ipad|tablet|android(?!.*mobile)/i.test(agent)) return 'Tablet'
  if (/iphone|ipod|mobile/i.test(agent)) return 'Mobile'
  if (/windows|macintosh|cros|linux/i.test(agent)) return 'Computer'
  return 'Unknown'
}

function answerText(value: unknown): string {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ''
  return Object.entries(value).flatMap(([stage, response]) => {
    if (typeof response === 'string') return [`${stage}: ${response}`]
    if (!response || typeof response !== 'object') return []
    const entry = response as { text?: unknown; strokes?: unknown[] }
    return [`${stage}: ${typeof entry.text === 'string' ? entry.text : ''}${entry.strokes?.length ? ' [Drawing included in original submission]' : ''}`]
  }).join('\n')
}

/** Changed prompts, options, point scales or demand labels are different comparisons. */
export function normalizeQuestions(submissions: QuizSubmission[], reviews: QuizReview[]): QuestionEvidence[] {
  const latest = new Map<string, QuizReview>()
  for (const review of [...reviews].sort((a, b) => a.reviewed_at.localeCompare(b.reviewed_at) || a.id.localeCompare(b.id))) latest.set(review.submission_id, review)
  return submissions.flatMap(submission => {
    const quiz = submission.snapshot, review = latest.get(submission.id)
    if (!quiz || !Array.isArray(quiz.questions)) return []
    return quiz.questions.map(question => {
      const answer = submission.answers?.[question.id]
      const raw = review?.decision === 'graded' ? question.kind === 'choice' && typeof question.correct_index === 'number' ? answer === String(question.correct_index) ? question.points : 0 : review.scores?.[question.id] : null
      const score = typeof raw === 'number' && Number.isFinite(raw) && question.points > 0 && raw >= 0 && raw <= question.points ? raw : null
      const choice = question.kind === 'choice' && typeof answer === 'string' && /^\d+$/.test(answer) ? question.options?.[Number(answer)] : undefined
      return {
        id: `${submission.id}:${question.id}`, questionKey: JSON.stringify([submission.quiz_id, question.id, question.prompt, question.kind, question.options, question.correct_index, question.guide, question.points, question.target_id, question.demand ? [question.demand.blooms, question.demand.dok, question.demand.evidence] : null]),
        questionId: question.id, assessmentId: submission.quiz_id, assessment: quiz.title, classId: quiz.course_id,
        studentId: submission.user_id, targetId: question.target_id, kind: question.kind,
        bloom: question.demand && BLOOMS.includes(question.demand.blooms) ? question.demand.blooms : null,
        dok: question.demand?.dok ?? null, prompt: question.prompt, answer: choice ?? answerText(answer), at: submission.submitted_at,
        score, possible: question.points, reviewedAt: review?.reviewed_at ?? null,
        feedback: [review?.question_notes?.[question.id], review?.note].filter(Boolean).join('\n'),
      }
    })
  })
}
