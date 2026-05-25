import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'

// Projectile-motion engine. Owns the canvas (drawing + target dragging). The
// SimLab shell drives a FIXED-SUBSTEP loop (calls step/render) and sizing, so
// this class holds NO rAF and NO window listeners — pointer listeners live on the
// canvas and are removed in destroy().
//
// Physics: idealized (constant g, no air resistance) — conceptual-first for CPA.
// Graphics: game-like — predicted aim arc, landing marker, motion trail, glowing
// ball + shadow, decomposed velocity-component vectors, apex flag, target bursts,
// muzzle flash. On-brand lavender/sage/gold.

const GRAVITY = 9.8

const COL = {
  skyTop: '#E7E4FB', skyBot: '#F6F4FF',
  grass: '#5DCAA5', grassDark: '#1D9E75',
  grid: 'rgba(60,52,137,0.07)',
  cannon: '#3C3489', cannonBarrel: '#534AB7',
  ball: '#26215C', ballGlow: 'rgba(127,119,221,0.45)',
  trail: '#7F77DD',
  predict: 'rgba(83,74,183,0.45)',
  vx: '#1D9E75', vy: '#534AB7', vres: '#BA7517',
  targetUp: '#D85A30', targetHit: '#1D9E75', targetWhite: '#fff',
  apex: '#BA7517', text: '#26215C', textMute: '#6F6A86',
  flash: '#FAC775', landing: '#534AB7',
}

interface Target { x: number; y: number; width: number; height: number; hit: boolean; anim: number }
interface DataPoint { time: number; x: number; y: number; vx: number; vy: number; speed: number }

