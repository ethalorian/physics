import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkpointScore, checkpointStatus, releaseCheckpoint, scoreCheckpointResponse, submitCheckpoint } from './vocab-checkpoint'
import { CHECKPOINT_QUESTIONS as questions, createCheckpointPreview } from '../components/vocabulary/checkpoint/checkpoint-fixture'

test('unscored writing withholds the total and cannot be released', () => {
  const student = createCheckpointPreview().attempts[1]
  assert.equal(checkpointScore(questions, student).autoPoints, 10)
  assert.equal(checkpointScore(questions, student).percent, null)
  assert.throws(() => releaseCheckpoint(questions, student))
})
test('partial credit contributes to 20 points while Knowledge remains independent', () => {
  const student = createCheckpointPreview().attempts[1]
  const scored = scoreCheckpointResponse(questions, scoreCheckpointResponse(questions, student, 'q9', 3), 'q10', 2)
  assert.equal(checkpointScore(questions, scored).points, 15)
  assert.equal(checkpointScore(questions, scored).percent, 75)
  assert.equal(checkpointStatus(questions, scored), 'Ready to release')
  const released = releaseCheckpoint(questions, scored)
  assert.equal(released.knowledge, null)
  assert.equal(checkpointStatus(questions, released), 'Graded')
  assert.throws(() => scoreCheckpointResponse(questions, released, 'q9', 4))
})
test('zero is a real score; invalid scores are not accepted', () => {
  let student = createCheckpointPreview().attempts[1]
  student = scoreCheckpointResponse(questions, student, 'q9', 0)
  student = scoreCheckpointResponse(questions, student, 'q10', 0)
  assert.equal(checkpointScore(questions, student).percent, 50)
  assert.throws(() => scoreCheckpointResponse(questions, student, 'q9', 5))
  assert.throws(() => scoreCheckpointResponse(questions, student, 'q9', 1.5))
})
test('submission requires complete valid responses and is idempotent', () => {
  const student = createCheckpointPreview().attempts[4]
  assert.throws(() => submitCheckpoint(questions, student))
  const valid = { ...student, answers: { ...createCheckpointPreview().attempts[1].answers } }
  const submitted = submitCheckpoint(questions, valid)
  assert.equal(submitted.submitted, true)
  assert.equal(submitCheckpoint(questions, submitted), submitted)
  assert.throws(() => submitCheckpoint(questions, { ...valid, answers: { ...valid.answers, q1: '42' } }))
})
