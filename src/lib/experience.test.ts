import test from 'node:test'
import assert from 'node:assert/strict'
import { signExperience, verifyExperience } from './experience-token'
import { experienceActorMatches, experienceRequestError, type RoleExperience } from './experience'
import { experienceAllowsDatabaseRequest } from './experience-db-policy'
import { experienceDatabaseFetch, registerExperienceDatabaseGuard } from './experience-db-fetch'

const secret = 'synthetic-test-secret-never-used-in-production'
const actor = { id: 'owner-id', email: 'owner@example.invalid', name: 'Owner', role: 'admin' as const }
const fixture = (): RoleExperience => ({ id: 'preview-one', actor, user: { id: 'student-id', email: 'student@example.invalid', name: 'Example Student', role: 'student' }, readOnly: true, expiresAt: Date.now() + 60000 })

test('a signed preview round-trips every role and keeps the real actor separate', async () => {
  for (const role of ['student', 'teacher', 'observer', 'admin'] as const) {
    const value = fixture(); value.user.role = role
    assert.deepEqual(await verifyExperience(await signExperience(value, secret), secret), value)
  }
})
test('tampered payloads, bad signatures, and another signing key are rejected', async () => {
  const token = await signExperience(fixture(), secret)
  const tamper = token.split('.'); tamper[0] = Buffer.from(JSON.stringify({ ...fixture(), user: actor })).toString('base64url')
  for (const invalid of [tamper.join('.'), token + 'x', 'malformed', '', 'a'.repeat(6000)]) assert.equal(await verifyExperience(invalid, secret), null)
  assert.equal(await verifyExperience(token, secret + 'other'), null)
  assert.equal(await verifyExperience(token, undefined), null)
})
test('expiry and malformed identities fail closed', async () => {
  for (const value of [{ ...fixture(), expiresAt: Date.now() - 1 }, { ...fixture(), expiresAt: Date.now() + 99999999 }, { ...fixture(), readOnly: false }, { ...fixture(), actor: { ...actor, role: 'student' } }, { ...fixture(), user: { ...actor, role: 'root' } }]) {
    assert.equal(await verifyExperience(await signExperience(value as RoleExperience, secret), secret), null)
  }
})
test('a valid cookie cannot project another signed-in account or a non-admin', () => {
  const preview = fixture()
  assert.equal(experienceActorMatches(preview, actor), true)
  assert.equal(experienceActorMatches(preview, { ...actor, id: 'someone-else' }), false)
  assert.equal(experienceActorMatches(preview, { ...actor, email: 'someone@example.invalid' }), false)
  for (const role of ['teacher', 'observer', 'student']) assert.equal(experienceActorMatches(preview, { ...actor, role }), false)
})
test('read-only API methods and stale tabs are guarded without breaking normal writes', () => {
  for (const method of ['POST', 'PATCH', 'PUT', 'DELETE']) {
    assert.equal(experienceRequestError('/api/lessons/blocks', method, 'one', 'one'), 'read_only')
    assert.equal(experienceRequestError('/api/lessons/blocks', method, 'one', null), 'read_only')
    assert.equal(experienceRequestError('/api/lessons/blocks', method, null, 'one'), 'changed')
    assert.equal(experienceRequestError('/api/lessons/blocks', method, 'two', 'one'), 'changed')
    assert.equal(experienceRequestError('/api/lessons/blocks', method, null, null), null)
  }
  assert.equal(experienceRequestError('/api/home', 'GET', 'one', 'one'), null)
  assert.equal(experienceRequestError('/api/textbook/file', 'GET', 'one', null), null)
  assert.equal(experienceRequestError('/api/home', 'GET', 'two', 'one'), 'changed')
  assert.equal(experienceRequestError('/api/admin/experience', 'DELETE', 'one', null), null)
  assert.equal(experienceRequestError('/api/auth/signout', 'POST', 'one', null), null)
})
test('database guard allows reads but blocks table writes, unknown RPCs and functions', () => {
  const url = 'https://database.example.invalid'
  for (const method of ['POST', 'PATCH', 'PUT', 'DELETE']) assert.equal(experienceAllowsDatabaseRequest(url + '/rest/v1/block_responses', method), false)
  for (const method of ['GET', 'POST']) {
    assert.equal(experienceAllowsDatabaseRequest(url + '/rest/v1/rpc/record_lesson_video_watch', method), false)
    assert.equal(experienceAllowsDatabaseRequest(url + '/rest/v1/rpc/purchase_arcade_play', method), false)
    assert.equal(experienceAllowsDatabaseRequest(url + '/rest/v1/rpc/future_unknown_function', method), false)
    assert.equal(experienceAllowsDatabaseRequest(url + '/functions/v1/side-effect', method), false)
  }
  assert.equal(experienceAllowsDatabaseRequest(url + '/rest/v1/students', 'GET'), true)
  assert.equal(experienceAllowsDatabaseRequest(url + '/rest/v1/rpc/economy_totals', 'POST'), true)
  assert.equal(experienceAllowsDatabaseRequest(url + '/rest/v1/rpc/lesson_video_xp_status', 'POST'), true)
})
test('blocked database operations never reach fetch, including writes from a GET handler', async () => {
  const original = global.fetch
  let calls = 0
  global.fetch = async () => { calls++; return Response.json({ ok: true }) }
  registerExperienceDatabaseGuard(async () => true)
  try {
    for (const request of [new Request('https://database.example.invalid/rest/v1/students', { method: 'PATCH', body: '{}' }), new Request('https://database.example.invalid/rest/v1/rpc/record_lesson_video_watch', { method: 'POST', body: '{}' })]) assert.equal((await experienceDatabaseFetch(request)).status, 403)
    assert.equal(calls, 0)
    assert.equal((await experienceDatabaseFetch('https://database.example.invalid/rest/v1/students')).status, 200)
    assert.equal(calls, 1)
    registerExperienceDatabaseGuard(async () => false)
    assert.equal((await experienceDatabaseFetch('https://database.example.invalid/rest/v1/students', { method: 'POST', body: '{}' })).status, 200)
    assert.equal(calls, 2)
  } finally { global.fetch = original; registerExperienceDatabaseGuard(async () => false) }
})

