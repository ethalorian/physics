import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'
import { PAL, clearField, groundShadow, arrow } from '@/components/simulations/lab/draw'

// Constant-velocity walker. The canvas shows the overhead track (the scene); the
// shared mock sensor carries the position/velocity graph — same as every other
// sim, so the sensor behaves consistently everywhere. Direction is a LIVE control;
// speed is fixed per run. Physics is exact.

type Dir = 'forward' | 'backward' | 'stopped'
interface Pt { time: number; position: number; velocity: number }

// Structural/semantic tones come from the shared PAL so the sim matches every
// other lab. track = position, origin = secondary highlight, walker = primary
// ink, fwd = motion/velocity, back = secondary direction, stop = muted.
const COL = {
  track: PAL.primary, origin: PAL.cool,
  walker: PAL.ink,
  fwd: PAL.velocity, back: PAL.cool, stop: PAL.mute,
  grid: PAL.grid,
  mute: PAL.mute,
}

export function createConstantVelocityEngine(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, initial: ParamValues): SimEngine {
  let speed = Number(initial.speed ?? 1)
  let dir = (String(initial.direction ?? 'stopped') as Dir)
  let position = 0
  let t = 0
  let nextSample = 0
  let lastSamp = -1
  let pts: Pt[] = []
  let samp: { t: number; p: number; v: number }[] = []
  let trail: number[] = []

  const vel = () => (dir === 'forward' ? speed : dir === 'backward' ? -speed : 0)
  const dirColor = () => (dir === 'forward' ? COL.fwd : dir === 'backward' ? COL.back : COL.stop)
  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  function render() {
    const { w, h } = dims()
    clearField(ctx, w, h)

    const left = w * 0.08, right = w * 0.92, span = right - left
    const midY = h * 0.55
    const toX = (m: number) => left + ((m + 10) / 20) * span

    ctx.strokeStyle = COL.track; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(left, midY); ctx.lineTo(right, midY); ctx.stroke()
    ctx.font = '11px ui-sans-serif, system-ui, sans-serif'; ctx.textAlign = 'center'
    for (const m of [-10, -5, 0, 5, 10]) {
      const x = toX(m)
      ctx.strokeStyle = m === 0 ? COL.origin : COL.grid; ctx.lineWidth = m === 0 ? 2 : 1
      ctx.beginPath(); ctx.moveTo(x, midY - 16); ctx.lineTo(x, midY + 16); ctx.stroke()
      ctx.fillStyle = m === 0 ? COL.origin : COL.mute
      ctx.fillText(m === 0 ? '0 m' : `${m}`, x, midY + 34)
    }

    trail.forEach((mx, i) => {
      const a = (i / trail.length) * 0.35
      ctx.fillStyle = `rgba(127,119,221,${a})`
      ctx.beginPath(); ctx.arc(toX(Math.max(-10, Math.min(10, mx))), midY, 4, 0, Math.PI * 2); ctx.fill()
    })

    const wx = toX(Math.max(-10, Math.min(10, position)))
    groundShadow(ctx, wx, midY + 8, 12, 4)
    ctx.fillStyle = COL.walker
    ctx.beginPath(); ctx.arc(wx, midY - 26, 7, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = COL.walker; ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(wx, midY - 19); ctx.lineTo(wx, midY - 4); ctx.stroke()
    ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(wx, midY - 15); ctx.lineTo(wx - 6, midY - 8); ctx.moveTo(wx, midY - 15); ctx.lineTo(wx + 6, midY - 8); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(wx, midY - 4); ctx.lineTo(wx - 6, midY + 5); ctx.moveTo(wx, midY - 4); ctx.lineTo(wx + 6, midY + 5); ctx.stroke()
    if (dir !== 'stopped') {
      const ax = dir === 'forward' ? wx + 20 : wx - 20
      const shaftX = dir === 'forward' ? wx + 12 : wx - 12
      arrow(ctx, shaftX, midY - 32, ax, midY - 32, { color: dirColor(), width: 3, head: 7 })
    }
  }

  const sample = () => { pts.push({ time: Math.round(t), position, velocity: vel() }) }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      position += vel() * dt
      t += dt
      if (t >= nextSample) { sample(); nextSample = Math.floor(t) + 1 }
      if (t - lastSamp >= 0.05) { samp.push({ t, p: position, v: vel() }); lastSamp = t }
      trail.push(position)
      if (trail.length > 40) trail.shift()
    },
    setParams(values: ParamValues) {
      speed = Number(values.speed ?? speed)
      dir = (String(values.direction ?? dir) as Dir)
    },
    start() {
      if (samp.length === 0) { samp.push({ t: 0, p: position, v: vel() }); sample() }
    },
    reset() {
      position = 0; t = 0; nextSample = 0; lastSamp = -1; pts = []; samp = []; trail = []; dir = 'stopped'
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
    getSensorTrace(key?: string) {
      return samp.map((s) => ({ x: s.t, y: key === 'velocity' ? s.v : s.p }))
    },
    isComplete() { return pts.length >= 10 },
    destroy() {},
  }
  return engine
}
