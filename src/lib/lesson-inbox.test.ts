import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { summarizeLessonInbox, newSubmissionIds } from './lesson-inbox';

test('all lessons stay visible and pending work sorts ahead of empty lessons', () => {
  const result = summarizeLessonInbox([{ id: 'empty', title: 'Next lesson' }, { id: 'motion', title: 'Position' }],
    [{ lesson_id: 'motion', lessonTitle: 'Position' }], [], [{ studentId: 's1', lessonId: 'motion', targetId: 't1', submissionId: 'sub1' }]);
  assert.deepEqual(result.map(x => x.id), ['motion', 'empty']);
  assert.equal(result[0].submissions, 1); assert.equal(result[0].targets, 1);
  assert.equal(result[1].submissions, 0);
});
test('old saved work and stale historical entries cannot recreate lesson choices', () => {
  const result = summarizeLessonInbox([{ id: 'current', title: 'Video lesson' }, { id: 'old', title: 'Earlier lesson', historical: true }],
    [{ lesson_id: 'old', lessonTitle: 'Earlier lesson' }], [{ lesson_id: 'saved', lessonTitle: 'Earlier evidence' }, { lesson_id: null, lessonTitle: 'Unlinked work' }],
    [{ studentId: 's1', targetId: 't1', lessonId: 'old' }]);
  assert.deepEqual(result.map(x => x.id), ['current']);
  assert.equal(result[0].submissions, 0); assert.equal(result[0].targets, 0);
});
test('submission totals and target reviews are separate counts', () => {
  const result = summarizeLessonInbox([{ id: 'lesson', title: 'Motion' }], [{ lesson_id: 'lesson', lessonTitle: 'Motion' }], [], ['t1', 't2'].map(targetId => ({ studentId: 's1', lessonId: 'lesson', targetId, submissionId: 'sub1' })));
  assert.equal(result[0].submissions, 1); assert.equal(result[0].targets, 2);
});
test('initial load is not an arrival alert; refresh only alerts on new submission IDs', () => {
  assert.deepEqual(newSubmissionIds(null, [{ id: 'old' }]), []);
  assert.deepEqual(newSubmissionIds(new Set(['old']), [{ id: 'old' }, { id: 'new' }]), ['new']);
  assert.deepEqual(newSubmissionIds(new Set(['old', 'new']), [{ id: 'new' }]), []);
});
