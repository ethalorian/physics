import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assignmentDeadline, assignmentDueLabel, assignmentInView, prioritizeAssignments, type StudentAssignment } from './student-dashboard'
const now = new Date('2026-10-07T12:00:00').getTime()
const work = (id: string, due: string | null, extra: Partial<StudentAssignment> = {}): StudentAssignment => ({ id, due, kind: 'video', title: id, href: '/lessons/' + id, status: 'To do', action: 'Open', complete: false, ...extra })
test('pending deadline views exclude submitted work and include undated tasks only in to do', () => {
  const past = work('past', '2026-10-06T12:00:00'), future = work('future', '2026-10-09T12:00:00'), undated = work('undated', null), submitted = work('done', past.due, { complete: true })
  assert(assignmentInView(past, 'overdue', now))
  assert(!assignmentInView(submitted, 'overdue', now))
  assert(assignmentInView(submitted, 'submitted', now))
  assert(!assignmentInView(submitted, 'todo', now))
  assert(assignmentInView(future, 'upcoming', now))
  assert(!assignmentInView(past, 'upcoming', now))
  assert(assignmentInView(undated, 'todo', now))
  assert(!assignmentInView(undated, 'upcoming', now))
})
test('date-only vocabulary deadlines stay available through the local due day', () => {
  const task = work('vocab', '2026-10-07')
  assert.equal(new Date(assignmentDeadline(task.due)).getHours(), 23)
  assert(!assignmentInView(task, 'overdue', now))
  assert(assignmentInView(task, 'upcoming', now))
  assert(assignmentInView(task, 'overdue', new Date('2026-10-08T00:00:00').getTime()))
})
test('past due first, revisions next, then due dates; equal deadlines preserve course sequence', () => {
  const items = [work('video1', null), work('future', '2026-10-10T12:00:00'), work('video2', null), work('revise', null, { returned: true }), work('past', '2026-10-06T12:00:00')]
  assert.deepEqual(prioritizeAssignments(items, now).map(i => i.id), ['past', 'revise', 'future', 'video1', 'video2'])
  assert.equal(items[0].id, 'video1', 'sorting does not mutate source data')
})
test('invalid deadlines never appear past due or upcoming and show an honest label', () => {
  const task = work('invalid', 'not-a-date')
  assert(!assignmentInView(task, 'overdue', now))
  assert(!assignmentInView(task, 'upcoming', now))
  assert.equal(assignmentDueLabel(task.due), 'No due date set')
})
