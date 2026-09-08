export interface Cell { x: number; y: number }
export type Direction = 'up' | 'down' | 'left' | 'right'
export const DELTAS: Record<Direction, Cell> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }
export const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y
export interface Maze { size: number; walls: number[][]; start: Cell; goal: Cell }
export function route(maze: Maze, start: Cell, goal: Cell): Cell[] {
  const queue = [start], parents = new Map<string, Cell | null>([[`${start.x},${start.y}`, null]])
  for (let i = 0; i < queue.length; i++) {
    const c = queue[i]
    if (same(c, goal)) {
      const result = [c]
      let p = parents.get(`${c.x},${c.y}`)
      while (p) { result.push(p); p = parents.get(`${p.x},${p.y}`) }
      return result.reverse()
    }
    for (const d of Object.values(DELTAS)) {
      const n = { x: c.x + d.x, y: c.y + d.y }, key = `${n.x},${n.y}`
      if (maze.walls[n.y]?.[n.x] === 0 && !parents.has(key)) { parents.set(key, c); queue.push(n) }
    }
  }
  return []
}
/** Seeded depth-first carving: connected passages, enclosed border, real branches and dead ends. */
export function makeMaze(size: number, seed: number): Maze {
  let state = seed >>> 0
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296 }
  const walls = Array.from({ length: size }, () => Array<number>(size).fill(1))
  const center = 2 * Math.floor((size - 2) / 4) + 1
  const start = { x: center, y: center }, stack = [start]
  walls[start.y][start.x] = 0
  while (stack.length) {
    const c = stack[stack.length - 1]
    const choices = Object.values(DELTAS).map(d => ({ x: c.x + 2 * d.x, y: c.y + 2 * d.y }))
      .filter(n => n.x > 0 && n.x < size - 1 && n.y > 0 && n.y < size - 1 && walls[n.y][n.x] === 1)
    if (!choices.length) { stack.pop(); continue }
    const n = choices[Math.floor(random() * choices.length)]
    walls[(c.y + n.y) / 2][(c.x + n.x) / 2] = 0
    walls[n.y][n.x] = 0
    stack.push(n)
  }
  const maze: Maze = { size, walls, start, goal: start }
  let longest = 0
  for (let y = 1; y < size; y += 2) for (let x = 1; x < size; x += 2) {
    const length = route(maze, start, { x, y }).length
    if (length > longest) { longest = length; maze.goal = { x, y } }
  }
  return maze
}
export function measure(start: Cell, position: Cell, distance: number) {
  const x = position.x - start.x, y = start.y - position.y
  return { x, y, magnitude: Math.hypot(x, y), distance }
}
export class MazeRun {
  position: Cell
  trail: Cell[]
  found = false
  returned = false
  constructor(public maze: Maze) { this.position = { ...maze.start }; this.trail = [this.position] }
  move(direction: Direction): boolean {
    const d = DELTAS[direction], n = { x: this.position.x + d.x, y: this.position.y + d.y }
    if (this.maze.walls[n.y]?.[n.x] !== 0) return false
    this.position = n
    this.trail.push(n)
    if (same(n, this.maze.goal)) this.found = true
    this.returned = this.found && same(n, this.maze.start)
    return true
  }
  get values() { return measure(this.maze.start, this.position, this.trail.length - 1) }
}
