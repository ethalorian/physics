import type { SimEngine, ParamValues, SimData, SensorSample } from '@/components/simulations/lab/contract'
import { PAL, clearField, groundShadow, chip } from '@/components/simulations/lab/draw'

// Vacuum chamber — drop a feather and a bowling ball at the same instant and watch
// air resistance decide the race. In vacuum (no air) both fall under g alone and
// land together (h = ½gt²). With air, drag F = ½ρv²C_dA opposes motion; the
// feather's huge area-to-mass ratio drags it to a slow terminal speed while the
// dense ball barely notices. Physics is integrated EXACTLY as the bespoke sim:
// a = (mg − drag) / m, with drag using v·|v| so it always opposes motion.

const GRAVITY = 9.8 // m/s²
const CHAMBER_HEIGHT = 10 // meters
const FEATHER_MASS = 0.005 // kg (5 grams)
const FEATHER_AREA = 0.01 // m²
const FEATHER_DRAG_COEFFICIENT = 1.3
const BALL_MASS = 7.26 // kg (16 lb bowling ball)
const BALL_AREA = 0.0367 // m² (diameter ~21.6 cm)
const BALL_DRAG_COEFFICIENT = 0.47

const FULL_AIR = 1.225 // kg/m³ sea level

interface FallSample {
  time: number
  featherY: number
  featherVy: number
  featherAy: number
  ballY: number
  ballVy: number
  ballAy: number
}

