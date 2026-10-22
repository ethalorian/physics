import test from 'node:test'
import assert from 'node:assert/strict'
import { compass, DEFAULT_RACE, raceMeasurement, restoreRaceTrials } from './model'
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ≠ ${expected}`)
test('scratch trials restore only supported finite conditions', () => {
  const trial = { id: 1, conditions: DEFAULT_RACE }
  assert.deepEqual(restoreRaceTrials([trial, { ...trial, conditions: { ...DEFAULT_RACE, speed: 0 } }, null]), [trial])
  assert.deepEqual(restoreRaceTrials({ trials: [trial] }), [])
  assert.equal(restoreRaceTrials(Array.from({ length: 20 }, (_, i) => ({ ...trial, id: i + 1 }))).length, 12)
})
test('quarter, half and full laps have correct paths, endpoints and velocity vectors', () => {
  const quarter = raceMeasurement({ ...DEFAULT_RACE, laps: 0.25 }, 1)
  close(quarter.distance, 50 * Math.PI); close(quarter.displacement, 100 * Math.SQRT2)
  close(quarter.dx, -100); close(quarter.dy, -100); assert.equal(compass(quarter.dx, quarter.dy), 'southwest')
  close(quarter.vx, -20); close(quarter.vy, 0)
  const half = raceMeasurement({ ...DEFAULT_RACE, laps: 0.5 }, 1)
  close(half.displacement, 200); close(half.dx, -200); close(half.dy, 0)
  const full = raceMeasurement(DEFAULT_RACE, 1)
  assert.equal(full.displacement, 0); assert.equal(full.averageVelocity, 0)
  close(full.distance, 200 * Math.PI); close(full.averageSpeed, 20); close(Math.hypot(full.vx, full.vy), 20)
})
test('reversing direction reverses the north/south component; doubling speed halves time only', () => {
  const clockwise = raceMeasurement({ ...DEFAULT_RACE, laps: 0.25 }, 1)
  const counter = raceMeasurement({ ...DEFAULT_RACE, laps: 0.25, direction: 'counterclockwise' }, 1)
  close(clockwise.dx, counter.dx); close(clockwise.dy, -counter.dy)
  close(clockwise.displacement, counter.displacement)
  const fast = raceMeasurement({ ...DEFAULT_RACE, speed: 40 }, 1)
  const slow = raceMeasurement(DEFAULT_RACE, 1)
  close(fast.time, slow.time / 2); close(fast.distance, slow.distance); close(fast.displacement, slow.displacement)
})
test('two laps retain path length, scrubber clamps, and tangent velocity is orthogonal to radius', () => {
  const twice = raceMeasurement({ ...DEFAULT_RACE, laps: 2 }, 1)
  close(twice.distance, 400 * Math.PI); close(twice.displacement, 0)
  for (const fraction of [0, 0.123, 0.5, 0.789, 1]) {
    const m = raceMeasurement(DEFAULT_RACE, fraction)
    close((m.dx + 100) * m.vx + m.dy * m.vy, 0)
    close(Math.hypot(m.vx, m.vy), 20)
    assert.ok(m.displacement <= m.distance + 1e-8)
  }
  assert.equal(raceMeasurement(DEFAULT_RACE, -1).time, 0)
  assert.equal(raceMeasurement(DEFAULT_RACE, 2).turns, 1)
})
