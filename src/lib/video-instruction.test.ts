import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PHYSICS_VIDEOS, UPCOMING_PHYSICS_VIDEOS, conceptTitle, lessonsForVideo, videosForTarget, type VideoLessonLink } from './video-instruction'
import { createVideoLesson } from './video-lesson-authoring'
import { validateBlockDocument } from '@/data/block-registry'
import { isBlockComplete, paginateBlocks, type InlineQuestion, type QuestionBlock } from '@/data/content-blocks'
import { filterDocumentForViewer } from './track-visibility'
import { checkedLessonResponse } from './lesson-response-validation'
import { evidenceContext } from './mastery-evidence'
import { physicsLearningEntry } from './physics-learning'
import { linkedTeachingPlans } from './lesson-workspace'
import inventory from '../../scripts/physics-learning/target-inventory.json'
import seed from '../../scripts/physics-learning/seed.json'
import additions from '../../scripts/physics-learning/sept30-additions.json'
import octoberAdditions from '../../scripts/physics-learning/oct5-additions.json'

const targetSlugs = new Set([...inventory, ...seed.targets, ...additions.map(a=>a.target), ...octoberAdditions.map(a=>a.target)].map(target => target.slug))
const position = 'u1.vocab-position-distance-displacement'
const video = PHYSICS_VIDEOS[7]
const lesson: VideoLessonLink = {
  id: 'practice', slug: 'practice', title: 'Day 2 — Position', published: true, window: { state: 'open' },
  learning: { id: 'practice', slug: 'practice', title: 'Position', unitId: 'unit-1', kind: 'lesson', targets: [{ slug: position, statement: 'Position and displacement', domain: 'knowledge' }], readings: [], hasSimulation: false, hasWorkedExample: false, videoIds: [], source: 'existing' },
}

