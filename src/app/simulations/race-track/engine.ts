import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'

// Race track — a car circles a track at constant speed. DISTANCE (the path) rises
// forever; DISPLACEMENT (straight line from start) rises to the diameter then
// falls back to 0 each lap. The canvas highlights the traveled arc (distance)
// against the displacement chord (arrow); the shell's sensor plots displacement
// vs time — the rise-and-fall that distinguishes it from distance. Exact circular
// motion.

const R = 100 // track radius (m)
const TRACK_W = 10
const START = -Math.PI / 2 // 12 o'clock

const COL = {
  bg: '#F6F4FF', grass: '#5DCAA5', track: '#3A3550', center: '#FAC775',
  start: '#FFFFFF', origin: '#9A93B8', disp: '#7F77DD', arc: '#1D9E75',
  car: '#D85A30', carWin: '#BFE3FF', wheel: '#26215C', text: '#26215C', mute: '#6F6A86',
}

export function createRaceTrackEngine(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, initial: ParamValues): SimEngine {
  let speed = Number(initial.speed ?? 20)
  let ang = 0       // radians travelled from start
  let distance = 0
  let t = 0
  let running = false
  let lastSample = -1
  let samp: { t: number; dist: number; disp: number; speed: number }[] = []
  let rows: (number)[][] = []
  let lastRow = -1

  const carAngle = () => START + ang
  const carPos = () => ({ x: R * Math.cos(carAngle()), y: R * Math.sin(carAngle()) })
  const startPos = () => ({ x: R * Math.cos(START), y: R * Math.sin(START) })
  const displacement = () => {
    const c = carPos(), s = startPos()
    return Math.hypot(c.x - s.x, c.y - s.y)
  }
  const laps = () => Math.floor(ang / (2 * Math.PI))
  const velocity = () => {
    const n = samp.length
    if (n < 2) return 0
    const dt = samp[n - 1].t - samp[n - 2].t
    return dt > 0 ? Math.abs((samp[n - 1].disp - samp[n - 2].disp) / dt) : 0
  }

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  function render() {
    const { w, h } = dims()
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, w, h)

    const cx = w / 2, cy = h / 2
    const ppm = (Math.min(w, h) * 0.40) / (R + TRACK_W)
    const sx = (mx: number) => cx + mx * ppm
    const sy = (my: number) => cy + my * ppm

    // grass + track annulus + inner grass
    ctx.fillStyle = COL.grass; ctx.beginPath(); ctx.arc(cx, cy, (R + TRACK_W) * ppm, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = COL.track; ctx.beginPath(); ctx.arc(cx, cy, (R + TRACK_W) * ppm, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = COL.grass; ctx.beginPath(); ctx.arc(cx, cy, (R - TRACK_W) * ppm, 0, Math.PI * 2); ctx.fill()

    // centerline (dashed gold)
    ctx.strokeStyle = COL.center; ctx.lineWidth = 2; ctx.setLineDash([10, 10])
    ctx.beginPath(); ctx.arc(cx, cy, R * ppm, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([])

    // traveled arc this lap (DISTANCE made visible) — bright over the centerline
    const lapAng = ang % (2 * Math.PI)
    if (lapAng > 0.001) {
      ctx.strokeStyle = COL.arc; ctx.lineWidth = 5
      ctx.beginPath(); ctx.arc(cx, cy, R * ppm, START, START + lapAng); ctx.stroke()
    }

    // start/finish tick + label
    const st = startPos()
    ctx.strokeStyle = COL.start; ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(sx(st.x) - 14, sy(st.y)); ctx.lineTo(sx(st.x) + 14, sy(st.y)); ctx.stroke()
    ctx.fillStyle = COL.text; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('START', sx(st.x), sy(st.y) - 10)

    // origin marker
    ctx.fillStyle = COL.origin; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill()

    // displacement chord (arrow from START to car)
    const c = carPos()
    if (ang > 0.001) {
      const x0 = sx(st.x), y0 = sy(st.y), x1 = sx(c.x), y1 = sy(c.y)
      ctx.strokeStyle = COL.disp; ctx.fillStyle = COL.disp; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke()
      const a = Math.atan2(y1 - y0, x1 - x0)
      ctx.beginPath(); ctx.moveTo(x1, y1)
      ctx.lineTo(x1 - 10 * Math.cos(a - Math.PI / 6), y1 - 10 * Math.sin(a - Math.PI / 6))
      ctx.lineTo(x1 - 10 * Math.cos(a + Math.PI / 6), y1 - 10 * Math.sin(a + Math.PI / 6))
      ctx.closePath(); ctx.fill()
    }

    // car (tangent to track)
    ctx.save(); ctx.translate(sx(c.x), sy(c.y)); ctx.rotate(carAngle() + Math.PI)
    ctx.fillStyle = COL.car; ctx.beginPath(); ctx.roundRect(-7, -11, 14, 22, 3); ctx.fill()
    ctx.fillStyle = COL.carWin; ctx.fillRect(-5, -7, 10, 6)
    ctx.fillStyle = COL.wheel
    ctx.fillRect(-9, -7, 3, 5); ctx.fillRect(6, -7, 3, 5); ctx.fillRect(-9, 2, 3, 5); ctx.fillRect(6, 2, 3, 5)
    ctx.restore()

    // legend
    ctx.textAlign = 'left'; ctx.font = '11px sans-serif'
    ctx.fillStyle = COL.arc; ctx.fillText('● arc = distance (path)', 10, h - 24)
    ctx.fillStyle = COL.disp; ctx.fillText('→ arrow = displacement (from start)', 10, h - 10)
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (!running) return
      ang += (speed / R) * dt
      distance += speed * dt
      t += dt
      if (t - lastSample >= 0.05) { samp.push({ t, dist: distance, disp: displacement(), speed }); lastSample = t }
      const sec = Math.floor(t)
      if (sec > lastRow) { rows.push([sec, distance, displacement(), speed, velocity(), laps()]); lastRow = sec }
    },
    setParams(values: ParamValues) { speed = Number(values.speed ?? speed) },
    start(values: ParamValues) {
      this.setParams(values)
      running = true
      if (samp.length === 0) { samp.push({ t: 0, dist: 0, disp: 0, speed }); rows.push([0, 0, 0, speed, 0, 0]) }
    },
    reset() {
      ang = 0; distance = 0; t = 0; running = false; lastSample = -1; lastRow = -1; samp = []; rows = []
    },
    getReadouts() {
      return { time: t, distance, displacement: displacement(), velocity: velocity(), laps: laps() }
    },
    getData(): SimData {
      return {
        columns: ['Time (s)', 'Distance (m)', 'Displacement (m)', 'Speed (m/s)', 'Velocity (m/s)', 'Laps'],
        rows,
        xCol: 0, yCol: 2,
      }
    },
    getSensorTrace(key?: string) {
      return samp.map((s, i) => {
        let y = s.disp
        if (key === 'distance') y = s.dist
        else if (key === 'speed') y = s.speed
        else if (key === 'velocity') {
          const prev = samp[i - 1]
          const dt = prev ? s.t - prev.t : 0
          y = prev && dt > 0 ? Math.abs((s.disp - prev.disp) / dt) : 0
        }
        return { x: s.t, y }
      })
    },
    isComplete() { return laps() >= 1 },
    destroy() {},
  }
  return engine
}
