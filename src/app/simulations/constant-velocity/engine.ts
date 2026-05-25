import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'

// Constant-velocity walker. Originally a DOM/emoji sim; re-expressed on canvas so
// it lives on the shared platform. A walker moves along a 1D track; direction is
// a LIVE control (steer mid-run), speed is fixed per run. Samples (t, x, v) once
// per simulated second — the classic position-time data set.

type Dir = 'forward' | 'backward' | 'stopped'
interface Pt { time: number; position: number; velocity: number }

export function createConstantVelocityEngine(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, initial: ParamValues): SimEngine {
  let speed = Number(initial.speed ?? 1)
  let dir = (String(initial.direction ?? 'stopped') as Dir)
  let position = 0
  let t = 0
  let nextSample = 0
  let pts: Pt[] = []

  const vel = () => (dir === 'forward' ? speed : dir === 'backward' ? -speed : 0)
  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  function render() {
    const { w, h } = dims()
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#F4F2FF'
    ctx.fillRect(0, 0, w, h)

    const midY = h / 2
    const left = w * 0.08
    const right = w * 0.92
    const span = right - left
    // world range -10..+10 maps to left..right
    const toX = (m: number) => left + ((m + 10) / 20) * span

    // track
    ctx.strokeStyle = '#7F77DD'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(left, midY); ctx.lineTo(right, midY); ctx.stroke()

    // scale ticks
    ctx.fillStyle = '#6F6A86'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'
    for (const m of [-10, -5, 0, 5, 10]) {
      const x = toX(m)
      ctx.strokeStyle = m === 0 ? '#534AB7' : 'rgba(0,0,0,0.12)'
      ctx.lineWidth = m === 0 ? 2 : 1
      ctx.beginPath(); ctx.moveTo(x, midY - 18); ctx.lineTo(x, midY + 18); ctx.stroke()
      ctx.fillStyle = m === 0 ? '#534AB7' : '#6F6A86'
      ctx.fillText(m === 0 ? '0 m' : `${m}`, x, midY + 34)
    }

    // walker
    const wx = toX(Math.max(-10, Math.min(10, position)))
    ctx.fillStyle = '#26215C'
    ctx.beginPath(); ctx.arc(wx, midY - 26, 8, 0, Math.PI * 2); ctx.fill() // head
    ctx.strokeStyle = '#26215C'; ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(wx, midY - 18); ctx.lineTo(wx, midY - 2); ctx.stroke() // body
    // direction arrow
    if (dir !== 'stopped') {
      const ax = dir === 'forward' ? wx + 16 : wx - 16
      ctx.strokeStyle = dir === 'forward' ? '#1D9E75' : '#185FA5'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(wx, midY - 40); ctx.lineTo(ax, midY - 40)
      ctx.lineTo(ax + (dir === 'forward' ? -5 : 5), midY - 45); ctx.moveTo(ax, midY - 40)
      ctx.lineTo(ax + (dir === 'forward' ? -5 : 5), midY - 35); ctx.stroke()
    }
  }

  const sample = () => { pts.push({ time: Math.round(t), position, velocity: vel() }) }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      position += vel() * dt
      t += dt
      if (t >= nextSample) { sample(); nextSample = Math.floor(t) + 1 }
    },
    setParams(values: ParamValues) {
      speed = Number(values.speed ?? speed)
      dir = (String(values.direction ?? dir) as Dir)
    },
    start() {
      if (pts.length === 0) sample()
    },
    reset() {
      position = 0; t = 0; nextSample = 0; pts = []; dir = 'stopped'
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
