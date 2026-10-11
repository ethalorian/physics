import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createTetherBridge } from './tether-bridge'

test('late coin approval, serialized checkpoints, failed payout retry, and duplicate final receipt', async () => {
  const replies: Record<string, unknown>[] = [], requests: string[] = []
  let releaseCoin: (() => void) | undefined
  const gate = new Promise<void>(r => { releaseCoin = r })
  let payoutAttempts = 0, finished = 0, active = 0, maxActive = 0
  const bridge = createTetherBridge({ slug: 'tether', onBalance: () => {}, onFinished: () => finished++, reply: m => replies.push(m), fetcher: (async (url: string) => {
    requests.push(url); active++; maxActive = Math.max(active, maxActive)
    try {
      if (url.endsWith('/coin')) { await gate; return Response.json({ playId: 'run-1', balance: 40 }) }
      if (url.endsWith('/payout') && ++payoutAttempts === 1) return Response.json({ error: 'Connection interrupted' }, { status: 503 })
      return Response.json(url.endsWith('/payout') ? { xp: 6, balance: 46 } : { score: 3250 })
    } finally { active-- }
  }) as typeof fetch })
  const base = { protocol: 2, source: 'tether-arcade' }
  const coin = bridge.handle({ ...base, type: 'arcade:coinRequest', requestId: 'c1' })
  await new Promise(r => setTimeout(r, 20)); assert.equal(replies.length, 0)
  releaseCoin!(); await coin; assert.equal(replies[0].playId, 'run-1')
  await bridge.handle({ ...base, type: 'arcade:coinRequest', requestId: 'c1' })
  assert.equal(requests.filter(p => p.endsWith('/coin')).length, 1)
  const final = { ...base, type: 'arcade:score', playId: 'run-1', requestId: 'final', score: 3250, final: true }
  await Promise.all([
    bridge.handle({ ...final, requestId: 'checkpoint', final: false }), bridge.handle(final),
  ])
  assert.equal(maxActive, 1); assert.equal(finished, 0); assert.equal(replies.at(-1)?.type, 'arcade:saveFailed')
  await bridge.handle(final); assert.equal(finished, 1); assert.equal(replies.at(-1)?.xp, 6)
  const count = requests.length; await bridge.handle(final); assert.equal(requests.length, count)
  assert.equal(replies.at(-1)?.xp, 6)
})

test('wrong source, wrong game, and stale play IDs cannot submit a score', async () => {
  const requests: string[] = []
  const bridge = createTetherBridge({ slug: 'tether', onBalance: () => {}, onFinished: () => {}, reply: () => {}, fetcher: (async (path: string) => { requests.push(path); return Response.json({ playId: 'current' }) }) as typeof fetch })
  const base = { protocol: 2, source: 'tether-arcade', requestId: '1' }
  await bridge.handle({ ...base, source: 'other', type: 'arcade:coinRequest' })
  assert.equal(requests.length, 0)
  await bridge.handle({ ...base, type: 'arcade:coinRequest' })
  await bridge.handle({ ...base, type: 'arcade:score', playId: 'old', final: true, score: 2000 })
  assert.equal(requests.length, 1)
})

test('Flywheel accepts its own source and rejects cross-cabinet messages', async () => {
 const calls: string[] = [], replies: Record<string, unknown>[] = []
 const bridge = createTetherBridge({slug:'flywheel',onBalance:()=>{},onFinished:()=>{},reply:m=>replies.push(m),fetcher:(async(path:string)=>{calls.push(path);return Response.json({playId:'f1',score:500,xp:2})}) as typeof fetch})
 await bridge.handle({protocol:2,source:'tether-arcade',requestId:'wrong',type:'arcade:coinRequest'})
 assert.equal(calls.length,0)
 await bridge.handle({protocol:2,source:'flywheel-arcade',requestId:'coin',type:'arcade:coinRequest'})
 await bridge.handle({protocol:2,source:'flywheel-arcade',requestId:'final',type:'arcade:score',playId:'f1',score:500,final:true})
 assert.equal(replies.at(-1)?.xp,2)
 assert.equal(replies.at(-1)?.final,true)
})

