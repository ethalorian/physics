import type { SimEngine, ParamValues, SimData, SensorSample } from '@/components/simulations/lab/contract'
import { PAL, clearField, groundShadow, arrow, chip } from '@/components/simulations/lab/draw'

// Sumo wrestling forces — two wrestlers (red, blue) push against each other on a
// dohyo. Each sets a force; their combined mass resists. Newton's 2nd law drives
// the motion: ΣF = redForce − blueForce, a = ΣF / (m_red + m_blue). The shared
// contact point accelerates, gains velocity, and slides across the mat. A
// wrestler is pushed out (the bout ends) once |position| exceeds the ring edge.
// Faithful port of the bespoke SumoPhysicsEngine: same Newtonian model, same
// canvas drawing (ring gradient, sumo bodies sized by mass, force arrows).

const RING_LIMIT = 100 // |position| beyond this = pushed out of the ring

// Scene tokens; semantic physics roles come from the shared PAL so the sim
// matches every other lab. Red→force (coral), blue→primary (lavender),
// net force is the key result → accent (gold reads as "the answer"). The
// dohyo brown/sand tones stay scene-specific.
const COL = {
  red: PAL.force, blue: PAL.primary, net: PAL.accent,
  ring: '#8B4513', sand0: '#F4E4C1', sand1: '#DCC896',
  redBelt: '#991B1B', blueBelt: '#1E40AF', skin: '#FDB5A6',
  ink: PAL.ink, mute: PAL.mute, onAccent: PAL.onAccent,
} as const

interface Kin { t: number; pos: number; vel: number; acc: number; net: number }

