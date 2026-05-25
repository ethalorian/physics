import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'

// Constant-velocity walker. Re-expressed on canvas with a SPLIT view: an overhead
// track up top (the walker) and a LIVE position-time graph below that draws itself
// as the walker moves, with a rise-over-run slope triangle labeling the velocity.
// The core idea — constant velocity is a straight line, slope = velocity — is shown
// live. Direction is a LIVE control; speed is fixed per run. Physics is exact.

type Dir = 'forward' | 'backward' | 'stopped'
interface Pt { time: number; position: number; velocity: number }

const COL = {
  laneTop: '#EEEDFE', laneBot: '#F6F4FF',
  track: '#7F77DD', origin: '#534AB7',
  walker: '#26215C', trail: 'rgba(127,119,221,0.35)',
  fwd: '#1D9E75', back: '#185FA5', stop: '#6F6A86',
  axis: '#B9B3D6', grid: 'rgba(60,52,137,0.08)', zero: '#534AB7',
  line: '#7F77DD', pen: '#26215C', tri: '#BA7517',
  text: '#26215C', mute: '#6F6A86',
}

export function createConstantVelocityEngine(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, initial: ParamValues): SimEngine {
  let speed = Number(initial.speed ?? 1)
  let dir = (String(initial.direction ?? 'stopped') as Dir)
  let position = 0
  let t = 0
  let nextSample = 0
  let lastGraph = -1
  let pts: Pt[] = []
  let graph: { t: number; p: number }[] = []
  let trail: number[] = [] // recent walker world-x for fade

  const vel = () => (dir === 'forward' ? speed : dir === 'backward' ? -speed : 0)
  const dirColor = () => (dir === 'forward' ? COL.fwd : dir === 'backward' ? COL.back : COL.stop)
  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  function render() {
    const { w, h } = dims()
    ctx.clearRect(0, 0, w, h)

    const trackH = h * 0.42
    const gTop = trackH + 10
    const gH = h - gTop - 6

    // ---- overhead track ----
    const lane = ctx.createLinearGradient(0, 0, 0, trackH)
    lane.addColorStop(0, COL.laneTop); lane.addColorStop(1, COL.laneBot)
    ctx.fillStyle = lane; ctx.fillRect(0, 0, w, trackH)

    const left = w * 0.08, right = w * 0.92, span = right - left
    const midY = trackH * 0.58
    const toX = (m: number) => left + ((m + 10) / 20) * span

    ctx.strokeStyle = COL.track; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(left, midY); ctx.lineTo(right, midY); ctx.stroke()
    ctx.fillStyle = COL.mute; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'
    for (const m of [-10, -5, 0, 5, 10]) {
      const x = toX(m)
      ctx.strokeStyle = m === 0 ? COL.origin : 'rgba(0,0,0,0.10)'; ctx.lineWidth = m === 0 ? 2 : 1
      ctx.beginPath(); ctx.moveTo(x, midY - 14); ctx.lineTo(x, midY + 14); ctx.stroke()
      ctx.fillStyle = m === 0 ? COL.origin : COL.mute
      ctx.fillText(m === 0 ? '0 m' : `${m}`, x, midY + 30)
    }

    // walker trail
    trail.forEach((mx, i) => {
      const a = (i / trail.length) * 0.35
      ctx.fillStyle = `rgba(127,119,221,${a})`
      ctx.beginPath(); ctx.arc(toX(Math.max(-10, Math.min(10, mx))), midY, 4, 0, Math.PI * 2); ctx.fill()
    })

    // walker
    const wx = toX(Math.max(-10, Math.min(10, position)))
    ctx.fillStyle = COL.walker
    ctx.beginPath(); ctx.arc(wx, midY - 24, 7, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = COL.walker; ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(wx, midY - 17); ctx.lineTo(wx, midY - 3); ctx.stroke()
    ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(wx, midY - 13); ctx.lineTo(wx - 6, midY - 6); ctx.moveTo(wx, midY - 13); ctx.lineTo(wx + 6, midY - 6); ctx.stroke() // arms
    ctx.beginPath(); ctx.moveTo(wx, midY - 3); ctx.lineTo(wx - 6, midY + 6); ctx.moveTo(wx, midY - 3); ctx.lineTo(wx + 6, midY + 6); ctx.stroke() // legs
    if (dir !== 'stopped') {
      const ax = dir === 'forward' ? wx + 18 : wx - 18
      ctx.strokeStyle = dirColor(); ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(dir === 'forward' ? wx + 10 : wx - 10, midY - 30); ctx.lineTo(ax, midY - 30)
      ctx.lineTo(ax + (dir === 'forward' ? -5 : 5), midY - 34); ctx.moveTo(ax, midY - 30)
      ctx.lineTo(ax + (dir === 'forward' ? -5 : 5), midY - 26); ctx.stroke()
    }

    // ---- live position-time graph ----
    const gLeft = w * 0.1, gRight = w * 0.96, gW = gRight - gLeft
    const gBot = gTop + gH - 18
    const plotH = gBot - gTop
    const tMax = Math.max(t, 10)
    let pMin = -5, pMax = 5
    for (const g of graph) { pMin = Math.min(pMin, g.p); pMax = Math.max(pMax, g.p) }
    const pad = (pMax - pMin) * 0.1 || 1
    pMin -= pad; pMax += pad
    const gx = (tt: number) => gLeft + (tt / tMax) * gW
    const gy = (p: number) => gBot - ((p - pMin) / (pMax - pMin)) * plotH

    // grid
    ctx.strokeStyle = COL.grid; ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const yy = gTop + (plotH * i) / 5
      ctx.beginPath(); ctx.moveTo(gLeft, yy); ctx.lineTo(gRight, yy); ctx.stroke()
    }
    // axes
    ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(gLeft, gTop); ctx.lineTo(gLeft, gBot); ctx.lineTo(gRight, gBot); ctx.stroke()
    // zero position line
    if (pMin < 0 && pMax > 0) {
      ctx.strokeStyle = COL.zero; ctx.lineWidth = 1; ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.moveTo(gLeft, gy(0)); ctx.lineTo(gRight, gy(0)); ctx.stroke(); ctx.setLineDash([])
    }
    // axis labels
    ctx.fillStyle = COL.mute; ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'; ctx.fillText('Position (m)', gLeft + 2, gTop + 10)
    ctx.textAlign = 'right'; ctx.fillText('Time (s)', gRight, gBot + 14)

    // plotted line
    if (graph.length > 1) {
      ctx.strokeStyle = COL.line; ctx.lineWidth = 3; ctx.lineJoin = 'round'
      ctx.beginPath()
      graph.forEach((g, i) => { const X = gx(g.t), Y = gy(g.p); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y) })
      ctx.stroke()
    }
    // integer-second dots
    pts.forEach((p) => { ctx.fillStyle = COL.line; ctx.beginPath(); ctx.arc(gx(p.time), gy(p.position), 3, 0, Math.PI * 2); ctx.fill() })

    // live pen + slope triangle (rise/run) over the last ~1s
    if (graph.length > 1) {
      const now = graph[graph.length - 1]
      ctx.fillStyle = COL.pen; ctx.beginPath(); ctx.arc(gx(now.t), gy(now.p), 4.5, 0, Math.PI * 2); ctx.fill()
      const prev = graph.find((g) => g.t >= now.t - 1) ?? graph[0]
      if (vel() !== 0 && now.t - prev.t > 0.3) {
        const x0 = gx(prev.t), y0 = gy(prev.p), x1 = gx(now.t), y1 = gy(now.p)
        ctx.strokeStyle = COL.tri; ctx.lineWidth = 1.5; ctx.setLineDash([3, 2])
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = COL.tri; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left'
        ctx.fillText(`slope = ${vel() > 0 ? '+' : ''}${vel().toFixed(1)} m/s`, x1 + 6, (y0 + y1) / 2)
      }
    }
  }

  const sample = () => { pts.push({ time: Math.round(t), position, velocity: vel() }) }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      position += vel() * dt
      t += dt
      if (t >= nextSample) { sample(); nextSample = Math.floor(t) + 1 }
      if (t - lastGraph >= 0.05) { graph.push({ t, p: position }); lastGraph = t }
      trail.push(position)
      if (trail.length > 40) trail.shift()
    },
    setParams(values: ParamValues) {
      speed = Number(values.speed ?? speed)
      dir = (String(values.direction ?? dir) as Dir)
    },
    start() {
      if (graph.length === 0) { graph.push({ t: 0, p: position }); sample() }
    },
    reset() {
      position = 0; t = 0; nextSample = 0; lastGraph = -1; pts = []; graph = []; trail = []; dir = 'stopped'
    },
    getReadouts() {
      return { time: t, position, velocity: vel() }
    },
    getData(): SimData {
      return {
        columns: ['Time (s)', 'Position (m)', 'Velocity (m/s)'],
        rows: pts.map((p) => [p.time, p.position, p.velocity]),
        xCol: 0, yCol: 1,
      }
    },
    isComplete() { return pts.length >= 10 },
    destroy() {},
  }
  return engine
}
