import type { SimEngine, ParamValues, SimData, SensorSample } from '@/components/simulations/lab/contract'
import { PAL, clearField, groundShadow, chip, label } from '@/components/simulations/lab/draw'

// Impulse–momentum — Unit 3, Vernier lab 3.2. A cart of mass m hits a force
// sensor at speed v and rebounds. The sensor records the force pulse F(t) during
// the brief contact; the AREA under that pulse is the impulse J = ∫F dt, which
// equals the cart's change in momentum Δp = m(v_out − v_in). The headline lesson:
// the SAME impulse (same area = same Δp) can be delivered with a huge brief force
// or a small sustained one — soften the bumper (longer contact time) and the peak
// force drops while the area is unchanged. That's the airbag / egg-drop principle.
//
// Model: a half-sine pulse F(τ) = F_peak·sin(πτ/Δt) over contact time Δt, with
// F_peak = π·|Δp| / (2·Δt) so the area equals |Δp| exactly. |Δp| = m·v·(1+e),
// where e is the rebound (0 = stops dead, 1 = elastic bounce-back).

const FONT = 'ui-sans-serif, system-ui, sans-serif'
const APPROACH_T = 0.9 // s of animation for the approach
const CONTACT_T = 1.9 // s of animation spent rendering the contact pulse

const COL = {
  floor: '#9ca3af', wall: '#6F6A86', sensor: PAL.cool, cart: PAL.primary, cartStroke: '#5b52c4',
  wheel: PAL.ink, vel: PAL.velocity, curve: PAL.force, area: 'rgba(216,90,48,0.22)',
  peak: PAL.accent, axis: PAL.axis, grid: PAL.grid, ink: PAL.ink, mute: PAL.mute,
}

interface Samp { tau: number; F: number }

