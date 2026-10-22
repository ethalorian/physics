import test from 'node:test'
import assert from 'node:assert/strict'
import { createPortraitStore, EMPTY_PORTRAIT } from './portrait-store'

const response = (alias: string) => Response.json({ alias, setup_completed: true, traits: {}, equipped: {}, equipped_items: [] })
function delayed() {
  const pending: Array<(response: Response) => void> = []
  const request: typeof fetch = () => new Promise(resolve => pending.push(resolve))
  return { pending, request }
}

test('late responses cannot overwrite a more recently saved look', async () => {
  const { pending, request } = delayed(), store = createPortraitStore(request)
  const first = store.refresh(), second = store.refresh()
  pending[1](response('New look')); await second
  pending[0](response('Old look')); await first
  assert.equal(store.getSnapshot().portrait?.alias, 'New look')
})

test('switching accounts disposes the old request and starts with no prior portrait', async () => {
  const { pending, request } = delayed(), firstUser = createPortraitStore(request)
  const requestA = firstUser.refresh(); firstUser.cancel()
  const secondUser = createPortraitStore(request)
  assert.deepEqual(secondUser.getSnapshot(), EMPTY_PORTRAIT)
  const requestB = secondUser.refresh()
  pending[1](response('Second student')); await requestB
  pending[0](response('First student')); await requestA
  assert.deepEqual(firstUser.getSnapshot(), EMPTY_PORTRAIT)
  assert.equal(secondUser.getSnapshot().portrait?.alias, 'Second student')
})

test('a temporary outage keeps the confirmed look; loss of authentication clears it', async () => {
  const queue = [response('Saved look'), new Response(null, { status: 503 }), new Response(null, { status: 401 })]
  const store = createPortraitStore(async () => queue.shift()!)
  await store.refresh(); await store.refresh()
  assert.equal(store.getSnapshot().portrait?.alias, 'Saved look')
  assert.equal(store.getSnapshot().error, true)
  await store.refresh()
  assert.equal(store.getSnapshot().portrait, null)
})

test('unsubscribing and cancelling prevents notifications after leaving a page', async () => {
  const { pending, request } = delayed(), store = createPortraitStore(request)
  let notifications = 0
  const unsubscribe = store.subscribe(() => notifications++)
  const loading = store.refresh(); unsubscribe(); store.cancel()
  pending[0](response('Late look')); await loading
  assert.equal(notifications, 0)
  assert.deepEqual(store.getSnapshot(), EMPTY_PORTRAIT)
})
