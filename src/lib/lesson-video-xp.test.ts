import test from 'node:test'
import assert from 'node:assert/strict'
import { LessonResponseStore } from './lesson-response-store'
import { validVideoHeartbeat } from './lesson-video-xp'

test('watch telemetry excludes nonfinite, negative and out-of-range positions', () => {
  const heartbeat = { lesson_id: 'lesson', block_id: 'video', session_id: '30000000-0000-4000-8000-000000000001', position: 1.2, playing: true, expected_user_id: 'student' }
  assert.equal(validVideoHeartbeat(heartbeat), true)
  for (const position of [NaN, Infinity, -1, 14401, '2', null]) assert.equal(validVideoHeartbeat({ ...heartbeat, position }), false)
})

test('a delayed answer response cannot erase a video reward from the visible total', () => {
  const store = new LessonResponseStore('student', 'lesson')
  store.recordXpTotal(10)
  store.recordXpTotal(15)
  store.recordXpTotal(10)
  assert.equal(store.getSnapshot().xpEarned, 15)
  store.recordXpTotal(NaN)
  assert.equal(store.getSnapshot().xpEarned, 15)
  store.dispose()
  store.recordXpTotal(20)
  assert.equal(store.getSnapshot().xpEarned, 15)
})
