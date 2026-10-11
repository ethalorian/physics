import test from 'node:test'
import assert from 'node:assert/strict'
import { readingBookUrl, readingQuestionPage, readingSectionPage, readingStartPage } from './reading-book-pages'

test('the assigned MVP section and numbered questions open their distinct printed pages', () => {
  const section = readingStartPage({ chapter: 5, section_ids: ['5.1'] })
  assert.deepEqual(section, { pdfPage: 2, printedPage: 69 })
  for (const n of [1, 2]) {
    const question = readingQuestionPage(5, { reference: `Check Concepts #${n}` })
    assert.deepEqual(question, { pdfPage: 14, printedPage: 81 })
    assert.equal(readingBookUrl(5, question), '/api/textbook/5#page=14')
  }
  assert.equal(readingBookUrl(5, section), '/api/textbook/5#page=2')
})

test('section checks and selections use chapter boundaries, not selection order', () => {
  assert.deepEqual(readingQuestionPage(5, { reference: 'Section 5.1 · Concept Check' }), readingSectionPage(5, '5.1'))
  assert.deepEqual(readingStartPage({ chapter: 5, section_ids: ['5.2', '5.1'] }), readingSectionPage(5, '5.1'))
  assert.equal(readingSectionPage(5, '4.1'), null)
  assert.deepEqual(readingStartPage({ chapter: 5, section_ids: [] }), { pdfPage: 1, printedPage: 68 })
})

test('custom questions and invalid question sets do not jump to unrelated book problems', () => {
  for (const reference of ['1 · Explain the distinction', 'Think and Solve #1', 'Check Concepts #999', 'Section 4.1 · Concept Check']) {
    assert.equal(readingQuestionPage(5, { reference }), null, reference)
  }
  assert.equal(readingBookUrl(5, null), '/api/textbook/5')
})
