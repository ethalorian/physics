import type { SimEngine, ParamValues, SimData, SensorSample } from '@/components/simulations/lab/contract'

// Freefall cliff — drop a stone from a cliff of known height; it falls under g
// from rest (h = ½gt², exact). Position traces stamp every 0.25 s and spread
// apart (the t² signature); the shell's Motion Detector shows downward speed vs
// time — a straight line of slope g, exactly what a picket fence measures.
// Physics is idealized (constant g, no air resistance) — conceptual-first.

const G = 9.8

const COL = {
  skyTop: '#E7E4FB', skyBot: '#F6F4FF',
  cliff: '#6B6478', cliffDark: '#4A4458', cliffEdge: '#3C3849',
  waterTop: '#3E8FD0', waterBot: '#1F5F9E', foam: '#BfE3FF',
  stone: '#26215C', stoneGlow: 'rgba(127,119,221,0.4)', trailC: 'rgba(127,119,221,',
  trace: '#D85A30', traceLabel: '#993C1D',
  head: '#BA7517', body: '#534AB7',
  splash: 'rgba(191,227,255,', text: '#26215C', mute: '#6F6A86',
}

export function createFreefallEngine(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, initial: ParamValues): SimEngine {
  let cliffH = Number(initial.cliffHeight ?? 45)
  let t = 0, fallen = 0, v = 0
  let falling = false
  let done = false
  let lastTrace = -1
  let lastSample = -1
  let splash = -1 // seconds since landing
  let traces: { t: number; h: number }[] = []
  let trace: SensorSample[] = []

  const tLand = () => Math.sqrt((2 * cliffH) / G)
  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  function render() {
    const { w, h } = dims()
    ctx.clearRect(0, 0, w, h)
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, COL.skyTop); sky.addColorStop(1, COL.skyBot)
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h)

    const waterTop = h * 0.86
    const dropTop = h * 0.13
    const colX = w * 0.42 // stone fall column
    const toY = (m: number) => dropTop + (Math.max(0, Math.min(cliffH, m)) / cliffH) * (waterTop - dropTop)

    // cliff (left)
    const cliffR = w * 0.30
    ctx.fillStyle = COL.cliff; ctx.fillRect(0, 0, cliffR, waterTop)
    ctx.fillStyle = COL.cliffDark; ctx.fillRect(cliffR - 8, 0, 8, waterTop)
    ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 1
    for (let i = 1; i < 9; i++) { const yy = (waterTop / 9) * i; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(cliffR - 8, yy + 6); ctx.stroke() }

    // traveler on the cliff top
    const tx = cliffR - 26
    ctx.fillStyle = COL.head; ctx.beginPath(); ctx.arc(tx, dropTop - 20, 6, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = COL.body; ctx.beginPath(); ctx.roundRect(tx - 4, dropTop - 14, 8, 13, 2); ctx.fill()

    // height scale (right of column)
    ctx.fillStyle = COL.mute; ctx.font = '10px sans-serif'; ctx.textAlign = 'left'
    for (let m = 0; m <= cliffH; m += 10) {
      const yy = toY(m)
      ctx.strokeStyle = 'rgba(60,52,137,0.12)'; ctx.beginPath(); ctx.moveTo(colX + 30, yy); ctx.lineTo(w, yy); ctx.stroke()
      ctx.fillText(`${m} m`, w - 34, yy - 2)
    }

    // position traces (spread apart as it accelerates)
    traces.forEach((tr) => {
      const yy = toY(tr.h)
      ctx.fillStyle = COL.trace; ctx.beginPath(); ctx.arc(colX, yy, 4, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = COL.traceLabel; ctx.font = '10px sans-serif'; ctx.textAlign = 'right'
      ctx.fillText(`${tr.t.toFixed(2)}s`, colX - 8, yy + 3)
    })

    // water
    const water = ctx.createLinearGradient(0, waterTop, 0, h)
    water.addColorStop(0, COL.waterTop); water.addColorStop(1, COL.waterBot)
    ctx.fillStyle = water; ctx.fillRect(0, waterTop, w, h - waterTop)
    ctx.fillStyle = COL.foam; ctx.fillRect(0, waterTop, w, 2)

    // falling stone (glow + trail)
    if (falling || (!done && fallen > 0)) {
      const sy = toY(fallen)
      for (let k = 1; k <= 6; k++) {
        const a = 0.28 * (1 - k / 7)
        ctx.fillStyle = `${COL.trailC}${a})`
        ctx.beginPath(); ctx.arc(colX, sy - k * 6, 5, 0, Math.PI * 2); ctx.fill()
      }
      const glow = ctx.createRadialGradient(colX, sy, 2, colX, sy, 14)
      glow.addColorStop(0, COL.stoneGlow); glow.addColorStop(1, 'rgba(127,119,221,0)')
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(colX, sy, 14, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = COL.stone; ctx.beginPath(); ctx.arc(colX, sy, 7, 0, Math.PI * 2); ctx.fill()
    }

    // splash rings on landing
    if (splash >= 0 && splash < 0.7) {
      const p = splash / 0.7
      ctx.strokeStyle = `${COL.splash}${1 - p})`; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(colX, waterTop, 6 + p * 34, 0, Math.PI); ctx.stroke()
      ctx.beginPath(); ctx.arc(colX, waterTop, 3 + p * 18, 0, Math.PI); ctx.stroke()
    }
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (splash >= 0) splash += dt
      if (done) return
      const land = tLand()
      if (t + dt >= land) {
        t = land; fallen = cliffH; v = G * land; falling = false; done = true; splash = 0
        traces.push({ t, h: cliffH }); trace.push({ x: t, y: v })
        return
      }
      t += dt
      fallen = 0.5 * G * t * t
      v = G * t
      if (t - lastTrace >= 0.25) { traces.push({ t, h: fallen }); lastTrace = Math.floor(t / 0.25) * 0.25 }
      if (t - lastSample >= 0.05) { trace.push({ x: t, y: v }); lastSample = t }
    },
    setParams(values: ParamValues) {
      cliffH = Number(values.cliffHeight ?? cliffH)
    },
    start(values: ParamValues) {
      this.setParams(values)
      t = 0; fallen = 0; v = 0; falling = true; done = false
      lastTrace = -1; lastSample = -1; splash = -1
      traces = [{ t: 0, h: 0 }]; trace = [{ x: 0, y: 0 }]
    },
    reset() {
      t = 0; fallen = 0; v = 0; falling = false; done = false
      lastTrace = -1; lastSample = -1; splash = -1; traces = []; trace = []
    },
    getReadouts() {
      return { time: t, distance: fallen, velocity: v }
    },
    getData(): SimData {
      return {
        columns: ['Time (s)', 'Distance fallen (m)', 'Speed (m/s)'],
        rows: traces.map((tr) => [tr.t, tr.h, G * tr.t]),
        xCol: 0, yCol: 1,
      }
    },
    getSensorTrace() { return trace },
    isComplete() { return done },
    destroy() {},
  }
  return engine
}
