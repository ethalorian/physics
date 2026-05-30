import type { SimEngine, ParamValues, SimData, SensorSample } from '@/components/simulations/lab/contract'
import { PAL, clearField, chip, label } from '@/components/simulations/lab/draw'

// Picket-fence g — Unit 2, Vernier lab 2.1. A clear strip with evenly spaced
// opaque bands free-falls through a photogate. Each band breaks the beam; the
// gate logs the times. Because the band spacing Δx is known, each interval gives
// an average velocity v = Δx/Δt, which (for constant acceleration) equals the
// instantaneous velocity at the interval's MIDPOINT time. Plot those v vs t and
// the slope is g ≈ 9.8 m/s² — the same whatever the mass, spacing, or release
// height. That independence is the discovery.
//
// Reuses the exact free-fall model of freefall-cliff (d = ½gt², v = gt); adds the
// photogate timing and the v–t fit. Animation runs in slow motion so the band
// crossings are watchable, but every time/velocity logged is the real value.

const G = 9.8
const N_BANDS = 10
const TIME_SCALE = 0.1 // slow-mo: physics seconds advance at 0.1× wall time

const COL = {
  bgTop: '#E7E4FB', bgBot: PAL.bg, strip: 'rgba(127,119,221,0.16)', stripEdge: PAL.primary,
  band: PAL.ink, gatePost: '#3C3489', beam: PAL.force, beamLive: '#FAC775',
  pt: PAL.primary, fit: PAL.velocity, axis: PAL.axis, grid: PAL.grid, ink: PAL.ink, mute: PAL.mute,
}

interface Trigger { i: number; tau: number }

