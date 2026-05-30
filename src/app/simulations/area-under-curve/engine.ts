import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'
import { PAL, clearField, axes as drawAxes, label, chip } from '@/components/simulations/lab/draw'

// Area under the curve — an input-driven graphing tutorial. Two control points
// define a line on a v-t / a-t / x-t graph; the shaded region between the line
// and the zero axis is the "area", which physically equals displacement (for a
// velocity-time graph), change in velocity (acceleration-time), etc. For a
// curved position-time graph the area is approximated with N Riemann rectangles
// under the parabola x = x0 + v0*t + ½at². This sim is NOT animated: the student
// drags the two points (or edits params) and the canvas redraws + asks the shell
// to re-read readouts via opts.invalidate(). Drawing is a faithful canvas port of
// the original SVG AreaGraph (700×450 design, padding 60).

type GraphType = 'velocity-time' | 'acceleration-time' | 'position-time'

interface Point { x: number; y: number }

// Logical design space of the original SVG. We render into this and letterbox.
const DESIGN_W = 700
const DESIGN_H = 450
const PADDING = 60

export function createAreaUnderCurveEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
  opts?: { invalidate: () => void },
): SimEngine {
  let graphType: GraphType = (initial.graphType as GraphType) ?? 'velocity-time'
  let point1: Point = { x: 0, y: 5 }
  let point2: Point = { x: 4, y: 5 }
  let numRectangles = (initial.numRectangles as number) ?? 4
  let v0 = (initial.v0 as number) ?? 0
  let acceleration = (initial.acceleration as number) ?? 0

  // Engagement tracking — mirrors the bespoke "did something meaningful" bar:
  // the student explored by moving points and/or switching graph type.
  let dragCount = 0
  let typesSeen = new Set<GraphType>([graphType])

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  // Letterbox the 700×450 design into the live canvas, preserving aspect ratio.
  const view = () => {
    const { w, h } = dims()
    const scale = Math.min(w / DESIGN_W, h / DESIGN_H)
    const ox = (w - DESIGN_W * scale) / 2
    const oy = (h - DESIGN_H * scale) / 2
    return { scale, ox, oy }
  }

  // ---- point ordering + area math (faithful to the bespoke) -----------------
  const ordered = () => (point1.x <= point2.x ? { p1: point1, p2: point2 } : { p1: point2, p2: point1 })

  function calculateArea() {
    const { p1, p2 } = ordered()
    const width = p2.x - p1.x
    const h1 = p1.y
    const h2 = p2.y

    if (Math.abs(h1 - h2) < 0.001) {
      return { area: h1 * width, absArea: Math.abs(h1 * width), shape: 'rectangle',
        rectangleArea: h1 * width, rectangleHeight: h1, triangleArea: 0, triangleHeight: 0, width, isNegative: h1 < 0 }
    }
    if (Math.abs(h1) < 0.001 && Math.abs(h2) >= 0.001) {
      return { area: 0.5 * h2 * width, absArea: Math.abs(0.5 * h2 * width), shape: 'triangle',
        rectangleArea: 0, rectangleHeight: 0, triangleArea: 0.5 * h2 * width, triangleHeight: h2, base: width, width, isNegative: h2 < 0 }
    }
    if (Math.abs(h2) < 0.001 && Math.abs(h1) >= 0.001) {
      return { area: 0.5 * h1 * width, absArea: Math.abs(0.5 * h1 * width), shape: 'triangle',
        rectangleArea: 0, rectangleHeight: 0, triangleArea: 0.5 * h1 * width, triangleHeight: h1, base: width, width, isNegative: h1 < 0 }
    }
    const minHeight = Math.min(Math.abs(h1), Math.abs(h2))
    const maxHeight = Math.max(Math.abs(h1), Math.abs(h2))
    const triangleHeight = maxHeight - minHeight
    const rectangleArea = minHeight * width
    const triangleArea = 0.5 * triangleHeight * width
    const totalArea = rectangleArea + triangleArea
    const signedArea = h1 >= 0 && h2 >= 0 ? totalArea : -totalArea
    return { area: signedArea, absArea: totalArea, shape: 'rectangle + triangle',
      rectangleArea, rectangleHeight: minHeight, triangleArea, triangleHeight, width, isNegative: signedArea < 0, h1, h2 }
  }

  const isCurvedPositionTime = () => {
    const { p1, p2 } = ordered()
    return graphType === 'position-time' && Math.abs(p1.y - p2.y) > 0.1
  }

  // Approximate Riemann-rectangle area for the curved position-time case.
  const rectangleSum = () => {
    const { p1, p2 } = ordered()
    const width = p2.x - p1.x
    const rectWidth = width / numRectangles
    const x0 = p1.y
    let sum = 0
    for (let i = 0; i < numRectangles; i++) {
      const dt = i * rectWidth
      const position = x0 + v0 * dt + 0.5 * acceleration * dt * dt
      sum += position * rectWidth
    }
    return sum
  }

  // ---- coordinate transforms (match the SVG scaling exactly) -----------------
  function bounds() {
    const xMin = Math.min(point1.x, point2.x, 0) - 0.5
    const xMax = Math.max(point1.x, point2.x) + 0.5
    const yMin = Math.min(point1.y, point2.y, 0) - 2
    const yMax = Math.max(point1.y, point2.y, 0) + 2
    const scaleX = (DESIGN_W - 2 * PADDING) / (xMax - xMin)
    const scaleY = (DESIGN_H - 2 * PADDING) / (yMax - yMin)
    return { xMin, xMax, yMin, yMax, scaleX, scaleY }
  }
  // Design-space pixel for a data coordinate.
  const dToScreenX = (x: number) => { const b = bounds(); return PADDING + (x - b.xMin) * b.scaleX }
  const dToScreenY = (y: number) => { const b = bounds(); return DESIGN_H - PADDING - (y - b.yMin) * b.scaleY }

  // Compose with the letterbox transform to canvas pixels.
  const cx = (x: number) => { const v = view(); return v.ox + dToScreenX(x) * v.scale }
  const cy = (y: number) => { const v = view(); return v.oy + dToScreenY(y) * v.scale }
  const s = (n: number) => n * view().scale // scale a design-space length

  // Inverse: canvas pixel -> data x/y (for dragging points).
  function canvasToData(px: number, py: number): Point {
    const v = view()
    const dx = (px - v.ox) / v.scale // design-space px
    const dy = (py - v.oy) / v.scale
    const b = bounds()
    const x = (dx - PADDING) / b.scaleX + b.xMin
    const y = (DESIGN_H - PADDING - dy) / b.scaleY + b.yMin
    return { x, y }
  }

  const graphLabels = () => {
    if (graphType === 'velocity-time') return { x: 'Time (s)', y: 'Velocity (m/s)' }
    if (graphType === 'acceleration-time') return { x: 'Time (s)', y: 'Acceleration (m/s²)' }
    return { x: 'Time (s)', y: 'Position (m)' }
  }

  // ---- render: faithful canvas reproduction of the SVG AreaGraph ------------
  function render() {
    const { w, h } = dims()
    clearField(ctx, w, h)
    ctx.save()

    const { p1, p2 } = ordered()
    const zeroLine = cy(0)
    const labels = graphLabels()

    // grid (40px squares in design space)
    ctx.strokeStyle = PAL.grid; ctx.lineWidth = 1
    for (let gx = 0; gx <= DESIGN_W; gx += 40) {
      ctx.beginPath(); ctx.moveTo(cx0(gx), cy0(0)); ctx.lineTo(cx0(gx), cy0(DESIGN_H)); ctx.stroke()
    }
    for (let gy = 0; gy <= DESIGN_H; gy += 40) {
      ctx.beginPath(); ctx.moveTo(cx0(0), cy0(gy)); ctx.lineTo(cx0(DESIGN_W), cy0(gy)); ctx.stroke()
    }

    if (isCurvedPositionTime()) {
      // Riemann rectangles under the parabola
      const width = p2.x - p1.x
      const rectWidth = width / numRectangles
      const x0 = p1.y
      for (let i = 0; i < numRectangles; i++) {
        const t = p1.x + i * rectWidth
        const position = x0 + v0 * (t - p1.x) + 0.5 * acceleration * (t - p1.x) * (t - p1.x)
        const rx = cx(t)
        const ry = cy(position)
        const rw = cx(t + rectWidth) - cx(t)
        const rh = zeroLine - ry
        ctx.fillStyle = 'rgba(29,158,117,0.22)'
        ctx.fillRect(rx, ry, rw, rh)
        ctx.strokeStyle = PAL.velocity; ctx.lineWidth = 1.5
        ctx.strokeRect(rx, ry, rw, rh)
      }
      // parabolic curve on top
      const numPoints = 100
      const timeStep = width / numPoints
      const x0b = p1.y
      ctx.strokeStyle = PAL.primary; ctx.lineWidth = 4; ctx.beginPath()
      for (let i = 0; i <= numPoints; i++) {
        const t = p1.x + i * timeStep
        const position = x0b + v0 * (t - p1.x) + 0.5 * acceleration * (t - p1.x) * (t - p1.x)
        const px = cx(t), py = cy(position)
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      }
      ctx.stroke()
    } else {
      // trapezoidal shaded area (flat semi-transparent velocity fill)
      ctx.fillStyle = 'rgba(29,158,117,0.22)'
      ctx.beginPath()
      ctx.moveTo(cx(p1.x), zeroLine)
      ctx.lineTo(cx(p1.x), cy(p1.y))
      ctx.lineTo(cx(p2.x), cy(p2.y))
      ctx.lineTo(cx(p2.x), zeroLine)
      ctx.closePath(); ctx.fill()
      ctx.strokeStyle = PAL.primary; ctx.lineWidth = 3; ctx.stroke()

      // decomposition line + labels for rectangle + triangle
      if (Math.abs(p1.y - p2.y) > 0.1) {
        const minY = Math.min(Math.abs(p1.y), Math.abs(p2.y))
        ctx.strokeStyle = PAL.velocity; ctx.lineWidth = 2; ctx.setLineDash([s(8), s(4)])
        ctx.beginPath(); ctx.moveTo(cx(p1.x), cy(minY)); ctx.lineTo(cx(p2.x), cy(minY)); ctx.stroke()
        ctx.setLineDash([])
        chip(ctx, 'Rectangle', (cx(p1.x) + cx(p2.x)) / 2, (cy(minY) + zeroLine) / 2, { color: PAL.velocity, size: s(13) })
        const maxY = Math.max(Math.abs(p1.y), Math.abs(p2.y))
        chip(ctx, 'Triangle', (cx(p1.x) + cx(p2.x)) / 2, (cy(maxY) + cy(minY)) / 2, { color: PAL.velocity, size: s(13) })
      }
    }

    // width dimension line + label (force / coral)
    ctx.strokeStyle = PAL.force; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(cx(p1.x), zeroLine + s(20)); ctx.lineTo(cx(p2.x), zeroLine + s(20)); ctx.stroke()
    chip(ctx, `Width = ${(p2.x - p1.x).toFixed(2)}`, (cx(p1.x) + cx(p2.x)) / 2, zeroLine + s(36), { color: PAL.force, size: s(13) })

    // height indicators (velocity / green). Clamp the left labels so they never
    // back into the rotated "Velocity (m/s)" axis title (at design x≈25) when a
    // point sits near the left edge, and the right label off the right edge.
    const hLeftX = Math.max(cx(p1.x) - s(60), cx0(64))
    const hRightX = Math.min(cx(p2.x) + s(60), cx0(DESIGN_W - 64))
    if (Math.abs(p1.y - p2.y) < 0.1) {
      chip(ctx, `h = ${Math.abs(p1.y).toFixed(2)}`, hLeftX, (cy(p1.y) + zeroLine) / 2, { color: PAL.velocity, size: s(13), align: 'center' })
    } else {
      chip(ctx, `h₁ = ${Math.abs(p1.y).toFixed(2)}`, hLeftX, (cy(p1.y) + zeroLine) / 2, { color: PAL.velocity, size: s(11), align: 'center' })
      chip(ctx, `h₂ = ${Math.abs(p2.y).toFixed(2)}`, hRightX, (cy(p2.y) + zeroLine) / 2, { color: PAL.velocity, size: s(11), align: 'center' })
    }

    // axes (shared axis tone; geometry preserved — origin may sit mid-field)
    ctx.strokeStyle = PAL.axis; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(cx(0), cy0(PADDING)); ctx.lineTo(cx(0), cy0(DESIGN_H - PADDING)); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx0(PADDING), cy(0)); ctx.lineTo(cx0(DESIGN_W - PADDING), cy(0)); ctx.stroke()

    // axis labels
    label(ctx, labels.x, cx0(DESIGN_W / 2), cy0(DESIGN_H - 15), { color: PAL.ink, size: s(18), weight: 'bold', align: 'center' })
    ctx.save()
    ctx.translate(cx0(25), cy0(DESIGN_H / 2)); ctx.rotate(-Math.PI / 2)
    label(ctx, labels.y, 0, 0, { color: PAL.ink, size: s(18), weight: 'bold', align: 'center' })
    ctx.restore()

    // line between points
    ctx.strokeStyle = PAL.primary; ctx.lineWidth = 5
    ctx.beginPath(); ctx.moveTo(cx(p1.x), cy(p1.y)); ctx.lineTo(cx(p2.x), cy(p2.y)); ctx.stroke()

    // vertical boundaries (dashed)
    ctx.strokeStyle = PAL.axis; ctx.lineWidth = 2; ctx.setLineDash([s(5), s(5)])
    ctx.beginPath(); ctx.moveTo(cx(p1.x), cy(p1.y)); ctx.lineTo(cx(p1.x), zeroLine); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx(p2.x), cy(p2.y)); ctx.lineTo(cx(p2.x), zeroLine); ctx.stroke()
    ctx.setLineDash([])

    // control points (draggable)
    ctx.fillStyle = PAL.primary; ctx.strokeStyle = PAL.onAccent; ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(cx(p1.x), cy(p1.y), s(10), 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    chip(ctx, `Start: ${p1.y.toFixed(1)}`, cx(p1.x), cy(p1.y) < zeroLine ? cy(p1.y) - s(25) : cy(p1.y) + s(30), { color: PAL.primary, size: s(13), align: 'center' })

    ctx.fillStyle = PAL.cool; ctx.strokeStyle = PAL.onAccent; ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(cx(p2.x), cy(p2.y), s(10), 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    chip(ctx, `End: ${p2.y.toFixed(1)}`, cx(p2.x), cy(p2.y) < zeroLine ? cy(p2.y) - s(25) : cy(p2.y) + s(30), { color: PAL.cool, size: s(13), align: 'center' })

    // AREA label inside region
    label(ctx, 'AREA', (cx(p1.x) + cx(p2.x)) / 2, (Math.min(cy(p1.y), cy(p2.y)) + zeroLine) / 2, { color: PAL.accent, size: s(24), weight: 'bold', align: 'center', baseline: 'middle' })

    ctx.restore()
  }

  // raw design-space pixel -> canvas pixel (no data transform), for grid/axes.
  function cx0(designPx: number) { const v = view(); return v.ox + designPx * v.scale }
  function cy0(designPx: number) { const v = view(); return v.oy + designPx * v.scale }

  // ---- pointer input: drag the two control points ---------------------------
  let dragging: 1 | 2 | null = null

  function hit(px: number, py: number): 1 | 2 | null {
    const r = s(16)
    if (Math.hypot(px - cx(point1.x), py - cy(point1.y)) <= r) return 1
    if (Math.hypot(px - cx(point2.x), py - cy(point2.y)) <= r) return 2
    return null
  }

  function localPt(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect()
    return { px: e.clientX - rect.left, py: e.clientY - rect.top }
  }

  function onPointerDown(e: PointerEvent) {
    const { px, py } = localPt(e)
    dragging = hit(px, py)
    if (dragging) {
      canvas.setPointerCapture?.(e.pointerId)
      canvas.style.cursor = 'grabbing'
    }
  }

  function onPointerMove(e: PointerEvent) {
    const { px, py } = localPt(e)
    if (!dragging) {
      canvas.style.cursor = hit(px, py) ? 'grab' : 'default'
      return
    }
    const d = canvasToData(px, py)
    // round to a tidy 0.1 so coordinates read cleanly
    const pt = { x: Math.round(d.x * 10) / 10, y: Math.round(d.y * 10) / 10 }
    if (dragging === 1) point1 = pt; else point2 = pt
    dragCount++
    render()
    opts?.invalidate()
  }

  function onPointerUp(e: PointerEvent) {
    if (dragging) {
      canvas.releasePointerCapture?.(e.pointerId)
      dragging = null
      canvas.style.cursor = 'default'
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointerleave', onPointerUp)

  const physicsArea = () => {
    if (graphType === 'velocity-time') return { name: 'Displacement', unit: 'm' }
    if (graphType === 'acceleration-time') return { name: 'Change in velocity', unit: 'm/s' }
    return { name: 'Average velocity', unit: 'm/s' }
  }

  const engine: SimEngine = {
    render,
    setParams(values: ParamValues) {
      if (typeof values.graphType === 'string') {
        const g = values.graphType as GraphType
        if (g !== graphType) { graphType = g; typesSeen.add(g) }
      }
      if (typeof values.numRectangles === 'number') numRectangles = values.numRectangles
      if (typeof values.v0 === 'number') v0 = values.v0
      if (typeof values.acceleration === 'number') acceleration = values.acceleration
      render()
    },
    reset() {
      graphType = 'velocity-time'
      point1 = { x: 0, y: 5 }
      point2 = { x: 4, y: 5 }
      numRectangles = 4
      v0 = 0
      acceleration = 0
      dragCount = 0
      typesSeen = new Set<GraphType>(['velocity-time'])
      render()
    },
    getReadouts() {
      const r = calculateArea()
      const curved = isCurvedPositionTime()
      const area = curved ? rectangleSum() : r.area
      return {
        area,
        shape: curved ? `${numRectangles} rectangles` : r.shape,
        width: ordered().p2.x - ordered().p1.x,
        physics: physicsArea().name,
      }
    },
    getData(): SimData {
      // For the curved case, log each Riemann rectangle; otherwise log the two
      // bounding points and the resulting area.
      if (isCurvedPositionTime()) {
        const { p1, p2 } = ordered()
        const width = p2.x - p1.x
        const rectWidth = width / numRectangles
        const x0 = p1.y
        const rows: (number | string)[][] = []
        for (let i = 0; i < numRectangles; i++) {
          const t = p1.x + i * rectWidth
          const position = x0 + v0 * (t - p1.x) + 0.5 * acceleration * (t - p1.x) * (t - p1.x)
          rows.push([i + 1, Math.round(t * 100) / 100, Math.round(position * 100) / 100, Math.round(position * rectWidth * 100) / 100])
        }
        return { columns: ['Rect', 't (s)', 'height', 'area'], rows, xCol: 1, yCol: 2 }
      }
      const r = calculateArea()
      const { p1, p2 } = ordered()
      return {
        columns: ['Point', 't (s)', 'value', 'cumulative area'],
        rows: [
          [1, p1.x, p1.y, 0],
          [2, p2.x, p2.y, Math.round(r.area * 100) / 100],
        ],
        xCol: 1, yCol: 2,
      }
    },
    // Complete once the student has meaningfully explored: dragged the points a
    // few times AND viewed more than one graph type (the bespoke "did something
    // meaningful" spirit — engagement, not a single correct answer).
    isComplete() {
      return dragCount >= 3 && typesSeen.size >= 2
    },
    destroy() {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerUp)
    },
  }
  return engine
}
