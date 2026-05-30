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
    // Offset each wrestler by its OWN body radius so the two just touch at the
    // contact point instead of interpenetrating — at high mass a fixed ±30 px let
    // the bodies overlap so far they buried the "kg" labels. (radius = 30 + mass/10,
    // matching drawSumoWrestler's size.)
    const redX = cx + position - (30 + redMass / 10)
    const blueX = cx + position + (30 + blueMass / 10)
    const centerX = cx + position
    const scale = 0.1 // pixels per Newton

    // LEGIBILITY: the two push forces point toward each other, so drawing them on
    // one line made the arrows AND their numbers collide in the middle. Each force
    // now gets its own stacked lane above the wrestlers, and every label is
    // anchored over the wrestler that produces it (not at the arrow midpoint), so
    // no arrow and no number can ever overlap another — at any force/mass/position.
    // Lanes are measured off the LARGEST wrestler so a heavy sumo never reaches them.
    const maxR = 30 + Math.max(redMass, blueMass) / 10
    const redLaneY = cy - maxR - 28
    const blueLaneY = redLaneY - 38

    if (redForce > 0) {
      arrow(ctx, redX, redLaneY, redX + redForce * scale, redLaneY, { color: COL.red, width: 3 })
    }
    // Label always over the red wrestler, whatever the arrow length.
    chip(ctx, `Red: ${redForce} N`, redX, redLaneY - 13, { color: COL.red })

    if (blueForce > 0) {
      arrow(ctx, blueX, blueLaneY, blueX - blueForce * scale, blueLaneY, { color: COL.blue, width: 3 })
    }
    chip(ctx, `Blue: ${blueForce} N`, blueX, blueLaneY - 13, { color: COL.blue })

    // Net force on its own lane BELOW the wrestlers — never near the push arrows.
    if (Math.abs(netForce) > 10) {
      const netY = cy + maxR + 34
      if (netForce > 0) {
        arrow(ctx, centerX, netY, centerX + Math.abs(netForce) * scale, netY, { color: COL.net, width: 4 })
      } else {
        arrow(ctx, centerX, netY, centerX - Math.abs(netForce) * scale, netY, { color: COL.net, width: 4 })
      }
      chip(ctx, `Net: ${Math.abs(netForce)} N`, centerX, netY + 20, { color: COL.net })
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
    // Offset each wrestler by its OWN body radius so the two just touch at the
    // contact point instead of interpenetrating — at high mass a fixed ±30 px let
    // the bodies overlap so far they buried the "kg" labels. (radius = 30 + mass/10,
    // matching drawSumoWrestler's size.)
    const redX = cx + position - (30 + redMass / 10)
    const blueX = cx + position + (30 + blueMass / 10)
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
