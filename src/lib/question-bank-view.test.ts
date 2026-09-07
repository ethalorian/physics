import assert from 'node:assert/strict'
import test from 'node:test'
import { filterQuestionBank, importQuestionBankItems } from './question-bank-view'
import type { QuestionBankItem } from '@/types/question-bank'

const bank: QuestionBankItem[] = [
  { id: '1', question: { id: 'q1', type: 'multiple-choice', options: ['A', 'B'], correctAnswer: 0, question: 'Explain momentum', points: 1 }, unit: 'u1', lesson: 'l1', topics: ['motion'], tags: ['vectors'], difficulty: 'easy', usage_count: 0, created_at: '', updated_at: '', cognitive_level: 'apply' },
  { id: '2', question: { id: 'q2', type: 'multiple-choice', options: ['A', 'B'], correctAnswer: 0, question: 'Explain heat', points: 1 }, unit: 'u2', lesson: 'l2', topics: ['energy'], difficulty: 'hard', usage_count: 2, created_at: '', updated_at: '' },
]

test('filters combine, support multiple selections and leave the source bank intact', () => {
  assert.deepEqual(filterQuestionBank(bank, { units: ['u1', 'u2'], difficulty: ['hard'] }).map(q => q.id), ['2'])
  assert.deepEqual(filterQuestionBank(bank, { lessons: ['l1'], cognitive_levels: ['apply'], tags: ['vectors'], topics: ['motion'], questionTypes: ['multiple-choice'] }), [bank[0]])
  assert.deepEqual(filterQuestionBank(bank, { units: ['u2'], tags: ['vectors'] }), [])
  assert.deepEqual(filterQuestionBank(bank, {}), bank)
  assert.equal(bank.length, 2)
})

test('search is case-insensitive across question text, topics, and optional tags', () => {
  for (const searchText of [' MOMENTUM ', 'Motion', 'VECTORS']) {
    assert.deepEqual(filterQuestionBank(bank, { searchText }), [bank[0]])
  }
  assert.deepEqual(filterQuestionBank(bank, { searchText: 'missing' }), [])
  assert.deepEqual(filterQuestionBank(bank, { searchText: '  ' }), bank)
})

test('imports perform N writes and one refresh', async () => {
  const events: string[] = []
  await importQuestionBankItems([1, 2, 3], async item => { events.push(`save ${item}`) }, async () => { events.push('refresh') })
  assert.deepEqual(events, ['save 1', 'save 2', 'save 3', 'refresh'])
})

test('partial imports refresh successful writes, propagate failure, and stop writing', async () => {
  const saved: number[] = []
  let refreshes = 0
  await assert.rejects(importQuestionBankItems([1, 2, 3], async item => {
    if (item === 2) throw new Error('save failed')
    saved.push(item)
  }, async () => { refreshes++ }), /save failed/)
  assert.deepEqual(saved, [1])
  assert.equal(refreshes, 1)
})

test('empty imports do no network work', async () => {
  await importQuestionBankItems([], async () => { assert.fail('save called') }, async () => { assert.fail('refresh called') })
})
