import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { filterReviewQueue, orderReviewQueue, reviewItemKey, type MasteryReviewItem } from './mastery-review-queue';
const item = (studentId: string, targetId: string, lessonId = 'lesson-a', submissionId = 'submission-a'): MasteryReviewItem => ({ studentId, targetId, lessonId, submissionId });

test('finish every target and lesson for the active student before switching students', () => {
  const current = item('s1', 'motion');
  const rest = [item('s2', 'motion'), item('s1', 'graph'), item('s3', 'graph'), item('s1', 'motion', 'lesson-b'), item('s2', 'graph')];
  const ordered = orderReviewQueue([current, ...rest], current);
  assert.deepEqual(ordered.map(x => x.studentId), ['s1', 's1', 's1', 's2', 's2', 's3']);
  assert.equal(ordered[2].lessonId, 'lesson-b');
  assert.deepEqual(rest.map(x => x.studentId), ['s2', 's1', 's3', 's1', 's2'], 'source queue is not mutated');
});

test('a saved review advances through the same student even after it leaves the pending queue', () => {
  const current = item('s1', 'motion');
  assert.equal(orderReviewQueue([item('s2', 'motion'), item('s1', 'graph')], current)[0].studentId, 's1');
});

test('filtering preserves the exact student, target, lesson, and submission scope', () => {
  const current = item('s1', 'motion');
  const revision = item('s1', 'motion', 'lesson-a', 'submission-b');
  const queue = [current, revision, item('s2', 'motion'), item('s1', 'graph'), item('s1', 'motion', 'lesson-b')];
  assert.deepEqual(filterReviewQueue(queue, { studentIds: ['s1'], targetIds: ['motion'], lessonId: 'lesson-a', excluded: new Set([reviewItemKey(current)]) }), [revision]);
});
