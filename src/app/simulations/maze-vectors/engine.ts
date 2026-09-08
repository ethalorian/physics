import type { SimEngine, ParamValues } from '@/components/simulations/lab/contract'
import { arrow } from '@/components/simulations/lab/draw'
import { makeMaze, MazeRun, measure, route, type Direction } from './model'

export interface MazeEngine extends SimEngine {
  move(direction: Direction): void
  newMaze(): void
  hint(): void
  record(): void
  checkPrediction(x: string, y: string, magnitude: string): string
}
export function createMazeVectorsEngine(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, initial: ParamValues, opts?: { invalidate: () => void }): MazeEngine {
  let params = initial, seed = 41, run = new MazeRun(makeMaze(Number(initial.size) || 21, seed))
  let hintCell: { x: number; y: number } | undefined
  let message = 'Find the gold goal. Each step is 1 m.'
  let rows: (number | string)[][] = []
  let predictionCorrect = false, trial = 0
  const originalTabIndex = canvas.getAttribute('tabindex')
  canvas.tabIndex = 0
  canvas.setAttribute('aria-label', 'Vector maze. Focus here and use arrow keys or W A S D. Each step is one metre. North is positive y. Movement buttons and measurements follow the maze.')
  const update = () => { render(); opts?.invalidate() }
  function reset() {
    trial++
    run = new MazeRun(makeMaze(Number(params.size) || 21, seed)); rows = []; hintCell = undefined; predictionCorrect = false
    message = 'Find the gold goal. Each step is 1 m.'; update()
  }
  function render() {
    const dpr = window.devicePixelRatio || 1, w = canvas.width / dpr, h = canvas.height / dpr
    const size = Math.min(w - 24, h - 78), cell = size / run.maze.size, ox = (w - size) / 2, oy = 48
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#334155'; ctx.font = '600 13px system-ui'; ctx.textAlign = 'left'
    ctx.fillText('N ↑ +y   •   E → +x   •   1 step = 1 m', 14, 25)
    const point = (p: { x: number; y: number }) => ({ x: ox + (p.x + .5) * cell, y: oy + (p.y + .5) * cell })
    for (let y = 0; y < run.maze.size; y++) for (let x = 0; x < run.maze.size; x++) {
      ctx.fillStyle = run.maze.walls[y][x] ? '#334155' : '#ffffff'
      ctx.fillRect(ox + x * cell, oy + y * cell, cell + .3, cell + .3)
      if (!run.maze.walls[y][x]) { ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = .5; ctx.strokeRect(ox + x * cell, oy + y * cell, cell, cell) }
    }
    if (params.trail !== false) {
      ctx.beginPath(); run.trail.forEach((p, i) => { const s = point(p); if (!i) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y) })
      ctx.strokeStyle = '#14b8a6'; ctx.lineWidth = Math.max(2, cell * .19); ctx.lineJoin = 'round'; ctx.stroke()
    }
    if (hintCell) { const p = point(hintCell); ctx.fillStyle = '#fbbf24'; ctx.fillRect(p.x - cell * .3, p.y - cell * .3, cell * .6, cell * .6) }
    const a = point(run.maze.start), b = point(run.position), goal = point(run.maze.goal)
    if (params.vectors !== false && run.values.magnitude > 0) {
      // White underlay keeps vector arrows readable over walls.
      if (params.components !== false) {
        arrow(ctx, a.x, a.y, b.x, a.y, { color: '#fff', width: 5, head: 9 })
        arrow(ctx, b.x, a.y, b.x, b.y, { color: '#fff', width: 5, head: 9 })
        arrow(ctx, a.x, a.y, b.x, a.y, { color: '#dc2626', width: 2, head: 7 })
        arrow(ctx, b.x, a.y, b.x, b.y, { color: '#2563eb', width: 2, head: 7 })
      }
      arrow(ctx, a.x, a.y, b.x, b.y, { color: '#fff', width: 6, head: 10 })
      arrow(ctx, a.x, a.y, b.x, b.y, { color: '#7c3aed', width: 3, head: 8, dash: [7, 4] })
    }
    for (const [p, color, label] of [[a, '#0f766e', 'S'], [goal, '#b45309', 'G'], [b, '#7c3aed', '●']] as const) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(5, cell * .43), 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.max(8, cell * .55)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, p.x, p.y)
    }
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.fillStyle = '#475569'; ctx.font = '12px system-ui'
    ctx.fillText('S start   G goal   ● you   — trail', 14, h - 12)
  }
  function move(direction: Direction) {
    hintCell = undefined
    if (!run.move(direction)) message = 'Wall: choose another direction. Distance did not change.'
    else if (run.returned) message = 'Round trip: displacement is 0 m; distance is still positive.'
    else if (run.found) message = 'Goal found! Record evidence, then navigate back to S.'
    else message = 'Exploring: backtracking adds distance, but can reduce displacement.'
    update()
  }
  function onKey(e: KeyboardEvent) {
    const map: Record<string, Direction> = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' }
    const dir = map[e.key.toLowerCase()]
    if (dir) { e.preventDefault(); move(dir) }
  }
  let pointerStart: { x: number; y: number; id: number } | undefined
  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return
    canvas.focus({ preventScroll: true })
    pointerStart = { x: e.clientX, y: e.clientY, id: e.pointerId }
    canvas.setPointerCapture(e.pointerId)
  }
  function onPointerUp(e: PointerEvent) {
    if (!pointerStart || pointerStart.id !== e.pointerId) return
    const dx = e.clientX - pointerStart.x, dy = e.clientY - pointerStart.y
    pointerStart = undefined
    if (Math.hypot(dx, dy) > 15) {
      move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'))
      return
    }
    const rect = canvas.getBoundingClientRect(), size = Math.min(rect.width - 24, rect.height - 78), cell = size / run.maze.size
    const x = Math.floor((e.clientX - rect.left - (rect.width - size) / 2) / cell) - run.position.x
    const y = Math.floor((e.clientY - rect.top - 48) / cell) - run.position.y
    if (Math.abs(x) + Math.abs(y) === 1) move(x ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up'))
  }
  function onPointerCancel() { pointerStart = undefined }
  canvas.addEventListener('keydown', onKey)
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerCancel)
  const engine: MazeEngine = {
    render, move, reset,
    newMaze() { seed++; reset() },
    hint() {
      hintCell = route(run.maze, run.position, run.found ? run.maze.start : run.maze.goal)[1]
      message = hintCell ? 'One-step hint highlighted in gold. Explain why you chose that branch.' : 'You are at the destination.'; update()
    },
    record() {
      const v = run.values
      rows = [...rows, [rows.length + 1, v.distance, v.x, v.y, Number(v.magnitude.toFixed(2)), run.returned ? 'Round trip' : run.found ? 'After goal' : 'Exploring']]
      message = 'Evidence recorded. Compare distance and displacement in the table.'; update()
    },
    checkPrediction(x, y, magnitude) {
      if ([x, y, magnitude].some(s => !s.trim() || !Number.isFinite(Number(s)))) return 'Enter three numbers before checking.'
      const v = measure(run.maze.start, run.maze.goal, 0)
      predictionCorrect = Number(x) === v.x && Number(y) === v.y && Math.abs(Number(magnitude) - v.magnitude) <= .06
      update()
      if (predictionCorrect) return 'Correct! These goal components and displacement stay the same whichever route you take.'
      if (Number(x) !== v.x || Number(y) !== v.y) return 'Count grid steps from S to G horizontally and vertically. East is positive x; north is positive y. Ignore the winding route.'
      return 'Components are correct. Use √(Δx² + Δy²), then round to the nearest 0.1 m.'
    },
    setParams(values) { const changed = values.size !== params.size; params = { ...values }; if (changed) reset(); else update() },
    getReadouts() {
      const v = run.values, g = measure(run.maze.start, run.maze.goal, 0)
      return { ...v, trial, goal: `(${g.x}, ${g.y}) m`, shortest: run.found ? route(run.maze, run.maze.start, run.maze.goal).length - 1 : 'Reach G to reveal', status: message, prediction: predictionCorrect ? 'Verified' : 'Try a prediction' }
    },
    getData() { return { columns: ['Record', 'Distance (m)', 'Δx (m)', 'Δy (m)', '|Δr| (m)', 'Stage'], rows } },
    isComplete() { return run.found },
    destroy() {
      canvas.removeEventListener('keydown', onKey)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerCancel)
      if (originalTabIndex === null) canvas.removeAttribute('tabindex'); else canvas.setAttribute('tabindex', originalTabIndex)
    },
  }
  return engine
}
