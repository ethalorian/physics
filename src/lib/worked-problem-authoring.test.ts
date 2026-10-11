import test from 'node:test'
import assert from 'node:assert/strict'
import { addWorkedProblem01, tripSolution, WORKED_PROBLEM_01, WORKED_PROBLEM_PRACTICE, WORKED_PROBLEM_LESSONS } from './worked-problem-authoring'
import { validateBlockDocument } from '@/data/block-registry'
import { isRequiredCaptureBlock, isBlockComplete, type BlockDocument } from '@/data/content-blocks'
import { filterDocumentForViewer } from './track-visibility'
import { checkedLessonResponse } from './lesson-response-validation'
import { lessonCompletion } from './lesson-completion'
import { buildLessonConceptMap } from './lesson-concept-map-server'
import payload from '../../scripts/physics-learning/worked-problem-01-lessons.json'

test('video and practice answers agree with independently calculated paths', () => {
  assert.deepEqual(tripSolution(WORKED_PROBLEM_01.positions), { changes: [6, -11], lengths: [6, 11], distance: 17, displacement: -5 })
  const expected = [[15, -3], [14, 0], [14, -8], [7, 1], [11, -1]]
  Object.values(WORKED_PROBLEM_PRACTICE).flat().forEach((problem, i) => {
    const result = tripSolution(problem.positions)
    assert.deepEqual([result.distance, result.displacement], expected[i])
    assert.ok(result.distance >= Math.abs(result.displacement))
  })
})

test('both published lesson updates preserve every existing block and add valid, targeted practice', () => {
  for (const item of payload) {
    const config = WORKED_PROBLEM_LESSONS.find(c => c.id === item.id)!
    const before = item.before as BlockDocument, doc = item.document as BlockDocument
    assert.deepEqual(addWorkedProblem01(before, config.kind), doc)
    assert.deepEqual(doc.blocks.filter(b => !b.id.startsWith('wp01-')), before.blocks)
    assert.deepEqual(validateBlockDocument(doc, true), [])
    assert.deepEqual(addWorkedProblem01(doc, config.kind), doc)
    const practice = doc.blocks.filter(b => b.id.startsWith('wp01-') && b.type === 'gewa')
    assert.equal(practice.length, config.kind === 'position' ? 3 : 2)
    for (const block of practice) {
      assert.equal(block.targetId, WORKED_PROBLEM_01.targetId)
      assert.ok(isRequiredCaptureBlock(block))
      assert.ok(block.note?.includes('Teacher solution'))
      assert.ok(block.referenceBlockIds?.every(id => doc.blocks.some(b => b.id === id)))
    }
  }
})

test('students get examples and hints but never private practice solutions', () => {
  for (const item of payload) {
    const safe = filterDocumentForViewer(item.document as BlockDocument, { role: 'student', track: 'cpa' })
    assert.ok(safe.blocks.some(b => b.id.startsWith('wp01-') && b.type === 'worked_example' && b.answer?.includes('17 m')))
    assert.ok(!JSON.stringify(safe).includes('Teacher solution'))
    assert.ok(safe.blocks.every(b => b.note === undefined))
    assert.ok(!JSON.stringify(safe).includes('correctOptionId'))
    assert.ok(filterDocumentForViewer(item.document as BlockDocument, { role: 'admin' }).blocks.some(b => b.note?.includes('Teacher solution')))
  }
})

test('practice saves require all reasoning stages and do not auto-grade correctness', () => {
  const block = (payload[0].document as BlockDocument).blocks.find(b => b.id === 'wp01-position-turnaround')!
  const response = { format: 'problem-workspace', responses: { model: 'Right positive; +1 → +7 → −2 m.', plan: 'Add leg lengths; subtract endpoints.', work: '6 + 9 = 15; −2 − 1 = −3.', answer: 'Distance 15 m; displacement −3 m (left).' } }
  const result = checkedLessonResponse(block, response)
  assert.equal(result.ok, true)
  assert.ok(isBlockComplete(block, response))
  assert.ok(!isBlockComplete(block, { ...response, responses: { ...response.responses, plan: '' } }))
  assert.ok(result.ok && !('autoCheck' in (result.response as object)))
})

test('existing reviewed submissions stay reviewed and concept-map identity and access stay unchanged', () => {
  for (const [index, item] of payload.entries()) {
    const doc = item.document as BlockDocument
    assert.equal(lessonCompletion(doc.blocks, [], { submitted_at: '2026-10-06T12:00:00Z', reviewed: true }).state, 'reviewed')
    const map = buildLessonConceptMap([{ ...item, content_blocks: doc, published: true, unit_id: 'unit-1' }], [], {}, {}, 'cpa')
    assert.equal(map.nodes[0].sequence, index === 0 ? 3 : 6)
    assert.equal(map.nodes[0].access, 'locked')
    assert.equal(map.nodes[0].href, undefined)
    assert.ok(!JSON.stringify(map).includes(WORKED_PROBLEM_01.youtubeId))
  }
})

test('partial installations or missing insertion points fail before changing content', () => {
  const before = payload[0].before as BlockDocument
  assert.throws(() => addWorkedProblem01({ ...before, blocks: [] }, 'position'), /Missing lesson anchor/)
  assert.throws(() => addWorkedProblem01({ ...before, blocks: [...before.blocks, { id: 'wp01-position-video', type: 'prose', markdown: 'partial' }] }, 'position'), /Partially installed/)
})
