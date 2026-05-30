import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'
import { PAL, clearField, grid as drawGridHelper, axes as drawAxesHelper, chip } from '@/components/simulations/lab/draw'

// Slope calculator & kinematics visualizer — read the slope off a graph. The
// student drags two points on the canvas (Point 1 = start, Point 2 = end); the
// rise/run triangle and the slope appear live. In KINEMATICS mode the slope of
// the position-time line IS the velocity, and the three graph views (position,
// velocity, acceleration) are linked. An EQUATION input method drives the points
// from x = x0 + v0 t + 1/2 a t^2 instead (then the P-T line can curve into a
// parabola). This sim is NOT animated — it reacts to dragging / param changes,
// so the canvas owns its pointer input and asks the shell to re-read state via
// opts.invalidate() after each change.

interface Pt { x: number; y: number }

// Semantic roles mapped onto the shared SimLab palette so this graph matches
// every other lab. line/p1 = lavender (primary), p2 = teal (cool/secondary),
// rise = green (velocity), run = coral (force), vel = green, acc = gold (accent).
const COL = {
  bg: PAL.bg, grid: PAL.grid, axis: PAL.axis, text: PAL.ink, mute: PAL.mute,
  line: PAL.primary, p1: PAL.primary, p2: PAL.cool,
  rise: PAL.velocity, run: PAL.force,
  vel: PAL.velocity, acc: PAL.accent,
}

const FONT = 'ui-sans-serif, system-ui, sans-serif'

const PADDING = 60

