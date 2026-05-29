import type { SimEngine, ParamValues } from '@/components/simulations/lab/contract'
import { PAL, clearField, arrow, chip } from '@/components/simulations/lab/draw'

// Maze Navigator: vector addition — drive a mouse through a 20x20 maze with the
// arrow keys / WASD to reach the cheese. As it moves, the canvas draws the
// position vector built from its x-component (coral) and y-component (teal), with
// the resultant r = x + y as a dashed lavender arrow from the origin. The sim
// evolves over time (held keys move the mouse continuously), so movement is
// integrated in step(dt) while the SimLab shell owns the animation loop.

interface Position { x: number; y: number } // cell coordinates (one cell = 1 m)

const MAZE_W = 20
const MAZE_H = 20
// Bespoke moved 0.05 cells/frame at ~60fps. Convert to cells/second so the
// fixed-dt shell loop produces the same on-screen speed.
const MOVE_SPEED = 0.05 * 60 // cells per second
const START: Position = { x: 0.5, y: 0.5 }
const CHEESE: Position = { x: 19.5, y: 19.5 }

// 1 = wall, 0 = path (identical to the bespoke layout)
const MAZE_LAYOUT = [
  [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
]

export function createMazeVectorsEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  _initial: ParamValues,
  _opts?: { invalidate: () => void },
): SimEngine {
  let mousePos: Position = { ...START }
  let moveCount = 0
  let hasWon = false
  const keys: Set<string> = new Set()

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  // The maze is square; fit it inside the available canvas and centre it. cellSize
  // is the on-screen size of one cell; (ox, oy) is the top-left of the maze.
  const layout = () => {
    const { w, h } = dims()
    const size = Math.min(w, h)
    const cellSize = size / MAZE_W
    const ox = (w - cellSize * MAZE_W) / 2
    const oy = (h - cellSize * MAZE_H) / 2
    return { cellSize, ox, oy }
  }

  const isWall = (row: number, col: number) =>
    row >= 0 && row < MAZE_H && col >= 0 && col < MAZE_W && MAZE_LAYOUT[row][col] === 1

  function canMoveTo(x: number, y: number): boolean {
    if (x < 0 || x >= MAZE_W || y < 0 || y >= MAZE_H) return false
    const checkRadius = 0.25
    const checkPoints = [
      { x: x, y: y },
      { x: x - checkRadius, y: y },
      { x: x + checkRadius, y: y },
      { x: x, y: y - checkRadius },
      { x: x, y: y + checkRadius },
      { x: x - checkRadius, y: y - checkRadius },
      { x: x + checkRadius, y: y - checkRadius },
      { x: x - checkRadius, y: y + checkRadius },
      { x: x + checkRadius, y: y + checkRadius },
    ]
    for (const point of checkPoints) {
      const col = Math.floor(point.x)
      const row = Math.floor(point.y)
      if (row < 0 || row >= MAZE_H || col < 0 || col >= MAZE_W) return false
      if (isWall(row, col)) return false
    }
    return true
  }

  function render() {
    const { w, h } = dims()
    const { cellSize, ox, oy } = layout()

    clearField(ctx, w, h)

    ctx.save()
    ctx.translate(ox, oy)

    // Draw maze grid — walls in strong grid tone, paths on the surface tone
    for (let row = 0; row < MAZE_H; row++) {
      for (let col = 0; col < MAZE_W; col++) {
        const x = col * cellSize
        const y = row * cellSize
        if (isWall(row, col)) {
          ctx.fillStyle = PAL.gridStrong
          ctx.fillRect(x, y, cellSize, cellSize)
        } else {
          ctx.fillStyle = PAL.surface
          ctx.fillRect(x, y, cellSize, cellSize)
        }
        ctx.strokeStyle = PAL.grid
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, cellSize, cellSize)
      }
    }

    // Start cell highlight (origin)
    ctx.fillStyle = 'rgba(127, 119, 221, 0.18)'
    ctx.fillRect(0, 0, cellSize, cellSize)
    ctx.strokeStyle = PAL.primary
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, cellSize, cellSize)

    // End cell highlight (cheese location / reward)
    ctx.fillStyle = 'rgba(224, 169, 60, 0.2)'
    ctx.fillRect(19 * cellSize, 19 * cellSize, cellSize, cellSize)
    ctx.strokeStyle = PAL.accent
    ctx.lineWidth = 3
    ctx.strokeRect(19 * cellSize, 19 * cellSize, cellSize, cellSize)

    // Cheese at goal position (kept illustrative)
    ctx.font = `${cellSize * 0.5}px ui-sans-serif, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🧀', 19.5 * cellSize, 19.5 * cellSize)

    // START / ORIGIN marker
    const originX = 0.5 * cellSize
    const originY = 0.5 * cellSize

    ctx.fillStyle = PAL.primary
    ctx.beginPath()
    ctx.arc(originX, originY, 8, 0, 2 * Math.PI)
    ctx.fill()
    ctx.fillStyle = PAL.onAccent
    ctx.font = 'bold 10px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('O', originX, originY)

    ctx.fillStyle = PAL.primary
    ctx.font = 'bold 9px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('Origin', originX, cellSize - 5)

    // Position vectors (from the origin)
    const mouseScreenX = mousePos.x * cellSize
    const mouseScreenY = mousePos.y * cellSize

    const xComp = mousePos.x - 0.5
    const yComp = mousePos.y - 0.5
    const magnitude = Math.sqrt(xComp ** 2 + yComp ** 2)

    // x-component vector (coral / force)
    arrow(ctx, originX, originY, mouseScreenX, originY, { color: PAL.force, width: 2, head: 8 })
    chip(ctx, `x = ${xComp.toFixed(1)}m`, (originX + mouseScreenX) / 2, originY - 12, { color: PAL.force })

    // y-component vector (teal / cool)
    arrow(ctx, mouseScreenX, originY, mouseScreenX, mouseScreenY, { color: PAL.cool, width: 2, head: 8 })
    chip(ctx, `y = ${yComp.toFixed(1)}m`, mouseScreenX + 26, (originY + mouseScreenY) / 2, { color: PAL.cool })

    // resultant vector (lavender / primary, dashed)
    arrow(ctx, originX, originY, mouseScreenX, mouseScreenY, { color: PAL.primary, width: 3, head: 10, dash: [6, 5] })
    chip(ctx, `r = ${magnitude.toFixed(2)}m`, (originX + mouseScreenX) / 2, (originY + mouseScreenY) / 2 - 12, { color: PAL.primary })

    // mouse
    ctx.font = `${cellSize * 0.35}px ui-sans-serif, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🐭', mouseScreenX, mouseScreenY)

    ctx.restore()
  }

  function hasReachedCheese(): boolean {
    const dx = mousePos.x - CHEESE.x
    const dy = mousePos.y - CHEESE.y
    return Math.sqrt(dx * dx + dy * dy) < 0.6
  }

  // ---- keyboard input -------------------------------------------------------
  function onKeyDown(e: KeyboardEvent) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
      e.preventDefault()
      keys.add(e.key.toLowerCase())
    }
  }
  function onKeyUp(e: KeyboardEvent) {
    keys.delete(e.key.toLowerCase())
  }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  const engine: SimEngine = {
    render,
    step(dt: number) {
      // Held keys move the mouse continuously, with sliding wall collisions —
      // identical behaviour to the bespoke animate(), now driven by dt.
      let dx = 0
      let dy = 0
      const dist = MOVE_SPEED * dt
      if (keys.has('arrowup') || keys.has('w')) dy -= dist
      if (keys.has('arrowdown') || keys.has('s')) dy += dist
      if (keys.has('arrowleft') || keys.has('a')) dx -= dist
      if (keys.has('arrowright') || keys.has('d')) dx += dist

      if (dx !== 0 || dy !== 0) {
        const newX = mousePos.x + dx
        const newY = mousePos.y + dy
        if (canMoveTo(newX, newY)) {
          mousePos.x = newX
          mousePos.y = newY
          moveCount++
        } else if (dx !== 0 && canMoveTo(newX, mousePos.y)) {
          mousePos.x = newX
          moveCount++
        } else if (dy !== 0 && canMoveTo(mousePos.x, newY)) {
          mousePos.y = newY
          moveCount++
        }
      }

      if (hasReachedCheese()) hasWon = true
    },
    setParams() {},
    reset() {
      mousePos = { ...START }
      keys.clear()
      moveCount = 0
      hasWon = false
      render()
    },
    getReadouts() {
      const x = mousePos.x - 0.5
      const y = mousePos.y - 0.5
      return {
        x,
        y,
        magnitude: Math.sqrt(x ** 2 + y ** 2),
        moves: moveCount,
        status: hasWon ? 'Cheese found!' : 'Exploring',
      }
    },
    // Complete once the mouse reaches the cheese — mirrors the bespoke win
    // condition (hasReachedCheese), keyed to actually solving the maze.
    isComplete() { return hasWon },
    destroy() {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    },
  }
  return engine
}
