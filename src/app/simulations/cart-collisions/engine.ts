import type { SimEngine, ParamValues, SimData, SensorSample } from '@/components/simulations/lab/contract'
import { PAL, clearField, groundShadow, arrow, chip, label } from '@/components/simulations/lab/draw'

// Cart collisions (1D) — Unit 3, Vernier lab 3.1. Two carts on a track collide
// with a variable coefficient of restitution e (1 = perfectly elastic, 0 =
// perfectly inelastic / they stick). The general 1D result, from momentum
// conservation + the restitution definition v₂'−v₁' = −e(v₂−v₁):
//   v₁' = (m₁u₁ + m₂u₂ + m₂·e·(u₂−u₁)) / (m₁+m₂)
//   v₂' = (m₁u₁ + m₂u₂ + m₁·e·(u₁−u₂)) / (m₁+m₂)
// The discovery: total momentum is conserved for EVERY e; kinetic energy is
// conserved only at e = 1. Momentum and KE are independent conservation ideas.

const PPM = 40 // pixels per metre (display)
const FONT = 'ui-sans-serif, system-ui, sans-serif'

const COL = {
  floor: '#9ca3af', center: PAL.axis, wheel: PAL.ink,
  a: PAL.primary, aStroke: '#5b52c4', b: PAL.force, bStroke: '#a8421f',
  vel: PAL.velocity, flash: '#FAC775',
  pBar: PAL.primary, keBar: PAL.accent, keLost: PAL.mute,
  ink: PAL.ink, mute: PAL.mute,
}

interface Samp { t: number; v1: number; v2: number; p: number; ke: number }

