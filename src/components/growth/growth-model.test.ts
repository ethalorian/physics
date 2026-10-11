import assert from 'node:assert/strict'
import test from 'node:test'
import { growthSnapshot, growthNextStep } from './growth-model'
import type { LearningTarget, MasteryRecord } from '@/data/curriculum-types'
const targets: LearningTarget[] = [
  { id: 'a', statement: 'Motion', unitId: 'unit-1', domain: 'knowledge' },
  { id: 'b', statement: 'Forces', unitId: 'unit-1', domain: 'reasoning' },
  { id: 'c', statement: 'Reflection', unitId: 'unit-1', domain: 'product', excludeFromGrowth: true },
]
const record = (targetId: string, level: 1|2|3, day: number): MasteryRecord => ({ targetId, level, studentId: 'student', observedAt: `2026-09-${String(day).padStart(2, '0')}T12:00:00Z` })
test('unrated targets are not zero; excluded and unrelated evidence never count', () => {
  const s = growthSnapshot(targets, [record('c',3,1), record('other',3,1)])
  assert.equal(s.items.length, 2); assert.equal(s.reviewed, 0); assert.equal(s.observations, 0)
  assert.equal(s.items[0].value, null); assert.match(growthNextStep(s.items[0]), /first teacher rating/)
})
test('repeated evidence uses the actual mastery rollup in chronological order', () => {
  const s = growthSnapshot(targets, [record('a',3,3), record('a',1,1), record('a',2,2)])
  assert.equal(s.items[0].value, 2.44); assert.equal(s.secure, 0); assert.equal(s.improving, 1)
  assert.equal(s.observations, 3); assert.equal(s.reviewed, 1)
})
test('one high observation is initial evidence, not a claimed improvement', () => {
  const s = growthSnapshot(targets, [record('a',3,1)])
  assert.equal(s.secure, 1); assert.equal(s.improving, 0)
  assert.match(growthNextStep(s.items[0]), /first piece/)
})
test('a lower latest rating does not receive an improvement celebration', () => {
  const s = growthSnapshot(targets, [record('a',3,1), record('a',1,2), record('b',2,3)])
  assert.equal(s.improving, 0); assert.equal(s.items[0].trend, 'down'); assert.equal(s.recent[0].target.id, 'b')
})
