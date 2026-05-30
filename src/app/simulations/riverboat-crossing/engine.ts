import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'
import { PAL, clearField, arrow, chip, panel, label } from '@/components/simulations/lab/draw'

// Scene tokens; semantic vector/text tones come from the shared PAL so this sim
// matches every other lab. Water/shore/dock/flag stay scene-specific.
const COL = {
  waterTop: '#3b82f6', waterMid: '#2563eb', waterBot: '#1e40af',
  flow: 'rgba(147, 197, 253, 0.3)', shore: '#86efac', shoreEdge: '#22c55e',
  startDock: '#92400e', targetDock: '#fbbf24', flag: '#ef4444', flagPole: '#7c2d12',
  hull: '#ef4444', cabin: '#dc2626', trace: PAL.accent, reference: 'rgba(255, 255, 255, 0.3)',
  boatVec: PAL.velocity, currentVec: PAL.cool, resultantVec: PAL.primary, driftVec: PAL.accent,
  ink: PAL.ink, mute: PAL.mute,
} as const

// Riverboat crossing — a boat with a fixed speed/heading through the water crosses
// a 100 m wide river while the current sweeps it downstream. The boat's velocity
// relative to the water (green) ADDS as a vector to the current velocity (cyan) to
// give the resultant velocity over the ground (purple). The drift downstream is the
// downstream displacement when the boat reaches the far shore. Exact 2-D constant
// vector kinematics; idealized (no acceleration, uniform current).
//
// Coordinate system (matches the bespoke sim):
//   x = distance ACROSS the river (0 → riverWidth), boatAngle measured so 90° is
//       straight across; sin(angle) drives the across (x) component (sin 90° = 1).
//   y = distance DOWNSTREAM; the current only acts in +y. The boat's own y
//       component is −cos(angle): 0 at 90° (straight across), upstream below 90°
//       (compensating for the current), downstream above 90°. The current adds to it.

interface Vec2 { x: number; y: number }

const RIVER_WIDTH = 100 // meters (shore to shore, the crossing distance)
const RIVER_LENGTH = 150 // meters (visible downstream section)
const START_Y = 50 // meters downstream where the boat starts
const TARGET_Y = 50 // meters downstream of the target dock

