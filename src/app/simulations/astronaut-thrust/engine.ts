import type { SimEngine, ParamValues, SimData, SensorSample } from '@/components/simulations/lab/contract'
import { PAL, grid as drawGrid, arrow, chip } from '@/components/simulations/lab/draw'

// Astronaut thrust — Newton's First & Second Laws in space (no friction, no
// gravity). A 100 kg astronaut floats on a 2-D plane. A thrust vector (magnitude
// + angle) produces an acceleration a = F/m, which integrates to velocity and
// position. With zero thrust the astronaut coasts at constant velocity (1st law);
// with thrust it accelerates (2nd law). The astronaut bounces off the canvas
// edges with an 80% speed retention so it stays in view. Speed/acceleration are
// sampled into a table every 0.5 s, exactly as the bespoke sim did.

const ASTRONAUT_MASS = 100 // kg (astronaut + spacesuit)
const PIXELS_PER_METER = 20 // rendering scale (matches bespoke)
const SAMPLE_DT = 0.5 // seconds between table rows
const MIN_DATA_POINTS = 10 // bespoke "complete" bar: 10+ samples collected

interface Vec { x: number; y: number }

interface Row {
  time: number
  positionX: number
  positionY: number
  velocityX: number
  velocityY: number
  accelerationX: number
  accelerationY: number
  speed: number
  forceX: number
  forceY: number
  forceMagnitude: number
}