export function createPicketFenceEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
): SimEngine {
  let spacingCm = Number(initial.bandSpacing ?? 5)
  let releaseCm = Number(initial.releaseHeight ?? 10)
  let massG = Number(initial.mass ?? 50) // grams — deliberately has NO effect on g

  let tau = 0 // physics time since release (s)
  let running = false
  let done = false
  let triggers: Trigger[] = []
  let beamBlocked = false
  let flash = 0

  const spacingM = () => spacingCm / 100
  const releaseM = () => releaseCm / 100
  const dropAt = (t: number) => 0.5 * G * t * t // displacement of the fence, m
  // trigger i fires when the fence has fallen (releaseM + i·spacing)
  const tauOf = (i: number) => Math.sqrt((2 * (releaseM() + i * spacingM())) / G)

  // velocity points: average velocity over each interval, at the midpoint time
  function points() {
    const pts: { t: number; v: number }[] = []
    for (let k = 0; k < triggers.length - 1; k++) {
      const a = triggers[k], b = triggers[k + 1]
      pts.push({ t: (a.tau + b.tau) / 2, v: spacingM() / (b.tau - a.tau) })
    }
    return pts
  }
  function measuredG() {
    const p = points()
    if (p.length < 2) return 0
    const f = p[0], l = p[p.length - 1]
    return (l.v - f.v) / (l.t - f.t)
  }

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  function render() {
    const { w, h } = dims()
    clearField(ctx, w, h)
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, COL.bgTop); sky.addColorStop(1, COL.bgBot)
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h)

    // ---------- photogate scene (left) ----------
    const sceneX = w * 0.22
    const gateY = h * 0.46
    const ppm = 210 // px per metre (visual)
    const stripW = 40

    // the fence: bottom edge screen-y. At τ=0 the first band sits releaseM above gate.
    const bottomY = gateY - releaseM() * ppm + dropAt(tau) * ppm
    // strip body (long enough to cover all bands)
    const stripLen = (N_BANDS + 1) * spacingM() * ppm
    ctx.fillStyle = COL.strip
    ctx.fillRect(sceneX - stripW / 2, bottomY - stripLen, stripW, stripLen)
    ctx.strokeStyle = COL.stripEdge; ctx.lineWidth = 2
    ctx.strokeRect(sceneX - stripW / 2, bottomY - stripLen, stripW, stripLen)
    // opaque bands (every spacing up from the bottom edge)
    ctx.fillStyle = COL.band
    const bandH = Math.min(spacingM() * ppm * 0.5, 14)
    for (let i = 0; i <= N_BANDS; i++) {
      const by = bottomY - i * spacingM() * ppm
      if (by > -20 && by < h + 20) ctx.fillRect(sceneX - stripW / 2, by - bandH, stripW, bandH)
    }

    // photogate posts + beam
    ctx.fillStyle = COL.gatePost
    ctx.fillRect(sceneX - stripW / 2 - 26, gateY - 10, 18, 60)
    ctx.fillRect(sceneX + stripW / 2 + 8, gateY - 10, 18, 60)
    ctx.strokeStyle = beamBlocked || flash > 0 ? COL.beamLive : COL.beam
    ctx.lineWidth = beamBlocked || flash > 0 ? 4 : 2
    ctx.beginPath(); ctx.moveTo(sceneX - stripW / 2 - 8, gateY + 20); ctx.lineTo(sceneX + stripW / 2 + 8, gateY + 20); ctx.stroke()
    chip(ctx, 'photogate', sceneX, gateY + 64, { bg: PAL.surface, color: COL.gatePost, size: 10 })

    // ---------- v–t graph (right) ----------
    const gx0 = w * 0.46, gx1 = w - 30
    const gy0 = 58, gy1 = h - 56 // top margin clears the instruction line
    const pts = points()
    const tMax = Math.max(0.05, tauOf(N_BANDS) * 1.05)
    const vMax = Math.max(0.5, Math.sqrt(2 * G * (releaseM() + N_BANDS * spacingM())) * 1.1)
    const gX = (t: number) => gx0 + (t / tMax) * (gx1 - gx0)
    const gY = (v: number) => gy1 - (v / vMax) * (gy1 - gy0)

    ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(gx0, gy0 - 4); ctx.lineTo(gx0, gy1); ctx.lineTo(gx1, gy1); ctx.stroke()
    label(ctx, 'velocity (m/s)', gx0 - 2, gy0 - 12, { color: COL.ink, size: 11, weight: 'bold' })
    label(ctx, 'time (s) →', gx1, gy1 + 20, { color: COL.mute, size: 11, align: 'right' })

    // fitted line (slope = measured g), drawn once there are ≥2 points
    if (pts.length >= 2) {
      const m = measuredG()
      const b = pts[0].v - m * pts[0].t // intercept
      ctx.strokeStyle = COL.fit; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5])
      ctx.beginPath(); ctx.moveTo(gX(0), gY(b)); ctx.lineTo(gX(tMax), gY(m * tMax + b)); ctx.stroke(); ctx.setLineDash([])
      chip(ctx, `slope = g = ${m.toFixed(2)} m/s²`, (gx0 + gx1) / 2, gY(m * (tMax * 0.5) + b) - 16, { bg: PAL.surface, color: COL.fit, size: 12 })
    }
    // data points
    pts.forEach((p) => {
      ctx.fillStyle = COL.pt
      ctx.beginPath(); ctx.arc(gX(p.t), gY(p.v), 4, 0, Math.PI * 2); ctx.fill()
    })

    label(ctx, 'A banded strip falls through the gate. Each band gives a velocity — their slope is g.', 14, 22, { color: COL.mute, size: 12 })
    if (massG) label(ctx, `mass = ${massG} g  (try changing it — does g change?)`, 14, h - 14, { color: COL.mute, size: 11 })
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (flash > 0) flash = Math.max(0, flash - dt)
      if (!running) return
      tau += dt * TIME_SCALE
      // fire any band triggers we've reached
      for (let i = triggers.length; i <= N_BANDS; i++) {
        if (tau >= tauOf(i)) { triggers.push({ i, tau: tauOf(i) }); flash = 0.18; beamBlocked = true }
        else break
      }
      // beam "blocked" briefly after a trigger
      if (flash <= 0) beamBlocked = false
      if (triggers.length > N_BANDS) { running = false; done = true }
    },
    setParams(values: ParamValues) {
      spacingCm = Number(values.bandSpacing ?? spacingCm)
      releaseCm = Number(values.releaseHeight ?? releaseCm)
      massG = Number(values.mass ?? massG)
    },
    start(values: ParamValues) {
      this.setParams(values)
      tau = 0; running = true; done = false; triggers = []; beamBlocked = false; flash = 0
    },
    reset() {
      tau = 0; running = false; done = false; triggers = []; beamBlocked = false; flash = 0
    },
    getReadouts() {
      const p = points()
      return {
        measuredG: measuredG(),
        bandsTimed: triggers.length,
        vGate: p.length ? p[p.length - 1].v : 0,
        spacing: spacingCm,
        mass: massG,
        fallTime: tau,
      }
    },
    getData(): SimData {
      const p = points()
      return {
        columns: ['Interval #', 'Time (s)', 'Velocity (m/s)'],
        rows: p.map((q, i) => [i + 1, parseFloat(q.t.toFixed(3)), parseFloat(q.v.toFixed(3))]),
        xCol: 1, yCol: 2,
      }
    },
    getSensorTrace(): SensorSample[] {
      return points().map((p) => ({ x: p.t, y: p.v }))
    },
    isComplete() { return done },
    destroy() {},
  }
  return engine
}
