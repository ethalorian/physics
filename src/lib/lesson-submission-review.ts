export type LessonMasteryReview = {
  user_id: string
  lesson_id: string
  target_id: string
  evidence: unknown
}

/** Saved mastery reviews have already released the teacher's rating and feedback.
 * Only evidence from this exact student's lesson submission can satisfy a target. */
export function pendingSubmissionTargets(
  submission: { id: string; user_id: string; lesson_id: string },
  targetIds: string[],
  reviews: LessonMasteryReview[],
): string[] {
  const rated = new Set(reviews.filter(review =>
    review.user_id === submission.user_id && review.lesson_id === submission.lesson_id &&
    Array.isArray(review.evidence) && review.evidence.some(e =>
      e && typeof e === 'object' && e.submissionId === submission.id,
    ),
  ).map(review => review.target_id))
  return [...new Set(targetIds)].filter(id => !rated.has(id))
}
