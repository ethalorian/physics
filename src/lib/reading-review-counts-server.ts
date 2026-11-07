import 'server-only'
import { supabaseAdmin } from './supabase'
import { readingRows } from './textbook-assignments-server'
import { readingExemptions } from './reading-exemptions-server'
import type { ReadingAssignment } from './textbook-assignments'

/** Same submitted/active/enrolled/not-excused rule as the full reading list.
 * Read-only and request-local; never retain counts across accounts or saves. */
export async function readingReviewCounts(assignments: Pick<ReadingAssignment, 'id' | 'course_id' | 'status'>[], courseIds: string[], exemptions?: { assignment_id: string; user_id: string }[]) {
  const published = assignments.filter(assignment => assignment.status === 'published')
  const counts: Record<string, number> = {}
  if (!published.length) return counts
  const ids = published.map(assignment => assignment.id)
  const [roster, pending, excusedRows] = await Promise.all([
    readingRows<{ course_id: string; student_id: string }>((a, b) => supabaseAdmin.from('course_students').select('course_id,student_id').in('course_id', courseIds).eq('enrollment_state', 'ACTIVE').order('id').range(a, b)),
    readingRows<{ assignment_id: string; user_id: string }>((a, b) => supabaseAdmin.from('textbook_work').select('assignment_id,user_id').in('assignment_id', ids).eq('state', 'submitted').order('assignment_id').order('user_id').range(a, b)),
    exemptions ?? readingExemptions(ids),
  ])
  const enrolled = new Set(roster.map(row => `${row.course_id}:${row.student_id}`))
  const excused = new Set(excusedRows.map(row => `${row.assignment_id}:${row.user_id}`))
  const byId = new Map(assignments.map(assignment => [assignment.id, assignment]))
  for (const work of pending) {
    if (!excused.has(`${work.assignment_id}:${work.user_id}`) && enrolled.has(`${byId.get(work.assignment_id)?.course_id}:${work.user_id}`)) counts[work.assignment_id] = (counts[work.assignment_id] ?? 0) + 1
  }
  return counts
}