export function createSlopeCalculatorEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
  opts?: { invalidate: () => void },
): SimEngine {
  // --- params (mirror the bespoke selects/inputs) -------------------------
  let context = String(initial.context ?? 'kinematics') as 'kinematics' | 'generic'
  let inputMode = String(initial.inputMode ?? 'points') as 'points' | 'equation'
  let graphView = String(initial.graphView ?? 'position') as 'position' | 'velocity' | 'acceleration'
  // equation-mode kinematic variables
  let x0 = Number(initial.x0 ?? 0)
  let v0 = Number(initial.v0 ?? 2)
  let acceleration = Number(initial.acceleration ?? 0)
  let timeRange = Number(initial.timeRange ?? 4)

  // points-mode draggable points (defaults match bespoke: (0,0) and (4,8))
  let point1: Pt = { x: 0, y: 0 }
  let point2: Pt = { x: 4, y: 8 }

  // engagement tracking for completion
  let interactions = 0

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  // Recompute points from the kinematic equation when in equation/kinematics mode.
  const syncEquationPoints = () => {
    if (inputMode === 'equation' && context === 'kinematics') {
      const t1 = 0
      const t2 = timeRange
      const a = acceleration
      point1 = { x: t1, y: x0 + v0 * t1 + 0.5 * a * t1 * t1 }
      point2 = { x: t2, y: x0 + v0 * t2 + 0.5 * a * t2 * t2 }
    }
  }
  syncEquationPoints()

  // Ordered points so point1.x <= point2.x (bespoke orderedPoints).
  const ordered = () => (point1.x <= point2.x ? { p1: point1, p2: point2 } : { p1: point2, p2: point1 })

  const slopeResult = () => {
    const { p1, p2 } = ordered()
    const deltaY = p2.y - p1.y
    const deltaX = p2.x - p1.x
    if (deltaX === 0) return null
    return { slope: deltaY / deltaX, deltaY, deltaX }
  }

  // Derived kinematic quantities (mirror bespoke logic).
  const velocity = () => {
    if (inputMode === 'equation' && context === 'kinematics') return v0
    return slopeResult()?.slope ?? 0
  }
  const actualAccel = () => (inputMode === 'equation' && context === 'kinematics' ? acceleration : 0)
  const yIntercept = () => {
    const r = slopeResult()
    if (!r) return 0
    const { p1 } = ordered()
    return p1.y - r.slope * p1.x
  }

  const isEquationCurve = () => inputMode === 'equation' && context === 'kinematics'
  // Whether the position graph shows the draggable rise/run triangle.
  const showRiseRun = () => inputMode === 'points'

  // --- coordinate transforms for whichever graph is active ----------------
  // Each graph computes its own data range, exactly as the bespoke components did.
  type View = { xMin: number; xMax: number; yMin: number; yMax: number }

  const positionView = (): View => {
    const xMin = Math.min(point1.x, point2.x, 0) - 1
    const xMax = Math.max(point1.x, point2.x) + 1
    const yMin = Math.min(point1.y, point2.y, 0) - 1
    const yMax = Math.max(point1.y, point2.y) + 1
    return { xMin, xMax, yMin, yMax }
  }
  const velocityView = (): View => {
    const { p1, p2 } = ordered()
    const xMin = Math.min(p1.x, 0) - 0.5
    const xMax = Math.max(p2.x, p1.x) + 0.5
    const v = velocity()
    const a = actualAccel()
    const vStart = v
    const vEnd = v + a * (p2.x - p1.x)
    const vMin = Math.min(vStart, vEnd, 0)
    const vMax = Math.max(vStart, vEnd, 1)
    const yMin = vMin - Math.abs(vMax - vMin) * 0.2
    const yMax = vMax + Math.abs(vMax - vMin) * 0.2
    return { xMin, xMax, yMin, yMax }
  }
  const accelerationView = (): View => {
    const { p1, p2 } = ordered()
    const xMin = Math.min(p1.x, 0) - 0.5
    const xMax = Math.max(p2.x, p1.x) + 0.5
    const aRange = Math.max(Math.abs(actualAccel()) * 1.5, 2)
    return { xMin, xMax, yMin: -aRange, yMax: aRange }
  }

  const currentView = (): View => {
    if (context === 'generic') return positionView()
    if (graphView === 'velocity') return velocityView()
    if (graphView === 'acceleration') return accelerationView()
    return positionView()
  }

  // Build screen transforms for the active view, given canvas dims.
  const transforms = () => {
    const { w, h } = dims()
    const v = currentView()
    const sx = (w - 2 * PADDING) / (v.xMax - v.xMin)
    const sy = (h - 2 * PADDING) / (v.yMax - v.yMin)
    const toScreenX = (x: number) => PADDING + (x - v.xMin) * sx
    const toScreenY = (y: number) => h - PADDING - (y - v.yMin) * sy
    return { v, toScreenX, toScreenY }
  }

  // --- drawing helpers ----------------------------------------------------
  function drawAxesAndGrid(toScreenX: (x: number) => number, toScreenY: (y: number) => number) {
    const { w, h } = dims()
    clearField(ctx, w, h)
    // background grid (40px squares, matching the bespoke pattern)
    drawGridHelper(ctx, w, h, 40, { color: COL.grid })
    // L-shaped frame around the plot region (shared axes style)
    drawAxesHelper(ctx, PADDING, PADDING, w - PADDING, h - PADDING, COL.axis)
    // emphasized axes through the data origin
    ctx.strokeStyle = COL.axis
    ctx.lineWidth = 1.5
    const x0px = toScreenX(0), y0px = toScreenY(0)
    ctx.beginPath(); ctx.moveTo(x0px, PADDING); ctx.lineTo(x0px, h - PADDING); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(PADDING, y0px); ctx.lineTo(w - PADDING, y0px); ctx.stroke()
  }

  function axisLabels(xLabel: string, yLabel: string) {
    const { w, h } = dims()
    ctx.fillStyle = COL.mute
    ctx.font = `bold 14px ${FONT}`
    ctx.textAlign = 'center'
    ctx.fillText(xLabel, w / 2, h - 10)
    ctx.save()
    ctx.translate(20, h / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(yLabel, 0, 0)
    ctx.restore()
  }

  function drawDot(x: number, y: number, color: string, r = 8) {
    ctx.fillStyle = color
    ctx.strokeStyle = PAL.surface
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  }

  function renderPosition() {
    const { toScreenX, toScreenY } = transforms()
    drawAxesAndGrid(toScreenX, toScreenY)
    const xLabel = context === 'kinematics' ? 'Time (s)' : 'x'
    const yLabel = context === 'kinematics' ? 'Position (m)' : 'y'
    axisLabels(xLabel, yLabel)

    const p1s = { x: toScreenX(point1.x), y: toScreenY(point1.y) }
    const p2s = { x: toScreenX(point2.x), y: toScreenY(point2.y) }
    const deltaX = point2.x - point1.x
    const deltaY = point2.y - point1.y

    // rise/run triangle (points mode only)
    if (showRiseRun() && deltaX !== 0) {
      // run (Δx) — red dashed horizontal
      ctx.strokeStyle = COL.run
      ctx.lineWidth = 3
      ctx.setLineDash([8, 4])
      ctx.beginPath(); ctx.moveTo(p1s.x, p1s.y); ctx.lineTo(p2s.x, p1s.y); ctx.stroke()
      // rise (Δy) — green dashed vertical
      ctx.strokeStyle = COL.rise
      ctx.beginPath(); ctx.moveTo(p2s.x, p1s.y); ctx.lineTo(p2s.x, p2s.y); ctx.stroke()
      ctx.setLineDash([])
      // Only label each leg when it's long enough to hold a chip — when the points
      // are dragged close, a tiny triangle can't fit Δx/Δy without them colliding
      // with each other and with the P1/P2 chips. The dashed legs still show.
      if (Math.abs(p2s.x - p1s.x) > 48) {
        chip(ctx, `Δx = ${deltaX.toFixed(2)}`, (p1s.x + p2s.x) / 2, p1s.y - 12, { color: COL.run })
      }
      if (Math.abs(p2s.y - p1s.y) > 30) {
        chip(ctx, `Δy = ${deltaY.toFixed(2)}`, p2s.x + 45, (p1s.y + p2s.y) / 2, { color: COL.rise })
      }
    }

    // line or curve between points
    ctx.strokeStyle = COL.line
    ctx.lineWidth = 4
    if (isEquationCurve()) {
      const numPoints = 100
      const tStart = point1.x
      const tEnd = point2.x
      const step = (tEnd - tStart) / numPoints
      ctx.beginPath()
      for (let i = 0; i <= numPoints; i++) {
        const t = tStart + i * step
        const x = x0 + v0 * t + 0.5 * acceleration * t * t
        const sx = toScreenX(t), sy = toScreenY(x)
        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy)
      }
      ctx.stroke()
      // markers along the curve
      if (acceleration !== 0) {
        ctx.fillStyle = COL.line
        const numMarkers = 8
        for (let i = 1; i < numMarkers; i++) {
          const t = tStart + (i / numMarkers) * (tEnd - tStart)
          const x = x0 + v0 * t + 0.5 * acceleration * t * t
          ctx.beginPath(); ctx.arc(toScreenX(t), toScreenY(x), 3, 0, Math.PI * 2); ctx.fill()
        }
      }
    } else {
      ctx.beginPath(); ctx.moveTo(p1s.x, p1s.y); ctx.lineTo(p2s.x, p2s.y); ctx.stroke()
    }

    // points + coordinate chips (legible over the grid). The two chips are biased
    // OUTWARD by screen position — the left point's chip extends left, the right
    // point's extends right — so they never overlap even when the points are
    // dragged on top of each other.
    const p1IsLeft = p1s.x <= p2s.x
    const biasedChip = (text: string, px: number, py: number, toLeft: boolean, color: string) =>
      chip(ctx, text, px + (toLeft ? -10 : 10), py, { color, align: toLeft ? 'right' : 'left' })
    drawDot(p1s.x, p1s.y, COL.p1)
    biasedChip(
      isEquationCurve() ? `t=0s, x=${point1.y.toFixed(1)}m` : `P1 (${point1.x.toFixed(1)}, ${point1.y.toFixed(1)})`,
      p1s.x, p1s.y - 20, p1IsLeft, COL.p1,
    )
    drawDot(p2s.x, p2s.y, COL.p2)
    biasedChip(
      isEquationCurve() ? `t=${point2.x.toFixed(1)}s, x=${point2.y.toFixed(1)}m` : `P2 (${point2.x.toFixed(1)}, ${point2.y.toFixed(1)})`,
      p2s.x, p2s.y - 20, !p1IsLeft, COL.p2,
    )

    if (showRiseRun()) {
      ctx.fillStyle = COL.mute
      ctx.font = `11px ${FONT}`
      ctx.textAlign = 'left'
      ctx.fillText('Drag the points to change the slope.', 12, dims().h - 28)
    }
  }

  function renderVelocity() {
    const { toScreenX, toScreenY } = transforms()
    drawAxesAndGrid(toScreenX, toScreenY)
    axisLabels('Time (s)', 'Velocity (m/s)')
    const { p1, p2 } = ordered()
    const v = velocity()
    const a = actualAccel()
    ctx.strokeStyle = COL.vel
    ctx.lineWidth = 4
    if (a === 0) {
      const y = toScreenY(v)
      ctx.beginPath(); ctx.moveTo(toScreenX(p1.x), y); ctx.lineTo(toScreenX(p2.x), y); ctx.stroke()
      // answer highlight chip — gold accent
      chip(ctx, `v = ${v.toFixed(3)} m/s`, (toScreenX(p1.x) + toScreenX(p2.x)) / 2, y - 16, { color: COL.acc, size: 13 })
      drawDot(toScreenX(p1.x), y, COL.vel, 6)
      drawDot(toScreenX(p2.x), y, COL.vel, 6)
    } else {
      const vEnd = v + a * (p2.x - p1.x)
      ctx.beginPath()
      ctx.moveTo(toScreenX(p1.x), toScreenY(v))
      ctx.lineTo(toScreenX(p2.x), toScreenY(vEnd))
      ctx.stroke()
      // Biased OUTWARD (p1 is the left point from ordered()): v₀ extends left, v
      // extends right, so the two never collide when the points are dragged close.
      chip(ctx, `v₀ = ${v.toFixed(3)} m/s`, toScreenX(p1.x) - 10, toScreenY(v) - 12, { color: COL.vel, align: 'right' })
      chip(ctx, `v = ${vEnd.toFixed(3)} m/s`, toScreenX(p2.x) + 10, toScreenY(vEnd) - 12, { color: COL.acc, align: 'left' })
      drawDot(toScreenX(p1.x), toScreenY(v), COL.vel, 6)
      drawDot(toScreenX(p2.x), toScreenY(vEnd), COL.vel, 6)
    }
  }

  function renderAcceleration() {
    const { toScreenX, toScreenY } = transforms()
    drawAxesAndGrid(toScreenX, toScreenY)
    axisLabels('Time (s)', 'Acceleration (m/s²)')
    const { p1, p2 } = ordered()
    const a = actualAccel()
    const y = toScreenY(a)
    ctx.strokeStyle = COL.acc
    ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(toScreenX(p1.x), y); ctx.lineTo(toScreenX(p2.x), y); ctx.stroke()
    // answer highlight chip — gold accent
    chip(ctx, `a = ${a.toFixed(3)} m/s²`, (toScreenX(p1.x) + toScreenX(p2.x)) / 2, y - 16, { color: COL.acc, size: 13 })
    drawDot(toScreenX(p1.x), y, COL.acc, 6)
    drawDot(toScreenX(p2.x), y, COL.acc, 6)
  }

  function render() {
    if (context === 'generic') { renderPosition(); return }
    if (graphView === 'velocity') { renderVelocity(); return }
    if (graphView === 'acceleration') { renderAcceleration(); return }
    renderPosition()
  }

  // --- pointer input: drag the two points (only meaningful on the P-T graph
  //     in points mode; the derived graphs are read-only) -------------------
  let dragging: 0 | 1 | 2 = 0 // which point is being dragged
  const canDrag = () =>
    showRiseRun() && (context === 'generic' || graphView === 'position')

  const pointerToData = (e: PointerEvent): Pt => {
    const rect = canvas.getBoundingClientRect()
    const { toScreenX, toScreenY } = transforms()
    // invert the screen transform numerically using the view
    const { v } = transforms()
    const { w, h } = dims()
    const sx = (w - 2 * PADDING) / (v.xMax - v.xMin)
    const sy = (h - 2 * PADDING) / (v.yMax - v.yMin)
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    void toScreenX; void toScreenY
    return {
      x: (px - PADDING) / sx + v.xMin,
      y: -(py - (h - PADDING)) / sy + v.yMin,
    }
  }

  const screenDistTo = (e: PointerEvent, p: Pt) => {
    const rect = canvas.getBoundingClientRect()
    const { toScreenX, toScreenY } = transforms()
    return Math.hypot((e.clientX - rect.left) - toScreenX(p.x), (e.clientY - rect.top) - toScreenY(p.y))
  }

  function onPointerDown(e: PointerEvent) {
    if (!canDrag()) return
    const d1 = screenDistTo(e, point1)
    const d2 = screenDistTo(e, point2)
    if (d1 <= 18 && d1 <= d2) dragging = 1
    else if (d2 <= 18) dragging = 2
    else return
    canvas.setPointerCapture?.(e.pointerId)
    e.preventDefault()
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return
    const p = pointerToData(e)
    // round to a tidy 0.1 so coordinates read cleanly
    p.x = Math.round(p.x * 10) / 10
    p.y = Math.round(p.y * 10) / 10
    if (dragging === 1) point1 = p; else point2 = p
    interactions++
    render()
    opts?.invalidate()
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragging) return
    dragging = 0
    canvas.releasePointerCapture?.(e.pointerId)
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.style.cursor = 'crosshair'

  const engine: SimEngine = {
    render,
    setParams(values: ParamValues) {
      const prevContext = context
      const prevMode = inputMode
      context = String(values.context ?? context) as 'kinematics' | 'generic'
      inputMode = String(values.inputMode ?? inputMode) as 'points' | 'equation'
      graphView = String(values.graphView ?? graphView) as 'position' | 'velocity' | 'acceleration'
      x0 = Number(values.x0 ?? x0)
      v0 = Number(values.v0 ?? v0)
      acceleration = Number(values.acceleration ?? acceleration)
      timeRange = Math.max(0.1, Number(values.timeRange ?? timeRange))
      // generic mode has no derived graphs / equation input
      if (context === 'generic') { inputMode = 'points'; graphView = 'position' }
      syncEquationPoints()
      if (prevContext !== context || prevMode !== inputMode) interactions++
      interactions++
    },
    reset() {
      point1 = { x: 0, y: 0 }
      point2 = { x: 4, y: 8 }
      x0 = 0; v0 = 2; acceleration = 0; timeRange = 4
      interactions = 0
      syncEquationPoints()
      render()
    },
    getReadouts() {
      const r = slopeResult()
      const slope = r?.slope ?? 0
      return {
        slope: Number(slope.toFixed(3)),
        rise: Number((r?.deltaY ?? 0).toFixed(2)),
        run: Number((r?.deltaX ?? 0).toFixed(2)),
        intercept: Number(yIntercept().toFixed(3)),
        velocity: Number(velocity().toFixed(3)),
        acceleration: Number(actualAccel().toFixed(3)),
      }
    },
    // Complete once the student has engaged enough to read a slope off the
    // graph — dragging points / changing params (mirrors the bespoke
    // calculate + points_added criteria, keyed to engagement rather than clicks).
    isComplete() {
      return interactions >= 2 && slopeResult() !== null
    },
    destroy() {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
    },
  }
  return engine
}
