import type { SimEngine, ParamValues, SimData, SensorSample } from '@/components/simulations/lab/contract'
import { PAL, clearField, groundShadow, arrow, chip } from '@/components/simulations/lab/draw'

// Carts & springs — Newton's Third Law. Two carts sit on a track with a
// compressed spring between them. On release, an equal-and-opposite interaction
// force acts on each cart for a fixed time (interactionTime), pushing them
// apart. After the force is spent the carts coast (free motion) and bounce off
// the walls. Same force, different masses → different accelerations (F = ma),
// and total momentum stays conserved (≈ 0 from rest).
//
// Physics is identical to the bespoke sim: force ON A = +F, force ON B = −F for
// the first interactionTime seconds; a = F/m; v += a·dt; x += v·ppm·dt; walls
// reflect with 0.7 restitution. Pixel motion uses pixelsPerMeter = 50.

const PPM = 50 // pixels per meter
const INTERACTION_TIME = 0.5 // seconds the spring force is applied

const FONT = 'ui-sans-serif, system-ui, sans-serif'

// Scene tokens; structural/semantic tones come from the shared PAL so the sim
// matches every other lab. Wheel/floor/track stay scene-specific.
const COL = {
  bg: PAL.bg,
  floor: '#9ca3af', // track rail (scene)
  wheel: '#1f2937', // cart wheels (scene)
  center: PAL.axis, // center line
  a: PAL.primary, aStroke: '#5b52c4', // cart A
  b: PAL.force, bStroke: '#a8421f', // cart B
  forceA: PAL.velocity, // action force on A (green role)
  forceB: PAL.primary, // reaction force on B (purple→primary)
  actionLabel: PAL.accent, // ACTION ⟷ REACTION
  vel: PAL.cool, // velocity vectors
  inkA: PAL.ink, inkB: PAL.ink, // cart labels
} as const

