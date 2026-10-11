import test from 'node:test'
import assert from 'node:assert/strict'
import {requestClaudeQuiz} from './claude-request'

test('retries a temporary 503 once with the same payload and shared time budget', async t => {
  const calls: RequestInit[] = []
  t.mock.method(globalThis, 'fetch', async (_url: string, options: RequestInit) => {
    calls.push(options)
    return calls.length === 1 ? Response.json({}, {status: 503}) : Response.json({draft: true})
  })
  assert.deepEqual(await (await requestClaudeQuiz('test-key', {model: 'test', messages: []})).json(), {draft: true})
  assert.equal(calls.length, 2)
  assert.equal(calls[0].body, calls[1].body)
  assert.equal(calls[0].signal, calls[1].signal)
})

test('stops after the second service failure and explains that no draft was returned', async t => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({}, {status: 503}) })
  await assert.rejects(requestClaudeQuiz('test-key', {}), /temporarily unavailable.*retried once.*settings are kept/)
  assert.equal(calls, 2)
})

test('does not retry credential errors or retry before a long provider wait', async t => {
  let calls = 0
  let status = 401
  t.mock.method(globalThis, 'fetch', async () => {
    calls++
    return Response.json({}, {status, headers: {'retry-after': '60'}})
  })
  await assert.rejects(requestClaudeQuiz('test-key', {}), /credentials or permissions/)
  assert.equal(calls, 1)
  status = 429
  await assert.rejects(requestClaudeQuiz('test-key', {}), /too many requests.*settings are kept/)
  assert.equal(calls, 2)
})
