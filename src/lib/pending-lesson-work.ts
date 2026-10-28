import { supabaseAdmin } from '@/lib/supabase'
import { evidenceContext } from '@/lib/mastery-evidence'
import { type MasteryReviewItem, reviewItemKey } from '@/lib/mastery-review-queue'
import { pendingSubmissionTargets, type LessonMasteryReview } from './lesson-submission-review'

type Lesson = { id: string; title?: string; content_blocks?: { blocks?: unknown[] } | null }
type Target = { id: string; slug: string; lesson_id: string | null }
type Saved = { user_id: string; lesson_id: string; block_id: string; block_type: string | null; target_id: string | null; created_at: string; draft?: string | null }
type Review = LessonMasteryReview
type Submission = { user_id: string; lesson_id: string }
const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {}

/** Exact reviewed versions clear only their own lesson and target, never another lesson's work. */
export function pendingSavedTargets(rows: Saved[], reviews: Review[], submissions: Submission[], lessons: Lesson[], targets: Target[], carriers: Map<string, string[]>, items?: MasteryReviewItem[]) {
  const submitted = new Set(submissions.map(s => `${s.user_id}|${s.lesson_id}`))
  const reviewed = new Set<string>()
  for (const review of reviews) for (const raw of Array.isArray(review.evidence) ? review.evidence : []) {
    const e = object(raw)
    reviewed.add(`${review.user_id}|${review.lesson_id}|${review.target_id}|${e.blockId}|${e.createdAt}`)
  }
  const blocks = new Map(lessons.map(l => [l.id, new Map((l.content_blocks?.blocks ?? []).map(raw => { const b = object(raw); return [String(b.id), b] }))]))
  const seen = new Set<string>(), pending: Record<string, Record<string, boolean>> = {}
  for (const row of [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    const key = `${row.user_id}|${row.lesson_id}|${row.block_id}`
    if (seen.has(key)) continue
    seen.add(key)
    // Existing submissions use their immutable snapshot and existing review workflow.
    if (submitted.has(`${row.user_id}|${row.lesson_id}`) || row.draft === 'true' || ['marzano', 'self_assessment'].includes(row.block_type ?? '')) continue
    const block = blocks.get(row.lesson_id)?.get(row.block_id)
    if (!block) continue
    const refs = [...evidenceContext(block).targets, ...(row.target_id ? [row.target_id] : [])]
    for (const target of targets) {
      if (!carriers.get(target.id)?.includes(row.lesson_id)) continue
      if (refs.length && !refs.includes(target.id) && !refs.includes(target.slug)) continue
      if (!reviewed.has(`${row.user_id}|${row.lesson_id}|${target.id}|${row.block_id}|${row.created_at}`)) {
        (pending[row.user_id] ??= {})[target.id] = true
        const item = { studentId: row.user_id, targetId: target.id, lessonId: row.lesson_id, lessonTitle: lessons.find(l => l.id === row.lesson_id)?.title }
        if (items && !items.some(existing => reviewItemKey(existing) === reviewItemKey(item))) items.push(item)
      }
    }
  }
  return pending
}

export async function getPendingSavedTargets(studentIds: string[], lessons: Lesson[], targets: Target[], carriers: Map<string, string[]>, submissions: Submission[]) {
  return (await getPendingMasteryWork(studentIds, lessons, targets, carriers, submissions)).pending
}

export async function getPendingMasteryWork(studentIds: string[], lessons: Lesson[], targets: Target[], carriers: Map<string, string[]>, submissions: Submission[], pendingSubmissions: (Submission & { id: string })[] = []) {
  const assessedSubmissionIds = new Set<string>()
  if (!studentIds.length || !lessons.length) return { pending: {}, reviewQueue: [] as MasteryReviewItem[], assessedSubmissionIds }
  const lessonIds = lessons.map(l => l.id), rows: Saved[] = [], reviews: Review[] = []
  // Read metadata only for answers; drawings and written responses are loaded when the desk opens.
  for (let from = 0; ; from += 500) {
    const { data, error } = await supabaseAdmin.from('block_responses')
      .select('id,user_id,lesson_id,block_id,block_type,target_id,created_at,draft:response->>draft')
      .in('user_id', studentIds).in('lesson_id', lessonIds).order('id').range(from, from + 499)
    if (error) throw error
    rows.push(...(data ?? []))
    if ((data ?? []).length < 500) break
  }
  if (!rows.length && !pendingSubmissions.length) return { pending: {}, reviewQueue: [] as MasteryReviewItem[], assessedSubmissionIds }
  for (let from = 0; ; from += 250) {
    const { data, error } = await supabaseAdmin.from('mastery_evidence_reviews')
      .select('id,user_id,lesson_id,target_id,evidence')
      .in('user_id', studentIds).in('lesson_id', lessonIds).order('id').range(from, from + 249)
    if (error) throw error
    reviews.push(...(data ?? []))
    if ((data ?? []).length < 250) break
  }
  const reviewQueue: MasteryReviewItem[] = []
  const pending = pendingSavedTargets(rows, reviews, submissions, lessons, targets, carriers, reviewQueue)
  for (const sub of pendingSubmissions) {
    if (!studentIds.includes(sub.user_id)) continue
    const targetIds = targets.filter(target => carriers.get(target.id)?.includes(sub.lesson_id)).map(target => target.id)
    const pendingTargets = pendingSubmissionTargets(sub, targetIds, reviews)
    // No targets is not evidence of a teacher return. Targetless work still needs acknowledgement.
    if (targetIds.length && !pendingTargets.length) assessedSubmissionIds.add(sub.id)
    for (const targetId of pendingTargets) {
      ;(pending[sub.user_id] ??= {})[targetId] = true
      reviewQueue.push({ studentId: sub.user_id, targetId, lessonId: sub.lesson_id, submissionId: sub.id, lessonTitle: lessons.find(l => l.id === sub.lesson_id)?.title })
    }
  }
  return { pending, reviewQueue, assessedSubmissionIds }
}
