import test from 'node:test'
import assert from 'node:assert/strict'
import { confirmedDateRequest, DateChangeCancelled, proposedSequenceDates, type SequenceDateContext } from './sequence-date-change'
const context: SequenceDateContext = { role: 'foundation', snapshot: { course: 'class-a', source: 'interactive:discussion', requestedDue: '2026-11-02', sequenceKey: 'day-7', foundation: { id: 'f', slug: 'discussion', date: '2026-10-26' }, review: { id: 'r', slug: 'review', date: '2026-10-29' }, quiz: { id: 'q', date: '2026-10-29T23:59:00-04:00', version: 2, status: 'published', deletedAt: null } }, normalDates: { foundation: '2026-11-02', review: '2026-11-05', quiz: '2026-11-05T23:59:00-05:00' } }
function server(replies: Array<[number, unknown]>) {
  const calls: Array<{ url: unknown; body: Record<string, unknown>; method: unknown }> = []
  return { calls, fetcher: (async (url, init) => { calls.push({ url, body: JSON.parse(String(init?.body)), method: init?.method }); const [status, body] = replies.shift()!; return Response.json(body, { status }) }) as typeof fetch }
}
const notice: [number, unknown] = [409, { code: 'SEQUENCE_DATE_CONFIRMATION', confirmation: context }]
test('cancel sends no confirmation or mutation retry', async () => {
  const s = server([notice]); await assert.rejects(confirmedDateRequest('/date', { due: '2026-11-02' }, async () => null, 'POST', s.fetcher), DateChangeCancelled); assert.equal(s.calls.length, 1)
})
test('confirmed retry preserves endpoint, method, scope and version, adding only the shown snapshot', async () => {
  for (const mode of ['single', 'linked'] as const) {
    const s = server([notice, [200, { saved: true }]]), payload = { classId: 'class-a', stepId: 'step-a', version: 4, slot: { date: '2026-11-02', block: 'A' } }
    assert.deepEqual(await confirmedDateRequest('/calendar', payload, async c => { assert.deepEqual(c, context); return mode }, 'PATCH', s.fetcher), { saved: true })
    assert.deepEqual(s.calls[1], { url: '/calendar', method: 'PATCH', body: { ...payload, sequenceConfirmation: { mode, expected: context.snapshot } } })
  }
})
test('stale confirmation fails once without automatically approving newer dates', async () => {
  const s = server([notice, [409, { error: 'Linked dates changed.' }]]); let prompts = 0
  await assert.rejects(confirmedDateRequest('/date', {}, async () => { prompts++; return 'single' }, 'POST', s.fetcher), /Linked dates changed/)
  assert.equal(prompts, 1); assert.equal(s.calls.length, 2)
})
test('unrelated errors never open a date confirmation', async () => {
  const s = server([[403, { error: 'Class unavailable.' }]])
  await assert.rejects(confirmedDateRequest('/date', {}, async () => { throw Error('Unexpected prompt') }, 'POST', s.fetcher), /Class unavailable/); assert.equal(s.calls.length, 1)
})
test('individual previews keep companions; linked previews show calculated dates', () => {
  assert.deepEqual(proposedSequenceDates(context, 'single'), { foundation: '2026-11-02', review: context.snapshot.review.date, quiz: context.snapshot.quiz.date })
  assert.deepEqual(proposedSequenceDates(context, 'linked'), context.normalDates)
  const quiz = { ...context, role: 'quiz' as const, snapshot: { ...context.snapshot, requestedDue: '2026-11-12T22:30:00Z' } }
  assert.deepEqual(proposedSequenceDates(quiz, 'single'), { foundation: context.snapshot.foundation.date, review: context.snapshot.review.date, quiz: quiz.snapshot.requestedDue })
})
