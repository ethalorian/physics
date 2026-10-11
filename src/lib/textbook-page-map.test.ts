import test from 'node:test'
import assert from 'node:assert/strict'
import source from '../data/textbook-page-map.json'
import { TEXTBOOK_CHAPTERS } from '../data/textbook'
import { TEXTBOOK_SECTIONS } from '../data/textbook-sections'
import { TEXTBOOK_TARGET_MAP } from './textbook-target-mapping'

const pages = source as Record<string, { offset: number; pages: number; questions: Record<string, number> }>
test('every selectable textbook question and section has a page inside its chapter PDF', () => {
  for (const chapter of TEXTBOOK_CHAPTERS) {
    const map = pages[chapter.n]
    assert.ok(map, `chapter ${chapter.n}`)
    const numbers = Object.values(TEXTBOOK_TARGET_MAP.chapters[chapter.n].sets).flat().sort((a, b) => a - b)
    assert.deepEqual(Object.keys(map.questions).map(Number).sort((a, b) => a - b), numbers)
    for (const page of Object.values(map.questions)) assert.ok(Number.isInteger(page) && page >= 1 && page <= map.pages)
    for (const section of TEXTBOOK_SECTIONS[chapter.n].sections) assert.ok(section.page - map.offset >= 1 && section.page - map.offset <= map.pages, section.id)
  }
})
test('printed pages and question jumps use the student PDF page numbering', () => {
  assert.equal(50 - pages[4].offset, 5) // Velocity, printed p. 50
  assert.equal(pages[4].questions[5] + pages[4].offset, 62)
  assert.equal(pages[4].questions[44] + pages[4].offset, 66)
  assert.equal(pages[31].questions[1] + pages[31].offset, 638)
  assert.equal(pages[20].questions[16], 17) // Spaced “1 6.”, printed p. 398
  assert.equal(pages[40].questions[8], 19) // “8 .” in source PDF
})