export function createProjectileEngine(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, initial: ParamValues): SimEngine {
  let speed = Number(initial.speed ?? 20)
  let angle = Number(initial.angle ?? 45)
  let height = Number(initial.height ?? 0)
  let drag = Number(initial.drag ?? 0) // linear drag coefficient (0 = ideal, no air resistance)

  let x = 0, y = 0, vx = 0, vy = 0, t = 0
  let flying = false
  let landed = false
  let hits = 0, misses = 0
  let trajectory: { x: number; y: number }[] = []
  let trail: { x: number; y: number }[] = []
  let dataPoints: DataPoint[] = []
  let lastDataT = 0, lastTrajT = 0
  let apex: { x: number; y: number } | null = null
  let flash = 0
  let draggingTarget: number | null = null
  const targets: Target[] = [
    { x: 30, y: 0, width: 3, height: 6, hit: false, anim: -1 },
    { x: 50, y: 0, width: 3, height: 8, hit: false, anim: -1 },
    { x: 70, y: 0, width: 3, height: 10, hit: false, anim: -1 },
  ]

  // Predicted flight path for a given linear drag coefficient k (k=0 → ideal
  // parabola). Numerically integrated the same way step() advances, so the
  // preview matches the real flight.
  const predict = (k: number): { x: number; y: number }[] => {
    const a = (angle * Math.PI) / 180
    let pvx = speed * Math.cos(a)
    let pvy = speed * Math.sin(a)
    const pts: { x: number; y: number }[] = []
    let px = 0, py = height, pt = 0
    const dt = 0.02
    while (py >= 0 && pt < 30) {
      pts.push({ x: px, y: py })
      pvx += -k * pvx * dt
      pvy += (-GRAVITY - k * pvy) * dt
      px += pvx * dt
      py += pvy * dt
      pt += dt
    }
    return pts
  }

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }
  const scale = (extra: { x: number; y: number }[]) => {
    const { w, h } = dims()
    const xs = [...trajectory.map((p) => p.x), ...extra.map((p) => p.x), x, ...targets.map((tg) => tg.x + tg.width), 50, 1]
    const ys = [...trajectory.map((p) => p.y), ...extra.map((p) => p.y), y, ...targets.map((tg) => tg.height), 20, 1]
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)
    return { w, h, maxX, maxY, sx: (w * 0.9) / maxX, sy: (h * 0.85) / maxY, ox: w * 0.06, oy: h * 0.08 }
  }
  type S = ReturnType<typeof scale>
  const toScreen = (s: S, wx: number, wy: number) => ({ X: s.ox + wx * s.sx, Y: s.h - s.oy - wy * s.sy })

  const screenToWorld = (px: number, py: number) => {
    const s = scale(flying ? [] : predict(drag))
    return { x: (px - s.ox) / s.sx, y: (s.h - s.oy - py) / s.sy }
  }
  const onDown = (e: MouseEvent) => {
    if (flying) return
    const rect = canvas.getBoundingClientRect()
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top)
    targets.forEach((tg, i) => {
      if (world.x >= tg.x - 1 && world.x <= tg.x + tg.width + 1 && world.y >= 0 && world.y <= tg.height + 1) draggingTarget = i
    })
  }
  const onMove = (e: MouseEvent) => {
    if (draggingTarget === null || flying) return
    const rect = canvas.getBoundingClientRect()
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top)
    targets[draggingTarget].x = Math.max(10, Math.min(world.x, 100))
    targets[draggingTarget].hit = false
    targets[draggingTarget].anim = -1
    render()
  }
  const onUp = () => { draggingTarget = null }
  canvas.addEventListener('mousedown', onDown)
  canvas.addEventListener('mousemove', onMove)
  canvas.addEventListener('mouseup', onUp)
  canvas.addEventListener('mouseleave', onUp)

  const arrow = (x0: number, y0: number, x1: number, y1: number, color: string, wdt = 3) => {
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = wdt
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke()
    const ang = Math.atan2(y1 - y0, x1 - x0)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x1 - 8 * Math.cos(ang - Math.PI / 6), y1 - 8 * Math.sin(ang - Math.PI / 6))
    ctx.lineTo(x1 - 8 * Math.cos(ang + Math.PI / 6), y1 - 8 * Math.sin(ang + Math.PI / 6))
    ctx.closePath(); ctx.fill()
  }

  function render() {
    const showPred = !flying && !landed
    const pred = showPred ? predict(drag) : []
    const predIdeal = showPred && drag > 0 ? predict(0) : []
    const s = scale(pred.length ? pred : predIdeal)
    const { w, h } = s

    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, COL.skyTop); sky.addColorStop(1, COL.skyBot)
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h)

    // grid
    ctx.strokeStyle = COL.grid; ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const gx = s.ox + (w * 0.9 * i) / 10
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h - s.oy); ctx.stroke()
    }
    for (let i = 0; i <= 6; i++) {
      const gy = s.oy + ((h - s.oy * 2) * i) / 6
      ctx.beginPath(); ctx.moveTo(s.ox, gy); ctx.lineTo(w, gy); ctx.stroke()
    }

    // ground
    ctx.fillStyle = COL.grass; ctx.fillRect(0, h - s.oy, w, s.oy)
    ctx.fillStyle = COL.grassDark; ctx.fillRect(0, h - s.oy, w, 3)

    // faint no-drag reference arc, so the drag slider visibly shortens/bends the path
    if (predIdeal.length > 1) {
      ctx.strokeStyle = 'rgba(83,74,183,0.18)'; ctx.lineWidth = 2; ctx.setLineDash([2, 4])
      ctx.beginPath()
      predIdeal.forEach((p, i) => { const q = toScreen(s, p.x, p.y); if (i === 0) ctx.moveTo(q.X, q.Y); else ctx.lineTo(q.X, q.Y) })
      ctx.stroke(); ctx.setLineDash([])
      const li = predIdeal[predIdeal.length - 1]
      const lqi = toScreen(s, li.x, 0)
      ctx.fillStyle = 'rgba(83,74,183,0.4)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('no drag', lqi.X, lqi.Y - 6)
    }
    // predicted aim arc + landing marker (before launch)
    if (pred.length > 1) {
      ctx.strokeStyle = COL.predict; ctx.lineWidth = 2; ctx.setLineDash([3, 5])
      ctx.beginPath()
      pred.forEach((p, i) => { const q = toScreen(s, p.x, p.y); if (i === 0) ctx.moveTo(q.X, q.Y); else ctx.lineTo(q.X, q.Y) })
      ctx.stroke(); ctx.setLineDash([])
      const land = pred[pred.length - 1]
      const lq = toScreen(s, land.x, 0)
      ctx.strokeStyle = COL.landing; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(lq.X - 6, lq.Y - 6); ctx.lineTo(lq.X + 6, lq.Y + 6)
      ctx.moveTo(lq.X + 6, lq.Y - 6); ctx.lineTo(lq.X - 6, lq.Y + 6); ctx.stroke()
    }

    // targets (with hit burst)
    targets.forEach((tg) => {
      const top = toScreen(s, tg.x, tg.height)
      const tw = tg.width * s.sx
      const th = tg.height * s.sy
      const cx = top.X + tw / 2
      const fill = tg.hit ? COL.targetHit : COL.targetUp
      // bullseye rings
      ctx.fillStyle = fill; ctx.fillRect(top.X, top.Y, tw, th)
      ctx.fillStyle = COL.targetWhite; ctx.fillRect(top.X + tw * 0.22, top.Y + th * 0.22, tw * 0.56, th * 0.56)
      ctx.fillStyle = fill; ctx.fillRect(top.X + tw * 0.4, top.Y + th * 0.4, tw * 0.2, th * 0.2)
      if (tg.hit && tg.anim >= 0 && tg.anim < 0.5) {
        const p = tg.anim / 0.5
        ctx.strokeStyle = `rgba(29,158,117,${1 - p})`; ctx.lineWidth = 3
        ctx.beginPath(); ctx.arc(cx, top.Y + th / 2, 8 + p * 28, 0, Math.PI * 2); ctx.stroke()
      }
      if (!flying && !tg.hit) {
        ctx.fillStyle = COL.textMute; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('drag', cx, h - s.oy + 13)
      }
    })

    // apex flag
    if (apex && (flying || landed)) {
      const q = toScreen(s, apex.x, apex.y)
      ctx.fillStyle = COL.apex
      ctx.beginPath(); ctx.moveTo(q.X, q.Y); ctx.lineTo(q.X + 12, q.Y + 4); ctx.lineTo(q.X, q.Y + 8); ctx.closePath(); ctx.fill()
      ctx.strokeStyle = COL.apex; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(q.X, q.Y); ctx.lineTo(q.X, q.Y + 18); ctx.stroke()
    }

    // flown trajectory
    if (trajectory.length > 1) {
      ctx.strokeStyle = COL.trail; ctx.lineWidth = 2; ctx.globalAlpha = 0.55; ctx.setLineDash([5, 5])
      ctx.beginPath()
      trajectory.forEach((p, i) => { const q = toScreen(s, p.x, p.y); if (i === 0) ctx.moveTo(q.X, q.Y); else ctx.lineTo(q.X, q.Y) })
      ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1
    }

    // motion trail (fading)
    trail.forEach((p, i) => {
      const q = toScreen(s, p.x, p.y)
      const a = (i / trail.length) * 0.5
      ctx.fillStyle = `rgba(127,119,221,${a})`
      ctx.beginPath(); ctx.arc(q.X, q.Y, 5, 0, Math.PI * 2); ctx.fill()
    })

    // cannon
    const cq = toScreen(s, 0, height)
    ctx.save(); ctx.translate(cq.X, cq.Y); ctx.rotate(-(angle * Math.PI) / 180)
    ctx.fillStyle = COL.cannonBarrel; ctx.fillRect(0, -7, 30, 14)
    if (flash > 0) {
      ctx.fillStyle = `rgba(250,199,117,${flash / 0.15})`
      ctx.beginPath(); ctx.arc(30, 0, 10 * (flash / 0.15) + 4, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
    ctx.fillStyle = COL.cannon
    ctx.beginPath(); ctx.arc(cq.X, cq.Y, 13, 0, Math.PI * 2); ctx.fill()

    // projectile + shadow + glow + velocity components
    if (flying || t > 0) {
      const q = toScreen(s, x, y)
      // ground shadow
      const gq = toScreen(s, x, 0)
      const shadow = Math.max(0.05, 1 - y / Math.max(s.maxY, 1))
      ctx.fillStyle = `rgba(38,33,92,${0.18 * shadow})`
      ctx.beginPath(); ctx.ellipse(gq.X, gq.Y - 1, 9 * shadow + 3, 3 * shadow + 1.5, 0, 0, Math.PI * 2); ctx.fill()
      // glow
      const glow = ctx.createRadialGradient(q.X, q.Y, 2, q.X, q.Y, 16)
      glow.addColorStop(0, COL.ballGlow); glow.addColorStop(1, 'rgba(127,119,221,0)')
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(q.X, q.Y, 16, 0, Math.PI * 2); ctx.fill()
      // ball
      ctx.fillStyle = COL.ball; ctx.beginPath(); ctx.arc(q.X, q.Y, 8, 0, Math.PI * 2); ctx.fill()
      // velocity component vectors during flight
      if (flying) {
        const k = 4
        arrow(q.X, q.Y, q.X + vx * k, q.Y, COL.vx, 3)              // horizontal (constant)
        arrow(q.X, q.Y, q.X, q.Y - vy * k, COL.vy, 3)             // vertical (changes)
        arrow(q.X, q.Y, q.X + vx * k, q.Y - vy * k, COL.vres, 2)  // resultant
      }
    }

    // score badge
    ctx.fillStyle = 'rgba(255,255,255,0.82)'
    ctx.fillRect(8, 8, 132, 26)
    ctx.fillStyle = COL.text; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left'
    ctx.fillText(`Hits ${hits}   Misses ${misses}`, 16, 25)
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (flash > 0) flash = Math.max(0, flash - dt)
      targets.forEach((tg) => { if (tg.hit && tg.anim >= 0) tg.anim += dt })
      if (!flying) return
      // linear air drag: a = -k·v on each component (k=0 → ideal parabola)
      vx += -drag * vx * dt
      vy += (-GRAVITY - drag * vy) * dt
      x += vx * dt
      y += vy * dt
      t += dt
      if (!apex || y > apex.y) apex = { x, y }
      trail.push({ x, y })
      if (trail.length > 60) trail.shift()
      targets.forEach((tg) => {
        if (!tg.hit && x >= tg.x && x <= tg.x + tg.width && y <= tg.height && y >= 0) { tg.hit = true; tg.anim = 0; hits++ }
      })
      if (y <= 0) {
        y = 0; vy = 0; flying = false; landed = true
        trajectory.push({ x, y: 0 })
        if (!targets.some((tg) => tg.hit)) misses++
      }
      if (flying && t - lastTrajT >= 0.05) { trajectory.push({ x, y }); lastTrajT = t }
      if (t - lastDataT >= 0.1) {
        dataPoints.push({ time: t, x, y, vx, vy, speed: Math.sqrt(vx * vx + vy * vy) })
        lastDataT = t
      }
    },
    setParams(values: ParamValues) {
      speed = Number(values.speed ?? speed)
      angle = Number(values.angle ?? angle)
      height = Number(values.height ?? height)
      drag = Number(values.drag ?? drag)
    },
    start(values: ParamValues) {
      this.setParams(values)
      const a = (angle * Math.PI) / 180
      x = 0; y = height; vx = speed * Math.cos(a); vy = speed * Math.sin(a); t = 0
      flying = true; landed = false
      trajectory = [{ x: 0, y: height }]
      trail = []
      apex = { x: 0, y: height }
      flash = 0.15
      dataPoints = [{ time: 0, x: 0, y: height, vx, vy, speed }]
      lastDataT = 0; lastTrajT = 0
      targets.forEach((tg) => { tg.hit = false; tg.anim = -1 })
    },
    reset() {
      x = 0; y = 0; vx = 0; vy = 0; t = 0; flying = false; landed = false
      trajectory = []; trail = []; dataPoints = []; apex = null; flash = 0
      targets.forEach((tg) => { tg.hit = false; tg.anim = -1 })
    },
    getReadouts() {
      return { time: t, x, y, vx, vy }
    },
    getData(): SimData {
      return {
        columns: ['Time (s)', 'X (m)', 'Y (m)', 'Vx (m/s)', 'Vy (m/s)', 'Speed (m/s)'],
        rows: dataPoints.map((d) => [d.time, d.x, d.y, d.vx, d.vy, d.speed]),
        xCol: 1, yCol: 2,
      }
    },
    isComplete() { return landed },
    destroy() {
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('mouseleave', onUp)
    },
  }
  return engine
}
