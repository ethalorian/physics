import test from 'node:test'
import assert from 'node:assert/strict'
import { questionNumbers, validateReading, validateReadingAnswers, readingOverdue, type ReadingAssignment } from './textbook-assignments'

const id = '00000000-0000-4000-8000-000000000001'
const q = { id, reference: 'Check Concepts #1', prompt: '', target_id: id }
const draft = { id, course_id: id, title: 'Motion', chapter: 4, reading: 'Sections 4.2–4.3', section_ids: ['4.2', '4.3'], instructions: '', questions: [q], due_at: null, status: 'draft', version: 0 }
test('bulk numbers expand, deduplicate, and reject malformed or excessive ranges', () => {
  assert.deepEqual(questionNumbers('1–3, 3, 8 12-13'), [1, 2, 3, 8, 12, 13])
  for (const bad of ['0', '5-2', '1-50', 'abc', '3.5']) assert.throws(() => questionNumbers(bad))
})
test('assignment validation requires real chapters, matching sections, and a mastery target per question', () => {
  assert.equal(validateReading(draft).questions.length, 1)
  for (const patch of [{ chapter: 1 }, { section_ids: ['8.1'] }, { questions: [q, q] }, { questions: [{ ...q, target_id: '' }] }, { questions: [{ ...q, reference: '', prompt: '' }] }, { due_at: 'bad' }, { questions: [] }]) assert.throws(() => validateReading({ ...draft, ...patch }))
})
test('drafts allow incomplete answers; submission requires every answer and rejects foreign question IDs', () => {
  assert.deepEqual(validateReadingAnswers({}, [q], false), {})
  assert.throws(() => validateReadingAnswers({}, [q], true))
  assert.throws(() => validateReadingAnswers({ other: 'Answer' }, [q], false))
  assert.throws(() => validateReadingAnswers({ [id]: ' '.repeat(10001) }, [q], false))
  assert.throws(() => validateReadingAnswers({ [id]: { answer: 3 } }, [q], false))
  assert.equal(validateReadingAnswers({ [id]: 'Speed is distance divided by time.' }, [q], true)[id], 'Speed is distance divided by time.')
})
test('overdue indicates missing work, not work waiting for a teacher', () => {
  const a = { ...draft, status: 'published', due_at: '2026-01-01T00:00:00Z' } as ReadingAssignment
  assert.equal(readingOverdue(a, null, Date.parse('2026-01-02')), true)
  assert.equal(readingOverdue({ ...a, status: 'archived' }, null), false)
})
