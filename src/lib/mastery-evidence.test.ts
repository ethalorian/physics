import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evidenceContext, evidenceResponseText, parseMasterySuggestion } from './mastery-evidence'

test('option choices keep their original meaning without exposing answer keys', () => {
  const context = evidenceContext({ targetId: 'motion', question: { prompt: 'Which direction?', correctOptionId: 'a', options: [{ id: 'a', text: 'Forward', feedback: 'Correct!' }] } })
  assert.deepEqual(context, { targets: ['motion'], prompt: 'Which direction?\na: Forward' })
})
test('missing evidence stays unrated and malformed AI output never becomes Almost', () => {
  assert.equal(parseMasterySuggestion('{"level":null,"rationale":"Drawing requires teacher review."}').level, null)
  for (const value of ['{}', '{"level":4,"rationale":"test"}', '{"level":"3","rationale":"test"}', 'not JSON']) assert.throws(() => parseMasterySuggestion(value))
})
test('multimodal work keeps every written field and flags unseen drawings', () => {
  const text = evidenceResponseText({ text: 'Constant speed', explain: 'Equal spacing', strokes: [{ points: [{ x: 1, y: 2 }] }], labels: ['velocity'] })
  assert.match(text, /Constant speed/); assert.match(text, /Equal spacing/); assert.match(text, /velocity/); assert.match(text, /teacher must inspect/); assert.doesNotMatch(text, /points/)
})
