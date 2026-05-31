import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'
import { PAL, clearField, arrow, chip, label } from '@/components/simulations/lab/draw'

// Closing Speed — relative velocity of the asteroid (Unit 1, vectors & reference
// frames). The asteroid moves at its own speed in the Sun's frame, but Earth is
// ALSO moving (~30 km/s in its orbit). The speed at which they close — and how
// hard it hits — is the asteroid's velocity RELATIVE to Earth:
//   v_rel = v_asteroid − v_Earth      (a vector subtraction)
// The closing/impact speed is |v_rel|, which is almost always LARGER than the
// asteroid's own speed — a result you only get by subtracting vectors, not by
// looking at either speed alone. Reactive: the diagram updates live as you drag.

const VS = 4.6 // pixels per (km/s)

const COL = {
  bgTop: '#0B1026', bgBot: '#161B3A', star: '#E7E4FB',
  approach: PAL.axis, ast: '#9A8FA6', astEdge: '#5A5170', earth: '#2E73C8', earthLand: '#46B98A',
  va: PAL.velocity, ve: PAL.cool, vrel: PAL.accent,
  ink: '#EDEAFB', mute: '#9A93C0', panel: 'rgba(255,255,255,0.92)',
}

export function createClosingSpeedEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
): SimEngine {
  let vaMag = Number(initial.asteroidSpeed ?? 25)
  let veMag = Number(initial.earthSpeed ?? 30)
  let earthAngle = Number(initial.earthAngle ?? 75)

  const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + 0.3, a: Math.random() * 0.5 + 0.3 }))

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  function model() {
    const th = (earthAngle * Math.PI) / 180
    const va = { x: vaMag, y: 0 } // asteroid heads along the approach line (+x toward Earth)
    const ve = { x: veMag * Math.cos(th), y: veMag * Math.sin(th) }
    const vrel = { x: va.x - ve.x, y: va.y - ve.y } // asteroid velocity as seen from Earth
    const impact = Math.hypot(vrel.x, vrel.y)
    return { va, ve, vrel, impact }
  }

  function render() {
    const { w, h } = dims()
    const m = model()
    clearField(ctx, w, h, COL.bgTop)
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, COL.bgBot); sky.addColorStop(1, COL.bgTop)
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h)
    stars.forEach((s) => { ctx.globalAlpha = s.a; ctx.fillStyle = COL.star; ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2); ctx.fill() })
    ctx.globalAlpha = 1

    label(ctx, 'Subtract the velocity vectors: v_rel = v_asteroid − v_Earth. Its length is the impact speed.', 14, 24, { color: COL.mute, size: 12 })

    // origin O = asteroid; Earth sits to the right along the line of approach
    const O = { x: w * 0.27, y: h * 0.66 }
    const earthX = w - 92
    ctx.strokeStyle = COL.approach; ctx.lineWidth = 1.5; ctx.setLineDash([7, 6])
    ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(earthX, O.y); ctx.stroke(); ctx.setLineDash([])

    // Earth
    ctx.fillStyle = COL.earth; ctx.beginPath(); ctx.arc(earthX, O.y, 22, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = COL.earthLand; ctx.beginPath(); ctx.arc(earthX - 7, O.y - 5, 8, 0, Math.PI * 2); ctx.arc(earthX + 6, O.y + 5, 6, 0, Math.PI * 2); ctx.fill()
    chip(ctx, 'EARTH', earthX, O.y + 38, { bg: COL.panel, color: COL.earth, size: 10 })

    // velocity triangle from O (screen y is down, so flip vy)
    const tip = (v: { x: number; y: number }) => ({ x: O.x + v.x * VS, y: O.y - v.y * VS })
    const A = tip(m.va), E = tip(m.ve)
    arrow(ctx, O.x, O.y, E.x, E.y, { color: COL.ve, width: 3, head: 9 })        // v_Earth
    arrow(ctx, O.x, O.y, A.x, A.y, { color: COL.va, width: 3, head: 9 })        // v_asteroid (toward Earth)
    arrow(ctx, E.x, E.y, A.x, A.y, { color: COL.vrel, width: 4, head: 11 })     // v_rel = v_a − v_e

    // labels anchored to the OUTER side of each vector so they never collide
    chip(ctx, `v_asteroid = ${vaMag.toFixed(0)} km/s`, (O.x + A.x) / 2, O.y + 18, { bg: COL.panel, color: COL.va, size: 11 })
    chip(ctx, `v_Earth = ${veMag.toFixed(0)} km/s`, E.x - 8, E.y - 8, { bg: COL.panel, color: COL.ve, size: 11, align: 'right' })
    chip(ctx, `impact speed = ${m.impact.toFixed(1)} km/s`, (E.x + A.x) / 2 + 12, (E.y + A.y) / 2, { bg: COL.panel, color: COL.vrel, size: 12, align: 'left' })

    // asteroid at the origin
    ctx.save(); ctx.translate(O.x, O.y)
    ctx.fillStyle = COL.ast; ctx.strokeStyle = COL.astEdge; ctx.lineWidth = 1.5
    ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const rr = 9 * (0.8 + 0.2 * Math.abs(Math.sin(i * 2.1))); const px = Math.cos(a) * rr, py = Math.sin(a) * rr; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py) }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore()

    // headline takeaway
    ctx.fillStyle = COL.ink; ctx.font = 'bold 15px ui-sans-serif, system-ui, sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(`Own speed ${vaMag.toFixed(0)} km/s — but it closes on Earth at ${m.impact.toFixed(0)} km/s`, w / 2, h - 18)
  }

  const engine: SimEngine = {
    render,
    setParams(values: ParamValues) {
      vaMag = Number(values.asteroidSpeed ?? vaMag)
      veMag = Number(values.earthSpeed ?? veMag)
      earthAngle = Number(values.earthAngle ?? earthAngle)
    },
    reset() {},
    getReadouts() {
      const m = model()
      return {
        impactSpeed: m.impact,
        ownSpeed: vaMag,
        earthSpeed: veMag,
        boost: m.impact - vaMag,
      }
    },
    getData(): SimData {
      const m = model()
      return {
        columns: ['Quantity', 'Value (km/s)'],
        rows: [
          ['Asteroid own speed', vaMag],
          ['Earth speed', veMag],
          ['Impact / closing speed |v_rel|', parseFloat(m.impact.toFixed(2))],
        ],
        xCol: 0, yCol: 1,
      }
    },
    isComplete() { return true },
    destroy() {},
  }
  return engine
}
