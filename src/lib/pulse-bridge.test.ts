import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createTetherBridge } from './tether-bridge'

test('Pulse saves, retries, and acknowledges ranked runs without calling the XP payout endpoint', async () => {
  const requests: string[] = [], replies: Record<string, unknown>[] = []
  let failures = 1, completed = 0
  const bridge = createTetherBridge({ slug: 'pulse', onBalance: () => {}, onFinished: () => completed++, reply: message => replies.push(message), fetcher: (async (path: string) => {
    requests.push(path)
    if (path.endsWith('/coin')) return Response.json({ playId: 'pulse-1', balance: 20 })
    if (failures-- > 0) return Response.json({ error: 'Try again' }, { status: 503 })
    return Response.json({ score: 990000, finished: true })
  }) as typeof fetch })
  const base = { protocol: 2, source: 'pulse-arcade' }
  const coin = { ...base, type: 'arcade:coinRequest', requestId: 'coin-1' }
  await bridge.handle({ ...coin, source: 'vortex-arcade' }); assert.equal(requests.length, 0)
  await Promise.all([bridge.handle(coin), bridge.handle(coin)])
  assert.equal(requests.filter(x => x.endsWith('/coin')).length, 1)
  const final = { ...base, type: 'arcade:score', requestId: 'final-1', playId: 'pulse-1', score: 990000, final: true }
  await bridge.handle({ ...final, playId: 'someone-else' }); assert.equal(requests.length, 1)
  await bridge.handle(final); assert.equal(replies.at(-1)?.type, 'arcade:saveFailed')
  await bridge.handle(final); assert.equal(replies.at(-1)?.type, 'arcade:scoreSaved')
  assert.equal(replies.at(-1)?.xp, 0); assert.equal(completed, 1)
  const count = requests.length; await bridge.handle(final); assert.equal(requests.length, count)
  assert(requests.every(x => !x.endsWith('/payout')))
})
