import test from 'node:test'
import assert from 'node:assert/strict'
import type { BlockDocument } from '@/data/content-blocks'
import { usesInteractiveLessonWorkspace, isVideoLesson } from './video-lesson-workspace'
import { learningTaskFocus } from './learning-task-focus'

test('every learning-library kind uses the newer interactive workspace, including lessons without videos', () => {
  for (const kind of ['lesson', 'investigation', 'mission'] as const) {
    const document: BlockDocument = { schemaVersion: 1, presentation: 'physics-path', learningPath: { version: 1, kind, focus: 'Explain motion.', targetSlugs: [] }, blocks: [{ id: 'q', type: 'question', capture: true, question: { prompt: 'What is your evidence?' } }] }
    const before = JSON.stringify(document)
    assert.equal(usesInteractiveLessonWorkspace(document), true)
    assert.equal(JSON.stringify(document), before, 'choosing a layout must not rewrite questions or response IDs')
  }
})

test('other lesson presentations retain their own workspace', () => {
  assert.equal(isVideoLesson(null), false)
  assert.equal(isVideoLesson({ schemaVersion: 1, blocks: [] }), false)
  assert.equal(isVideoLesson({ schemaVersion: 1, presentation: 'trades-workshop', blocks: [] }), false)
})

test('classroom focus follows the actual interactive assignment prompt', () => {
  assert.equal(learningTaskFocus([{ id: 'iq', type: 'interactive_question', capture: true, task: { title: 'Velocity', format: 'concept', prompt: 'Explain the direction of motion.', parts: [] } }], 'Motion'), 'Explain the direction of motion.')
  assert.equal(learningTaskFocus([{ id: 'q', type: 'question', capture: true, question: { prompt: 'Why did velocity change?' } }], 'Motion'), 'Why did velocity change?')
  assert.equal(learningTaskFocus([], 'Motion'), 'Motion')
})

test('teacher preparation does not mistake an investigation for a video lesson', () => {
  assert.equal(isVideoLesson({schemaVersion:1,presentation:'physics-path',learningPath:{version:1,kind:'investigation',focus:'Investigate.',targetSlugs:[]},blocks:[]}),false)
})
