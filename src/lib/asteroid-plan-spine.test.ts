import test from 'node:test'
import assert from 'node:assert/strict'
import { ASTEROID_VIDEO_SUPPORT, planVideoSupport, videoPlanConnections } from '@/data/asteroid-video-support'
import { PHYSICS_VIDEOS, lessonsForVideo, type VideoLessonLink } from './video-instruction'
import { PLANS, buildLessonPlanHtml, findDay } from './lesson-plan-export'
import { withVideoSpine } from './asteroid-plan-spine'
import { isCurrentClassroomLesson } from './current-lesson-catalog'
import original from '@/data/unit1-cpa-lesson-plans.json'

test('every authored physics plan carries one support section without changing its source or identity', () => {
  const plans = Object.values(PLANS.cpa).flat()
  assert.equal(plans.length, 137)
  for (const [unit, days] of Object.entries(PLANS.cpa)) for (const day of days) {
    assert.equal(day.bodyHtml.match(/data-video-spine=/g)?.length, 1)
    assert.ok(!day.bodyHtml.includes('data-classroom-alignment='))
    assert.deepEqual(withVideoSpine(unit, day), day)
    assert.equal(findDay(unit, day.day, ['honors']), day)
    assert.ok(buildLessonPlanHtml(unit, day).includes(day.bodyHtml))
    assert.ok(buildLessonPlanHtml(unit, day, { forPdf: true }).includes(day.bodyHtml))
  }
  assert.ok(original.every(day => !day.bodyHtml.includes('data-video-spine=')))
  for (const track of ['trades', 'projects']) assert.ok(Object.values(PLANS[track]).flat().every(day => !day.bodyHtml.includes('data-video-spine=')))
})

test('all curated video uses resolve to actual days and recordings, and all twelve videos have a classroom connection', () => {
  for (const [unit, days] of Object.entries(ASTEROID_VIDEO_SUPPORT)) for (const [day, support] of Object.entries(days)) {
    assert.ok(findDay(unit, Number(day), ['cpa']), `${unit} day ${day}`)
    assert.equal(new Set(support.videos.map(v => v.sequence)).size, support.videos.length)
    for (const use of support.videos) assert.ok(PHYSICS_VIDEOS.some(v => v.sequence === use.sequence))
  }
  for (const video of PHYSICS_VIDEOS) assert.ok(videoPlanConnections(video.sequence).length > 0)
  assert.deepEqual(videoPlanConnections(99), [])
})

test('prediction preparation addresses notation and conversion without replacing uncertainty instruction or lab evidence', () => {
  const prediction = planVideoSupport('unit-1', 5)!
  assert.deepEqual(prediction.videos.filter(v => v.when === 'Prepare').map(v => v.sequence), [10, 12])
  assert.match(prediction.gap, /uncertainty/)
  assert.match(prediction.flow!, /remaining time for the asteroid prediction/)
  assert.match(planVideoSupport('unit-1', 3)!.evidence, /measured graph/)
})

test('transfer assessment days keep assessment conditions and do not add viewing or coached answers', () => {
  for (const day of [21, 22]) {
    assert.deepEqual(planVideoSupport('unit-1', day)!.videos, [])
    const body = findDay('unit-1', day, ['cpa'])!.bodyHtml
    assert.match(body, /No extra video viewing is needed/)
    assert.ok(!body.includes('Check the relevant video response in the opening recap'))
  }
})

test('video concept lessons cannot become classroom session links; investigations and Trades remain available', () => {
  const concept = { unit_id: 'unit-1', lesson_type: 'video', presentation: 'physics-path', learning_path: { kind: 'lesson' } }
  assert.equal(isCurrentClassroomLesson(concept), false)
  assert.equal(isCurrentClassroomLesson({ ...concept, learning_path: { kind: 'investigation' } }), true)
  assert.equal(isCurrentClassroomLesson({ ...concept, lesson_type: 'markdown' }), true)
  assert.equal(isCurrentClassroomLesson({ unit_id: 'unit-1', lesson_type: 'markdown' }), false)
  assert.equal(isCurrentClassroomLesson({ unit_id: 'trades-etf-1', program: 'trades', lesson_type: 'markdown' }), true)
})

test('a video embedded in an open investigation does not release or replace its closed standalone video lesson', () => {
  const video = PHYSICS_VIDEOS[2]
  const lesson: VideoLessonLink = { id: 'video', slug: 'video', title: 'Position', published: true, window: { state: 'closed' }, learning: { id: 'video', slug: 'video', title: 'Position', source: 'new', kind: 'lesson', unitId: 'unit-1', videoIds: [video.youtubeId], targets: [], readings: [], hasSimulation: false, hasWorkedExample: false } }
  const investigation = { ...lesson, id: 'investigation', window: { state: 'open' }, learning: { ...lesson.learning!, kind: 'investigation' as const } }
  assert.deepEqual(lessonsForVideo(video, [investigation, lesson]), [])
  assert.deepEqual(lessonsForVideo(video, [investigation, lesson], true).map(l => l.id), ['video'])
  assert.deepEqual(lessonsForVideo(video, [{ ...lesson, window: { state: 'open' } }, investigation]).map(l => l.id), ['video'])
})


test('no transfer-task plan adds a new video assignment', () => {
  for (const [unit, days] of Object.entries(PLANS.cpa)) for (const day of days.filter(d => /transfer task/i.test(d.title))) {
    assert.deepEqual(planVideoSupport(unit, day.day)!.videos, [], unit + ' day ' + day.day)
  }
})
