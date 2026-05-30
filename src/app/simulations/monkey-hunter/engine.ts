import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'
import { PAL, clearField, grid as drawGrid, axes as drawAxes, groundShadow, arrow, chip } from '@/components/simulations/lab/draw'

// Scene-specific tones (ceiling/desk stay illustrative); structural + semantic
// tones come from the shared PAL so this sim matches every other lab.
const COL = {
  ceiling: '#e5e7eb', ceilingEdge: '#9ca3af',
  desk: '#92400e', deskTop: '#b45309',
  dartHead: '#7c2d12', dartFletch: '#fbbf24',
  string: PAL.mute,
}

// Monkey-hunter engine — the classic "shoot the falling monkey" projectile demo.
// Faithful port of the bespoke MonkeyHunterEngine: same physics, same canvas
// drawing (coordinate grid, ceiling, desk, emoji monkey/hunter, dart, trajectory,
// crosshair aim line, hit burst). The SimLab shell drives the fixed-substep loop
// (step/render) and sizing, so this class holds NO rAF and NO window listeners.
//
// Physics: dart undergoes projectile motion (constant vx, vy − g·t); the monkey
// drops in free fall the instant the dart fires. Aimed directly at the monkey,
// the dart always hits because both fall at g — gravity "cancels out" along the
// original aim line.

const GRAVITY = 9.8 // m/s²

interface Vector2D { x: number; y: number }
interface DataPoint {
  time: number
  dartX: number
  dartY: number
  monkeyX: number
  monkeyY: number
  dartVx: number
  dartVy: number
  monkeyVy: number
}

