import { test } from 'node:test'
import assert from 'node:assert/strict'
import { advanceFlight, stepFlight } from './physics'
import { createProjectileEngine } from './engine'

const near = (a: number, b: number, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, `${a} ≠ ${b}`)

test('ideal flight matches kinematics and conserves mechanical energy', () => {
  const initial = { x: 0, y: 5, vx: 12, vy: 16 }
  const next = advanceFlight(initial, 1, 0)
  near(next.x, 12); near(next.y, 16.1); near(next.vy, 6.2)
  near((next.vx ** 2 + next.vy ** 2) / 2 + 9.8 * next.y, 249)
})

test('linear drag is independent of step size, including near-zero drag', () => {
  for (const drag of [0, 1e-12, 0.1, 0.3]) {
    const initial = { x: 0, y: 20, vx: 15, vy: 15 }
    const expected = advanceFlight(initial, 1, drag)
    let actual = initial
    for (let i = 0; i < 120; i++) actual = advanceFlight(actual, 1 / 120, drag)
    for (const key of ['x', 'y', 'vx', 'vy'] as const) near(actual[key], expected[key])
  }
})

test('ground contact gives analytic flight time, range and pre-impact velocity', () => {
  const initial = { x: 0, y: 0, vx: 10, vy: 10 }
  const result = stepFlight(initial, 3, 0)
  assert.equal(result.landed, true)
  near(result.elapsed, 20 / 9.8); near(result.state.x, 200 / 9.8)
  near(result.state.y, 0); near(result.state.vy, -10)
})

test('horizontal ground launch lands immediately; vertical launch returns to origin', () => {
  near(stepFlight({ x: 0, y: 0, vx: 10, vy: 0 }, 1 / 120, 0).elapsed, 0)
  const vertical = stepFlight({ x: 0, y: 0, vx: 0, vy: 10 }, 3, 0)
  near(vertical.state.x, 0); near(vertical.elapsed, 20 / 9.8)
})

test('engine exports the exact landing sample and preserves impact velocity', () => {
  const canvas = { addEventListener() {}, removeEventListener() {}, style: {} } as unknown as HTMLCanvasElement
  const params = { speed: 20, angle: 45, height: 0, drag: 0 }
  const engine = createProjectileEngine(canvas, {} as CanvasRenderingContext2D, params)
  engine.start!(params)
  for (let i = 0; i < 600; i++) engine.step!(1 / 120)
  assert.equal(engine.isComplete!(), true)
  const data = engine.getData!().rows
  const last = data[data.length - 1] as number[]
  near(last[0], 2 * 20 * Math.sin(Math.PI / 4) / 9.8)
  near(last[1], 400 / 9.8); near(last[2], 0); near(last[4], -20 / Math.sqrt(2))
  near(last[5], 20)
  engine.reset(); assert.equal(engine.getData!().rows.length, 0)
  engine.destroy()
})
