import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'
import { PAL, clearField, arrow, chip, label } from '@/components/simulations/lab/draw'

// Kinetic-impactor (DART-style) asteroid deflection — Unit 3 capstone.
//
// Physics (idealized mechanics, REAL numbers): a spacecraft of mass m hits the
// asteroid at speed v. With ejecta, the momentum delivered is enhanced by β, so
// the asteroid gains Δp = β·m·v and a tiny cross-track velocity Δv = Δp / M_ast.
// Applied a lead time t before arrival, that nudge grows into a lateral miss
// distance ≈ Δv·t at Earth. The lesson: Δv is sub-mm/s, yet years of lead time
// turn it into thousands of km — and a bigger asteroid (M ∝ size³) blunts it fast.
//
// Honest visual: at the arrival plane, the cross-track miss and Earth's radius are
// drawn at the SAME scale (Earth's disk = 6371 km), so whether the asteroid clears
// the disk is physically correct. Only the along-track corridor is compressed
// (labeled "not to scale") — there's no way to draw light-seconds of approach.

const RHO = 3500 // kg/m³, stony asteroid
const EARTH_RADIUS_KM = 6371
const SEC_PER_YEAR = 3.15576e7
const ANIM_DURATION = 6.5 // seconds of animation for the whole corridor
const IMPACT_PROG = 0.28 // fraction of the corridor where the impactor strikes

const COL = {
  space: '#0B1026', spaceHi: '#161B3A', star: '#E7E4FB',
  ast: '#9A8FA6', astHi: '#C3BBD0', astEdge: '#5A5170',
  earth: '#2E73C8', earthLand: '#46B98A', earthGlow: 'rgba(70,185,138,0.25)',
  orig: PAL.mute, deflected: PAL.velocity, impactor: PAL.force,
  flash: '#FAC775', miss: PAL.accent, text: PAL.ink, onDark: '#EDEAFB', mute: '#9A93C0',
}

interface Sample { tYr: number; offKm: number }