test('published sequence contains fifteen unique verified links and real target references', () => {
  assert.deepEqual(PHYSICS_VIDEOS.map(v => v.sequence), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
  assert.equal(new Set(PHYSICS_VIDEOS.map(v => v.youtubeId)).size, 15)
  for (const v of PHYSICS_VIDEOS) {
    assert.match(v.youtubeId, /^[\w-]{11}$/)
    assert.ok(!('check' in v) && !('reflection' in v), 'Shared video metadata must not include draft prompts or answer keys')
    assert.ok(v.targets.some(link => link.relationship === 'teaches'))
    for (const link of v.targets) assert.ok(targetSlugs.has(link.slug), link.slug)
  }
  assert.ok(UPCOMING_PHYSICS_VIDEOS.every(v => !('youtubeId' in v)))
  assert.equal(createVideoLesson('9'), null)
})

test('practice links require server-provided open access, not a shared or preparatory target alone', () => {
  assert.deepEqual(lessonsForVideo(video, [lesson]), [])
  for (const window of [null, undefined, { state: 'closed' }, { state: 'scheduled' }]) {
    assert.deepEqual(lessonsForVideo(video, [{ ...lesson, window }]), [])
  }
  assert.deepEqual(lessonsForVideo(video, [{ ...lesson, published: false }]), [])
  const supportOnly = { ...lesson, learning: { ...lesson.learning!, targets: [{ slug: 'u1.capture-pt-graph', statement: 'Collect a graph', domain: 'skill' }] } }
  assert.deepEqual(lessonsForVideo(video, [supportOnly]), [])
  assert.deepEqual(lessonsForVideo(video, []), [])
  assert.deepEqual(lessonsForVideo(video, [{ ...lesson, window: null }], true), [])
})

test('only explicitly linked current lessons release the video, never shared-target practice', () => {
  const exact = { ...lesson, id: 'video', learning: { ...lesson.learning!, videoIds: [video.youtubeId], source:'new' } }
  const source = [lesson, exact]
  assert.deepEqual(lessonsForVideo(video, source).map(l => l.id), ['video'])
  assert.equal(source[0], lesson)
})

test('roadmap does not promote prerequisite videos into full graph or vector instruction', () => {
  for (const slug of ['u1.capture-pt-graph', 'u1.read-vt-graph-components', 'u1.predict-position-uncertainty']) {
    const links = videosForTarget(slug)
    assert.ok(links.length > 0)
    assert.ok(links.every(({ link }) => link.relationship === 'supports'))
  }
  assert.deepEqual(videosForTarget('u1.vectors-tip-to-tail').filter(({link})=>link.relationship==='teaches').map(({video})=>video.sequence), [13,14])
  assert.deepEqual(videosForTarget('u8.unknown'), [])
})

for (const v of PHYSICS_VIDEOS) test(`video ${v.sequence} draft uses canonical evidence, feedback, pagination and teacher-only mastery`, () => {
  const doc = createVideoLesson(v.youtubeId)!
  assert.deepEqual(validateBlockDocument(doc, true), [])
  assert.deepEqual(doc.learningPath!.targetSlugs, v.targets.filter(t => t.relationship === 'teaches').map(t => t.slug))
  assert.equal(paginateBlocks(doc.blocks).filter(page=>page.hasCapture).length, 5)
  assert.deepEqual(linkedTeachingPlans({ unit_id: 'unit-1', lesson_number: 99 + v.sequence }, doc), [])
  const captures = doc.blocks.filter(b => 'capture' in b && b.capture)
  assert.equal(captures.length, 5)
  for (const block of captures) {
    assert.ok(evidenceContext(block).targets.includes(block.targetId!))
    assert.ok(!block.gate, 'incorrect practice must not block the lesson')
  }
  const q = captures.find(b => b.type === 'interactive_question')!
  assert.ok(q.type === 'interactive_question')
  if(q.type !== 'interactive_question') throw Error('interactive')
  const part = q.task.parts[0]
  assert.ok(part.kind === 'choice')
  if(part.kind !== 'choice') throw Error('choice')
  const wrong = part.options.find(o=>o.id!==part.answer)!
  const response = checkedLessonResponse(q, {version:1,answers:{[part.id]:wrong.id},checks:{[part.id]:'match'}})
  assert.ok(response.ok)
  if(response.ok) {
    assert.equal((response.response as {checks:Record<string,string>}).checks[part.id],'mismatch')
    assert.equal(isBlockComplete(q,response.response),true)
  }
  const filtered = filterDocumentForViewer(doc, { role: 'student', track: 'cpa' })
  assert.ok(!JSON.stringify(filtered).includes('correctOptionId'))
  assert.equal(physicsLearningEntry({ ...lesson, content_blocks: filtered })!.videoIds[0], v.youtubeId)
  assert.deepEqual(createVideoLesson(v.youtubeId), doc, 'stable capture IDs preserve saved work')
})

test('day prefixes disappear only from display titles; lesson identity remains stable', () => {
  assert.equal(conceptTitle(lesson.title), 'Position')
  assert.equal(conceptTitle('Day 4 – 5: Velocity'), 'Velocity')
  assert.equal(conceptTitle('A day on Mars'), 'A day on Mars')
  assert.equal(lesson.title, 'Day 2 — Position')
  assert.equal(lesson.id, 'practice')
})

 test('opening one position video does not open the other videos sharing its target',()=>{
  const one={...lesson,learning:{...lesson.learning!,source:'new',videoIds:[PHYSICS_VIDEOS[2].youtubeId]}};
  assert.deepEqual(PHYSICS_VIDEOS.filter(v=>lessonsForVideo(v,[one]).length).map(v=>v.sequence),[3]);
  for(const state of ['closed','scheduled','ended']) assert.equal(lessonsForVideo(PHYSICS_VIDEOS[2],[{...one,window:{state}}]).length,0);
  assert.equal(lessonsForVideo(PHYSICS_VIDEOS[2],[{...one,published:false}]).length,0);
  assert.equal(lessonsForVideo(PHYSICS_VIDEOS[2],[{...one,learning:{...one.learning,source:'existing'}}]).length,0);
 });
