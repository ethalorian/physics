import test from 'node:test'
import assert from 'node:assert/strict'
import { isInteractiveReading, isInteractiveSyllabusStep } from './reading-availability'
import { readingLibrary } from './reading-library-server'
import { READING_SYLLABUS } from '@/data/reading-syllabus'
import { TEXTBOOK_SYLLABUS } from '@/data/textbook-syllabus'

const reading = { chapter: 4, section_ids: ['4.4'], passage: null, honors_reading: null }
test('only registered interactive sources can be assigned', () => {
  assert(isInteractiveReading(reading))
  assert(!isInteractiveReading({ ...reading, passage: 'Plain reading text.' }))
  assert(!isInteractiveReading({ ...reading, chapter: 99 }))
  assert(!isInteractiveReading({ ...reading, section_ids: ['4.999'] }))
  assert(isInteractiveReading({ ...reading, honors_reading: { sections: ['1.2'], from: 20, to: 21, focus: 'Measurement' } }))
  assert(!isInteractiveReading({ ...reading, honors_reading: { sections: ['1.2', '2.1'], from: 20, to: 40, focus: 'Mixed chapters' } }))
})
test('course notes are excluded for CPA while their registered Honors source remains available', () => {
  const quantities = READING_SYLLABUS.find(s => s.id === 'quantities')!
  assert(!isInteractiveSyllabusStep(quantities, 'cpa'))
  assert(isInteractiveSyllabusStep(quantities, 'honors'))
})
test('both planning libraries offer only the interactive reader, including every registered textbook template for the track', () => {
  for (const track of ['cpa', 'honors']) {
    const library = readingLibrary(track, [])
    assert(library.length > 100)
    assert(library.every(s => s.format === 'interactive-reading'))
    for (const template of TEXTBOOK_SYLLABUS.filter(s => isInteractiveSyllabusStep(s, track))) assert(library.some(s => s.id === template.id), template.id)
    assert(library.some(s => s.id === 'textbook-hewitt-4-4'))
  }
  assert(!readingLibrary('cpa', []).some(s => s.id === 'quantities' || s.book === 'OpenStax'))
})

test('reading templates label the actual CPA or OpenStax source in every track', () => {
  assert(readingLibrary('cpa', []).every(s => s.readingTag === 'CPA'))
  const honors = readingLibrary('honors', [])
  assert.equal(honors.find(s => s.id === 'quantities')?.readingTag, 'OpenStax')
  assert.equal(honors.find(s => s.id === 'textbook-hewitt-4-4')?.readingTag, 'CPA')
  assert(honors.filter(s => s.id.startsWith('textbook-openstax-')).every(s => s.readingTag === 'OpenStax'))
  assert(honors.some(s => s.readingTag === 'OpenStax'))
})