export function createDartDeflectionEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
): SimEngine {
  let sizeM = Number(initial.asteroidSize ?? 300)
  let impMass = Number(initial.impactorMass ?? 20000)
  let impSpeed = Number(initial.impactorSpeed ?? 10) // km/s
  let beta = Number(initial.beta ?? 3.6)
  let leadYr = Number(initial.leadTime ?? 20)

  let t = 0
  let prog = 0
  let running = false
  let done = false
  let flash = 0
  let samples: Sample[] = []
  let lastSample = -1

  // Stars: fixed positions (don't regenerate per frame).
  const stars = Array.from({ length: 80 }, () => ({
    x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.3, a: Math.random() * 0.5 + 0.3,
  }))

  // ---- physics (pure function of current params) -------------------------
  function physics() {
    const r = sizeM / 2
    const M = RHO * (4 / 3) * Math.PI * r * r * r // kg
    const dp = beta * impMass * (impSpeed * 1000) // kg·m/s
    const dv = dp / M // m/s (cross-track)
    const missKm = (dv * leadYr * SEC_PER_YEAR) / 1000
    return { M, dp, dv, missKm, missR: missKm / EARTH_RADIUS_KM, isMiss: missKm > EARTH_RADIUS_KM }
  }

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  // cross-track offset (px) the asteroid has accrued at a given progress
  const offsetPxAt = (prog: number, arrivalPx: number) =>
    prog <= IMPACT_PROG ? 0 : arrivalPx * ((prog - IMPACT_PROG) / (1 - IMPACT_PROG))

  function render() {
    const { w, h } = dims()
    const p = physics()

    // ---- space backdrop ----
    clearField(ctx, w, h, COL.space)
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, COL.spaceHi); sky.addColorStop(1, COL.space)
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h)
    stars.forEach((s) => {
      ctx.globalAlpha = s.a; ctx.fillStyle = COL.star
      ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2); ctx.fill()
    })
    ctx.globalAlpha = 1

    // ---- corridor geometry ----
    const startX = 64
    const earthX = w - 156 // leaves room on the right for the miss bracket + label
    const baseY = h * 0.56
    const earthDiskR = 34 // px representing EARTH_RADIUS_KM (the to-scale anchor)
    const kmPerPx = EARTH_RADIUS_KM / earthDiskR
    const maxOffPx = baseY - 24 // keep the path on canvas
    const arrivalPxRaw = p.missKm / kmPerPx
    const arrivalPx = Math.min(arrivalPxRaw, maxOffPx)
    const clamped = arrivalPxRaw > maxOffPx

    const ix = startX + (earthX - startX) * IMPACT_PROG // impact point x
    const ax = startX + (earthX - startX) * prog
    const ay = baseY - offsetPxAt(prog, arrivalPx)

    // ---- Earth ----
    ctx.fillStyle = COL.earthGlow
    ctx.beginPath(); ctx.arc(earthX, baseY, earthDiskR + 9, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = COL.earth
    ctx.beginPath(); ctx.arc(earthX, baseY, earthDiskR, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = COL.earthLand
    ctx.beginPath(); ctx.arc(earthX - 10, baseY - 8, 12, 0, Math.PI * 2)
    ctx.arc(earthX + 9, baseY + 6, 9, 0, Math.PI * 2)
    ctx.arc(earthX + 4, baseY - 12, 6, 0, Math.PI * 2); ctx.fill()
    chip(ctx, 'EARTH', earthX, baseY + earthDiskR + 16, { bg: PAL.surface, color: COL.earth, size: 11 })

    // ---- original (do-nothing) collision course ----
    ctx.strokeStyle = COL.orig; ctx.lineWidth = 2; ctx.setLineDash([6, 6])
    ctx.beginPath(); ctx.moveTo(startX, baseY); ctx.lineTo(earthX, baseY); ctx.stroke()
    ctx.setLineDash([])
    chip(ctx, 'do nothing → impact', (startX + ix) / 2 + 30, baseY + 18, { bg: PAL.surface, color: COL.mute, size: 10 })

    // ---- predicted / actual deflected path (impact point → arrival offset).
    // Always drawn: faint+dashed as a prediction before/at launch, solid once the
    // asteroid is under way. ----
    {
      const previewing = !done && prog <= IMPACT_PROG
      ctx.strokeStyle = COL.deflected; ctx.lineWidth = 2.5
      ctx.globalAlpha = previewing ? 0.5 : 1
      if (previewing) ctx.setLineDash([4, 5])
      ctx.beginPath(); ctx.moveTo(ix, baseY); ctx.lineTo(earthX, baseY - arrivalPx); ctx.stroke()
      ctx.setLineDash([]); ctx.globalAlpha = 1
    }

    // ---- impact marker / momentum kick (after the strike) ----
    if (prog >= IMPACT_PROG) {
      // incoming impactor (coral arrow from below) + cross-track kick (up)
      if (flash > 0) {
        ctx.fillStyle = `rgba(250,199,117,${flash / 0.3})`
        ctx.beginPath(); ctx.arc(ix, baseY, 10 * (flash / 0.3) + 5, 0, Math.PI * 2); ctx.fill()
      }
      arrow(ctx, ix, baseY + 40, ix, baseY + 8, { color: COL.impactor, width: 3, head: 9 })
      arrow(ctx, ix, baseY, ix, baseY - 30, { color: COL.deflected, width: 3, head: 9 })
      chip(ctx, `Δp = β·m·v`, ix, baseY + 52, { bg: PAL.surface, color: COL.impactor, size: 10 })
      chip(ctx, `Δv = ${(physics().dv * 1000).toFixed(1)} mm/s`, ix - 4, baseY - 38, { bg: PAL.surface, color: COL.deflected, size: 10, align: 'center' })
    }

    // ---- asteroid (always shown: at the launch corridor, in flight, or sailing
    // past Earth at arrival) ----
    {
      ctx.save(); ctx.translate(ax, ay)
      ctx.fillStyle = COL.ast; ctx.strokeStyle = COL.astEdge; ctx.lineWidth = 1.5
      ctx.beginPath()
      const R = Math.max(6, 4 + sizeM / 60)
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2
        const rr = R * (0.82 + 0.18 * Math.abs(Math.sin(i * 2.3)))
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      }
      ctx.closePath(); ctx.fill(); ctx.stroke()
      ctx.fillStyle = COL.astHi
      ctx.beginPath(); ctx.arc(-R * 0.3, -R * 0.3, R * 0.3, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }

    // ---- arrival outcome ----
    if (done) {
      // miss bracket at the arrival plane (to-scale vs Earth's disk)
      const topY = baseY - arrivalPx
      ctx.strokeStyle = COL.miss; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(earthX + 2, baseY); ctx.lineTo(earthX + 46, baseY)
      ctx.moveTo(earthX + 2, topY); ctx.lineTo(earthX + 46, topY); ctx.stroke()
      ctx.setLineDash([])
      arrow(ctx, earthX + 40, baseY, earthX + 40, topY, { color: COL.miss, width: 1.5, head: 7 })
      arrow(ctx, earthX + 40, topY, earthX + 40, baseY, { color: COL.miss, width: 1.5, head: 7 })
      chip(ctx, `miss ${p.missKm < 1e6 ? Math.round(p.missKm).toLocaleString() : p.missKm.toExponential(1)} km`, earthX + 40, (baseY + topY) / 2, { bg: PAL.surface, color: COL.miss, size: 10, align: 'left' })
      if (clamped) chip(ctx, '↑ off-scale', earthX, topY - 12, { bg: PAL.surface, color: COL.mute, size: 9 })

      // banner
      const ok = p.isMiss
      ctx.fillStyle = ok ? PAL.velocity : PAL.force
      ctx.font = 'bold 26px ui-sans-serif, system-ui, sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(ok ? '✓ EARTH MISSED' : '✗ IMPACT', w / 2, 40)
      ctx.fillStyle = COL.onDark; ctx.font = '13px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText(
        ok ? `Cleared Earth by ${p.missR.toFixed(2)}× its radius` : `Deflected only ${p.missR.toFixed(2)}× Earth's radius — still hits`,
        w / 2, 62,
      )
      if (!ok) { // strike flash on Earth
        ctx.fillStyle = 'rgba(250,199,117,0.7)'
        ctx.beginPath(); ctx.arc(earthX, baseY, earthDiskR + 6, 0, Math.PI * 2); ctx.fill()
      }
    }

    // ---- scale honesty note ----
    label(ctx, 'Corridor compressed (not to scale) · miss vs Earth radius shown to scale', 12, h - 12, { color: COL.mute, size: 11 })
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (flash > 0) flash = Math.max(0, flash - dt)
      if (!running) return
      const prevProg = prog
      t += dt
      prog = Math.min(t / ANIM_DURATION, 1)
      if (prevProg < IMPACT_PROG && prog >= IMPACT_PROG) flash = 0.3
      // log cross-track vs years-since-impact
      const p = physics()
      if (prog > IMPACT_PROG && t - lastSample >= 0.1) {
        const frac = (prog - IMPACT_PROG) / (1 - IMPACT_PROG)
        samples.push({ tYr: leadYr * frac, offKm: p.missKm * frac })
        lastSample = t
      }
      if (prog >= 1) { prog = 1; running = false; done = true; samples.push({ tYr: leadYr, offKm: p.missKm }) }
    },
    setParams(values: ParamValues) {
      sizeM = Number(values.asteroidSize ?? sizeM)
      impMass = Number(values.impactorMass ?? impMass)
      impSpeed = Number(values.impactorSpeed ?? impSpeed)
      beta = Number(values.beta ?? beta)
      leadYr = Number(values.leadTime ?? leadYr)
    },
    start(values: ParamValues) {
      this.setParams(values)
      t = 0; prog = 0; running = true; done = false; flash = 0; samples = []; lastSample = -1
    },
    reset() {
      t = 0; prog = 0; running = false; done = false; flash = 0; samples = []; lastSample = -1
    },
    getReadouts() {
      const p = physics()
      return {
        massBn: p.M / 1e9,
        deltaP: p.dp / 1e6,
        deltaV: p.dv * 1000,
        miss: p.missKm,
        missR: p.missR,
        outcome: p.isMiss ? 'MISS ✓' : 'HIT ✗',
      }
    },
    getData(): SimData {
      return {
        columns: ['Years since impact', 'Cross-track offset (km)'],
        rows: samples.map((s) => [parseFloat(s.tYr.toFixed(2)), Math.round(s.offKm)]),
        xCol: 0, yCol: 1,
      }
    },
    isComplete() { return done && physics().isMiss },
    destroy() {},
  }
  return engine
}
