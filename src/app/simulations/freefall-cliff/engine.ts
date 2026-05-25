import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'

// Freefall cliff — drop a stone from a cliff of known height; it falls under g
// from rest (h = ½gt², exact). Position traces stamp every 0.25 s and spread
// apart (the t² signature); the shell's Motion Detector shows downward speed vs
// time — a straight line of slope g, exactly what a picket fence measures.
// Physics is idealized (constant g, no air resistance) — conceptual-first.

const G = 9.8

const COL = {
  skyTop: '#EAE7FB', skyBot: '#F8F6FF',
  rock: '#867E9C', rockDark: '#5C5670', rockLight: '#9F98B4', strata: 'rgba(255,255,255,0.12)',
  grass: '#5DCAA5', grassDark: '#1D9E75',
  waterTop: '#69B0DD', waterBot: '#2C6FA8', foam: '#E1F0FF', wave: 'rgba(255,255,255,0.22)',
  stone: '#2A2540', stoneHi: 'rgba(255,255,255,0.55)', trailC: 'rgba(127,119,221,',
  trace: '#D85A30', traceLabel: '#993C1D',
  head: '#E8B964', body: '#534AB7',
  ruler: '#6F6A86', rulerLine: 'rgba(60,52,137,0.16)',
  drop: 'rgba(83,74,183,0.30)', splash: 'rgba(225,240,255,', text: '#26215C', mute: '#6F6A86',
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
  let samp: { t: number; v: number; h: number }[] = []

  const tLand = () => Math.sqrt((2 * cliffH) / G)
  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  function render() {
    const { w, h } = dims()
    ctx.clearRect(0, 0, w, h)

    // ---- layout ----
    const waterTop = Math.round(h * 0.82)
    const lipY = Math.round(h * 0.16)        // cliff top edge / launch height
    const cliffR = Math.round(w * 0.40)      // cliff right face
    const dropX = cliffR + 18                // stone falls just off the lip
    const rulerX = w - 30
    const toY = (m: number) => lipY + (Math.max(0, Math.min(cliffH, m)) / cliffH) * (waterTop - lipY)

    // ---- sky ----
    const sky = ctx.createLinearGradient(0, 0, 0, waterTop)
    sky.addColorStop(0, COL.skyTop); sky.addColorStop(1, COL.skyBot)
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, waterTop)

    // ---- water ----
    const water = ctx.createLinearGradient(0, waterTop, 0, h)
    water.addColorStop(0, COL.waterTop); water.addColorStop(1, COL.waterBot)
    ctx.fillStyle = water; ctx.fillRect(0, waterTop, w, h - waterTop)
    // gentle wave lines
    ctx.strokeStyle = COL.wave; ctx.lineWidth = 1.5
    for (let r = 0; r < 3; r++) {
      const yy = waterTop + 10 + r * 12
      ctx.beginPath()
      for (let xx = 0; xx <= w; xx += 8) {
        const yo = Math.sin((xx / 26) + r) * 2
        if (xx === 0) ctx.moveTo(xx, yy + yo); else ctx.lineTo(xx, yy + yo)
      }
      ctx.stroke()
    }
    ctx.fillStyle = COL.foam; ctx.fillRect(0, waterTop - 1, w, 3)

    // ---- cliff ----
    const rock = ctx.createLinearGradient(0, 0, cliffR, 0)
    rock.addColorStop(0, COL.rockDark); rock.addColorStop(1, COL.rock)
    ctx.fillStyle = rock; ctx.fillRect(0, lipY, cliffR, h - lipY)
    // strata (clean horizontals)
    ctx.strokeStyle = COL.strata; ctx.lineWidth = 2
    for (let i = 1; i <= 4; i++) {
      const yy = lipY + ((waterTop - lipY) / 5) * i
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(cliffR - 4, yy); ctx.stroke()
    }
    // lit edge
    ctx.fillStyle = COL.rockLight; ctx.fillRect(cliffR - 4, lipY, 4, h - lipY)
    // grassy cap
    ctx.fillStyle = COL.grass; ctx.beginPath(); ctx.roundRect(0, lipY - 8, cliffR, 12, 4); ctx.fill()
    ctx.fillStyle = COL.grassDark; ctx.fillRect(0, lipY + 2, cliffR, 2)

    // ---- traveler at the lip ----
    const tx = cliffR - 24
    ctx.fillStyle = COL.head; ctx.beginPath(); ctx.arc(tx, lipY - 24, 5.5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = COL.body; ctx.beginPath(); ctx.roundRect(tx - 4, lipY - 18, 8, 13, 3); ctx.fill()
    ctx.strokeStyle = COL.body; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(tx - 3, lipY - 5); ctx.lineTo(tx - 5, lipY - 1); ctx.moveTo(tx + 3, lipY - 5); ctx.lineTo(tx + 5, lipY - 1); ctx.stroke()

    // ---- depth ruler ----
    ctx.strokeStyle = COL.ruler; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(rulerX, lipY); ctx.lineTo(rulerX, waterTop); ctx.stroke()
    ctx.font = '10px sans-serif'; ctx.textAlign = 'right'
    for (let m = 0; m <= cliffH; m += 10) {
      const yy = toY(m)
      ctx.strokeStyle = COL.ruler; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(rulerX, yy); ctx.lineTo(rulerX + 5, yy); ctx.stroke()
      ctx.fillStyle = COL.mute; ctx.fillText(`${m}`, rulerX - 4, yy + 3)
    }

    // ---- drop guideline ----
    ctx.strokeStyle = COL.drop; ctx.lineWidth = 1.5; ctx.setLineDash([3, 5])
    ctx.beginPath(); ctx.moveTo(dropX, lipY); ctx.lineTo(dropX, waterTop); ctx.stroke(); ctx.setLineDash([])

    // ---- position traces (spread as it accelerates) ----
    traces.forEach((tr, i) => {
      const yy = toY(tr.h)
      ctx.fillStyle = COL.trace; ctx.beginPath(); ctx.arc(dropX, yy, 3.5, 0, Math.PI * 2); ctx.fill()
      if (i > 0) {
        ctx.fillStyle = COL.traceLabel; ctx.font = '10px sans-serif'; ctx.textAlign = 'left'
        ctx.fillText(`${tr.t.toFixed(2)} s`, dropX + 8, yy + 3)
      }
    })

    // ---- falling stone (trail + highlight) ----
    if (falling || (!done && fallen > 0) || (done && splash < 0)) {
      const sy = toY(fallen)
      for (let k = 1; k <= 6; k++) {
        const a = 0.30 * (1 - k / 7)
        ctx.fillStyle = `${COL.trailC}${a})`
        ctx.beginPath(); ctx.arc(dropX, sy - k * 7, 5 - k * 0.4, 0, Math.PI * 2); ctx.fill()
      }
      ctx.fillStyle = COL.stone; ctx.beginPath(); ctx.arc(dropX, sy, 8, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = COL.stoneHi; ctx.beginPath(); ctx.arc(dropX - 2.5, sy - 2.5, 2.5, 0, Math.PI * 2); ctx.fill()
    }

    // ---- splash on landing ----
    if (splash >= 0 && splash < 0.7) {
      const p = splash / 0.7
      ctx.strokeStyle = `${COL.splash}${1 - p})`; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.arc(dropX, waterTop, 6 + p * 32, Math.PI, 2 * Math.PI); ctx.stroke()
      ctx.beginPath(); ctx.arc(dropX, waterTop, 3 + p * 16, Math.PI, 2 * Math.PI); ctx.stroke()
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
        traces.push({ t, h: cliffH }); samp.push({ t, v, h: cliffH })
        return
      }
      t += dt
      fallen = 0.5 * G * t * t
      v = G * t
      if (t - lastTrace >= 0.25) { traces.push({ t, h: fallen }); lastTrace = Math.floor(t / 0.25) * 0.25 }
      if (t - lastSample >= 0.05) { samp.push({ t, v, h: fallen }); lastSample = t }
    },
    setParams(values: ParamValues) {
      cliffH = Number(values.cliffHeight ?? cliffH)
    },
    start(values: ParamValues) {
      this.setParams(values)
      t = 0; fallen = 0; v = 0; falling = true; done = false
      lastTrace = -1; lastSample = -1; splash = -1
      traces = [{ t: 0, h: 0 }]; samp = [{ t: 0, v: 0, h: 0 }]
    },
    reset() {
      t = 0; fallen = 0; v = 0; falling = false; done = false
      lastTrace = -1; lastSample = -1; splash = -1; traces = []; samp = []
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
    getSensorTrace(key?: string) {
      return samp.map((s) => ({ x: s.t, y: key === 'distance' ? s.h : s.v }))
    },
    isComplete() { return done },
    destroy() {},
  }
  return engine
}
