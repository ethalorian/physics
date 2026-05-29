import type { SimEngine, ParamValues, SimData, SensorSample } from '@/components/simulations/lab/contract'
import { PAL, clearField, groundShadow, arrow, chip } from '@/components/simulations/lab/draw'

// Atwood machine — two masses connected by a rope over a frictionless pulley.
// Net force comes from the weight difference; both masses share one acceleration:
//   a = g(m1 − m2)/(m1 + m2)   (positive = m1 falls, m2 rises)
// Rope tension is found from either mass: T = m1(g − a) = m2(g + a).
// Drawing is a faithful port of the original bespoke canvas (pulley with rim/groove/
// axle, rope over the groove, two 3D mass blocks, weight + tension force arrows,
// ceiling, target line, displacement + equilibrium labels). Physics is integrated
// in step(dt) by the shell's fixed-dt loop — no requestAnimationFrame here.

const GRAVITY = 9.8 // m/s²

interface Row {
  time: number
  position: number
  velocity: number
  acceleration: number
  tensionForce: number
  netForce: number
  mass1Weight: number
  mass2Weight: number
}

export function createAtwoodMachineEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
): SimEngine {
  // Params
  let mass1 = Number(initial.mass1 ?? 2.0) // kg (left, blue)
  let mass2 = Number(initial.mass2 ?? 1.5) // kg (right, red)
  let targetDistance = Number(initial.targetDistance ?? 2.0) // m

  // Motion state (position positive = mass1 down, mass2 up)
  let position = 0
  let velocity = 0
  let acceleration = 0
  let time = 0
  let running = false

  // Geometry (matches bespoke)
  const pulleyY = 80
  const pulleyRadius = 30
  const maxRopeLength = 3 // meters each side
  const pixelsPerMeter = 80

  // Data logging (every 0.1 s while running)
  let rows: Row[] = []
  let lastSample = -1

  const calcAcceleration = () => {
    acceleration = GRAVITY * (mass1 - mass2) / (mass1 + mass2)
  }
  calcAcceleration()

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }
  // The bespoke clamped the drawing width to 700px and centered the pulley.
  const pulleyXOf = (w: number) => Math.min(w, 700) / 2

  const hasReachedTarget = () => Math.abs(position) >= targetDistance

  const equilibriumType = (): 'static' | 'dynamic' | 'accelerating' => {
    if (Math.abs(acceleration) < 0.01) {
      return Math.abs(velocity) < 0.01 ? 'static' : 'dynamic'
    }
    return 'accelerating'
  }
  // T = m1(g − a)  (equivalently m2(g + a))
  const tensionOf = () => mass1 * (GRAVITY - acceleration)

  // ---- drawing helpers --------------------------------------------------
  // Flat mass block in a solid PAL fill (gradients removed for the shared
  // visual language). mass1 → primary (lavender), mass2 → force (coral).
  function drawMass(x: number, y: number, mass: number, color: string, label: string) {
    const width = 50
    const height = 50 + mass * 8 // height scales with mass

    // Soft contact shadow under the block (flat ellipse, no blur)
    groundShadow(ctx, x, y + height / 2 + 4, width / 2, 5)

    // Solid body
    ctx.fillStyle = color
    ctx.fillRect(x - width / 2, y - height / 2, width, height)

    // Crisp border in the structural axis tone
    ctx.strokeStyle = PAL.axis
    ctx.lineWidth = 2
    ctx.strokeRect(x - width / 2, y - height / 2, width, height)

    // Label and mass
    ctx.fillStyle = PAL.onAccent
    ctx.font = 'bold 16px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, x, y - 8)
    ctx.font = '14px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(`${mass.toFixed(1)} kg`, x, y + 10)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
  }

  function drawForceVectors(x1: number, y1: number, x2: number, y2: number) {
    const vectorScale = 8 // pixels per Newton

    // Mass 1 forces
    const weight1 = mass1 * GRAVITY
    const tension = mass1 * (GRAVITY - acceleration)

    // Weight (down) → force/coral
    arrow(ctx, x1, y1, x1, y1 + weight1 * vectorScale, { color: PAL.force, width: 3 })
    chip(ctx, `W₁=${weight1.toFixed(1)}N`, x1 + 44, y1 + weight1 * vectorScale / 2, { color: PAL.force })

    // Tension (up) → velocity/green
    arrow(ctx, x1, y1, x1, y1 - tension * vectorScale, { color: PAL.velocity, width: 3 })
    chip(ctx, `T=${tension.toFixed(1)}N`, x1 + 40, y1 - tension * vectorScale / 2, { color: PAL.velocity })

    // Mass 2 forces
    const weight2 = mass2 * GRAVITY
    arrow(ctx, x2, y2, x2, y2 + weight2 * vectorScale, { color: PAL.force, width: 3 })
    chip(ctx, `W₂=${weight2.toFixed(1)}N`, x2 - 44, y2 + weight2 * vectorScale / 2, { color: PAL.force })

    arrow(ctx, x2, y2, x2, y2 - tension * vectorScale, { color: PAL.velocity, width: 3 })
    chip(ctx, `T=${tension.toFixed(1)}N`, x2 - 40, y2 - tension * vectorScale / 2, { color: PAL.velocity })
  }

  function render() {
    const { w, h } = dims()
    const pulleyX = pulleyXOf(w)

    // Field backdrop (shared lavender-tinted background)
    clearField(ctx, w, h)

    // Subtle grid (shared grid tone)
    ctx.strokeStyle = PAL.grid
    ctx.lineWidth = 1
    for (let y = 100; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }

    // Ceiling
    ctx.fillStyle = PAL.gridStrong; ctx.fillRect(0, 0, w, 60)
    ctx.fillStyle = PAL.axis; ctx.fillRect(0, 58, w, 4)

    // Mounting bracket (flat structural tone)
    ctx.fillStyle = PAL.axis; ctx.fillRect(pulleyX - 15, 40, 30, 20)

    // Pulley mount
    ctx.fillStyle = PAL.ink
    ctx.beginPath(); ctx.arc(pulleyX, pulleyY, 8, 0, 2 * Math.PI); ctx.fill()

    // Pulley wheel — solid body (gradient flattened to flat PAL fill)
    ctx.fillStyle = PAL.gridStrong
    ctx.beginPath(); ctx.arc(pulleyX, pulleyY, pulleyRadius, 0, 2 * Math.PI); ctx.fill()

    // Pulley groove
    ctx.strokeStyle = PAL.axis; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(pulleyX, pulleyY, pulleyRadius - 5, 0, 2 * Math.PI); ctx.stroke()

    // Center axle
    ctx.fillStyle = PAL.ink
    ctx.beginPath(); ctx.arc(pulleyX, pulleyY, 6, 0, 2 * Math.PI); ctx.fill()

    // Mass positions
    const mass1Y = pulleyY + pulleyRadius + (maxRopeLength / 2 + position) * pixelsPerMeter
    const mass2Y = pulleyY + pulleyRadius + (maxRopeLength / 2 - position) * pixelsPerMeter
    const mass1X = pulleyX - pulleyRadius - 10
    const mass2X = pulleyX + pulleyRadius + 10

    // Rope (flat ink line over the pulley groove)
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 4
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    const ropeRadius = pulleyRadius - 3

    ctx.beginPath(); ctx.moveTo(mass1X, mass1Y - 25); ctx.lineTo(mass1X, pulleyY + ropeRadius); ctx.stroke()
    ctx.beginPath(); ctx.arc(pulleyX, pulleyY, ropeRadius, Math.PI * 0.5, -Math.PI * 0.5, false); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(mass2X, pulleyY + ropeRadius); ctx.lineTo(mass2X, mass2Y - 25); ctx.stroke()

    // Mass blocks — mass1 → primary (lavender), mass2 → force (coral)
    drawMass(mass1X, mass1Y, mass1, PAL.primary, 'M₁')
    drawMass(mass2X, mass2Y, mass2, PAL.force, 'M₂')

    // Force vectors when in motion (and target not yet reached)
    if ((running || Math.abs(velocity) > 0.01) && !hasReachedTarget()) {
      drawForceVectors(mass1X, mass1Y, mass2X, mass2Y)
    }

    // Target distance reference line (accent/gold, dashed) with chip label
    if (targetDistance > 0) {
      const targetLineY = pulleyY + pulleyRadius + (maxRopeLength / 2 + targetDistance) * pixelsPerMeter
      ctx.strokeStyle = PAL.accent; ctx.lineWidth = 2
      ctx.setLineDash([10, 5])
      ctx.beginPath(); ctx.moveTo(mass1X - 40, targetLineY); ctx.lineTo(mass1X + 40, targetLineY); ctx.stroke()
      ctx.setLineDash([])
      chip(ctx, `Target: ${targetDistance}m`, mass1X - 80, targetLineY, { color: PAL.accent })
    }

    // Displacement label (chip behind floating value)
    chip(ctx, `Displacement: ${Math.abs(position).toFixed(2)}m`, pulleyX, h - 50, { color: PAL.mute, size: 12 })

    // Equilibrium indicator
    if (Math.abs(acceleration) < 0.01) {
      ctx.fillStyle = PAL.velocity; ctx.font = 'bold 14px ui-sans-serif, system-ui, sans-serif'; ctx.textAlign = 'center'
      if (Math.abs(velocity) < 0.01) {
        ctx.fillText('⚖️ STATIC EQUILIBRIUM', pulleyX, h - 20)
      } else {
        ctx.fillText('⚖️ DYNAMIC EQUILIBRIUM', pulleyX, h - 20)
      }
      ctx.font = '11px ui-sans-serif, system-ui, sans-serif'; ctx.fillStyle = PAL.velocity
      ctx.fillText('Equal masses → no net force → a = 0', pulleyX, h - 5)
      ctx.textAlign = 'left'
    }
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (!running) return

      // Kinematics
      velocity += acceleration * dt
      position += velocity * dt

      // Stop if a mass hits the rope limit
      if (Math.abs(position) >= maxRopeLength) {
        position = Math.sign(position) * maxRopeLength
        velocity = 0
        running = false
      }

      // Stop when target distance is reached (only meaningful if accelerating)
      if (Math.abs(position) >= targetDistance && acceleration !== 0) {
        running = false
      }

      time += dt

      // Log data every 0.1 s while running
      if (time - lastSample >= 0.1) {
        const weight1 = mass1 * GRAVITY
        const weight2 = mass2 * GRAVITY
        rows.push({
          time: parseFloat(time.toFixed(3)),
          position: parseFloat(position.toFixed(3)),
          velocity: parseFloat(velocity.toFixed(3)),
          acceleration: parseFloat(acceleration.toFixed(3)),
          tensionForce: parseFloat(tensionOf().toFixed(2)),
          netForce: parseFloat((weight1 - weight2).toFixed(2)),
          mass1Weight: parseFloat(weight1.toFixed(2)),
          mass2Weight: parseFloat(weight2.toFixed(2)),
        })
        lastSample = time
      }
    },
    setParams(values: ParamValues) {
      mass1 = Number(values.mass1 ?? mass1)
      mass2 = Number(values.mass2 ?? mass2)
      targetDistance = Number(values.targetDistance ?? targetDistance)
      calcAcceleration()
    },
    start(values: ParamValues) {
      this.setParams(values)
      calcAcceleration()
      running = true
      lastSample = -1
    },
    reset() {
      running = false
      position = 0
      velocity = 0
      time = 0
      rows = []
      lastSample = -1
      calcAcceleration()
    },
    getReadouts() {
      return {
        time,
        position: Math.abs(position),
        velocity,
        acceleration: Math.abs(acceleration),
        tension: tensionOf(),
        netForce: (mass1 - mass2) * GRAVITY,
        state:
          equilibriumType() === 'static' ? 'Static eq.'
            : equilibriumType() === 'dynamic' ? 'Dynamic eq.'
            : 'Accelerating',
      }
    },
    getData(): SimData {
      return {
        columns: ['Time (s)', 'Position (m)', 'Velocity (m/s)', 'Acceleration (m/s²)', 'Tension (N)', 'Net Force (N)', 'W1 (N)', 'W2 (N)'],
        rows: rows.map((d) => [d.time, d.position, d.velocity, d.acceleration, d.tensionForce, d.netForce, d.mass1Weight, d.mass2Weight]),
        xCol: 0,
        yCol: 1,
      }
    },
    getSensorTrace(): SensorSample[] {
      // Motion detector trace: position vs time (matches the bespoke position-time graph)
      return rows.map((d) => ({ x: d.time, y: d.position }))
    },
    isComplete() {
      // Mirrors the bespoke "Target Distance Reached!" completion.
      return hasReachedTarget() && acceleration !== 0
    },
    destroy() {},
  }
  return engine
}
