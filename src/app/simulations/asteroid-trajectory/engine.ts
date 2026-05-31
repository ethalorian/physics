import type { SimEngine, ParamValues, SimData, SensorSample } from '@/components/simulations/lab/contract'
import { PAL, clearField, chip, label } from '@/components/simulations/lab/draw'

// Asteroid Trajectory — "Predicting 2026-XJ's Position" (Unit 1 transfer task).
// NASA tracks the asteroid: each week a new distance-from-Earth measurement comes
// in. Far from Earth the approach is ~constant velocity, so the distance-vs-time
// data falls on a straight LINE. The student fits the trend and EXTRAPOLATES it to
// distance = 0 — the predicted impact day. Slope = closing speed; x-intercept =
// arrival. Real measurements scatter, so the fit (and the prediction) carry
// uncertainty — exactly the reasoning the transfer task asks for. Mirrors lab 1.1
// (read a position-time graph) at cosmic scale.

const SEC_PER_DAY = 86400
const PER_MKM = 1e6 // km in one million km
const KMPS_TO_MKM_PER_DAY = (SEC_PER_DAY) / PER_MKM // 0.0864 Mkm/day per (km/s)
const N_OBS = 9
const REVEAL_T = 0.42 // s of animation between new observations

const COL = {
  bgTop: '#E7E4FB', bgBot: PAL.bg, axis: PAL.axis, grid: PAL.grid,
  pt: PAL.primary, ptEdge: '#5b52c4', fit: PAL.velocity, extrap: 'rgba(29,158,117,0.10)',
  earth: '#2E73C8', impact: PAL.force, ink: PAL.ink, mute: PAL.mute,
}