test('student walkthrough reads foundation prerequisites without dropping the assignment lists', async () => {
  const original = global.fetch
  const calls: { url: string; body: string }[] = []
  const missing = [{ id: 'foundation-id', title: 'Foundation', role: 'foundation' }]
  global.fetch = async (input, init) => {
    calls.push({ url: String(input), body: String(init?.body) })
    return Response.json(missing)
  }
  registerExperienceDatabaseGuard(async () => true)
  try {
    for (const [rpc, key] of [['daily_review_missing', 'p_reviews'], ['daily_lesson_missing', 'p_quizzes']]) {
      const url = `https://database.example.invalid/rest/v1/rpc/${rpc}`
      const body = JSON.stringify({ [key]: ['assigned-id'], p_user: 'student-id' })
      const response = await experienceDatabaseFetch(url, { method: 'POST', body })
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), missing)
      assert.deepEqual(calls.at(-1), { url, body })
      for (const method of ['PATCH', 'PUT', 'DELETE']) assert.equal(experienceAllowsDatabaseRequest(url, method), false)
    }
    assert.equal(calls.length, 2)
  } finally { global.fetch = original; registerExperienceDatabaseGuard(async () => false) }
})

test('prerequisite reads never enable scheduling, submissions, grading or release in a walkthrough', async () => {
  const original = global.fetch
  let calls = 0
  global.fetch = async () => { calls++; return Response.json({ ok: true }) }
  registerExperienceDatabaseGuard(async () => true)
  try {
    for (const rpc of ['set_interactive_assignment_date', 'save_quiz_assignment', 'claim_automatic_grading', 'release_simulation_lab_grade', 'review_module_decision']) {
      for (const method of ['GET', 'POST']) {
        const response = await experienceDatabaseFetch(`https://database.example.invalid/rest/v1/rpc/${rpc}`, { method })
        assert.equal(response.status, 403)
      }
    }
    assert.equal(calls, 0)
  } finally { global.fetch = original; registerExperienceDatabaseGuard(async () => false) }
})