export function createMonkeyHunterEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
): SimEngine {
  // Fixed hunter position (on the desk, at ground level in physics coords).
  const hunterX = 2
  const hunterY = 0

  // Setup params.
  let monkeyHeight = Number(initial.monkeyHeight ?? 12)   // meters from ground
  let monkeyDistance = Number(initial.monkeyDistance ?? 13) // meters from hunter
  let launchSpeed = Number(initial.dartSpeed ?? 20)        // m/s
  let aimAtMonkey = String(initial.aimMode ?? 'direct') === 'direct'

  // Monkey initial (resting) position.
  let monkeyX0 = hunterX + monkeyDistance
  let monkeyY0 = monkeyHeight

  // Live state.
  let dartX = hunterX
  let dartY = hunterY
  let dartVx = 0
  let dartVy = 0
  let monkeyX = monkeyX0
  let monkeyY = monkeyY0
  let monkeyVy = 0

  let time = 0
  let firing = false   // dart in flight
  let hasHit = false
  let hitTime = 0
  // Set when a shot ends with the dart hitting the floor BEFORE reaching the
  // monkey's column — i.e. it fell short. Drives the on-canvas explanation that
  // turns the "always hits" precondition (both must stay airborne) into a lesson.
  let fellShort = false
  let trajectory: Vector2D[] = []
  let dataPoints: DataPoint[] = []
  let lastTrajT = 0

  const syncMonkeyHome = () => {
    monkeyX0 = hunterX + monkeyDistance
    monkeyY0 = monkeyHeight
    if (!firing && time === 0) {
      monkeyX = monkeyX0
      monkeyY = monkeyY0
    }
  }

  // ---- coordinate mapping (matches bespoke: origin near bottom-left) -------
  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }
  const layout = () => {
    const { w, h } = dims()
    const originX = 80
    const originY = h - 80
    const pixelsPerMeter = Math.min(w / 20, h / 15)
    return { w, h, originX, originY, ppm: pixelsPerMeter }
  }

  function render() {
    const { w, h, originX, originY, ppm } = layout()

    // Clear + classroom background (shared lavender field).
    clearField(ctx, w, h)

    // Grid (every meter), drawn within the plot region via the shared helper.
    drawGrid(ctx, w - 20, originY, ppm, {
      x0: originX, y0: 20, x1: w - 20, y1: originY,
      originX, originY, color: PAL.grid,
    })

    // Axes (shared L-shaped helper) + arrowheads via arrow().
    drawAxes(ctx, originX, 20, w - 20, originY, PAL.axis)
    arrow(ctx, originX, originY, w - 20, originY, { color: PAL.axis, width: 1.5, head: 9 })
    arrow(ctx, originX, originY, originX, 20, { color: PAL.axis, width: 1.5, head: 9 })

    // Axis labels. The x-title sits on its OWN line below the tick numbers (which
    // are at originY+18) and right-aligned to the axis end, so it never overlaps
    // the rightmost tick label.
    ctx.fillStyle = PAL.ink
    ctx.font = 'bold 14px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('x (meters)', w - 20, originY + 38)
    ctx.fillText('y (meters)', originX - 10, 15)

    // Ticks + labels.
    ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
    ctx.fillStyle = PAL.mute
    ctx.strokeStyle = PAL.axis
    for (let x = 0; x <= 20; x += 2) {
      const sx = originX + x * ppm
      if (sx <= w - 30) {
        ctx.beginPath(); ctx.moveTo(sx, originY); ctx.lineTo(sx, originY + 6); ctx.stroke()
        ctx.textAlign = 'center'; ctx.fillText(x.toString(), sx, originY + 18)
      }
    }
    for (let y = 0; y <= 14; y += 2) {
      const sy = originY - y * ppm
      if (sy >= 30) {
        ctx.beginPath(); ctx.moveTo(originX, sy); ctx.lineTo(originX - 6, sy); ctx.stroke()
        ctx.textAlign = 'right'; ctx.fillText(y.toString(), originX - 10, sy + 4)
      }
    }

    // Ceiling.
    ctx.fillStyle = COL.ceiling; ctx.fillRect(0, 0, w, 20)
    ctx.fillStyle = COL.ceilingEdge; ctx.fillRect(0, 18, w, 4)

    // Desk (with a soft contact shadow at its base).
    const deskHeight = 30
    groundShadow(ctx, originX, originY + 4, 48, 7)
    ctx.fillStyle = COL.desk; ctx.fillRect(originX - 40, originY - deskHeight, 80, deskHeight)
    ctx.fillStyle = COL.deskTop; ctx.fillRect(originX - 40, originY - deskHeight, 80, 3)

    // Physics → screen.
    const monkeyScreenX = originX + monkeyX * ppm
    const monkeyScreenY = originY - monkeyY * ppm
    const dartScreenX = originX + dartX * ppm
    const dartScreenY = originY - dartY * ppm
    const hunterScreenX = originX + hunterX * ppm
    const hunterScreenY = originY - hunterY * ppm

    // Monkey.
    ctx.font = '35px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🐵', monkeyScreenX, monkeyScreenY)
    ctx.textBaseline = 'alphabetic'

    // String from ceiling (before the shot).
    if (time === 0 || !firing) {
      ctx.strokeStyle = COL.string; ctx.lineWidth = 2; ctx.setLineDash([2, 2])
      ctx.beginPath(); ctx.moveTo(monkeyScreenX, 20); ctx.lineTo(monkeyScreenX, monkeyScreenY - 18); ctx.stroke()
      ctx.setLineDash([])
    }

    // Aim line + crosshair (before firing). Aim line in accent gold (dashed);
    // target highlight tied to the cool/teal tone.
    if (!firing && time === 0) {
      ctx.strokeStyle = PAL.accent; ctx.lineWidth = 2; ctx.setLineDash([6, 5])
      ctx.beginPath(); ctx.moveTo(hunterScreenX, hunterScreenY); ctx.lineTo(monkeyScreenX, monkeyScreenY); ctx.stroke()
      ctx.setLineDash([])

      ctx.strokeStyle = PAL.cool; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(monkeyScreenX, monkeyScreenY, 22, 0, 2 * Math.PI); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(monkeyScreenX - 25, monkeyScreenY); ctx.lineTo(monkeyScreenX + 25, monkeyScreenY); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(monkeyScreenX, monkeyScreenY - 25); ctx.lineTo(monkeyScreenX, monkeyScreenY + 25); ctx.stroke()

      const midX = (hunterScreenX + monkeyScreenX) / 2
      const midY = (hunterScreenY + monkeyScreenY) / 2
      chip(ctx, 'AIM LINE', midX, midY - 8, { bg: PAL.accent, color: PAL.onAccent })
    }

    // Dart trajectory (projectile path → primary lavender).
    if (trajectory.length > 1) {
      ctx.strokeStyle = PAL.primary; ctx.lineWidth = 2; ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(originX + trajectory[0].x * ppm, originY - trajectory[0].y * ppm)
      for (let i = 1; i < trajectory.length; i++) {
        ctx.lineTo(originX + trajectory[i].x * ppm, originY - trajectory[i].y * ppm)
      }
      ctx.stroke(); ctx.setLineDash([])
    }

    // Dart.
    if (firing || time > 0) {
      ctx.save()
      ctx.translate(dartScreenX, dartScreenY)
      const dartAngle = Math.atan2(-dartVy, dartVx)
      ctx.rotate(dartAngle)
      ctx.fillStyle = PAL.primary
      ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-12, -4); ctx.lineTo(-12, 4); ctx.closePath(); ctx.fill()
      ctx.fillStyle = COL.dartHead
      ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(18, -3); ctx.lineTo(18, 3); ctx.closePath(); ctx.fill()
      ctx.fillStyle = COL.dartFletch
      ctx.beginPath(); ctx.moveTo(-12, -4); ctx.lineTo(-16, -6); ctx.lineTo(-12, -2); ctx.closePath(); ctx.fill()
      ctx.beginPath(); ctx.moveTo(-12, 4); ctx.lineTo(-16, 6); ctx.lineTo(-12, 2); ctx.closePath(); ctx.fill()
      ctx.restore()
    }

    // Hunter (with a soft contact shadow under the launcher base).
    groundShadow(ctx, hunterScreenX, originY - deskHeight - 1, 26, 5)
    ctx.font = '40px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('🧑‍🔬', hunterScreenX, hunterScreenY - 35)

    // Dart gun (before firing).
    if (!firing && time === 0) {
      ctx.save()
      ctx.translate(hunterScreenX + 15, hunterScreenY - 25)
      const gunAngle = Math.atan2(monkeyY0, monkeyX0 - hunterX)
      ctx.rotate(gunAngle)
      ctx.fillStyle = '#475569'; ctx.fillRect(0, -3, 25, 6)
      ctx.fillStyle = '#1e293b'; ctx.fillRect(25, -2, 5, 4)
      ctx.restore()
    }

    // Floating position labels (wrapped in legible chips). Shown ONLY while the
    // dart is in flight — the dart and monkey converge to the same point at
    // impact, so two same-side chips would land on top of each other. After the
    // shot the Hit chip / fell-short banner take over. During flight the dart
    // label is biased up-and-left and the monkey label down-and-right, so even as
    // the two objects close in, their labels stay cleanly separated.
    if (firing && !hasHit) {
      chip(ctx, `Dart (${dartX.toFixed(1)}, ${dartY.toFixed(1)})`, dartScreenX - 16, dartScreenY - 24, { color: PAL.primary, align: 'right' })
      chip(ctx, `Monkey (${monkeyX.toFixed(1)}, ${monkeyY.toFixed(1)})`, monkeyScreenX + 16, monkeyScreenY + 28, { color: PAL.cool, align: 'left' })
    }

    // Hit indicator + burst (the event → accent gold).
    if (hasHit) {
      ctx.fillStyle = PAL.accent; ctx.font = 'bold 28px ui-sans-serif, system-ui, sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('🎯 DIRECT HIT!', w / 2, 50)
      ctx.fillStyle = PAL.mute; ctx.font = '14px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText(`Collision at t = ${hitTime.toFixed(2)}s`, w / 2, 80)

      ctx.fillStyle = 'rgba(224, 169, 60, 0.5)'
      ctx.beginPath(); ctx.arc(monkeyScreenX, monkeyScreenY, 35, 0, 2 * Math.PI); ctx.fill()
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        ctx.fillStyle = PAL.accent
        ctx.beginPath()
        ctx.arc(monkeyScreenX + Math.cos(a) * 40, monkeyScreenY + Math.sin(a) * 40, 4, 0, 2 * Math.PI)
        ctx.fill()
      }
      chip(ctx, `Hit: (${dartX.toFixed(1)}m, ${dartY.toFixed(1)}m)`, monkeyScreenX, monkeyScreenY - 35, { bg: PAL.accent, color: PAL.onAccent })
    }

    // Fell-short explanation. A dead-on shot that still misses looks like the
    // "always hits" principle just failed — so say WHY: the dart hit the floor
    // before reaching the monkey, and the principle only holds while both are
    // still in free fall. Turns a confusing miss into the deeper lesson.
    if (fellShort && !hasHit) {
      // Mark where the dart landed on the ground.
      const landX = originX + dartX * ppm
      ctx.strokeStyle = COL.dartHead; ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(landX - 7, originY - 7); ctx.lineTo(landX + 7, originY + 7)
      ctx.moveTo(landX + 7, originY - 7); ctx.lineTo(landX - 7, originY + 7)
      ctx.stroke()

      // Explanatory banner across the top, on a translucent panel for legibility.
      const lines = [
        'The dart hit the floor before reaching the monkey.',
        '“Aim straight = always hits” only holds while BOTH are still falling.',
        'Speed up the dart (or move the monkey closer) so it arrives mid-air.',
      ]
      ctx.textAlign = 'center'
      const bannerW = Math.min(w - 24, 460)
      const bx = w / 2 - bannerW / 2
      ctx.fillStyle = 'rgba(255, 255, 255, 0.86)'
      ctx.beginPath(); ctx.roundRect(bx, 30, bannerW, 78, 10); ctx.fill()
      ctx.strokeStyle = PAL.force; ctx.lineWidth = 2
      ctx.beginPath(); ctx.roundRect(bx, 30, bannerW, 78, 10); ctx.stroke()

      ctx.fillStyle = PAL.force; ctx.font = 'bold 16px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText('Dart fell short', w / 2, 50)
      ctx.fillStyle = PAL.ink; ctx.font = '12px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText(lines[0], w / 2, 70)
      ctx.fillText(lines[1], w / 2, 86)
      ctx.fillStyle = PAL.mute
      ctx.fillText(lines[2], w / 2, 102)
      ctx.textAlign = 'left'
    }
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (!firing || hasHit) return

      // Positions at the START of this substep — needed for continuous (swept)
      // collision detection below.
      const pDartX = dartX, pDartY = dartY
      const pMonkeyX = monkeyX, pMonkeyY = monkeyY

      // Dart: projectile motion (vy decreases under gravity, y up positive).
      dartVy -= GRAVITY * dt
      dartX += dartVx * dt
      dartY += dartVy * dt

      // Monkey: free fall the instant the dart fires.
      monkeyVy += GRAVITY * dt
      monkeyY -= monkeyVy * dt

      // Record trajectory ~every 0.05s.
      if (time - lastTrajT >= 0.05) {
        trajectory.push({ x: dartX, y: dartY })
        lastTrajT = time
      }

      time += dt

      dataPoints.push({ time, dartX, dartY, monkeyX, monkeyY, dartVx, dartVy, monkeyVy })

      // Continuous (swept) collision detection. A point-sample check
      // (|dart − monkey| < r at the frame boundary) can step right over the
      // contact instant for a fast dart and report a false MISS — fatal for a
      // demo whose whole point is "it always hits." Instead, treat the dart and
      // monkey as moving along straight segments across the substep and find the
      // minimum separation over the interval. The relative position is linear in
      // s∈[0,1], so this is an exact point-to-segment distance.
      const HIT_RADIUS = 0.3
      const r0x = pDartX - pMonkeyX, r0y = pDartY - pMonkeyY
      const r1x = dartX - monkeyX, r1y = dartY - monkeyY
      const ddx = r1x - r0x, ddy = r1y - r0y
      const denom = ddx * ddx + ddy * ddy
      const s = denom > 0 ? Math.max(0, Math.min(1, -(r0x * ddx + r0y * ddy) / denom)) : 0
      const minSep = Math.hypot(r0x + s * ddx, r0y + s * ddy)
      if (minSep < HIT_RADIUS) {
        hasHit = true
        hitTime = time - dt + s * dt // interpolate the true contact instant
        firing = false
      }

      // Dart hits the ground → stop. If it landed without a hit and short of the
      // monkey's column, it fell short — flag it for the on-canvas explanation.
      if (dartY < 0) {
        firing = false
        if (!hasHit && dartX < monkeyX0) fellShort = true
      }

      // Monkey hits the ground → rest there.
      if (monkeyY < 0) { monkeyY = 0; monkeyVy = 0 }
    },
    setParams(values: ParamValues) {
      monkeyHeight = Number(values.monkeyHeight ?? monkeyHeight)
      monkeyDistance = Number(values.monkeyDistance ?? monkeyDistance)
      launchSpeed = Number(values.dartSpeed ?? launchSpeed)
      aimAtMonkey = String(values.aimMode ?? (aimAtMonkey ? 'direct' : 'above')) === 'direct'
      syncMonkeyHome()
    },
    start(values: ParamValues) {
      this.setParams(values)

      // Lock monkey home position for this shot.
      monkeyX0 = hunterX + monkeyDistance
      monkeyY0 = monkeyHeight

      // Launch geometry: aim straight at the monkey's resting position.
      const dx = monkeyX0 - hunterX
      const dy = monkeyY0 - hunterY
      const angle = Math.atan2(dy, dx)
      dartVx = launchSpeed * Math.cos(angle)
      dartVy = launchSpeed * Math.sin(angle)

      // "Above (compensate)" mode: overcorrect for the drop → it overshoots (misses).
      if (!aimAtMonkey) {
        const timeToTarget = dx / dartVx
        const dropDuringFlight = 0.5 * GRAVITY * timeToTarget * timeToTarget
        dartVy += (dropDuringFlight + dy) / timeToTarget - dartVy
      }

      // Reset positions.
      dartX = hunterX
      dartY = hunterY
      monkeyX = monkeyX0
      monkeyY = monkeyY0
      monkeyVy = 0

      trajectory = []
      dataPoints = [{ time: 0, dartX, dartY, monkeyX, monkeyY, dartVx, dartVy, monkeyVy }]
      lastTrajT = 0
      hasHit = false
      hitTime = 0
      fellShort = false
      time = 0
      firing = true
    },
    reset() {
      monkeyX0 = hunterX + monkeyDistance
      monkeyY0 = monkeyHeight
      dartX = hunterX
      dartY = hunterY
      dartVx = 0
      dartVy = 0
      monkeyX = monkeyX0
      monkeyY = monkeyY0
      monkeyVy = 0
      time = 0
      firing = false
      hasHit = false
      hitTime = 0
      fellShort = false
      trajectory = []
      dataPoints = []
      lastTrajT = 0
    },
    getReadouts() {
      const status = hasHit ? 'Hit' : fellShort ? 'Fell short' : firing ? 'Flying' : 'Ready'
      return {
        time,
        dartY,
        monkeyY,
        hitTime: hasHit ? hitTime : 0,
        status,
      }
    },
    getData(): SimData {
      return {
        columns: ['Time (s)', 'Dart X (m)', 'Dart Y (m)', 'Monkey Y (m)', 'Dart Vy (m/s)', 'Monkey Vy (m/s)'],
        rows: dataPoints.map((d) => [d.time, d.dartX, d.dartY, d.monkeyY, d.dartVy, d.monkeyVy]),
        xCol: 0, yCol: 2,
      }
    },
    isComplete() { return hasHit },
    destroy() { /* no listeners to detach */ },
  }
  return engine
}
