import test from 'node:test'
import assert from 'node:assert/strict'
import { COMPETENCIES, missionForCode } from './math-missions/catalog'
import { isMathSkill, mathRemediation } from './math-remediation'

test('every wrong-answer recommendation leads to guided play and a fresh check on the same skill', () => {
  for (const code of Object.keys(COMPETENCIES)) {
    const recommendation = mathRemediation(code, 'mismatch')!
    const url = new URL(recommendation.href, 'https://fixture.invalid')
    assert.equal(url.pathname, '/arcade/missions/' + missionForCode(code)!.slug)
    assert.equal(url.searchParams.get('skill'), code)
    assert.equal(url.searchParams.get('mode'), 'practice')
    assert.equal(url.searchParams.get('from'), 'math-feedback')
    const back = new URL(url.searchParams.get('returnTo')!, url.origin)
    assert.equal(back.pathname, '/dashboard/math-spine/warmup')
    assert.equal(back.searchParams.get('practice_skill'), code)
    assert.equal(back.hash, '#practice')
  }
})

test('correct, unparsed, unassessed and teacher-only answers do not infer a deficit', () => {
  for (const result of ['match', 'unknown', undefined, null]) assert.equal(mathRemediation('SM1', result), null)
  for (const code of ['UNKNOWN', '__proto__', 'constructor', '<script>', 'NS1?mode=challenge']) {
    assert.equal(isMathSkill(code), false)
    assert.equal(mathRemediation(code, 'mismatch'), null)
  }
})

test('teacher review supersedes automatic answer matching', () => {
  assert.equal(mathRemediation('SM1', 'mismatch', 3), null)
  assert.equal(mathRemediation('SM1', 'mismatch', 2), null)
  assert.equal(mathRemediation('SM1', 'match', 1)?.reason, 'teacher')
})
