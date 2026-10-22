import test from 'node:test'
import assert from 'node:assert/strict'
import { asteroidModel, ASTEROID_DEFAULTS, STORY_EPISODES } from './asteroid-story'
import { assignmentBySlug } from './interactive-assignments/catalog'

test('story lessons link to existing response sections, including the vector day', () => {
  for (const episode of STORY_EPISODES) {
    const lesson = assignmentBySlug(episode.slug)
    assert.ok(lesson, episode.slug)
    assert.ok(lesson.sections[episode.part - 1]?.questions.length, episode.slug)
  }
})
test('velocity components, elapsed time and uncertainty use consistent units', () => {
  const m=asteroidModel({...ASTEROID_DEFAULTS, days:1})
  assert.ok(Math.abs(Math.hypot(m.vx,m.vy)-8.5)<1e-12)
  assert.ok(Math.abs(m.point.x-(120+m.vx*.0864))<1e-10)
  assert.ok(Math.abs(m.bound-.06728)<1e-10)
  const initial=asteroidModel({...ASTEROID_DEFAULTS,days:0})
  assert.deepEqual(initial.point,{x:120,y:0}); assert.equal(initial.bound,.05)
})
test('closing speed changes sign after passing the origin; zero-distance direction is undefined', () => {
  const before=asteroidModel({...ASTEROID_DEFAULTS,angle:0,days:100})
  const after=asteroidModel({...ASTEROID_DEFAULTS,angle:0,days:200})
  assert.equal(before.closing,8.5); assert.equal(after.closing,-8.5)
  assert.equal(asteroidModel({...ASTEROID_DEFAULTS,angle:0,days:120e6/8.5/86400}).closing,null)
})
test('the explorer bounds invalid controls and does not produce nonfinite coordinates', () => {
  const m=asteroidModel({speed:NaN,angle:90,days:Infinity,uncertainty:-1})
  assert.equal(m.speed,8.5);assert.equal(m.angle,45);assert.equal(m.days,160);assert.equal(m.uncertainty,0)
  assert.ok(Number.isFinite(m.point.x));assert.ok(Number.isFinite(m.point.y))
})