export function createSumoForcesEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
): SimEngine {
  let redMass = Number(initial.redMass ?? 150)
  let blueMass = Number(initial.blueMass ?? 150)
  let redForce = Number(initial.redForce ?? 500)
  let blueForce = Number(initial.blueForce ?? 500)

  // Engine-local physics state (was React state in the bespoke page).
  let position = 0 // -100..+100 across the mat
  let velocity = 0
  let acceleration = 0
  let netForce = 0
  let totalMass = redMass + blueMass
  let time = 0
  let winner: 'red' | 'blue' | null = null

  let history: Kin[] = []
  let lastSampleT = -1

  const ringRadius = 150
  const wrestlerSize = 60 // (kept for parity with bespoke; body size derived from mass)

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  // ΣF = ma — recompute the instantaneous force/accel from current params.
  function recompute() {
    netForce = redForce - blueForce
    totalMass = redMass + blueMass
    acceleration = netForce / totalMass
  }
  recompute()

  // ---- drawing -----------------------------------------------------------
  function drawRing(cx: number, cy: number) {
    // Outer ring (scene-specific dohyo brown)
    ctx.strokeStyle = COL.ring
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2)
    ctx.stroke()

    // Inner sand (radial gradient, scene-specific)
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, ringRadius)
    gradient.addColorStop(0, COL.sand0)
    gradient.addColorStop(1, COL.sand1)
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2)
    ctx.fill()

    // Center lines (shikiri-sen)
    ctx.strokeStyle = COL.ring
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx - 40, cy)
    ctx.lineTo(cx - 10, cy)
    ctx.moveTo(cx + 10, cy)
    ctx.lineTo(cx + 40, cy)
    ctx.stroke()
  }

  function drawSumoWrestler(x: number, y: number, color: 'red' | 'blue', mass: number) {
    const size = 30 + mass / 10 // size based on mass

    // Contact shadow on the sand for depth
    groundShadow(ctx, x, y + size * 0.92, size * 0.85)

    // Body
    ctx.fillStyle = color === 'red' ? COL.red : COL.blue
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()

    // Face
    ctx.fillStyle = COL.skin
    ctx.beginPath()
    ctx.arc(x, y - size / 3, size / 2, 0, Math.PI * 2)
    ctx.fill()

    // Mawashi (belt)
    ctx.strokeStyle = color === 'red' ? COL.redBelt : COL.blueBelt
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(x, y, size, Math.PI * 0.2, Math.PI * 0.8)
    ctx.stroke()

    // Arms pushing
    ctx.strokeStyle = COL.skin
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    if (color === 'red') {
      ctx.beginPath()
      ctx.moveTo(x + size * 0.7, y)
      ctx.lineTo(x + size * 1.3, y - 10)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x + size * 0.7, y)
      ctx.lineTo(x + size * 1.3, y + 10)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.moveTo(x - size * 0.7, y)
      ctx.lineTo(x - size * 1.3, y - 10)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x - size * 0.7, y)
      ctx.lineTo(x - size * 1.3, y + 10)
      ctx.stroke()
    }
    ctx.lineCap = 'butt'

    // Mass label
    ctx.fillStyle = COL.onAccent
    ctx.font = 'bold 12px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${mass}kg`, x, y + 5)
    ctx.textAlign = 'left'
  }

  function drawForceVectors(cx: number, cy: number) {
    const redX = cx + position - 30
    const blueX = cx + position + 30
    const y = cy - 80
    const scale = 0.1 // pixels per Newton

    if (redForce > 0) {
      arrow(ctx, redX, y, redX + redForce * scale, y, { color: COL.red, width: 3 })
      chip(ctx, `${redForce}N`, redX + (redForce * scale) / 2, y - 14, { color: COL.red })
    }

    if (blueForce > 0) {
      arrow(ctx, blueX, y, blueX - blueForce * scale, y, { color: COL.blue, width: 3 })
      chip(ctx, `${blueForce}N`, blueX - (blueForce * scale) / 2, y - 14, { color: COL.blue })
    }

    if (Math.abs(netForce) > 10) {
      const netY = cy + 80
      const centerX = cx + position
      if (netForce > 0) {
        arrow(ctx, centerX, netY, centerX + Math.abs(netForce) * scale, netY, { color: COL.net, width: 4 })
      } else {
        arrow(ctx, centerX, netY, centerX - Math.abs(netForce) * scale, netY, { color: COL.net, width: 4 })
      }
      chip(ctx, `Net: ${Math.abs(netForce)}N`, centerX, netY + 18, { color: COL.net })
    }
  }

  function drawWinnerMessage(cx: number, cy: number, w: number, h: number) {
    ctx.fillStyle = 'rgba(38, 33, 92, 0.5)'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = COL.net
    ctx.font = 'bold 48px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${winner === 'red' ? 'RED' : 'BLUE'} WINS!`, cx, cy)
    ctx.font = 'bold 24px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('勝負あり！', cx, cy + 40)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'
  }

  function render() {
    const { w, h } = dims()
    const cx = w / 2
    const cy = h / 2
    clearField(ctx, w, h)

    drawRing(cx, cy)

    // Wrestlers sit at the shared contact point, offset ±30 px.
    const redX = cx + position - 30
    const blueX = cx + position + 30
    drawSumoWrestler(redX, cy, 'red', redMass)
    drawSumoWrestler(blueX, cy, 'blue', blueMass)

    drawForceVectors(cx, cy)

    if (winner) drawWinnerMessage(cx, cy, w, h)
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (winner) return
      // Newton's 2nd law integration (same as bespoke animate()).
      velocity += acceleration * dt
      position += velocity * dt
      time += dt

      // Sample kinematics every 0.1 s (cap at last 50 like the bespoke).
      if (history.length === 0 || time - lastSampleT >= 0.1) {
        history.push({
          t: Math.round(time * 10) / 10,
          pos: Math.round(position * 10) / 10,
          vel: Math.round(velocity * 100) / 100,
          acc: Math.round(acceleration * 100) / 100,
          net: Math.round(netForce),
        })
        if (history.length > 50) history = history.slice(1)
        lastSampleT = time
      }

      // Winner: a wrestler pushed past the ring edge.
      if (Math.abs(position) > RING_LIMIT) {
        winner = position > RING_LIMIT ? 'red' : 'blue'
      }
    },
    setParams(values: ParamValues) {
      redMass = Number(values.redMass ?? redMass)
      blueMass = Number(values.blueMass ?? blueMass)
      redForce = Number(values.redForce ?? redForce)
      blueForce = Number(values.blueForce ?? blueForce)
      recompute()
    },
    reset() {
      position = 0
      velocity = 0
      time = 0
      winner = null
      history = []
      lastSampleT = -1
      recompute()
    },
    getReadouts() {
      return {
        time,
        netForce: Math.abs(netForce),
        advantage: netForce > 0 ? 'Red' : netForce < 0 ? 'Blue' : 'Balanced',
        totalMass,
        acceleration: Math.abs(acceleration),
        velocity,
        position,
        winner: winner ? (winner === 'red' ? 'Red' : 'Blue') : '—',
      }
    },
    getData(): SimData {
      return {
        columns: ['Time (s)', 'Position', 'Velocity', 'Acceleration', 'Net Force (N)'],
        rows: history.map((k) => [k.t, k.pos, k.vel, k.acc, k.net]),
        xCol: 0,
        yCol: 1,
      }
    },
    getSensorTrace(): SensorSample[] {
      return history.map((k) => ({ x: k.t, y: k.net }))
    },
    isComplete() {
      return winner !== null
    },
    destroy() {},
  }

  // wrestlerSize retained from bespoke for visual reference; suppress unused.
  void wrestlerSize

  return engine
}