test('Descent accepts its own source and rejects cross-cabinet messages', async () => {
 const calls: string[] = [], replies: Record<string, unknown>[] = []
 const bridge = createTetherBridge({slug:'descent',onBalance:()=>{},onFinished:()=>{},reply:m=>replies.push(m),fetcher:(async(path:string)=>{calls.push(path);return Response.json({playId:'f1',score:500,xp:2})}) as typeof fetch})
 await bridge.handle({protocol:2,source:'tether-arcade',requestId:'wrong',type:'arcade:coinRequest'})
 assert.equal(calls.length,0)
 await bridge.handle({protocol:2,source:'descent-arcade',requestId:'coin',type:'arcade:coinRequest'})
 await bridge.handle({protocol:2,source:'descent-arcade',requestId:'final',type:'arcade:score',playId:'f1',score:500,final:true})
 assert.equal(replies.at(-1)?.xp,2)
 assert.equal(replies.at(-1)?.final,true)
})

test('Push accepts its own source and rejects cross-cabinet messages', async () => {
 const calls: string[] = [], replies: Record<string, unknown>[] = []
 const bridge = createTetherBridge({slug:'push',onBalance:()=>{},onFinished:()=>{},reply:m=>replies.push(m),fetcher:(async(path:string)=>{calls.push(path);return Response.json({playId:'f1',score:500,xp:2})}) as typeof fetch})
 await bridge.handle({protocol:2,source:'tether-arcade',requestId:'wrong',type:'arcade:coinRequest'})
 assert.equal(calls.length,0)
 await bridge.handle({protocol:2,source:'push-arcade',requestId:'coin',type:'arcade:coinRequest'})
 await bridge.handle({protocol:2,source:'push-arcade',requestId:'final',type:'arcade:score',playId:'f1',score:500,final:true})
 assert.equal(replies.at(-1)?.xp,2)
 assert.equal(replies.at(-1)?.final,true)
})

test('Cascade accepts its own source and rejects cross-cabinet messages', async () => {
 const calls: string[] = [], replies: Record<string, unknown>[] = []
 const bridge = createTetherBridge({slug:'cascade',onBalance:()=>{},onFinished:()=>{},reply:m=>replies.push(m),fetcher:(async(path:string)=>{calls.push(path);return Response.json({playId:'f1',score:500,xp:2})}) as typeof fetch})
 await bridge.handle({protocol:2,source:'tether-arcade',requestId:'wrong',type:'arcade:coinRequest'})
 assert.equal(calls.length,0)
 await bridge.handle({protocol:2,source:'cascade-arcade',requestId:'coin',type:'arcade:coinRequest'})
 await bridge.handle({protocol:2,source:'cascade-arcade',requestId:'final',type:'arcade:score',playId:'f1',score:500,final:true})
 assert.equal(replies.at(-1)?.xp,2)
 assert.equal(replies.at(-1)?.final,true)
})

for (const slug of ['inverse-blitz', 'magnitude', 'scale-storm', 'powers-of-ten', 'slope-sniper', 'fusion', 'expression-crush', 'mathle']) {
  test(`${slug} accepts its own messages and banks a completed math run`, async () => {
    const replies: Record<string, unknown>[] = []
    const bridge = createTetherBridge({ slug, onBalance: () => {}, onFinished: () => {}, reply: message => replies.push(message), fetcher: (async () => Response.json({ playId: 'math', score: 500, xp: 2 })) as typeof fetch })
    const base = { protocol: 2, source: `${slug}-arcade` }
    await bridge.handle({ ...base, type: 'arcade:coinRequest', requestId: 'coin' })
    await bridge.handle({ ...base, type: 'arcade:score', requestId: 'final', playId: 'math', score: 500, final: true })
    assert.equal(replies.at(-1)?.xp, 2)
    assert.equal(replies.at(-1)?.final, true)
  })
}

