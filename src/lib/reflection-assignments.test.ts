import test from 'node:test'
import assert from 'node:assert/strict'
import { createReflectionAssignment, createReadyReflection } from './reflection-assignments'
import { lessonTargetReferences } from './lesson-target-references'
import { isBlockComplete, isRequiredCaptureBlock } from '@/data/content-blocks'
import { validateBlockDocument } from '@/data/block-registry'
import { checkedLessonResponse } from './lesson-response-validation'
import { artifactFileType } from './lesson-artifacts'
import { choiceStepDate, type ChoiceOption, type ChoiceSelection } from './choice-calendar'
import { CURRENT_LESSON_FIELDS, isCurrentLesson, isCurrentClassroomLesson } from './current-lesson-catalog'
import { physicsLearningEntry } from './physics-learning'

test('both reflection templates use existing capture and submission rules', () => {
  for (const kind of ['manga', 'story'] as const) {
    const doc = createReflectionAssignment(kind, 'motion')
    assert.deepEqual(validateBlockDocument(doc, true), [])
    assert.equal(doc.presentation, undefined, 'never routes into the rejected PhysicsPathView')
    assert.equal(doc.blocks.filter(isRequiredCaptureBlock).length, 1)
    assert(doc.blocks.filter(isRequiredCaptureBlock).every(b => b.targetId === 'motion'))
    assert.deepEqual(createReflectionAssignment(kind, 'motion'), doc, 'stable response identifiers')
    assert.equal(doc.blocks.length, 1, 'no extra reflection questions')
  }
})
test('manga needs a private upload receipt without an extra written answer', () => {
  const block = createReflectionAssignment('manga').blocks.find(b => b.id === 'reflection-product')!
  assert(block.type === 'sketch')
  const attachmentId = '11111111-1111-4111-8111-111111111111'
  assert(!isBlockComplete(block, { text: 'Caption without a page.' }))
  assert(isBlockComplete(block, { attachmentId, text: '' }))
  assert(!isBlockComplete({ ...block, captionRequired: undefined }, { attachmentId, text: '' }), 'legacy caption requirements stay intact')
  assert(isBlockComplete(block, { attachmentId, text: 'The ball changes direction because of the force.' }))
  assert.equal(checkedLessonResponse(block, { attachmentId: 'https://example.test/page.png', text: 'caption' }).ok, false)
  assert.deepEqual(checkedLessonResponse(block, { attachmentId, text: 'caption', path: 'another student/file' }), { ok: true, response: { attachmentId, text: 'caption' } })
  assert(isBlockComplete({ id: 'legacy', type: 'sketch', capture: true, instruction: 'Describe' }, { text: 'Legacy keyboard answer.' }), 'existing sketches unchanged')
})
test('ready reflections retain unit targets for review without arbitrary evidence attribution', () => {
  for (const kind of ['manga', 'story'] as const) {
    const document = createReadyReflection(kind, ['motion', 'forces', 'motion'])
    assert.deepEqual(validateBlockDocument(document, true), [])
    assert.deepEqual(lessonTargetReferences(document), ['motion', 'forces'])
    assert.equal(document.blocks.length, 1)
    assert.equal(document.blocks[0].targetId, undefined, 'the actual product determines its target')
    const focused = createReadyReflection(kind, ['motion'])
    assert.equal(focused.blocks[0].targetId, 'motion')
    assert(validateBlockDocument(createReadyReflection(kind, []), true).length, 'empty target scope cannot publish')
  }
})
test('uploads accept image/PDF signatures, not renamed HTML or SVG', () => {
  assert.equal(artifactFileType(new TextEncoder().encode('%PDF-1.7'))?.type, 'application/pdf')
  assert.equal(artifactFileType(new Uint8Array([255,216,255,0]))?.type, 'image/jpeg')
  assert.equal(artifactFileType(new TextEncoder().encode('<svg><script>')) ,null)
  assert.equal(artifactFileType(new TextEncoder().encode('<html>')), null)
})
test('activity dates are independent, including a later listed activity planned first', () => {
  const option = { lab: false } as ChoiceOption
  const selection = { selected: true, planned_on: '2026-11-04', step_dates: { first: '2026-11-05', second: '2026-11-02', third: null } } as unknown as ChoiceSelection
  assert.equal(choiceStepDate(option, selection, 'second'), '2026-11-02')
  assert.equal(choiceStepDate(option, selection, 'first'), '2026-11-05')
  assert.equal(choiceStepDate(option, selection, 'third'), null)
  assert.equal(choiceStepDate({ ...option, lab: true }, selection, 'report'), null, 'booking does not move independent report work')
  assert.equal(choiceStepDate(option, { ...selection, selected: false }, 'second'), null)
})
test('reflection assignments appear in full and lightweight catalogs without replacing classroom instruction', () => {
  assert.match(CURRENT_LESSON_FIELDS, /reflection_assignment:content_blocks->reflection/)
  for (const kind of ['manga', 'story'] as const) {
    const content_blocks = createReflectionAssignment(kind)
    assert(isCurrentLesson({ unit_id: 'unit-1', content_blocks }))
    assert(isCurrentLesson({ program: 'physics', unit_id: 'custom-physics', reflection_assignment: content_blocks.reflection }))
    assert(!isCurrentClassroomLesson({ unit_id: 'unit-1', content_blocks }))
    assert(physicsLearningEntry({ id: 'new-weekly-reflection', title: 'Weekly reflection', slug: 'weekly-reflection', unit_id: 'custom-physics', content_blocks }))
  }
  assert(!isCurrentLesson({ unit_id: 'unit-1', reflection_assignment: { version: 1, kind: 'unknown' } }))
})