export function createAstronautThrustEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
): SimEngine {
  let thrustMagnitude = Number(initial.thrustMagnitude ?? 0) // N
  let thrustAngle = Number(initial.thrustAngle ?? 0) // degrees
  let initialVelocity = Number(initial.initialVelocity ?? 0) // m/s
  let velocityAngle = Number(initial.velocityAngle ?? 0) // degrees

  // Position is kept in PIXELS (as the bespoke engine did); velocity/accel in SI.
  let position: Vec = { x: 250, y: 250 }
  let velocity: Vec = { x: 0, y: 0 } // m/s
  let acceleration: Vec = { x: 0, y: 0 } // m/s^2
  let thrustForce: Vec = { x: 0, y: 0 } // N
  let time = 0
  let running = false
  let started = false
  let lastSample = -1
  let rows: Row[] = []

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  const speed = () => Math.hypot(velocity.x, velocity.y)
  const forceMag = () => Math.hypot(thrustForce.x, thrustForce.y)
  const accelMag = () => Math.hypot(acceleration.x, acceleration.y)

  function applyThrust() {
    const fx = thrustMagnitude * Math.cos((thrustAngle * Math.PI) / 180)
    const fy = thrustMagnitude * Math.sin((thrustAngle * Math.PI) / 180)
    thrustForce = { x: fx, y: fy }
    // Newton's 2nd law: a = F / m
    acceleration = { x: fx / ASTRONAUT_MASS, y: fy / ASTRONAUT_MASS }
  }

  function centerPosition() {
    const { w, h } = dims()
    position = { x: w / 2, y: h / 2 }
  }

  function render() {
    const { w, h } = dims()

    // Clear + space background
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, w, h)

    // Stars
    ctx.fillStyle = '#fff'
    for (let i = 0; i < 100; i++) {
      const x = (i * 73) % w
      const y = (i * 127) % h
      const size = (i % 3) + 1
      ctx.fillRect(x, y, size, size)
    }

    // Reference grid — shared helper, faint white so it reads on the dark space bg
    // (PAL.grid is tuned for the lavender field and would wash out here).
    drawGrid(ctx, w, h, 50, { color: 'rgba(255,255,255,0.10)' })

    // Floating-label chip background — dark so it stays legible over space.
    const CHIP_BG = 'rgba(38,33,92,0.85)'

    // Velocity vector → PAL.velocity (green = motion)
    const velMag = speed()
    if (velMag > 0.1) {
      const velScale = 30
      const tipX = position.x + velocity.x * velScale
      const tipY = position.y + velocity.y * velScale
      arrow(ctx, position.x, position.y, tipX, tipY, { color: PAL.velocity, width: 3, head: 10 })
      chip(ctx, `v = ${velMag.toFixed(1)} m/s`, (position.x + tipX) / 2, (position.y + tipY) / 2 - 10, {
        bg: CHIP_BG,
        color: '#FFFFFF',
      })
    }

    // Thrust force vector → PAL.force (coral = force)
    const fMag = forceMag()
    if (fMag > 0.1) {
      const forceScale = 0.5
      const tipX = position.x + thrustForce.x * forceScale
      const tipY = position.y + thrustForce.y * forceScale
      arrow(ctx, position.x, position.y, tipX, tipY, { color: PAL.force, width: 4, head: 10 })
      chip(ctx, `F = ${fMag.toFixed(0)} N`, (position.x + tipX) / 2, (position.y + tipY) / 2 + 20, {
        bg: CHIP_BG,
        color: '#FFFFFF',
      })
    }

    // Astronaut
    ctx.font = '40px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🧑‍🚀', position.x, position.y)
    ctx.textBaseline = 'alphabetic'

    // Mechanical equilibrium indicator (no net force) → PAL.accent (gold = "answer")
    if (fMag < 0.1) {
      ctx.strokeStyle = PAL.accent
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(position.x, position.y, 35, 0, 2 * Math.PI)
      ctx.stroke()
      chip(ctx, 'EQUILIBRIUM', position.x, position.y - 50, { bg: CHIP_BG, color: PAL.accent, size: 10 })
    }
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (!running) return
      const { w, h } = dims()

      // Newton's 2nd Law: acceleration already set from thrust.
      // v = v0 + a t
      velocity.x += acceleration.x * dt
      velocity.y += acceleration.y * dt
      // x = x0 + v t  (position in pixels)
      position.x += velocity.x * PIXELS_PER_METER * dt
      position.y += velocity.y * PIXELS_PER_METER * dt

      // Elastic edge bounce (speed fully retained). The bespoke version drained
      // 20% of the speed at each wall, which silently contradicted this sim's
      // core lesson: with zero thrust the astronaut should coast at CONSTANT
      // speed (Newton's 1st law). A wall is an external force, so reversing
      // direction is legitimate — but losing speed with no force shown taught the
      // exact misconception the sim exists to dispel. Speed is now conserved
      // across bounces, so a thrust-free astronaut keeps its speed forever.
      if (position.x < 30) {
        position.x = 30
        velocity.x = Math.abs(velocity.x)
      }
      if (position.x > w - 30) {
        position.x = w - 30
        velocity.x = -Math.abs(velocity.x)
      }
      if (position.y < 30) {
        position.y = 30
        velocity.y = Math.abs(velocity.y)
      }
      if (position.y > h - 30) {
        position.y = h - 30
        velocity.y = -Math.abs(velocity.y)
      }

      time += dt

      // Sample table every 0.5 s (matches bespoke data collection cadence).
      if (time - lastSample >= SAMPLE_DT) {
        rows.push({
          time: parseFloat(time.toFixed(2)),
          positionX: parseFloat((position.x / PIXELS_PER_METER).toFixed(2)),
          positionY: parseFloat((position.y / PIXELS_PER_METER).toFixed(2)),
          velocityX: parseFloat(velocity.x.toFixed(2)),
          velocityY: parseFloat(velocity.y.toFixed(2)),
          accelerationX: parseFloat(acceleration.x.toFixed(2)),
          accelerationY: parseFloat(acceleration.y.toFixed(2)),
          speed: parseFloat(speed().toFixed(2)),
          forceX: parseFloat(thrustForce.x.toFixed(2)),
          forceY: parseFloat(thrustForce.y.toFixed(2)),
          forceMagnitude: parseFloat(forceMag().toFixed(2)),
        })
        lastSample = time
      }
    },
    setParams(values: ParamValues) {
      thrustMagnitude = Number(values.thrustMagnitude ?? thrustMagnitude)
      thrustAngle = Number(values.thrustAngle ?? thrustAngle)
      initialVelocity = Number(values.initialVelocity ?? initialVelocity)
      velocityAngle = Number(values.velocityAngle ?? velocityAngle)
      // Thrust is mid-run editable; re-derive acceleration immediately.
      applyThrust()
    },
    start(values: ParamValues) {
      thrustMagnitude = Number(values.thrustMagnitude ?? thrustMagnitude)
      thrustAngle = Number(values.thrustAngle ?? thrustAngle)
      initialVelocity = Number(values.initialVelocity ?? initialVelocity)
      velocityAngle = Number(values.velocityAngle ?? velocityAngle)

      if (!started) {
        // Seed initial velocity from magnitude + direction once at launch.
        velocity = {
          x: initialVelocity * Math.cos((velocityAngle * Math.PI) / 180),
          y: initialVelocity * Math.sin((velocityAngle * Math.PI) / 180),
        }
        started = true
      }
      applyThrust()
      running = true
    },
    reset() {
      running = false
      started = false
      centerPosition()
      velocity = { x: 0, y: 0 }
      acceleration = { x: 0, y: 0 }
      thrustForce = { x: 0, y: 0 }
      time = 0
      lastSample = -1
      rows = []
    },
    getReadouts() {
      return {
        time,
        speed: speed(),
        acceleration: accelMag(),
        force: forceMag(),
      }
    },
    getData(): SimData {
      return {
        columns: [
          'Time (s)',
          'Speed (m/s)',
          'Accel (m/s²)',
          'Force (N)',
          'Pos X (m)',
          'Pos Y (m)',
          'Vel X (m/s)',
          'Vel Y (m/s)',
        ],
        rows: rows.map((d) => [
          d.time,
          d.speed,
          parseFloat(Math.hypot(d.accelerationX, d.accelerationY).toFixed(2)),
          d.forceMagnitude,
          d.positionX,
          d.positionY,
          d.velocityX,
          d.velocityY,
        ]),
        xCol: 0,
        yCol: 1,
      }
    },
    getSensorTrace(): SensorSample[] {
      return rows.map((d) => ({ x: d.time, y: d.speed }))
    },
    // Mirrors bespoke completion: the run counted as "done" once the student had
    // collected 10+ data samples (5+ s of motion). Physics-keyed via rows.length.
    isComplete() {
      return rows.length >= MIN_DATA_POINTS
    },
    destroy() {},
  }

  // Start centred on the canvas at its current size.
  centerPosition()
  applyThrust()

  return engine
}
