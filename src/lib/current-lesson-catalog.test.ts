import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { isCurrentLesson } from './current-lesson-catalog';

test('current physics lessons use the authored learning path rather than lesson numbers or titles', () => {
  assert.equal(isCurrentLesson({ unit_id: 'unit-1', content_blocks: { blocks: [] } }), false);
  assert.equal(isCurrentLesson({ unit_id: 'unit-1', content_blocks: { presentation: 'physics-path', learningPath: { kind: 'lesson' } } }), true);
  assert.equal(isCurrentLesson({ unit_id: 'unit-1', presentation: 'physics-path', learning_path: { kind: 'lesson' } }), true);
  assert.equal(isCurrentLesson({ program: 'physics', unit_id: 'custom-unit', presentation: 'physics-path' }), false);
});
test('current Trades lessons remain available and retired programs stay absent', () => {
  assert.equal(isCurrentLesson({ program: 'trades', unit_id: 'trades-etf-1' }), true);
  assert.equal(isCurrentLesson({ unit_id: 'trades-reset-1' }), false);
  assert.equal(isCurrentLesson({ unit_id: 'proj-1' }), false);
  assert.equal(isCurrentLesson({ program: 'projects', unit_id: 'custom' }), false);
});