export function createCartCollisionsEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
): SimEngine {
  let m1 = Number(initial.mass1 ?? 2)
  let m2 = Number(initial.mass2 ?? 1)
  let u1 = Number(initial.v1 ?? 2) // initial velocities (m/s, +right)
  let u2 = Number(initial.v2 ?? -1.5)
  let e = Number(initial.elasticity ?? 1)

  // live state (positions in px, velocities in m/s)
  let x1 = 0, x2 = 0, v1 = u1, v2 = u2
  let started = false, running = false, done = false
  let collided = false
  let flash = 0
  let time = 0, collisionT = -1
  let samples: Samp[] = []
  let lastSample = -1

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }
  const halfW = (m: number) => (50 + m * 12) / 2
  const trackBounds = () => { const { w } = dims(); return { left: 40, right: w - 40 } }

  const placeCarts = () => {
    const { left, right } = trackBounds()
    const span = right - left
    x1 = left + span * 0.26
    x2 = left + span * 0.64
  }
  placeCarts()

  // current totals (use live v's: before the collision these equal the initial)
  const momentum = () => m1 * v1 + m2 * v2
  const kinetic = () => 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2
  const pBefore = () => m1 * u1 + m2 * u2
  const keBefore = () => 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2

  function drawCart(cx: number, topY: number, m: number, vel: number, fill: string, stroke: string, name: string) {
    const cw = 50 + m * 12, ch = 36
    groundShadow(ctx, cx, topY + ch + 9, cw / 2, (cw / 2) * 0.3)
    ctx.fillStyle = fill; ctx.fillRect(cx - cw / 2, topY, cw, ch)
    ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.strokeRect(cx - cw / 2, topY, cw, ch)
    ctx.fillStyle = PAL.onAccent; ctx.font = `bold 14px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(`${m.toFixed(1)} kg`, cx, topY + ch / 2)
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = COL.wheel
    ctx.beginPath(); ctx.arc(cx - cw / 3, topY + ch, 7, 0, 2 * Math.PI); ctx.fill()
    ctx.beginPath(); ctx.arc(cx + cw / 3, topY + ch, 7, 0, 2 * Math.PI); ctx.fill()
    // velocity vector (green) above the cart + name tag below
    if (Math.abs(vel) > 0.05) {
      arrow(ctx, cx, topY - 12, cx + vel * 26, topY - 12, { color: COL.vel, width: 3, head: 9 })
      chip(ctx, `${vel.toFixed(2)} m/s`, cx + vel * 13, topY - 26, { color: COL.vel, size: 10 })
    }
    chip(ctx, name, cx, topY + ch + 22, { bg: PAL.surface, color: stroke, size: 11 })
  }

  // a labelled before/after bar pair (signed bars grow from a baseline)
  function barPair(x: number, y: number, wBar: number, hMax: number, title: string,
    before: number, after: number, scale: number, color: string, unit: string, signed: boolean) {
    label(ctx, title, x, y - hMax - 26, { color: COL.ink, weight: 'bold', size: 12 })
    const baseY = signed ? y - hMax / 2 : y
    if (signed) { ctx.strokeStyle = PAL.gridStrong; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 4, baseY); ctx.lineTo(x + wBar * 2 + 24, baseY); ctx.stroke() }
    const draw = (bx: number, val: number, faded: boolean) => {
      const len = Math.max(-hMax / 2, Math.min(hMax / 2, val * scale)) * (signed ? 1 : 2)
      ctx.fillStyle = faded ? COL.keLost : color
      ctx.globalAlpha = faded ? 0.55 : 1
      if (signed) ctx.fillRect(bx, baseY - Math.max(0, len), wBar, Math.abs(len))
      else ctx.fillRect(bx, y - Math.min(hMax, val * scale), wBar, Math.min(hMax, val * scale))
      ctx.globalAlpha = 1
    }
    draw(x, before, false)
    draw(x + wBar + 14, after, after < before - 1e-6 && !signed)
    ctx.font = `10px ${FONT}`; ctx.fillStyle = COL.mute; ctx.textAlign = 'center'
    ctx.fillText('before', x + wBar / 2, y + 14)
    ctx.fillText('after', x + wBar + 14 + wBar / 2, y + 14)
    ctx.textAlign = 'center'; ctx.fillStyle = COL.ink; ctx.font = `bold 11px ${FONT}`
    ctx.fillText(`${after.toFixed(1)} ${unit}`, x + wBar + 14 + wBar / 2, y - Math.min(hMax, Math.abs(after) * scale) - 6)
  }

  function render() {
    const { w, h } = dims()
    clearField(ctx, w, h)
    const { left, right } = trackBounds()
    const trackY = h * 0.30
    const floorY = trackY + 36 + 8

    // track + centre line
    ctx.fillStyle = COL.floor; ctx.fillRect(left - 6, floorY, right - left + 12, 4)
    ctx.strokeStyle = COL.center; ctx.lineWidth = 1.5; ctx.setLineDash([8, 8])
    ctx.beginPath(); ctx.moveTo((left + right) / 2, trackY - 30); ctx.lineTo((left + right) / 2, floorY); ctx.stroke()
    ctx.setLineDash([])

    // collision flash
    if (flash > 0) {
      const fx = (x1 + halfW(m1) + x2 - halfW(m2)) / 2
      ctx.fillStyle = `rgba(250,199,117,${flash / 0.3})`
      ctx.beginPath(); ctx.arc(fx, trackY + 18, 14 * (flash / 0.3) + 6, 0, Math.PI * 2); ctx.fill()
    }

    drawCart(x1, trackY, m1, v1, COL.a, COL.aStroke, 'Cart A')
    drawCart(x2, trackY, m2, v2, COL.b, COL.bStroke, 'Cart B')

    // ---- conservation bars ----
    const barY = h - 56
    const barH = 84
    barPair(left + 30, barY, 34, barH, 'Momentum (kg·m/s)', pBefore(), momentum(), barH / 2 / Math.max(1, Math.abs(pBefore())), COL.pBar, 'kg·m/s', true)
    barPair((left + right) / 2 + 40, barY, 34, barH, 'Kinetic energy (J)', keBefore(), kinetic(), barH / Math.max(1, keBefore()), COL.keBar, 'J', false)

    // verdict line
    const pOk = Math.abs(momentum() - pBefore()) < 1e-6
    const keOk = Math.abs(kinetic() - keBefore()) < 1e-3
    if (collided || done) {
      label(ctx, pOk ? 'momentum: CONSERVED ✓' : 'momentum changed?!', left + 30, barY + 30, { color: PAL.velocity, weight: 'bold', size: 12 })
      label(ctx, keOk ? 'energy: conserved (elastic)' : `energy: ${(100 * (1 - kinetic() / Math.max(1e-9, keBefore()))).toFixed(0)}% lost to heat`, (left + right) / 2 + 40, barY + 30, { color: keOk ? PAL.velocity : COL.mute, weight: 'bold', size: 12 })
    }

    label(ctx, 'Two carts, your masses + velocities. Watch which quantity survives the crash.', left, 22, { color: COL.mute, size: 12 })
  }

  function applyCollision() {
    const M = m1 + m2
    const nv1 = (m1 * v1 + m2 * v2 + m2 * e * (v2 - v1)) / M
    const nv2 = (m1 * v1 + m2 * v2 + m1 * e * (v1 - v2)) / M
    v1 = nv1; v2 = nv2
    collided = true; flash = 0.3; collisionT = time
    // separate to exactly touching so they don't visually overlap
    const overlap = (halfW(m1) + halfW(m2)) - (x2 - x1)
    if (overlap > 0) { x1 -= overlap / 2; x2 += overlap / 2 }
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (flash > 0) flash = Math.max(0, flash - dt)
      if (!running) return
      const { left, right } = trackBounds()
      time += dt
      x1 += v1 * PPM * dt
      x2 += v2 * PPM * dt
      // collision when the carts touch and are approaching
      if (!collided && x2 - x1 <= halfW(m1) + halfW(m2) && v1 > v2) applyCollision()
      // keep carts on the track (stop at the ends; readouts are latched at impact)
      if (x1 - halfW(m1) < left) { x1 = left + halfW(m1); if (v1 < 0) v1 = 0 }
      if (x2 + halfW(m2) > right) { x2 = right - halfW(m2); if (v2 > 0) v2 = 0 }
      if (time - lastSample >= 0.05) {
        samples.push({ t: time, v1, v2, p: momentum(), ke: kinetic() }); lastSample = time
      }
      // end ~2 s after the collision (or after a long no-collision coast)
      if ((collided && time - collisionT > 2) || time > 8) { running = false; done = true }
    },
    setParams(values: ParamValues) {
      m1 = Number(values.mass1 ?? m1); m2 = Number(values.mass2 ?? m2)
      u1 = Number(values.v1 ?? u1); u2 = Number(values.v2 ?? u2)
      e = Number(values.elasticity ?? e)
      if (!running && !done) { v1 = u1; v2 = u2; placeCarts() }
    },
    start(values: ParamValues) {
      this.setParams(values)
      v1 = u1; v2 = u2; placeCarts()
      started = true; running = true; done = false; collided = false; flash = 0
      time = 0; collisionT = -1; samples = [{ t: 0, v1: u1, v2: u2, p: pBefore(), ke: keBefore() }]; lastSample = 0
    },
    reset() {
      v1 = u1; v2 = u2; placeCarts()
      started = false; running = false; done = false; collided = false; flash = 0
      time = 0; collisionT = -1; samples = []; lastSample = -1
    },
    getReadouts() {
      const type = e > 0.95 ? 'Elastic' : e < 0.05 ? 'Perfectly inelastic' : 'Inelastic'
      return {
        pBefore: pBefore(), pAfter: momentum(),
        keBefore: keBefore(), keAfter: kinetic(),
        keLost: 100 * (1 - kinetic() / Math.max(1e-9, keBefore())),
        type,
      }
    },
    getData(): SimData {
      return {
        columns: ['Time (s)', 'Cart A v (m/s)', 'Cart B v (m/s)', 'Total p (kg·m/s)', 'Total KE (J)'],
        rows: samples.map((s) => [
          parseFloat(s.t.toFixed(2)), parseFloat(s.v1.toFixed(2)), parseFloat(s.v2.toFixed(2)),
          parseFloat(s.p.toFixed(2)), parseFloat(s.ke.toFixed(2)),
        ]),
        xCol: 0, yCol: 3, // total momentum vs time → flat line through the collision
      }
    },
    getSensorTrace(key?: string): SensorSample[] {
      return samples.map((s) => ({ x: s.t, y: key === 'vB' ? s.v2 : s.v1 }))
    },
    isComplete() { return done && collided },
    destroy() { void started },
  }
  return engine
}
