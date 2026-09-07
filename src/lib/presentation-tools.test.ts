import assert from 'node:assert/strict'
import test from 'node:test'
import { projectorSignature, projectorStatus, uncalledStudents, type ToolsState } from './presentation-tools'
import type { LiveCommandState } from './classroom-command'
const live = { session: { current_slide: 2, updated_at: '2026-09-07T12:00:00Z' }, lobby: null } as LiveCommandState
const tools: ToolsState = { pulse: null, tools: null, projector: null, roster: [], needs: [], marks: [] }
test('projector must acknowledge this command and remain fresh', () => {
  const now = Date.parse('2026-09-07T12:01:00Z')
  assert.equal(projectorStatus(live, tools, now), 'Projector not connected')
  const state = { ...tools, projector: { signature: projectorSignature(live, tools), seen_at: '2026-09-07T12:01:00Z', slide: 2, ready: true } }
  assert.equal(projectorStatus(live, state, now), 'Projector confirmed')
  assert.equal(projectorStatus(live, state, now + 11000), 'Projector connection lost')
  assert.equal(projectorStatus({ ...live, session: { ...live.session, current_slide: 3 } }, state, now), 'Waiting for projector')
  assert.equal(projectorStatus(live, { ...state, pulse: { id: 'pulse', kind: 'confidence', anonymous: true, status: 'open', created_at: '' } }, now), 'Waiting for projector')
  assert.equal(projectorStatus(live, { ...state, tools: { reconnect_token: 'new', discussion_block_id: null, discussion_poll_run_id: null, updated_at: 'later' } }, now), 'Waiting for projector')
})
test('picker excludes called and skipped students without removing students just bookmarked', () => {
  const roster = [{ id: 'a', name: 'Alex' }, { id: 'b', name: 'Blair' }, { id: 'c', name: 'Casey' }]
  const marks: ToolsState['marks'] = [
    { id: 'm', kind: 'called', student_id: 'a', slide: 0, note: '', created_at: '' },
    { id: 'n', kind: 'bookmark', student_id: 'b', slide: 0, note: 'Follow up', created_at: '' },
  ]
  assert.deepEqual(uncalledStudents(roster, marks, ['c']), [roster[1]])
})
