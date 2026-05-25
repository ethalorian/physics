import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'

// Distance vs. displacement — a click-driven walk. The student clicks to send the
// bug to each new spot; the green polyline is the PATH it actually walked
// (distance = total length), while the lavender arrow runs straight from START to
// where the bug stands now (displacement = the net change in position). This sim
// is NOT animated: it reacts to clicks, so the canvas owns its own pointer input
// and asks the shell to re-read state via opts.invalidate() after each click.

const PPM = 42 // pixels per metre at the reference size
const MIN_DISTANCE = 15 // metres of path travelled before the sim counts as complete
const COL = {
  bg: '#F6F4FF', grid: '#E7E2FB', axis: '#C9C1EF',
  start: '#FAC775', startRing: '#E0A93C',
  path: '#1D9E75', node: '#3FB98C',
  disp: '#7F77DD',
  bug: '#D85A30', bugLeg: '#26215C', bugBack: '#B8471F',
  text: '#26215C', mute: '#6F6A86',
}

interface Pt { x: number; y: number } // metres, relative to START (0,0)

export function createDistanceDisplacementEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  _initial: ParamValues,
  opts?: { invalidate: () => void },
): SimEngine {
  // Path always begins at START (the origin, 0,0). Each click appends a waypoint.
  let path: Pt[] = [{ x: 0, y: 0 }]

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }
  // METRE space has +y up (physics convention); screen space has +y down.
  const center = () => { const { w, h } = dims(); return { cx: w / 2, cy: h / 2 } }
  const toScreen = (p: Pt) => { const { cx, cy } = center(); return { x: cx + p.x * PPM, y: cy - p.y * PPM } }
  const toMetres = (sx: number, sy: number): Pt => {
    const { cx, cy } = center()
    return { x: (sx - cx) / PPM, y: (cy - sy) / PPM }
  }

  const distance = () => {
    let d = 0
    for (let i = 1; i < path.length; i++) d += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y)
    return d
  }
  const last = () => path[path.length - 1]
  const dx = () => last().x - path[0].x
  const dy = () => last().y - path[0].y
  const displacement = () => Math.hypot(dx(), dy())

  function drawBug(x: number, y: number, headingDeg: number) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((headingDeg * Math.PI) / 180)
    // legs
    ctx.strokeStyle = COL.bugLeg; ctx.lineWidth = 2
    for (const off of [-6, 0, 6]) {
      ctx.beginPath(); ctx.moveTo(-2, off); ctx.lineTo(-12, off - 4); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(2, off); ctx.lineTo(12, off - 4); ctx.stroke()
    }
    // body
    ctx.fillStyle = COL.bug
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 12, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = COL.bugBack
    ctx.beginPath(); ctx.ellipse(0, 3, 8, 8, 0, 0, Math.PI * 2); ctx.fill()
    // head
    ctx.fillStyle = COL.bugLeg
    ctx.beginPath(); ctx.arc(0, -11, 5, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }

  function arrowhead(x0: number, y0: number, x1: number, y1: number, color: string) {
    const a = Math.atan2(y1 - y0, x1 - x0)
    ctx.fillStyle = color
    ctx.beginPath(); ctx.moveTo(x1, y1)
    ctx.lineTo(x1 - 12 * Math.cos(a - Math.PI / 6), y1 - 12 * Math.sin(a - Math.PI / 6))
    ctx.lineTo(x1 - 12 * Math.cos(a + Math.PI / 6), y1 - 12 * Math.sin(a + Math.PI / 6))
    ctx.closePath(); ctx.fill()
  }

  function render() {
    const { w, h } = dims()
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, w, h)

    const { cx, cy } = center()
    // metre grid
    ctx.strokeStyle = COL.grid; ctx.lineWidth = 1
    for (let gx = cx % PPM; gx < w; gx += PPM) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke() }
    for (let gy = cy % PPM; gy < h; gy += PPM) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke() }
    // axes through START
    ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke()

    // PATH (distance) — green polyline through every waypoint
    if (path.length > 1) {
      ctx.strokeStyle = COL.path; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      ctx.beginPath()
      path.forEach((p, i) => { const s = toScreen(p); if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y) })
      ctx.stroke()
      // waypoint dots
      ctx.fillStyle = COL.node
      path.slice(1).forEach((p) => { const s = toScreen(p); ctx.beginPath(); ctx.arc(s.x, s.y, 3.5, 0, Math.PI * 2); ctx.fill() })
    }

    // DISPLACEMENT (lavender arrow) — straight from START to the bug
    if (path.length > 1 && displacement() > 0.01) {
      const s0 = toScreen(path[0]), s1 = toScreen(last())
      ctx.strokeStyle = COL.disp; ctx.lineWidth = 3.5
      ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke()
      arrowhead(s0.x, s0.y, s1.x, s1.y, COL.disp)
    }

    // START marker (gold)
    const s0 = toScreen(path[0])
    ctx.strokeStyle = COL.startRing; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.arc(s0.x, s0.y, 9, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = COL.start
    ctx.beginPath(); ctx.arc(s0.x, s0.y, 6, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = COL.text; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('START', s0.x, s0.y - 14)

    // BUG at the current position, facing the last leg of travel
    const s1 = toScreen(last())
    let heading = 0
    if (path.length > 1) {
      const a = path[path.length - 2], b = last()
      heading = (Math.atan2(-(b.y - a.y), b.x - a.x) * 180) / Math.PI + 90
    }
    drawBug(s1.x, s1.y, heading)

    // hint / legend
    ctx.textAlign = 'left'; ctx.font = '11px sans-serif'
    if (path.length === 1) {
      ctx.fillStyle = COL.mute
      ctx.fillText('Click anywhere to walk the bug — build a path.', 12, h - 12)
    } else {
      ctx.fillStyle = COL.path; ctx.fillText('— path = distance walked', 12, h - 26)
      ctx.fillStyle = COL.disp; ctx.fillText('→ arrow = displacement (from start)', 12, h - 10)
    }
  }

  // ---- pointer input: each click walks the bug to a new waypoint -------------
  function onPointerDown(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect()
    const p = toMetres(e.clientX - rect.left, e.clientY - rect.top)
    // round to a tidy 0.25 m so coordinates read cleanly
    p.x = Math.round(p.x * 4) / 4
    p.y = Math.round(p.y * 4) / 4
    path.push(p)
    render()
    opts?.invalidate()
  }
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.style.cursor = 'crosshair'

  const engine: SimEngine = {
    render,
    setParams() {},
    reset() { path = [{ x: 0, y: 0 }]; render() },
    getReadouts() {
      return { distance: distance(), displacement: displacement(), dx: dx(), dy: dy() }
    },
    getData(): SimData {
      let cum = 0
      const rows: (number | string)[][] = path.map((p, i) => {
        if (i > 0) cum += Math.hypot(p.x - path[i - 1].x, p.y - path[i - 1].y)
        return [i, p.x, p.y, Math.round(cum * 100) / 100]
      })
      return {
        columns: ['Stop', 'x (m)', 'y (m)', 'Distance so far (m)'],
        rows,
        xCol: 1, yCol: 2,
      }
    },
    // Complete once the bug has walked at least MIN_DISTANCE of path — keyed to
    // the physics (how far it travelled) rather than how many times the student
    // clicked. A long enough path is where distance visibly outpaces displacement.
    isComplete() { return distance() >= MIN_DISTANCE },
    destroy() { canvas.removeEventListener('pointerdown', onPointerDown) },
  }
  return engine
}
