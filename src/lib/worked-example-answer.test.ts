import assert from 'node:assert/strict'
import test from 'node:test'
import { randomUUID } from 'node:crypto'
import { BINDER_READINGS } from '@/data/binder-reading-syllabus'
import { validateReadingAnswers } from './textbook-assignments'
import { isWorkedExample, joinWorkedAnswer, splitWorkedAnswer } from './worked-example-answer'

test('the worked-example field is scoped to Section D in all 44 binder readings', () => {
  assert.equal(BINDER_READINGS.length, 44)
  for (const lesson of BINDER_READINGS) {
    assert(isWorkedExample(lesson.honors.reference!))
    assert(!isWorkedExample(lesson.readingCheck.reference!))
  }
})
test('existing answers, ordered equation steps and explanations round-trip through reading validation', () => {
  const question = { id: randomUUID(), reference: 'Section D · Worked example', prompt: 'Show your work.', target_id: randomUUID() }
  const explanation = 'Velocity is negative.\n\nIts magnitude increases.'
  const equations = ['a=\\frac{\\Delta v}{\\Delta t}', 'a=-2\\,\\mathrm{m/s^2}']
  for (const text of ['', explanation, '  preserve spaces  ', '<b>literal text</b>', '$$\nunfinished']) {
    assert.deepEqual(splitWorkedAnswer(text), { equations: [], explanation: text })
  }
  for (const text of ['', explanation]) {
    const value = joinWorkedAnswer(['', ...equations, '  '], text)
    const saved = validateReadingAnswers({ [question.id]: value }, [question], true)
    assert.deepEqual(splitWorkedAnswer(saved[question.id]), { equations, explanation: text })
  }
  assert.equal(joinWorkedAnswer(['', ' '], ''), '')
  assert.throws(() => validateReadingAnswers({ [question.id]: '' }, [question], true))
})
