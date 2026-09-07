import { supabaseAdmin } from '@/lib/supabase'

export interface LessonSubmission { id: string; user_id: string; lesson_id: string; submitted_at: string; content_snapshot?: unknown; response_snapshot?: unknown }

/** A review belongs to one concrete submission; a rating of a shared target cannot clear another lesson. */
export function pendingLessonSubmissions(submissions: LessonSubmission[], reviewedIds: Set<string>): LessonSubmission[] {
  const latest = new Map<string, LessonSubmission>()
  for (const row of submissions) {
    const key = `${row.user_id}:${row.lesson_id}`
    if (!latest.has(key) || row.submitted_at > latest.get(key)!.submitted_at) latest.set(key, row)
  }
  return [...latest.values()].filter((s) => !reviewedIds.has(s.id))
}

export async function submissionStatus(userId: string, lessonId: string) {
  const { data, error } = await supabaseAdmin.from('lesson_submissions').select('id, submitted_at').eq('user_id', userId).eq('lesson_id', lessonId).order('submitted_at', { ascending: false }).limit(1)
  if (error) throw error
  const submission = data?.[0] as { id: string; submitted_at: string } | undefined
  if (!submission) return { submissionId: null, submittedAt: null, locked: false }
  const { data: review, error: reviewError } = await supabaseAdmin.from('lesson_reviews').select('submission_id').eq('submission_id', submission.id).maybeSingle()
  if (reviewError) throw reviewError
  return { submissionId: submission.id, submittedAt: submission.submitted_at, locked: !review }
}