test('interrupted math run uses the old credit, retries payout, and validates cabinet on the server', async () => {
  const replies: Record<string, unknown>[] = [], bodies: Record<string, unknown>[] = []
  let payouts = 0
  const bridge = createTetherBridge({ slug: 'magnitude', onBalance: () => {}, onFinished: () => {}, reply: m => replies.push(m), fetcher: (async (url: string, init: RequestInit) => {
    assert(!url.endsWith('/coin'))
    const body = JSON.parse(init.body as string); bodies.push(body)
    if (url.endsWith('/score')) { assert.equal(body.slug, 'magnitude'); return Response.json({ score: 120 }) }
    if (++payouts === 1) return Response.json({ error: 'offline' }, { status: 503 })
    return Response.json({ xp: 2 })
  }) as typeof fetch })
  const message = { protocol: 2, source: 'magnitude-arcade', type: 'arcade:recover', requestId: 'retained-final', playId: 'retained-credit', final: true, score: 120 }
  await bridge.handle(message); assert.equal(replies.at(-1)?.type, 'arcade:saveFailed')
  await bridge.handle(message); assert.equal(replies.at(-1)?.xp, 2)
  const count = bodies.length; await bridge.handle(message); assert.equal(bodies.length, count)
})

test('recovery rejects other cabinet sources, checkpoints, and unavailable ownership without paying', async () => {
  let calls = 0
  const replies: Record<string, unknown>[] = []
  const bridge = createTetherBridge({ slug: 'fusion', onBalance: () => {}, onFinished: () => {}, reply: m => replies.push(m), fetcher: (async (url: string) => {
    calls++; assert(url.endsWith('/score')); return Response.json({ error: 'Unknown play' }, { status: 404 })
  }) as typeof fetch })
  const m = { protocol: 2, source: 'fusion-arcade', type: 'arcade:recover', requestId: 'r', playId: 'lost', final: true, score: 20 }
  await bridge.handle({ ...m, source: 'mathle-arcade' }); await bridge.handle({ ...m, final: false }); assert.equal(calls, 0)
  await bridge.handle(m); assert.equal(calls, 1); assert.equal(replies.at(-1)?.permanent, true)
})

for (const slug of ['pulse', 'mic-check']) {
  test(`${slug} preserves deployed paid-cabinet saves without requesting math XP`, async () => {
    const replies: Record<string, unknown>[] = [], calls: string[] = []
    const bridge = createTetherBridge({ slug, onBalance: () => {}, onFinished: () => {}, reply: m => replies.push(m), fetcher: (async (url: string, init: RequestInit) => {
      calls.push(url)
      const body = JSON.parse(init.body as string)
      if (url.endsWith('/coin')) {
        assert.equal(body.chartId, slug === 'pulse' ? 'fixture-chart' : undefined)
        return Response.json({ playId: 'paid-run', chartId: 'fixture-chart' })
      }
      assert(url.endsWith('/score'))
      return Response.json({ score: 100 })
    }) as typeof fetch })
    const base = { protocol: 2, source: `${slug}-arcade` }
    await bridge.handle({ ...base, type: 'arcade:coinRequest', requestId: 'coin', chartId: 'fixture-chart' })
    assert.equal(replies.at(-1)?.chartId, slug === 'pulse' ? 'fixture-chart' : undefined)
    const final = { ...base, type: 'arcade:score', requestId: 'final', playId: 'paid-run', final: true, score: 100 }
    await bridge.handle(final); await bridge.handle(final)
    assert.deepEqual(calls, ['/api/arcade/coin', '/api/arcade/score'])
    assert.equal(replies.at(-1)?.xp, 0)
    assert.equal(replies.at(-1)?.final, true)
  })
}
