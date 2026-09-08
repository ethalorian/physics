import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeMaze, MazeRun, route, measure, DELTAS, type Direction } from './model'

test('all difficulty levels produce enclosed, connected mazes with branches and substantial routes', () => {
  for (const size of [15, 21, 27]) for (let seed = 41; seed < 51; seed++) {
    const m = makeMaze(size, seed)
    let open = 0, deadEnds = 0, junctions = 0
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (!x || !y || x === size - 1 || y === size - 1) assert.equal(m.walls[y][x], 1)
      if (m.walls[y][x]) continue
      open++
      const neighbors = Object.values(DELTAS).filter(d => m.walls[y + d.y]?.[x + d.x] === 0).length
      if (neighbors === 1) deadEnds++
      if (neighbors >= 3) junctions++
      assert.ok(route(m, m.start, { x, y }).length > 0)
    }
    assert.ok(deadEnds >= 3 && junctions >= 2, `${size}/${seed} needs decisions`)
    assert.ok(route(m, m.start, m.goal).length > size * 2)
    assert.ok(open > size * size * .35)
    assert.deepEqual(makeMaze(size, seed), m)
    assert.notDeepEqual(makeMaze(size, seed + 1).walls, m.walls)
  }
})

test('wall collisions do not move or count; solving and returning preserves distance and cancels displacement', () => {
  const m = makeMaze(21, 41), run = new MazeRun(m), path = route(m, m.start, m.goal)
  const walk = (points: typeof path) => {
    for (const p of points) {
      const dir = (Object.keys(DELTAS) as Direction[]).find(k => run.position.x + DELTAS[k].x === p.x && run.position.y + DELTAS[k].y === p.y)!
      assert.ok(run.move(dir)); assert.ok(run.values.distance >= run.values.magnitude)
    }
  }
  const blocked = (Object.keys(DELTAS) as Direction[]).find(k => m.walls[run.position.y + DELTAS[k].y][run.position.x + DELTAS[k].x] === 1)!
  assert.equal(run.move(blocked), false); assert.equal(run.values.distance, 0)
  walk(path.slice(1)); assert.equal(run.found, true); assert.equal(run.values.distance, path.length - 1)
  walk(path.slice(0, -1).reverse()); assert.equal(run.returned, true)
  assert.equal(run.values.magnitude, 0); assert.equal(run.values.distance, 2 * (path.length - 1))
  walk(path.slice(1, 2)); assert.equal(run.returned, false)
})

test('physical coordinate convention and magnitude hold in all quadrants', () => {
  assert.deepEqual(measure({ x: 5, y: 5 }, { x: 2, y: 1 }, 19), { x: -3, y: 4, magnitude: 5, distance: 19 })
  assert.deepEqual(measure({ x: 5, y: 5 }, { x: 8, y: 9 }, 7), { x: 3, y: -4, magnitude: 5, distance: 7 })
})