export function createVacuumChamberEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
): SimEngine {
  // Environment: airDensity 0 = vacuum, 1.225 = sea level. Driven by the vacuum toggle.
  let airDensity = initial.vacuum === false ? FULL_AIR : 0

  // Object state (Y measured in meters from the top of the chamber)
  let featherY = 0.5, featherVy = 0
  let ballY = 0.5, ballVy = 0
  let time = 0
  let dropping = false
  let done = false

  // Logged samples (every 0.1 s, matching the bespoke data collection)
  let samples: FallSample[] = []
  let lastSample = -1

  const chamberHeight = CHAMBER_HEIGHT
  const floorPosition = chamberHeight - 0.8

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  function calculateDragForce(velocity: number, area: number, dragCoeff: number): number {
    // F_d = ½ρv²C_dA — uses v·|v| so the force always opposes motion.
    if (airDensity === 0) return 0
    return 0.5 * airDensity * velocity * Math.abs(velocity) * dragCoeff * area
  }

  function featherAccel(): number {
    const drag = calculateDragForce(featherVy, FEATHER_AREA, FEATHER_DRAG_COEFFICIENT)
    return (FEATHER_MASS * GRAVITY - drag) / FEATHER_MASS
  }
  function ballAccel(): number {
    const drag = calculateDragForce(ballVy, BALL_AREA, BALL_DRAG_COEFFICIENT)
    return (BALL_MASS * GRAVITY - drag) / BALL_MASS
  }

  function render() {
    const { w, h } = dims()
    // Shared lavender field as the base (chamber scene is layered on top).
    clearField(ctx, w, h)

    // pixelsPerMeter scaled to the live canvas (bespoke: (height-100)/chamberHeight)
    const pixelsPerMeter = (h - 100) / chamberHeight

    // Chamber dimensions
    const chamberX = 60
    const chamberY = 80
    const chamberWidth = w - 120
    const chamberH = h - 120

    // Chamber background gradient (denser air = more visible tint).
    // Tinted toward the shared cool accent so air reads consistently.
    const airOpacity = airDensity / FULL_AIR
    const gradient = ctx.createLinearGradient(chamberX, chamberY, chamberX, chamberY + chamberH)
    gradient.addColorStop(0, `rgba(63, 165, 155, ${airOpacity * 0.16})`)
    gradient.addColorStop(1, `rgba(63, 165, 155, ${airOpacity * 0.34})`)
    ctx.fillStyle = airDensity > 0 ? gradient : PAL.surface
    ctx.fillRect(chamberX, chamberY, chamberWidth, chamberH)

    // Chamber walls (thick glass) — structural grid tone
    ctx.fillStyle = PAL.gridStrong
    ctx.fillRect(chamberX - 10, chamberY - 10, chamberWidth + 20, 10) // Top
    ctx.fillRect(chamberX - 10, chamberY, 10, chamberH) // Left
    ctx.fillRect(chamberX + chamberWidth, chamberY, 10, chamberH) // Right
    ctx.fillRect(chamberX - 10, chamberY + chamberH, chamberWidth + 20, 10) // Bottom

    // Inner border — strong structure tone
    ctx.strokeStyle = PAL.gridStrong
    ctx.lineWidth = 2
    ctx.strokeRect(chamberX, chamberY, chamberWidth, chamberH)

    // Measurement scale on left — axis ticks + muted labels
    ctx.strokeStyle = PAL.axis
    ctx.lineWidth = 1
    ctx.font = '10px ui-sans-serif, system-ui, sans-serif'
    ctx.fillStyle = PAL.mute
    ctx.textAlign = 'right'
    for (let i = 0; i <= 10; i++) {
      const y = chamberY + (i / 10) * (chamberH - 40)
      ctx.beginPath()
      ctx.moveTo(chamberX - 15, y)
      ctx.lineTo(chamberX - 5, y)
      ctx.stroke()
      ctx.fillText(`${i}m`, chamberX - 20, y + 3)
    }

    // Floor (platform) — positioned to match floorPosition
    const floorY = chamberY + floorPosition * pixelsPerMeter
    ctx.fillStyle = PAL.gridStrong
    ctx.fillRect(chamberX, floorY, chamberWidth, chamberY + chamberH - floorY)
    ctx.fillStyle = PAL.axis
    ctx.fillRect(chamberX, floorY, chamberWidth, 3)
    ctx.strokeStyle = PAL.grid
    ctx.lineWidth = 2
    for (let i = 0; i < 5; i++) {
      const x = chamberX + (chamberWidth / 5) * i
      ctx.beginPath()
      ctx.moveTo(x, floorY + 3)
      ctx.lineTo(x, chamberY + chamberH)
      ctx.stroke()
    }

    // Screen positions
    const featherScreenX = chamberX + chamberWidth * 0.35
    const featherScreenY = chamberY + 15 + featherY * pixelsPerMeter
    const ballScreenX = chamberX + chamberWidth * 0.65
    const ballScreenY = chamberY + 15 + ballY * pixelsPerMeter

    // Release mechanism at top
    ctx.strokeStyle = PAL.axis
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(featherScreenX - 20, chamberY + 5)
    ctx.lineTo(featherScreenX + 20, chamberY + 5)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(ballScreenX - 20, chamberY + 5)
    ctx.lineTo(ballScreenX + 20, chamberY + 5)
    ctx.stroke()

    // Contact shadows that grow as each object nears the floor (flat ellipse, shared depth language)
    const shadowFor = (cy: number, baseR: number) => {
      const span = floorY - (chamberY + 15)
      const prox = span > 0 ? Math.max(0, Math.min(1, (cy - (chamberY + 15)) / span)) : 1
      return { r: baseR * (0.55 + 0.45 * prox), a: 0.06 + 0.1 * prox }
    }
    const fSh = shadowFor(featherScreenY, 18)
    groundShadow(ctx, featherScreenX, floorY - 2, fSh.r, fSh.r * 0.3, `rgba(38,33,92,${fSh.a})`)
    const bSh = shadowFor(ballScreenY, 22)
    groundShadow(ctx, ballScreenX, floorY - 2, bSh.r, bSh.r * 0.3, `rgba(38,33,92,${bSh.a})`)

    // Feather glyph
    ctx.font = '45px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🪶', featherScreenX, featherScreenY)

    // Bowling ball glyph
    ctx.font = '45px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('🎳', ballScreenX, ballScreenY)

    // Object labels OUTSIDE chamber at top
    ctx.fillStyle = PAL.ink
    ctx.font = 'bold 16px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Feather', featherScreenX, chamberY - 50)
    ctx.font = '12px ui-sans-serif, system-ui, sans-serif'
    ctx.fillStyle = PAL.mute
    ctx.fillText('5g', featherScreenX, chamberY - 30)

    ctx.fillStyle = PAL.ink
    ctx.font = 'bold 16px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('Bowling Ball', ballScreenX, chamberY - 50)
    ctx.font = '12px ui-sans-serif, system-ui, sans-serif'
    ctx.fillStyle = PAL.mute
    ctx.fillText('7.26kg', ballScreenX, chamberY - 30)

    // Height markers (dotted lines) while falling — feather mapped to PAL.velocity
    if (featherY > 0.1 && featherY < floorPosition) {
      ctx.strokeStyle = PAL.velocity
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(chamberX + 5, featherScreenY)
      ctx.lineTo(chamberX + chamberWidth * 0.25, featherScreenY)
      ctx.stroke()
      ctx.setLineDash([])
      chip(ctx, `${featherY.toFixed(1)}m`, chamberX + 38, featherScreenY - 9, { color: PAL.velocity })
    }

    // Ball mapped to PAL.force
    if (ballY > 0.1 && ballY < floorPosition) {
      ctx.strokeStyle = PAL.force
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(chamberX + chamberWidth * 0.75, ballScreenY)
      ctx.lineTo(chamberX + chamberWidth - 5, ballScreenY)
      ctx.stroke()
      ctx.setLineDash([])
      chip(ctx, `${ballY.toFixed(1)}m`, chamberX + chamberWidth - 32, ballScreenY - 9, { color: PAL.force })
    }

    // LANDED indicators
    if (featherY >= floorPosition) {
      chip(ctx, 'LANDED', featherScreenX, floorY - 50, { color: PAL.velocity })
    }
    if (ballY >= floorPosition) {
      chip(ctx, 'LANDED', ballScreenX, floorY - 50, { color: PAL.force })
    }

    // Air density indicator OUTSIDE chamber at bottom — chip pill, vacuum uses accent tone
    const indicatorY = chamberY + chamberH + 25
    if (airDensity === 0) {
      chip(ctx, '🌑 VACUUM (No Air)', w / 2, indicatorY, { bg: PAL.surfaceMute, color: PAL.accent, size: 13 })
    } else if (airDensity >= 1.2) {
      chip(ctx, '🌍 FULL AIR (Sea Level)', w / 2, indicatorY, { bg: PAL.surfaceMute, color: PAL.cool, size: 13 })
    } else {
      chip(ctx, `🌫️ PARTIAL AIR (${(airOpacity * 100).toFixed(0)}%)`, w / 2, indicatorY, { bg: PAL.surfaceMute, color: PAL.cool, size: 13 })
    }

    // Air particles if air present — shared cool accent
    if (airDensity > 0) {
      ctx.fillStyle = `rgba(63, 165, 155, ${airOpacity * 0.45})`
      const numParticles = Math.floor(airOpacity * 30)
      for (let i = 0; i < numParticles; i++) {
        const x = chamberX + (i * 37) % chamberWidth
        const y = chamberY + (i * 53 + time * 20) % (chamberH - 40)
        ctx.fillRect(x, y, 2, 2)
      }
    }
  }

  function logSample() {
    samples.push({
      time: parseFloat(time.toFixed(3)),
      featherY: parseFloat(featherY.toFixed(3)),
      featherVy: parseFloat(featherVy.toFixed(3)),
      featherAy: parseFloat(featherAccel().toFixed(3)),
      ballY: parseFloat(ballY.toFixed(3)),
      ballVy: parseFloat(ballVy.toFixed(3)),
      ballAy: parseFloat(ballAccel().toFixed(3)),
    })
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (done || !dropping) return

      // Accelerations: a = F_net / m  (weight − drag)
      const featherAy = featherAccel()
      const ballAy = ballAccel()

      const featherLanded = featherY >= floorPosition
      const ballLanded = ballY >= floorPosition

      if (!featherLanded) {
        featherVy += featherAy * dt
        featherY += featherVy * dt
        if (featherY >= floorPosition) {
          featherY = floorPosition
          featherVy = 0
        }
      }
      if (!ballLanded) {
        ballVy += ballAy * dt
        ballY += ballVy * dt
        if (ballY >= floorPosition) {
          ballY = floorPosition
          ballVy = 0
        }
      }

      time += dt

      // Collect data every 0.1 s (matching bespoke)
      if (time - lastSample >= 0.1) {
        logSample()
        lastSample = time
      }

      // Stop once both have landed
      if (featherY >= floorPosition && ballY >= floorPosition) {
        dropping = false
        done = true
      }
    },
    setParams(values: ParamValues) {
      // vacuum toggle: true = vacuum (no air), false = full air
      airDensity = values.vacuum === false ? FULL_AIR : 0
    },
    start(values: ParamValues) {
      this.setParams(values)
      featherY = 0.5; featherVy = 0
      ballY = 0.5; ballVy = 0
      time = 0
      dropping = true
      done = false
      samples = []
      lastSample = -1
      logSample()
    },
    reset() {
      featherY = 0.5; featherVy = 0
      ballY = 0.5; ballVy = 0
      time = 0
      dropping = false
      done = false
      samples = []
      lastSample = -1
    },
    getReadouts() {
      return {
        time,
        featherY,
        featherVy,
        ballY,
        ballVy,
      }
    },
    getData(): SimData {
      return {
        columns: [
          'Time (s)', 'Feather Pos (m)', 'Feather Vel (m/s)', 'Feather Acc (m/s²)',
          'Ball Pos (m)', 'Ball Vel (m/s)', 'Ball Acc (m/s²)',
        ],
        rows: samples.map((s) => [
          s.time, s.featherY, s.featherVy, s.featherAy, s.ballY, s.ballVy, s.ballAy,
        ]),
        xCol: 0, yCol: 1,
      }
    },
    getSensorTrace(channelKey?: string): SensorSample[] {
      // Motion detector: downward speed vs time. Two channels (feather / ball).
      return samples.map((s) => ({ x: s.time, y: channelKey === 'ball' ? s.ballVy : s.featherVy }))
    },
    isComplete() {
      // Mirrors bespoke: the run is meaningful once both objects have landed.
      return done
    },
    destroy() {},
  }
  return engine
}
