import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'

// Projectile-motion engine. Owns the canvas (drawing + target dragging). The
// SimLab shell drives the animation loop (calls step/render) and sizing, so this
// class holds NO rAF and NO window listeners — pointer listeners are attached on
// the canvas and removed in destroy() (fixes the old anonymous-listener leak).

const GRAVITY = 9.8

interface Target { x: number; y: number; width: number; height: number; hit: boolean }
interface DataPoint { time: number; x: number; y: number; vx: number; vy: number; speed: number }

export function createProjectileEngine(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, initial: ParamValues): SimEngine {
  let speed = Number(initial.speed ?? 20)
  let angle = Number(initial.angle ?? 45)
  let height = Number(initial.height ?? 0)

  let x = 0, y = 0, vx = 0, vy = 0, t = 0
  let flying = false
  let landed = false
  let hits = 0, misses = 0
  let trajectory: { x: number; y: number }[] = []
  let dataPoints: DataPoint[] = []
  let lastDataT = 0, lastTrajT = 0
  let draggingTarget: number | null = null
  const targets: Target[] = [
    { x: 30, y: 0, width: 3, height: 6, hit: false },
    { x: 50, y: 0, width: 3, height: 8, hit: false },
    { x: 70, y: 0, width: 3, height: 10, hit: false },
  ]

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }
  const scale = () => {
    const { w, h } = dims()
    const maxX = Math.max(...trajectory.map((p) => p.x), x, ...targets.map((tg) => tg.x + tg.width), 50, 1)
    const maxY = Math.max(...trajectory.map((p) => p.y), y, ...targets.map((tg) => tg.height), 20, 1)
    return { w, h, maxX, maxY, sx: (w * 0.9) / maxX, sy: (h * 0.9) / maxY, ox: w * 0.05, oy: h * 0.05 }
  }
  const screenToWorld = (px: number, py: number) => {
    const s = scale()
    return { x: (px - s.ox) / s.sx, y: (s.h - s.oy - py) / s.sy }
  }

  const onDown = (e: MouseEvent) => {
    if (flying) return
    const rect = canvas.getBoundingClientRect()
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top)
    targets.forEach((tg, i) => {
      if (world.x >= tg.x && world.x <= tg.x + tg.width && world.y >= 0 && world.y <= tg.height) draggingTarget = i
    })
  }
  const onMove = (e: MouseEvent) => {
    if (draggingTarget === null || flying) return
    const rect = canvas.getBoundingClientRect()
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top)
    targets[draggingTarget].x = Math.max(10, Math.min(world.x, 100))
    targets[draggingTarget].hit = false
    render()
  }
  const onUp = () => { draggingTarget = null }
  canvas.addEventListener('mousedown', onDown)
  canvas.addEventListener('mousemove', onMove)
  canvas.addEventListener('mouseup', onUp)
  canvas.addEventListener('mouseleave', onUp)

  function render() {
    const s = scale()
    ctx.clearRect(0, 0, s.w, s.h)

    // sky + ground
    ctx.fillStyle = '#EEEDFE'
    ctx.fillRect(0, 0, s.w, s.h)
    ctx.fillStyle = '#5DCAA5'
    ctx.fillRect(0, s.h - s.oy, s.w, s.oy)

    // grid
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const gx = s.ox + (s.w * 0.9 * i) / 10
      const gy = s.oy + (s.h * 0.9 * i) / 10
      ctx.beginPath(); ctx.moveTo(gx, s.oy); ctx.lineTo(gx, s.h - s.oy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(s.ox, gy); ctx.lineTo(s.w - s.ox, gy); ctx.stroke()
    }

    // targets
    targets.forEach((tg) => {
      const tx = s.ox + tg.x * s.sx
      const ty = s.h - s.oy - tg.height * s.sy
      const tw = tg.width * s.sx
      const th = tg.height * s.sy
      ctx.fillStyle = tg.hit ? '#1D9E75' : '#D85A30'
      ctx.fillRect(tx, ty, tw, th)
      ctx.fillStyle = '#fff'
      ctx.fillRect(tx + tw * 0.2, ty + th * 0.2, tw * 0.6, th * 0.6)
      ctx.fillStyle = tg.hit ? '#1D9E75' : '#D85A30'
      ctx.fillRect(tx + tw * 0.4, ty + th * 0.4, tw * 0.2, th * 0.2)
      if (!flying) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('drag', tx + tw / 2, s.h - s.oy + 14)
      }
    })

    // cannon
    const cx = s.ox
    const cy = s.h - s.oy - height * s.sy
    ctx.fillStyle = '#3C3489'
    ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill()
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-(angle * Math.PI) / 180)
    ctx.fillStyle = '#534AB7'
    ctx.fillRect(0, -7, 28, 14)
    ctx.restore()

    // trajectory
    if (trajectory.length > 1) {
      ctx.strokeStyle = '#7F77DD'; ctx.lineWidth = 2; ctx.globalAlpha = 0.6; ctx.setLineDash([5, 5])
      ctx.beginPath()
      trajectory.forEach((p, i) => {
        const px = s.ox + p.x * s.sx
        const py = s.h - s.oy - p.y * s.sy
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      })
      ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1
    }

    // projectile + velocity vector
    if (flying || t > 0) {
      const px = s.ox + x * s.sx
      const py = s.h - s.oy - y * s.sy
      ctx.fillStyle = '#26215C'
      ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fill()
      if (flying) {
        const v = 5
        ctx.strokeStyle = '#185FA5'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + vx * v, py - vy * v); ctx.stroke()
      }
    }

    ctx.fillStyle = '#26215C'
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`Hits: ${hits}  Misses: ${misses}`, 10, 22)
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (!flying) return
      vy -= GRAVITY * dt
      x += vx * dt
      y += vy * dt
      t += dt
      targets.forEach((tg) => {
        if (!tg.hit && x >= tg.x && x <= tg.x + tg.width && y <= tg.height && y >= 0) { tg.hit = true; hits++ }
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
    },
    start(values: ParamValues) {
      this.setParams(values)
      const a = (angle * Math.PI) / 180
      x = 0; y = height; vx = speed * Math.cos(a); vy = speed * Math.sin(a); t = 0
      flying = true; landed = false
      trajectory = [{ x: 0, y: height }]
      dataPoints = [{ time: 0, x: 0, y: height, vx, vy, speed }]
      lastDataT = 0; lastTrajT = 0
      targets.forEach((tg) => (tg.hit = false))
    },
    reset() {
      x = 0; y = 0; vx = 0; vy = 0; t = 0; flying = false; landed = false
      trajectory = []; dataPoints = []
      targets.forEach((tg) => (tg.hit = false))
    },
    getReadouts() {
      return { time: t, x, y, vx, vy }
    },
    getData(): SimData {
      return {
        columns: ['Time (s)', 'X (m)', 'Y (m)', 'Vx (m/s)', 'Vy (m/s)', 'Speed (m/s)'],
        rows: dataPoints.map((d) => [d.time, d.x, d.y, d.vx, d.vy, d.speed]),
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
