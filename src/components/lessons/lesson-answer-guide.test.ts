import assert from 'node:assert/strict'
import test from 'node:test'
import { CAPTURE_BLOCK_TYPES, type ContentBlock } from '@/data/content-blocks'
import { answerAnchor, answerGuide, answerStatus } from './lesson-answer-guide'

const question: ContentBlock = { id: 'q', type: 'question', capture: true, question: { prompt: 'Choose and explain.', options: [{ id: 'a', text: 'A' }], explain: 'Why?' } }
const entry = (response: unknown, draft = false) => ({ q: { response, draft, created_at: '' } })
test('guide covers every capture type, including explicit sentence frames', () => {
  for (const type of [...CAPTURE_BLOCK_TYPES, 'sentence_frame']) {
    const block = { id: type, type, capture: true, targetIds: ['motion'] } as ContentBlock
    assert.notEqual(answerGuide(block).title, 'Your response', type)
    assert.ok(answerGuide(block).parts.length > 0, type)
  }
})
test('saved choice without required explanation stays unfinished', () => {
  assert.equal(answerStatus(question, {}), 'To answer')
  assert.equal(answerStatus(question, entry({ optionId: 'a' })), 'Finish your response')
  assert.equal(answerStatus(question, entry({ optionId: 'a', explain: 'Evidence supports A.' })), 'Saved')
  assert.equal(answerStatus(question, entry({ optionId: 'a', explain: 'Revised.' }, true)), 'Changes need saving')
})
test('saved incorrect work points to feedback instead of claiming completion', () => {
  assert.equal(answerStatus(question, entry({ optionId: 'a', explain: 'Because.', autoCheck: 'mismatch' })), 'Saved · check feedback')
})
test('navigation anchors preserve punctuation and lesson scope without collisions', () => {
  assert.notEqual(answerAnchor('lesson', 'a b'), answerAnchor('lesson', 'a-b'))
  assert.notEqual(answerAnchor('lesson1', 'q'), answerAnchor('lesson2', 'q'))
})

test('projector continuations and response numbers follow the student lesson pages', async () => {
  const { lessonLocation } = await import('./LessonVisualIdentity')
  const { projectedBlockPages } = await import('@/lib/projected-block')
  const reading: ContentBlock = { id: 'reading', type: 'prose', markdown: `${'First paragraph. '.repeat(55)}\n\n${'Second paragraph. '.repeat(55)}` }
  const explanation: ContentBlock = { id: 'explain', type: 'exit_ticket', capture: true, prompt: 'Explain.' }
  const blocks = [question, reading, explanation]
  assert.deepEqual(lessonLocation('q', blocks), { step: 1, totalSteps: 2, response: 1 })
  for (const continuation of projectedBlockPages(reading)) {
    assert.deepEqual(lessonLocation(continuation.id, blocks), { step: 2, totalSteps: 2, response: null })
  }
  assert.deepEqual(lessonLocation('explain', blocks), { step: 2, totalSteps: 2, response: 2 })
  assert.equal(lessonLocation('unavailable', blocks), null)
})