export function createImpulseMomentumEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
): SimEngine {
  let m = Number(initial.cartMass ?? 1)
  let vIn = Number(initial.impactSpeed ?? 3)
  let contactMs = Number(initial.contactTime ?? 100)
  let e = Number(initial.bounce ?? 0.5)

  let t = 0 // animation clock
  let running = false
  let done = false
  let samples: Samp[] = []

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  // ---- physics (pure) ----
  function phys() {
    const dt = contactMs / 1000 // contact time, s
    const dpMag = m * vIn * (1 + e) // |Δp| = impulse magnitude, N·s
    const Fpeak = (Math.PI * dpMag) / (2 * dt)
    const vOut = -e * vIn
    return { dt, dpMag, Fpeak, vOut }
  }
  const forceAt = (tau: number, dt: number, Fpeak: number) =>
    tau >= 0 && tau <= dt ? Fpeak * Math.sin((Math.PI * tau) / dt) : 0

  // current contact progress 0..1 (animation)
  const contactFrac = () => Math.max(0, Math.min(1, (t - APPROACH_T) / CONTACT_T))

  function render() {
    const { w, h } = dims()
    const p = phys()
    clearField(ctx, w, h)

    // ---------- scene (top) ----------
    const trackY = h * 0.20
    const floorY = trackY + 34
    const wallX = w - 70
    const left = 40

    // wall + force sensor
    ctx.fillStyle = COL.wall; ctx.fillRect(wallX, trackY - 40, 16, 96)
    ctx.fillStyle = COL.sensor; ctx.fillRect(wallX - 12, trackY - 6, 12, 40)
    chip(ctx, 'force sensor', wallX - 6, floorY + 22, { bg: PAL.surface, color: COL.sensor, size: 10, align: 'center' })
    // floor
    ctx.fillStyle = COL.floor; ctx.fillRect(left - 6, floorY, wallX - left + 6, 4)

    // cart position + squish
    const cw = 54, ch = 30
    const frac = contactFrac()
    const startCartX = left + 40
    const contactX = wallX - 12 - cw / 2 // cart centre at first touch
    let cartX: number, vNow: number
    if (t < APPROACH_T) {
      cartX = startCartX + (contactX - startCartX) * (t / APPROACH_T)
      vNow = vIn
    } else if (frac < 1) {
      const squish = 14 * Math.sin(Math.PI * frac) // visual compression
      cartX = contactX - squish
      const tau = frac * p.dt
      vNow = vIn - (p.dpMag / m) * (1 - Math.cos((Math.PI * tau) / p.dt)) / 2 // ∫a — monotone v_in→v_out
    } else {
      const overT = t - (APPROACH_T + CONTACT_T)
      cartX = contactX - Math.abs(p.vOut) * 60 * overT
      vNow = p.vOut
    }
    // cart
    groundShadow(ctx, cartX, floorY - 1, cw / 2, (cw / 2) * 0.3)
    ctx.fillStyle = COL.cart; ctx.fillRect(cartX - cw / 2, floorY - ch, cw, ch)
    ctx.strokeStyle = COL.cartStroke; ctx.lineWidth = 3; ctx.strokeRect(cartX - cw / 2, floorY - ch, cw, ch)
    ctx.fillStyle = PAL.onAccent; ctx.font = `bold 13px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(`${m.toFixed(1)} kg`, cartX, floorY - ch / 2); ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = COL.wheel
    ctx.beginPath(); ctx.arc(cartX - cw / 3, floorY, 6, 0, 2 * Math.PI); ctx.fill()
    ctx.beginPath(); ctx.arc(cartX + cw / 3, floorY, 6, 0, 2 * Math.PI); ctx.fill()
    // velocity arrow
    if (Math.abs(vNow) > 0.05) {
      const ax = cartX, ay = floorY - ch - 12
      ctx.strokeStyle = COL.vel; ctx.fillStyle = COL.vel; ctx.lineWidth = 3
      const tip = ax + vNow * 22
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(tip, ay); ctx.stroke()
      const dir = Math.sign(vNow)
      ctx.beginPath(); ctx.moveTo(tip, ay); ctx.lineTo(tip - dir * 8, ay - 4); ctx.lineTo(tip - dir * 8, ay + 4); ctx.closePath(); ctx.fill()
      chip(ctx, `${vNow.toFixed(1)} m/s`, ax + vNow * 11, ay - 14, { color: COL.vel, size: 10 })
    }

    // ---------- force–time graph (bottom) — mock Dual-Range Force Sensor ----------
    const gx0 = 70, gx1 = w - 40
    const gy1 = h - 52, gy0 = floorY + 70
    // x-axis is ABSOLUTE time (fixed window), so a longer contact draws a visibly
    // wider, flatter pulse — the airbag lesson you can see, not just read.
    const XMAX_S = 0.46 // graph spans 0..460 ms (fits the 400 ms max contact)
    // Both axes are FIXED per impulse: x in absolute ms, and y scaled so a
    // reference 80 ms pulse of this impulse fills ~82%. Because both scales are
    // independent of contact time, equal impulse ⇒ equal SHADED AREA — a tall
    // narrow spike and a low wide dome cover the same pixels. (Only contact times
    // far shorter than the reference clip the peak off the top.)
    const REF_DT = 0.08
    const FpeakRef = (Math.PI * p.dpMag) / (2 * REF_DT)
    const yFill = 0.82
    const toGx = (tau: number) => gx0 + (tau / XMAX_S) * (gx1 - gx0)
    const toGy = (F: number) => gy1 - Math.min(1, (F / FpeakRef) * yFill) * (gy1 - gy0)
    const peakClamped = (p.Fpeak / FpeakRef) * yFill > 1

    // axes + millisecond gridlines
    ctx.strokeStyle = COL.axis; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(gx0, gy0 - 6); ctx.lineTo(gx0, gy1); ctx.lineTo(gx1, gy1); ctx.stroke()
    ctx.textAlign = 'center'; ctx.font = `10px ${FONT}`
    for (let ms = 100; ms <= 400; ms += 100) {
      const gx = toGx(ms / 1000)
      ctx.strokeStyle = COL.grid; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(gx, gy0 - 6); ctx.lineTo(gx, gy1); ctx.stroke()
      ctx.fillStyle = COL.mute; ctx.fillText(`${ms}`, gx, gy1 + 16)
    }
    label(ctx, 'Force (N)', gx0 - 4, gy0 - 12, { color: COL.ink, size: 11, weight: 'bold' })
    label(ctx, 'time (ms) →', gx1 - 4, gy1 + 30, { color: COL.mute, size: 11, align: 'right' })

    // pulse up to current contact progress (reveal as it happens; full once past)
    const upto = t < APPROACH_T ? 0 : frac >= 1 ? p.dt : frac * p.dt
    if (upto > 0) {
      const N = 60
      // shaded area
      ctx.beginPath(); ctx.moveTo(gx0, gy1)
      for (let i = 0; i <= N; i++) {
        const tau = (i / N) * upto
        ctx.lineTo(toGx(tau), toGy(forceAt(tau, p.dt, p.Fpeak)))
      }
      ctx.lineTo(toGx(upto), gy1); ctx.closePath()
      ctx.fillStyle = COL.area; ctx.fill()
      // curve
      ctx.strokeStyle = COL.curve; ctx.lineWidth = 3; ctx.beginPath()
      for (let i = 0; i <= N; i++) {
        const tau = (i / N) * upto
        const gx = toGx(tau), gy = toGy(forceAt(tau, p.dt, p.Fpeak))
        if (i === 0) ctx.moveTo(gx, gy); else ctx.lineTo(gx, gy)
      }
      ctx.stroke()
    }

    // peak marker + labels once contact is essentially complete
    if (frac >= 1 || done) {
      const pkX = toGx(p.dt / 2), pkY = toGy(p.Fpeak)
      ctx.strokeStyle = COL.peak; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(pkX, pkY); ctx.lineTo(pkX, gy1); ctx.stroke(); ctx.setLineDash([])
      const pkLabelY = peakClamped ? gy0 + 11 : pkY - 12
      chip(ctx, `${peakClamped ? '↑ ' : ''}peak ${Math.round(p.Fpeak)} N`, pkX, pkLabelY, { bg: PAL.surface, color: COL.peak, size: 11 })
      chip(ctx, `Area = Impulse = Δp = ${p.dpMag.toFixed(1)} N·s`, (gx0 + gx1) / 2, (gy0 + gy1) / 2 + 30, { bg: PAL.surface, color: COL.curve, size: 12 })
    }

    label(ctx, 'Area under the F–t pulse = impulse = change in momentum.', left, 22, { color: COL.mute, size: 12 })
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (!running) return
      const p = phys()
      const prev = t
      t += dt
      // record the force pulse over the contact window (real τ)
      if (t >= APPROACH_T && prev < APPROACH_T + CONTACT_T) {
        const tau = Math.max(0, Math.min(p.dt, ((t - APPROACH_T) / CONTACT_T) * p.dt))
        samples.push({ tau, F: forceAt(tau, p.dt, p.Fpeak) })
      }
      if (t > APPROACH_T + CONTACT_T + 1.4) { running = false; done = true }
    },
    setParams(values: ParamValues) {
      m = Number(values.cartMass ?? m)
      vIn = Number(values.impactSpeed ?? vIn)
      contactMs = Number(values.contactTime ?? contactMs)
      e = Number(values.bounce ?? e)
    },
    start(values: ParamValues) {
      this.setParams(values)
      t = 0; running = true; done = false; samples = []
    },
    reset() {
      t = 0; running = false; done = false; samples = []
    },
    getReadouts() {
      const p = phys()
      return {
        impulse: p.dpMag,
        deltaP: p.dpMag,
        peakForce: p.Fpeak,
        vIn,
        vOut: p.vOut,
        contactMs,
      }
    },
    getData(): SimData {
      // F-t pulse sampled across the contact, plus running impulse (area)
      const p = phys()
      const N = 24
      let area = 0
      const rows: (number | string)[][] = []
      let prevF = 0, prevτ = 0
      for (let i = 0; i <= N; i++) {
        const tau = (i / N) * p.dt
        const F = forceAt(tau, p.dt, p.Fpeak)
        area += ((F + prevF) / 2) * (tau - prevτ) // trapezoid
        prevF = F; prevτ = tau
        rows.push([parseFloat((tau * 1000).toFixed(1)), Math.round(F), parseFloat(area.toFixed(2))])
      }
      return { columns: ['Time (ms)', 'Force (N)', 'Impulse so far (N·s)'], rows, xCol: 0, yCol: 1 }
    },
    getSensorTrace(): SensorSample[] {
      return samples.map((s) => ({ x: s.tau * 1000, y: s.F }))
    },
    isComplete() { return done },
    destroy() {},
  }
  return engine
}