export function createRiverboatCrossingEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
): SimEngine {
  let boatSpeed = Number(initial.boatSpeed ?? 5)
  let boatAngle = Number(initial.boatAngle ?? 90)
  let currentSpeed = Number(initial.currentSpeed ?? 2)

  let boatX = 0
  let boatY = START_Y
  let time = 0
  let running = false
  let hasReachedOtherSide = false
  let path: Vec2[] = [{ x: 0, y: START_Y }]

  // dims() reports CSS pixels — the shell sets the DPR transform, so all drawing
  // uses CSS-pixel coordinates.
  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  // pixelsPerMeter mirrors the bespoke fit: the river width spans (h - shores) and
  // the visible length spans (w - shores). Kept as the smaller scale so both fit.
  const pixelsPerMeter = () => {
    const { w, h } = dims()
    return Math.min((w - 60) / RIVER_WIDTH, h / RIVER_WIDTH)
  }

  function render() {
    const { w, h } = dims()
    const ppm = pixelsPerMeter()

    // Base field layer (shared visual language); the river gradient + flow lines
    // are scene-specific and painted on top.
    clearField(ctx, w, h)

    // River background
    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, COL.waterTop)
    gradient.addColorStop(0.5, COL.waterMid)
    gradient.addColorStop(1, COL.waterBot)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    // Current flow lines (animated)
    ctx.strokeStyle = COL.flow
    ctx.lineWidth = 2
    const flowOffset = (time * currentSpeed * ppm) % 40
    for (let i = 0; i < 15; i++) {
      const y = i * 40 - flowOffset
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Near shore (starting side - left)
    ctx.fillStyle = COL.shore
    ctx.fillRect(0, 0, 30, h)

    // Far shore (destination - right)
    ctx.fillStyle = COL.shore
    ctx.fillRect(w - 30, 0, 30, h)

    // Shore edges
    ctx.strokeStyle = COL.shoreEdge
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(30, 0)
    ctx.lineTo(30, h)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(w - 30, 0)
    ctx.lineTo(w - 30, h)
    ctx.stroke()

    // Convert to screen coordinates
    const boatScreenX = 30 + boatX * ppm
    const boatScreenY = boatY * ppm

    const startScreenY = TARGET_Y * ppm
    const targetScreenY = TARGET_Y * ppm

    // Draw starting dock
    ctx.fillStyle = COL.startDock
    ctx.fillRect(10, startScreenY - 15, 20, 30)

    // Draw target dock (destination)
    ctx.fillStyle = COL.targetDock
    ctx.fillRect(w - 30, targetScreenY - 15, 20, 30)

    // Target flag
    ctx.fillStyle = COL.flag
    ctx.beginPath()
    ctx.moveTo(w - 15, targetScreenY - 15)
    ctx.lineTo(w - 15, targetScreenY - 40)
    ctx.lineTo(w - 35, targetScreenY - 30)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = COL.flagPole
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(w - 15, targetScreenY - 15)
    ctx.lineTo(w - 15, targetScreenY - 40)
    ctx.stroke()

    // Draw boat path (trace)
    if (path.length > 1) {
      ctx.strokeStyle = COL.trace
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(30 + path[0].x * ppm, path[0].y * ppm)
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(30 + path[i].x * ppm, path[i].y * ppm)
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw straight-across reference line (where boat would go with no current)
    if (running || time > 0) {
      ctx.strokeStyle = COL.reference
      ctx.lineWidth = 2
      ctx.setLineDash([10, 10])
      ctx.beginPath()
      ctx.moveTo(30, startScreenY)
      ctx.lineTo(w - 30, targetScreenY)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw boat
    ctx.save()
    ctx.translate(boatScreenX, boatScreenY)

    // Rotate boat to face direction of travel (resultant velocity)
    if (running || time > 0) {
      const angleRad = boatAngle * Math.PI / 180
      const boatVy = -boatSpeed * Math.cos(angleRad)
      const resultantVy = boatVy + currentSpeed
      const boatVx = boatSpeed * Math.sin(angleRad)
      const resultantAngle = Math.atan2(resultantVy, boatVx)
      ctx.rotate(resultantAngle)
    } else {
      ctx.rotate((boatAngle - 90) * Math.PI / 180)
    }

    // Boat shape
    ctx.fillStyle = COL.hull
    ctx.beginPath()
    ctx.moveTo(15, 0) // Front
    ctx.lineTo(-10, -8) // Back left
    ctx.lineTo(-10, 8) // Back right
    ctx.closePath()
    ctx.fill()

    // Boat details
    ctx.fillStyle = COL.cabin
    ctx.fillRect(-10, -3, 20, 6) // Center cabin

    ctx.restore()

    // Draw velocity vectors (from boat position)
    const vectorScale = 15 // pixels per m/s

    // Three velocity vectors all radiate from the boat, so their numeric labels
    // used to pile on top of each other whenever the current (or the speeds) were
    // small and the arrows were short. The arrows stay on the boat (colour-coded);
    // the NUMBERS move to a fixed legend below, where they can never collide.
    const angleRad = boatAngle * Math.PI / 180
    const boatVx = boatSpeed * Math.sin(angleRad)
    const boatVy = -boatSpeed * Math.cos(angleRad)

    // Boat velocity (green) — relative to the water
    arrow(ctx, boatScreenX, boatScreenY, boatScreenX + boatVx * vectorScale, boatScreenY + boatVy * vectorScale, { color: COL.boatVec, width: 3 })

    // Current velocity (cyan) — always downstream
    arrow(ctx, boatScreenX, boatScreenY, boatScreenX, boatScreenY + currentSpeed * vectorScale, { color: COL.currentVec, width: 3 })

    // Resultant velocity (purple) — actual path over the ground
    const resultantVx = boatVx
    const resultantVy = boatVy + currentSpeed
    arrow(ctx, boatScreenX, boatScreenY, boatScreenX + resultantVx * vectorScale, boatScreenY + resultantVy * vectorScale, { color: COL.resultantVec, width: 4 })

    const resultantSpeed = Math.sqrt(resultantVx * resultantVx + resultantVy * resultantVy)

    // Draw drift indicator if completed
    if (hasReachedOtherSide) {
      const drift = boatY - TARGET_Y
      const driftScreenY = boatY * ppm

      // Drift line
      ctx.strokeStyle = COL.driftVec
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(w - 30, targetScreenY)
      ctx.lineTo(w - 30, driftScreenY)
      ctx.stroke()
      ctx.setLineDash([])

      // Drift label
      chip(ctx, `Drift: ${Math.abs(drift).toFixed(1)}m ${drift > 0 ? '⬇' : '⬆'}`, w - 40, (targetScreenY + driftScreenY) / 2, { color: COL.driftVec, align: 'right', size: 12 })
    }

    // Draw labels
    chip(ctx, 'START', 15, startScreenY, { color: COL.ink, size: 12 })
    chip(ctx, 'TARGET', w - 15, targetScreenY + 50, { color: COL.driftVec, align: 'right', size: 12 })

    // Velocity legend (top-left corner — clear of the docks at mid-height and of
    // the boat's path, drawn on an opaque panel so it stays legible regardless).
    const lx = 10, ly = 12, lw = 196, lh = 86
    panel(ctx, lx, ly, lw, lh, 10, PAL.surface)
    label(ctx, 'Velocities (m/s)', lx + 12, ly + 19, { color: COL.ink, weight: 'bold', size: 12 })
    const legend: [string, string, string][] = [
      [COL.boatVec, 'v_boat', boatSpeed.toFixed(1)],
      [COL.currentVec, 'v_current', currentSpeed.toFixed(1)],
      [COL.resultantVec, 'v_resultant', resultantSpeed.toFixed(1)],
    ]
    legend.forEach(([color, name, val], i) => {
      const ry = ly + 36 + i * 18
      ctx.fillStyle = color
      ctx.fillRect(lx + 12, ry - 8, 10, 10)
      label(ctx, `${name} = ${val}`, lx + 28, ry + 1, { color: COL.ink, size: 12 })
    })
  }

  // Velocity components for readouts (independent of running state).
  const components = () => {
    const angleRad = boatAngle * Math.PI / 180
    const boatVx = boatSpeed * Math.sin(angleRad)
    const boatVy = -boatSpeed * Math.cos(angleRad)
    const resultantVx = boatVx
    const resultantVy = boatVy + currentSpeed
    return { boatVx, boatVy, resultantVx, resultantVy }
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (!running || hasReachedOtherSide) return

      const { resultantVx, resultantVy } = components()

      // Update position (vector addition: across unaffected by current, downstream = boat + current)
      boatX += resultantVx * dt
      boatY += resultantVy * dt

      // Record path
      if (path.length === 0 || time % 0.2 < dt) {
        path.push({ x: boatX, y: boatY })
      }

      // Check if reached other side
      if (boatX >= RIVER_WIDTH) {
        boatX = RIVER_WIDTH
        hasReachedOtherSide = true
        running = false
      }

      // Keep within river bounds (vertically)
      if (boatY < 0) boatY = 0
      if (boatY > RIVER_LENGTH) boatY = RIVER_LENGTH

      time += dt
    },
    setParams(values: ParamValues) {
      boatSpeed = Number(values.boatSpeed ?? boatSpeed)
      boatAngle = Number(values.boatAngle ?? boatAngle)
      currentSpeed = Number(values.currentSpeed ?? currentSpeed)
    },
    start(values: ParamValues) {
      this.setParams(values)
      boatX = 0
      boatY = START_Y
      path = [{ x: 0, y: START_Y }]
      hasReachedOtherSide = false
      time = 0
      running = true
    },
    reset() {
      running = false
      boatX = 0
      boatY = START_Y
      path = []
      time = 0
      hasReachedOtherSide = false
    },
    getReadouts() {
      const { resultantVx, resultantVy } = components()
      const resultantSpeed = Math.sqrt(resultantVx * resultantVx + resultantVy * resultantVy)
      const resultantAngle = Math.atan2(resultantVy, resultantVx) * 180 / Math.PI
      const drift = boatY - TARGET_Y
      return {
        time,
        across: boatX,
        drift,
        resultantSpeed,
        resultantAngle,
      }
    },
    getData(): SimData {
      const { boatVx, boatVy, resultantVx, resultantVy } = components()
      const resultantSpeed = Math.sqrt(resultantVx * resultantVx + resultantVy * resultantVy)
      return {
        columns: ['Boat speed (m/s)', 'Heading (deg)', 'Current (m/s)', 'v_boat,x', 'v_boat,y', 'Resultant (m/s)', 'Drift (m)', 'Across (m)', 'Time (s)'],
        rows: [[
          Number(boatSpeed.toFixed(2)),
          Number(boatAngle.toFixed(0)),
          Number(currentSpeed.toFixed(2)),
          Number(resultantVx.toFixed(2)),
          Number(resultantVy.toFixed(2)),
          Number(resultantSpeed.toFixed(2)),
          Number((boatY - TARGET_Y).toFixed(2)),
          Number(boatX.toFixed(2)),
          Number(time.toFixed(2)),
        ]],
        xCol: 8,
        yCol: 7,
      }
    },
    isComplete() { return hasReachedOtherSide },
    destroy() {},
  }
  return engine
}