export function createCartsThirdLawEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
): SimEngine {
  let massA = Number(initial.massA ?? 2.0)
  let massB = Number(initial.massB ?? 1.0)
  let interactionForce = Number(initial.interactionForce ?? 100)

  let positionA = 0 // pixels from left
  let positionB = 0
  let velocityA = 0 // m/s
  let velocityB = 0
  let elapsedInteractionTime = 0
  let time = 0
  let running = false
  let launched = false

  let rows: number[][] = []
  let traceA: SensorSample[] = []
  let traceB: SensorSample[] = []
  let traceP: SensorSample[] = []
  let lastSample = -1

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  const initPositions = () => {
    const { w } = dims()
    positionA = w * 0.3
    positionB = w * 0.7
  }
  initPositions()

  const forcesActive = () => elapsedInteractionTime < INTERACTION_TIME && interactionForce > 0
  const currentForceOnA = () => (forcesActive() ? interactionForce : 0)
  const currentForceOnB = () => (forcesActive() ? -interactionForce : 0)

  // Draw one cart: body, mass label, wheels, ground shadow. Geometry unchanged.
  function drawCart(
    cx: number, topY: number, cw: number, ch: number,
    massKg: number, fill: string, stroke: string,
  ) {
    groundShadow(ctx, cx, topY + ch + 10, cw / 2, (cw / 2) * 0.3)

    ctx.fillStyle = fill
    ctx.fillRect(cx - cw / 2, topY, cw, ch)
    ctx.strokeStyle = stroke
    ctx.lineWidth = 3
    ctx.strokeRect(cx - cw / 2, topY, cw, ch)

    ctx.fillStyle = PAL.onAccent
    ctx.font = `bold 16px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${massKg.toFixed(1)} kg`, cx, topY + ch / 2)

    ctx.fillStyle = COL.wheel
    ctx.beginPath()
    ctx.arc(cx - cw / 3, topY + ch, 8, 0, 2 * Math.PI)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + cw / 3, topY + ch, 8, 0, 2 * Math.PI)
    ctx.fill()
  }

  function render() {
    const { w, h } = dims()

    clearField(ctx, w, h)

    // Floor / track
    const floorY = h - 80
    ctx.fillStyle = COL.floor
    ctx.fillRect(0, floorY, w, 5)

    // Center line
    ctx.strokeStyle = COL.center
    ctx.lineWidth = 2
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo(w / 2, 0)
    ctx.lineTo(w / 2, h)
    ctx.stroke()
    ctx.setLineDash([])

    const active = forcesActive()

    // Cart A (left)
    const cartAY = floorY - 60
    const cartAWidth = 60 + massA * 15
    const cartAHeight = 40
    drawCart(positionA, cartAY, cartAWidth, cartAHeight, massA, COL.a, COL.aStroke)

    // Cart B (right)
    const cartBY = floorY - 60
    const cartBWidth = 60 + massB * 15
    const cartBHeight = 40
    drawCart(positionB, cartBY, cartBWidth, cartBHeight, massB, COL.b, COL.bStroke)

    // Interaction force arrows (during interaction only)
    if (active && interactionForce > 0) {
      const forceScale = 0.8
      const arrowY = cartAY + cartAHeight / 2

      // Action force on Cart A (pushing LEFT, away from B)
      const aTip = positionA - interactionForce * forceScale
      arrow(ctx, positionA, arrowY, aTip, arrowY, { color: COL.forceA, width: 4, head: 12 })
      chip(ctx, `F = ${interactionForce.toFixed(0)}N`, (positionA + aTip) / 2, arrowY - 15, { color: COL.forceA })

      // Reaction force on Cart B (pushing RIGHT, away from A)
      const bTip = positionB + interactionForce * forceScale
      arrow(ctx, positionB, arrowY, bTip, arrowY, { color: COL.forceB, width: 4, head: 12 })
      chip(ctx, `F = ${interactionForce.toFixed(0)}N`, (positionB + bTip) / 2, arrowY - 15, { color: COL.forceB })

      // Action-Reaction label
      chip(ctx, 'ACTION ⟷ REACTION', w / 2, arrowY - 40, { color: COL.actionLabel })
    }

    // Velocity vectors. A and B ride on SEPARATE vertical lanes (and their chips
    // above each lane) so that when the carts pass through each other on the
    // bounce-back, the two arrows and their numbers never overlap.
    const velYA = cartAY - 22
    const velYB = cartAY - 50
    if (Math.abs(velocityA) > 0.1) {
      const velScale = 40
      arrow(ctx, positionA, velYA, positionA + velocityA * velScale, velYA, { color: COL.vel, width: 3 })
      chip(ctx, `v_A = ${velocityA.toFixed(1)} m/s`, positionA, velYA - 12, { color: COL.vel })
    }
    if (Math.abs(velocityB) > 0.1) {
      const velScale = 40
      arrow(ctx, positionB, velYB, positionB + velocityB * velScale, velYB, { color: COL.vel, width: 3 })
      chip(ctx, `v_B = ${velocityB.toFixed(1)} m/s`, positionB, velYB - 12, { color: COL.vel })
    }

    // Cart name labels — also on separate lanes below the track, so a crossing
    // never stacks "Cart A" on "Cart B".
    ctx.font = `bold 14px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = COL.inkA
    ctx.fillText('Cart A', positionA, cartAY + cartAHeight + 22)
    ctx.fillStyle = COL.inkB
    ctx.fillText('Cart B', positionB, cartBY + cartBHeight + 44)
  }

  function recordSample() {
    const momA = massA * velocityA
    const momB = massB * velocityB
    const total = momA + momB
    rows.push([
      parseFloat(time.toFixed(2)),
      parseFloat((positionA / PPM).toFixed(2)),
      parseFloat((positionB / PPM).toFixed(2)),
      parseFloat(velocityA.toFixed(2)),
      parseFloat(velocityB.toFixed(2)),
      parseFloat(momA.toFixed(2)),
      parseFloat(momB.toFixed(2)),
      parseFloat(total.toFixed(2)),
      parseFloat(currentForceOnA().toFixed(2)),
      parseFloat(currentForceOnB().toFixed(2)),
    ])
    traceA.push({ x: time, y: velocityA })
    traceB.push({ x: time, y: velocityB })
    traceP.push({ x: time, y: total })
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (!running) return
      const { w } = dims()

      // Newton's Third Law: equal and opposite forces during interaction window.
      // The compressed spring pushes the carts APART — Cart A (left) is driven
      // left (−x), Cart B (right) is driven right (+x). The previous signs pushed
      // them toward each other, so they passed through one another (and their
      // labels collided) instead of springing apart and bouncing off the walls.
      let forceOnA = 0
      let forceOnB = 0
      if (elapsedInteractionTime < INTERACTION_TIME) {
        forceOnA = -interactionForce
        forceOnB = interactionForce
        elapsedInteractionTime += dt
      }

      // F = ma → a = F/m
      const accelerationA = forceOnA / massA
      const accelerationB = forceOnB / massB

      // v = v0 + a·t
      velocityA += accelerationA * dt
      velocityB += accelerationB * dt

      // x = x0 + v·t (in pixels)
      positionA += velocityA * PPM * dt
      positionB += velocityB * PPM * dt

      // Bounce off walls (restitution 0.7)
      if (positionA < 50) { positionA = 50; velocityA = -velocityA * 0.7 }
      if (positionA > w - 50) { positionA = w - 50; velocityA = -velocityA * 0.7 }
      if (positionB < 50) { positionB = 50; velocityB = -velocityB * 0.7 }
      if (positionB > w - 50) { positionB = w - 50; velocityB = -velocityB * 0.7 }

      // Cart–cart collision. Two solid carts must not pass through each other —
      // previously they overlapped (bodies and their "kg" tags) when they met on
      // the bounce-back. This is a 1-D ELASTIC collision (conserves both momentum
      // and kinetic energy), applied only when the carts touch AND are closing.
      const halfA = (60 + massA * 15) / 2 // matches cartWidth in render()
      const halfB = (60 + massB * 15) / 2
      const minGap = halfA + halfB
      const gap = positionB - positionA // Cart A is left, Cart B is right
      if (gap < minGap && velocityA - velocityB > 0) {
        const u1 = velocityA, u2 = velocityB
        velocityA = ((massA - massB) * u1 + 2 * massB * u2) / (massA + massB)
        velocityB = ((massB - massA) * u2 + 2 * massA * u1) / (massA + massB)
        // Push apart to exactly touching so they never visually overlap or jitter.
        const overlap = minGap - gap
        positionA -= overlap / 2
        positionB += overlap / 2
      }

      time += dt

      // Sample data every 0.2 s (matches bespoke collection cadence).
      if (time - lastSample >= 0.2) {
        recordSample()
        lastSample = time
      }
    },
    setParams(values: ParamValues) {
      massA = Number(values.massA ?? massA)
      massB = Number(values.massB ?? massB)
      interactionForce = Number(values.interactionForce ?? interactionForce)
    },
    start(values: ParamValues) {
      this.setParams(values)
      running = true
      launched = true
      elapsedInteractionTime = 0
    },
    reset() {
      running = false
      launched = false
      initPositions()
      velocityA = 0
      velocityB = 0
      time = 0
      elapsedInteractionTime = 0
      lastSample = -1
      rows = []
      traceA = []
      traceB = []
      traceP = []
    },
    getReadouts() {
      const momA = massA * velocityA
      const momB = massB * velocityB
      return {
        time,
        velocityA,
        velocityB,
        momentumA: momA,
        momentumB: momB,
        totalMomentum: momA + momB,
        forceOnA: currentForceOnA(),
        forceOnB: currentForceOnB(),
      }
    },
    getData(): SimData {
      return {
        columns: [
          'Time (s)', 'Pos A (m)', 'Pos B (m)', 'Vel A (m/s)', 'Vel B (m/s)',
          'Mom A (kg·m/s)', 'Mom B (kg·m/s)', 'Total Mom (kg·m/s)', 'Force on A (N)', 'Force on B (N)',
        ],
        rows,
        xCol: 0,
        yCol: 3,
      }
    },
    getSensorTrace(key?: string): SensorSample[] {
      if (key === 'velocityB') return traceB
      if (key === 'totalMomentum') return traceP
      return traceA
    },
    // Mirrors bespoke completion: a release happened and enough data accumulated
    // (bespoke marked complete at >= 10 data points, i.e. ~2 s of run).
    isComplete() {
      return launched && rows.length >= 10
    },
    destroy() {},
  }
  return engine
}
