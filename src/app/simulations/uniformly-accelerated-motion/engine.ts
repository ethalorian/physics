import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'

// Uniformly accelerated motion — the "oil-drop ticker": a car drops a spot every
// second, and the growing/shrinking spacing reveals constant acceleration. The
// canvas shows the ticker; the shell's Motion Detector shows velocity vs time
// (a straight line of slope = a). Physics is exact closed-form kinematics.

interface Spot { t: number; x: number; v: number }

const COL = {
  sky: '#EEEDFE', road: '#3A3550', lane: '#FAC775',
  car: '#534AB7', carDark: '#3C3489', window: '#BFE3FF', wheel: '#26215C',
  oil: '#1A1726', vel: '#1D9E75', label: '#EEEDFE', marker: '#9A93B8', text: '#fff',
}
const DOMAIN = 400 // metres of road shown

export function createUAMEngine(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, initial: ParamValues): SimEngine {
  let v0 = Number(initial.v0 ?? 5)
  let a = Number(initial.a ?? 2)
  let t = 0, x = 0, v = v0
  let done = false
  let lastSecond = -1
  let lastTrace = -1
  let spots: Spot[] = []
  let samp: { t: number; v: number; x: number }[] = []

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  function render() {
    const { w, h } = dims()
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = COL.sky; ctx.fillRect(0, 0, w, h)

    const roadTop = h * 0.34
    const roadH = h * 0.42
    const roadMid = roadTop + roadH / 2
    const left = w * 0.04, right = w * 0.96, span = right - left
    const toX = (m: number) => left + (Math.max(0, Math.min(DOMAIN, m)) / DOMAIN) * span

    // road
    ctx.fillStyle = COL.road; ctx.fillRect(left, roadTop, span, roadH)
    // lane dashes
    ctx.strokeStyle = COL.lane; ctx.lineWidth = 3; ctx.setLineDash([14, 12])
    ctx.beginPath(); ctx.moveTo(left, roadMid); ctx.lineTo(right, roadMid); ctx.stroke(); ctx.setLineDash([])
    // distance markers
    ctx.fillStyle = COL.marker; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
    for (let m = 0; m <= DOMAIN; m += 50) {
      const mx = toX(m)
      ctx.fillRect(mx, roadTop + roadH, 1, 5)
      ctx.fillText(`${m}`, mx, roadTop + roadH + 16)
    }

    // oil spots + time labels
    spots.forEach((s) => {
      const sx = toX(s.x)
      ctx.fillStyle = COL.oil
      ctx.beginPath(); ctx.ellipse(sx, roadMid + 14, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = COL.lane; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(`${s.t}s`, sx, roadMid - 16)
    })

    // car
    const cx = toX(x)
    const cy = roadMid
    // velocity arrow (ahead, length ∝ v; reversed if v<0)
    if (Math.abs(v) > 0.1) {
      const len = Math.max(-60, Math.min(60, v * 3))
      const ax = cx + 18 * Math.sign(len) + len
      ctx.strokeStyle = COL.vel; ctx.fillStyle = COL.vel; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(cx + 18 * Math.sign(len), cy); ctx.lineTo(ax, cy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(ax, cy)
      ctx.lineTo(ax - 6 * Math.sign(len), cy - 4); ctx.lineTo(ax - 6 * Math.sign(len), cy + 4); ctx.closePath(); ctx.fill()
    }
    // body
    ctx.fillStyle = COL.car
    ctx.beginPath(); ctx.roundRect(cx - 16, cy - 9, 32, 16, 4); ctx.fill()
    ctx.fillStyle = COL.window; ctx.beginPath(); ctx.roundRect(cx + 2, cy - 6, 9, 7, 2); ctx.fill()
    ctx.fillStyle = COL.wheel
    ctx.beginPath(); ctx.arc(cx - 8, cy + 8, 4, 0, Math.PI * 2); ctx.arc(cx + 8, cy + 8, 4, 0, Math.PI * 2); ctx.fill()

    // motion hint
    const hint = a > 0.01 ? 'speeding up — spots spread out' : a < -0.01 ? 'slowing down — spots bunch up' : 'constant velocity — even spacing'
    ctx.fillStyle = COL.car; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left'
    ctx.fillText(hint, left, roadTop - 10)
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (done) return
      // Forward-motion model (conceptual-first): a decelerating car brakes to
      // REST at v=0 rather than reversing (which would break the oil-spot story).
      if (a < 0) {
        const tStop = -v0 / a // exact time the car reaches v=0
        if (t + dt >= tStop) {
          t = tStop; v = 0; x = v0 * t + 0.5 * a * t * t
          const sec = Math.floor(t)
          if (sec > lastSecond) { spots.push({ t: sec, x, v }); lastSecond = sec }
          samp.push({ t, v: 0, x })
          done = true
          return
        }
      }
      t += dt
      v = v0 + a * t
      x = v0 * t + 0.5 * a * t * t
      const sec = Math.floor(t)
      if (sec > lastSecond) { spots.push({ t: sec, x, v }); lastSecond = sec }
      if (t - lastTrace >= 0.05) { samp.push({ t, v, x }); lastTrace = t }
      if (x > DOMAIN || t > 15) done = true
    },
    setParams(values: ParamValues) {
      v0 = Number(values.v0 ?? v0)
      a = Number(values.a ?? a)
      v = v0
    },
    start(values: ParamValues) {
      this.setParams(values)
      t = 0; x = 0; v = v0; done = false; lastSecond = -1; lastTrace = -1
      spots = [{ t: 0, x: 0, v: v0 }]
      samp = [{ t: 0, v: v0, x: 0 }]
    },
    reset() {
      t = 0; x = 0; v = v0; done = false; lastSecond = -1; lastTrace = -1; spots = []; samp = []
    },
    getReadouts() {
      return { time: t, position: x, velocity: v }
    },
    getData(): SimData {
      return {
        columns: ['Time (s)', 'Position (m)', 'Velocity (m/s)'],
        rows: spots.map((s) => [s.t, s.x, s.v]),
        xCol: 0, yCol: 2,
      }
    },
    getSensorTrace(key?: string) {
      return samp.map((s) => ({ x: s.t, y: key === 'position' ? s.x : s.v }))
    },
    isComplete() { return done },
    destroy() {},
  }
  return engine
}