// deterministic noise so a given scenario always produces the same data
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createAsteroidTrajectoryEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
): SimEngine {
  let speedKmps = Number(initial.closingSpeed ?? 17) // true closing speed
  let startMkm = Number(initial.startDistance ?? 50) // distance at first observation
  let scatterPct = Number(initial.scatter ?? 4) // measurement scatter, % of start distance

  let t = 0
  let running = false
  let done = false
  let noise: number[] = []

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  // --- model ---
  const slopeTrue = () => speedKmps * KMPS_TO_MKM_PER_DAY // Mkm/day (magnitude)
  const tImpactTrue = () => startMkm / slopeTrue() // day distance hits 0
  const interval = () => (0.62 * tImpactTrue()) / (N_OBS - 1) // data spans ~62% of the way in
  const dTrue = (day: number) => startMkm - slopeTrue() * day

  function buildNoise() {
    const seed = Math.floor(speedKmps * 1000 + startMkm * 31 + scatterPct * 97) + 1
    const rnd = mulberry32(seed)
    const amt = (scatterPct / 100) * startMkm
    noise = Array.from({ length: N_OBS }, () => (rnd() - 0.5) * 2 * amt)
  }
  buildNoise()

  const revealed = () => (running || done ? Math.min(N_OBS, Math.floor(t / REVEAL_T) + 1) : N_OBS)

  function observations() {
    const n = revealed()
    const pts: { day: number; dist: number }[] = []
    for (let i = 0; i < n; i++) {
      const day = i * interval()
      pts.push({ day, dist: Math.max(0, dTrue(day) + noise[i]) })
    }
    return pts
  }

  // least-squares fit over the revealed observations
  function fit() {
    const p = observations()
    if (p.length < 2) return null
    const n = p.length
    const mx = p.reduce((s, q) => s + q.day, 0) / n
    const my = p.reduce((s, q) => s + q.dist, 0) / n
    let num = 0, den = 0
    for (const q of p) { num += (q.day - mx) * (q.dist - my); den += (q.day - mx) ** 2 }
    if (den === 0) return null
    const slope = num / den
    const intercept = my - slope * mx
    const predImpact = slope < 0 ? -intercept / slope : Infinity
    const measSpeed = -slope / KMPS_TO_MKM_PER_DAY
    return { slope, intercept, predImpact, measSpeed }
  }

  function render() {
    const { w, h } = dims()
    clearField(ctx, w, h)
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, COL.bgTop); sky.addColorStop(1, COL.bgBot)
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h)

    label(ctx, 'NASA tracking data for 2026-XJ — fit the trend, extrapolate to the arrival.', 14, 22, { color: COL.mute, size: 12 })

    const gx0 = 76, gx1 = w - 40, gy0 = 60, gy1 = h - 52 // top margin clears the title
    const f = fit()
    const tImpact = tImpactTrue()
    const xMax = tImpact * 1.24 // headroom so the impact point + label sit on-canvas
    const yMax = startMkm * 1.08
    const gX = (day: number) => gx0 + (day / xMax) * (gx1 - gx0)
    const gY = (d: number) => gy1 - (d / yMax) * (gy1 - gy0)

    // axes
    ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(gx0, gy0 - 4); ctx.lineTo(gx0, gy1); ctx.lineTo(gx1, gy1); ctx.stroke()
    label(ctx, 'distance from Earth (million km)', gx0 - 4, gy0 - 12, { color: COL.ink, size: 11, weight: 'bold' })
    label(ctx, 'days since first detection →', gx1, gy1 + 20, { color: COL.mute, size: 11, align: 'right' })
    // y ticks
    ctx.fillStyle = COL.mute; ctx.font = '10px ui-sans-serif, system-ui, sans-serif'; ctx.textAlign = 'right'
    for (let k = 0; k <= 4; k++) {
      const d = (yMax * k) / 4, y = gY(d)
      ctx.strokeStyle = COL.grid; ctx.beginPath(); ctx.moveTo(gx0, y); ctx.lineTo(gx1, y); ctx.stroke()
      ctx.fillStyle = COL.mute; ctx.fillText(d.toFixed(0), gx0 - 6, y + 3)
    }

    // extrapolation shading beyond the last observation
    const obs = observations()
    if (obs.length > 0) {
      const lastDay = obs[obs.length - 1].day
      ctx.fillStyle = COL.extrap
      ctx.fillRect(gX(lastDay), gy0, gX(xMax) - gX(lastDay), gy1 - gy0)
      label(ctx, 'extrapolation', (gX(lastDay) + gx1) / 2, gy0 + 14, { color: COL.mute, size: 10, align: 'center' })
    }

    // best-fit line + predicted impact
    if (f && f.slope < 0) {
      const xEnd = Math.min(f.predImpact, xMax)
      ctx.strokeStyle = COL.fit; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5])
      ctx.beginPath(); ctx.moveTo(gX(0), gY(f.intercept)); ctx.lineTo(gX(xEnd), gY(f.intercept + f.slope * xEnd)); ctx.stroke(); ctx.setLineDash([])
      chip(ctx, `slope → ${f.measSpeed.toFixed(1)} km/s`, gX(xMax * 0.34), gY(f.intercept + f.slope * xMax * 0.34) - 14, { bg: PAL.surface, color: COL.fit, size: 11 })
      // impact marker on the axis
      if (f.predImpact <= xMax) {
        const ix = gX(f.predImpact)
        ctx.strokeStyle = COL.impact; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3])
        ctx.beginPath(); ctx.moveTo(ix, gY(0)); ctx.lineTo(ix, gy0 + 20); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = COL.earth; ctx.beginPath(); ctx.arc(ix, gY(0), 7, 0, Math.PI * 2); ctx.fill()
        chip(ctx, `impact ≈ day ${Math.round(f.predImpact)}`, Math.min(ix, gx1 - 60), gY(0) - 16, { bg: PAL.surface, color: COL.impact, size: 11 })
      }
    }

    // data points (with small error whiskers)
    const amtPx = ((scatterPct / 100) * startMkm) / yMax * (gy1 - gy0)
    obs.forEach((q) => {
      const x = gX(q.day), y = gY(q.dist)
      if (amtPx > 1) {
        ctx.strokeStyle = COL.ptEdge; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(x, y - amtPx); ctx.lineTo(x, y + amtPx); ctx.stroke()
      }
      ctx.fillStyle = COL.pt; ctx.strokeStyle = COL.ptEdge; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    })
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (!running) return
      t += dt
      if (t > REVEAL_T * N_OBS + 0.6) { running = false; done = true }
    },
    setParams(values: ParamValues) {
      speedKmps = Number(values.closingSpeed ?? speedKmps)
      startMkm = Number(values.startDistance ?? startMkm)
      scatterPct = Number(values.scatter ?? scatterPct)
      buildNoise()
    },
    start(values: ParamValues) {
      this.setParams(values)
      t = 0; running = true; done = false
    },
    reset() { t = 0; running = false; done = false },
    getReadouts() {
      const f = fit()
      const obs = observations()
      const cur = obs.length ? obs[obs.length - 1] : { day: 0, dist: startMkm }
      return {
        predImpact: f && isFinite(f.predImpact) ? f.predImpact : 0,
        daysLeft: f && isFinite(f.predImpact) ? Math.max(0, f.predImpact - cur.day) : 0,
        measSpeed: f ? Math.abs(f.measSpeed) : 0,
        currentDist: cur.dist,
        observations: obs.length,
      }
    },
    getData(): SimData {
      return {
        columns: ['Day', 'Distance (million km)'],
        rows: observations().map((q) => [parseFloat(q.day.toFixed(1)), parseFloat(q.dist.toFixed(2))]),
        xCol: 0, yCol: 1,
      }
    },
    getSensorTrace(): SensorSample[] {
      return observations().map((q) => ({ x: q.day, y: q.dist }))
    },
    isComplete() { return done },
    destroy() {},
  }
  return engine
}
