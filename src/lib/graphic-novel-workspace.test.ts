import test from 'node:test'
import assert from 'node:assert/strict'
import { createGraphicNovelAssignment, editNovelResponse, graphicNovelWorkspace, novelDrawingResponse, novelResponseText, NOVEL_BOOK } from './graphic-novel-assignments'
import { lessonReadiness } from './curriculum-readiness'
import { lessonTargetReferences } from './lesson-target-references'
import { isBlockComplete } from '@/data/content-blocks'

test('all chapters map to the shared workspace without replacing response or mastery identities', () => {
  for (const chapter of NOVEL_BOOK.chapters) {
    const document = createGraphicNovelAssignment(chapter.day)
    document.blocks = document.blocks.map(b => b.type === 'exit_ticket' ? { ...b, targetId: 'motion' } : b)
    const original = structuredClone(document)
    const workspace = graphicNovelWorkspace(document, 'Chapter response', 'existing-lesson-id')
    assert.equal(workspace.slug, 'existing-lesson-id')
    assert.deepEqual(workspace.questions.map(q => q.id), document.blocks.filter(b => b.type === 'exit_ticket').map(b => b.id))
    assert.deepEqual(workspace.targets, lessonTargetReferences(document))
    assert(workspace.questions.every(q => q.independent && q.demand && q.targets?.includes('motion')))
    assert(workspace.toolHref.endsWith('?page=' + chapter.start))
    assert.deepEqual(document, original)
    assert.deepEqual(lessonReadiness(document, [{ id: 'motion', slug: 'motion', statement: 'Explain motion', unit_id: 'unit-1' }], []).filter(i => i.severity === 'error'), [])
  }
})

test('existing strings, text, and drawings remain readable and count toward existing submission checks', () => {
  const q = createGraphicNovelAssignment().blocks[1]
  assert.equal(novelResponseText('Existing answer'), 'Existing answer')
  assert.equal(novelResponseText({ text: 'Saved answer', mode: 'text' }), 'Saved answer')
  assert.deepEqual(novelDrawingResponse(undefined), { text: '', strokes: [], mode: 'text' })
  const strokes = [{ color: '#000000', points: [{ x: 1, y: 2 }, { x: 3, y: 4 }] }]
  const prior = { text: 'A claim needs evidence.', strokes, mode: 'sketch', language: 'en' }
  assert.equal(novelDrawingResponse(prior).mode, 'drawing')
  const edited = editNovelResponse(prior, 'The chapter gives evidence for this claim.')
  assert.deepEqual(edited.strokes, strokes)
  assert.equal(edited.language, 'en')
  assert.equal(prior.text, 'A claim needs evidence.')
  assert(isBlockComplete(q, edited))
  assert(!isBlockComplete(q, editNovelResponse(undefined, '')))
})
