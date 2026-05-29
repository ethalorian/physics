import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'
import { PAL, clearField, grid as drawFieldGrid, groundShadow, arrow, chip } from '@/components/simulations/lab/draw'

// Free body diagram — an input-driven sim. A box sits at the centre; the student
// builds a free-body diagram on it by adding force arrows (each with a magnitude
// and direction) and dragging the arrowheads to set magnitude + angle. The engine
// sums the forces into a net-force vector and applies F = ma to draw the resulting
// acceleration. This sim is NOT animated — it reacts to control changes and to
// pointer drags on the canvas, asking the shell to re-read state via
// opts.invalidate() after each change. Drawing now uses the shared SimLab visual
// language (flat PAL box fill, shared arrow()/grid()/chip() helpers, ground
// shadow) — per-force semantic color intent preserved, mapped onto PAL tokens.

type ForceType =
  | 'applied' | 'gravity' | 'normal' | 'friction'
  | 'tension' | 'air-resistance' | 'spring' | 'custom'

interface Vector2D { x: number; y: number }

interface ForceVector {
  id: string
  name: string
  type: ForceType
  magnitude: number
  angle: number // degrees, math convention (0 = +x, CCW positive)
  color: string
  isDragging: boolean
}

// Per-force semantic color intent preserved, but routed onto shared PAL tokens so
// the diagram matches every other lab: applied/gravity pushes → force (coral);
// tension/friction (pull-along / motion-aligned) → velocity (green); normal /
// air-resistance (secondary vectors) → cool (teal); spring/custom → accent (gold).
const FORCE_TYPE_CONFIG: Record<ForceType, { label: string; color: string; defaultAngle: number }> = {
  applied: { label: 'Applied Force', color: PAL.force, defaultAngle: 0 },
  gravity: { label: 'Gravity (Weight)', color: PAL.force, defaultAngle: -90 },
  normal: { label: 'Normal Force', color: PAL.cool, defaultAngle: 90 },
  friction: { label: 'Friction', color: PAL.velocity, defaultAngle: 180 },
  tension: { label: 'Tension', color: PAL.velocity, defaultAngle: 45 },
  'air-resistance': { label: 'Air Resistance', color: PAL.cool, defaultAngle: 180 },
  spring: { label: 'Spring Force', color: PAL.accent, defaultAngle: 0 },
  custom: { label: 'Custom Force', color: PAL.accent, defaultAngle: 0 },
}

const SCALE = 10 // pixels per Newton
const BOX_SIZE = 60

function makeForce(type: ForceType, magnitude: number, angle: number): ForceVector {
  const cfg = FORCE_TYPE_CONFIG[type]
  return {
    id: `force${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: cfg.label,
    type,
    magnitude,
    angle,
    color: cfg.color,
    isDragging: false,
  }
}

export function createFreeBodyDiagramEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
  opts?: { invalidate: () => void },
): SimEngine {
  let mass = typeof initial.mass === 'number' ? initial.mass : 5
  let showGrid = initial.showGrid !== false
  let showLabels = initial.showLabels !== false
  let showAcceleration = initial.showAcceleration !== false
  let selectedForce: string | null = null

  // Engagement bookkeeping (mirrors the bespoke completion criteria spirit:
  // added forces, modified forces, changed mass).
  let forcesAdded = 0
  let forcesModified = 0
  let massChanged = false

  // Param-diff tracking: the shell sends every value to setParams; we detect a
  // change in the "addForce" selector or "preset" selector as an action trigger.
  let lastAddForce = String(initial.addForce ?? 'none')
  let lastPreset = String(initial.preset ?? 'custom')

  // Start with the same single Applied Force the bespoke sim seeded.
  let forces: ForceVector[] = [makeForce('applied', 20, 0)]
  forcesAdded = 0 // the seed force is not a student-added force

  let dragOffset: Vector2D | null = null
  let isDraggingObject = false

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }
  let box: Vector2D = (() => { const { w, h } = dims(); return { x: w / 2, y: h / 2 } })()

  const netForce = (): Vector2D => {
    let nx = 0, ny = 0
    for (const f of forces) {
      const rad = (f.angle * Math.PI) / 180
      nx += f.magnitude * Math.cos(rad)
      ny += f.magnitude * Math.sin(rad)
    }
    return { x: nx, y: ny }
  }
  const acceleration = (): Vector2D => {
    const nf = netForce()
    return { x: nf.x / mass, y: nf.y / mass }
  }
  const forceEndpoint = (f: ForceVector): Vector2D => {
    const rad = (f.angle * Math.PI) / 180
    return {
      x: box.x + f.magnitude * SCALE * Math.cos(rad),
      y: box.y - f.magnitude * SCALE * Math.sin(rad),
    }
  }

  // ---- drawing (shared SimLab visual language) --------------------------
  function drawObject() {
    // Flat contact shadow under the box for depth (replaces the gradient sheen).
    groundShadow(ctx, box.x, box.y + BOX_SIZE / 2 + 6, BOX_SIZE * 0.5)
    // Flat PAL fill (gradient flattened) with a darker ink edge.
    ctx.fillStyle = PAL.primary
    ctx.fillRect(box.x - BOX_SIZE / 2, box.y - BOX_SIZE / 2, BOX_SIZE, BOX_SIZE)
    ctx.strokeStyle = PAL.ink
    ctx.lineWidth = 2
    ctx.strokeRect(box.x - BOX_SIZE / 2, box.y - BOX_SIZE / 2, BOX_SIZE, BOX_SIZE)
    if (showLabels) {
      ctx.fillStyle = PAL.onAccent
      ctx.font = 'bold 14px ui-sans-serif, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`m = ${mass} kg`, box.x, box.y)
      ctx.textBaseline = 'alphabetic'
      ctx.textAlign = 'left'
    }
  }

  function drawForceVector(f: ForceVector) {
    if (f.magnitude === 0) return
    const start = box
    const end = forceEndpoint(f)
    arrow(ctx, start.x, start.y, end.x, end.y, { color: f.color, width: 3 })
    if (showLabels) {
      const midX = (start.x + end.x) / 2
      const midY = (start.y + end.y) / 2
      const labelOffset = 20
      const rad = (f.angle * Math.PI) / 180
      const labelX = midX + labelOffset * Math.sin(rad)
      const labelY = midY + labelOffset * Math.cos(rad)
      // Force-magnitude label wrapped in a chip so it stays legible over arrows.
      chip(ctx, `${f.name} · ${f.magnitude.toFixed(1)} N`, labelX, labelY, { color: f.color })
    }
    if (f.isDragging || selectedForce === f.id) {
      ctx.fillStyle = f.color
      ctx.beginPath()
      ctx.arc(end.x, end.y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = PAL.onAccent
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  function drawNetForce() {
    const nf = netForce()
    if (Math.abs(nf.x) < 0.1 && Math.abs(nf.y) < 0.1) return
    const start = box
    const end = { x: start.x + nf.x * SCALE, y: start.y - nf.y * SCALE }
    arrow(ctx, start.x, start.y, end.x, end.y, { color: PAL.accent, width: 4, dash: [5, 5] })
    if (showLabels) {
      const mag = Math.hypot(nf.x, nf.y)
      chip(ctx, `Net Force: ${mag.toFixed(1)} N`, end.x + 10, end.y, { color: PAL.accent, align: 'left' })
    }
  }

  function drawAcceleration() {
    const a = acceleration()
    if (Math.abs(a.x) < 0.1 && Math.abs(a.y) < 0.1) return
    const accScale = SCALE * 2
    const start = box
    const end = { x: start.x + a.x * accScale, y: start.y - a.y * accScale }
    arrow(ctx, start.x, start.y, end.x, end.y, { color: PAL.cool, width: 3, dash: [2, 3] })
    if (showLabels) {
      const mag = Math.hypot(a.x, a.y)
      chip(ctx, `a: ${mag.toFixed(2)} m/s²`, end.x + 10, end.y + 20, { color: PAL.cool, align: 'left' })
    }
  }

  function drawScale(h: number) {
    const scaleX = 10
    const scaleY = h - 10
    ctx.strokeStyle = PAL.mute
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(scaleX, scaleY)
    ctx.lineTo(scaleX + SCALE * 10, scaleY)
    ctx.stroke()
    // Scale-bar label wrapped in a chip.
    chip(ctx, '10 N', scaleX + SCALE * 10 + 20, scaleY, { color: PAL.mute, align: 'center' })
  }

  function render() {
    const { w, h } = dims()
    // Keep the box centred when the canvas resizes (bespoke recentred on resize),
    // but only if it hasn't been dragged off-centre meaningfully.
    clearField(ctx, w, h)
    if (showGrid) drawFieldGrid(ctx, w, h, 20, { color: PAL.grid })
    drawObject()
    for (const f of forces) drawForceVector(f)
    if (forces.length > 1) drawNetForce()
    if (showAcceleration) drawAcceleration()
    drawScale(h)
  }

  // ---- pointer input: drag the object, or drag a force arrowhead --------
  function pointerPos(e: PointerEvent): Vector2D {
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onPointerDown(e: PointerEvent) {
    const pos = pointerPos(e)
    // arrowhead hit-test first
    for (const f of forces) {
      const end = forceEndpoint(f)
      if (Math.hypot(pos.x - end.x, pos.y - end.y) < 15) {
        f.isDragging = true
        selectedForce = f.id
        dragOffset = { x: pos.x - end.x, y: pos.y - end.y }
        try { canvas.setPointerCapture(e.pointerId) } catch {}
        render()
        opts?.invalidate()
        return
      }
    }
    // otherwise object hit-test
    if (Math.hypot(pos.x - box.x, pos.y - box.y) < BOX_SIZE / 2 + 10) {
      isDraggingObject = true
      dragOffset = { x: pos.x - box.x, y: pos.y - box.y }
      try { canvas.setPointerCapture(e.pointerId) } catch {}
    }
  }

  function onPointerMove(e: PointerEvent) {
    const pos = pointerPos(e)
    if (isDraggingObject && dragOffset) {
      box = { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
      render()
      return
    }
    for (const f of forces) {
      if (f.isDragging) {
        const dx = pos.x - box.x
        const dy = pos.y - box.y
        const magnitude = Math.min(Math.hypot(dx, dy) / SCALE, 100)
        f.magnitude = Math.max(0, magnitude)
        f.angle = Math.atan2(-dy, dx) * (180 / Math.PI)
        forcesModified++
        render()
        opts?.invalidate()
        break
      }
    }
  }

  function onPointerUp(e: PointerEvent) {
    isDraggingObject = false
    dragOffset = null
    for (const f of forces) f.isDragging = false
    try { canvas.releasePointerCapture(e.pointerId) } catch {}
    render()
    opts?.invalidate()
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  canvas.style.cursor = 'pointer'
  canvas.style.touchAction = 'none'

  // ---- preset loader (port of bespoke presets) --------------------------
  function loadPreset(preset: string) {
    switch (preset) {
      case 'balanced':
        mass = 10
        forces = [makeForce('applied', 30, 0), makeForce('friction', 30, 180)]
        break
      case 'unbalanced':
        mass = 5
        forces = [makeForce('applied', 50, 45)]
        break
      case 'gravity':
        mass = 2
        forces = [makeForce('gravity', 19.6, FORCE_TYPE_CONFIG.gravity.defaultAngle)]
        break
      case 'friction':
        mass = 8
        forces = [makeForce('applied', 40, 0), makeForce('friction', 20, 180)]
        break
      default: // 'custom' — leave forces as-is
        return
    }
    selectedForce = null
    forcesAdded += forces.length
    massChanged = true
  }

  const engine: SimEngine = {
    render,
    setParams(values: ParamValues) {
      if (typeof values.mass === 'number' && values.mass !== mass) {
        mass = values.mass
        massChanged = true
      }
      showGrid = values.showGrid !== false
      showLabels = values.showLabels !== false
      showAcceleration = values.showAcceleration !== false

      // Selecting a (new) force type in "Add force" adds that force to the
      // diagram — the SimLab analogue of the bespoke "Add Force" button.
      const addForce = String(values.addForce ?? lastAddForce)
      if (addForce !== lastAddForce && addForce !== 'none' && addForce in FORCE_TYPE_CONFIG) {
        const t = addForce as ForceType
        forces.push(makeForce(t, 10, FORCE_TYPE_CONFIG[t].defaultAngle))
        forcesAdded++
        if (forces.length > 10) forces = forces.slice(forces.length - 10)
        lastAddForce = addForce
      } else {
        lastAddForce = addForce
      }

      // Preset selection rebuilds the diagram.
      const preset = String(values.preset ?? lastPreset)
      if (preset !== lastPreset) {
        lastPreset = preset
        loadPreset(preset)
      }
      render()
    },
    reset() {
      mass = 5
      forces = [makeForce('applied', 20, 0)]
      selectedForce = null
      const { w, h } = dims()
      box = { x: w / 2, y: h / 2 }
      forcesAdded = 0
      forcesModified = 0
      massChanged = false
      lastAddForce = String(initial.addForce ?? 'none')
      lastPreset = 'custom'
      render()
    },
    getReadouts() {
      const nf = netForce()
      const a = acceleration()
      return {
        mass,
        forceCount: forces.length,
        netFx: nf.x,
        netFy: nf.y,
        netF: Math.hypot(nf.x, nf.y),
        ax: a.x,
        ay: a.y,
        accel: Math.hypot(a.x, a.y),
      }
    },
    getData(): SimData {
      const rows: (number | string)[][] = forces.map((f) => {
        const rad = (f.angle * Math.PI) / 180
        return [
          f.name,
          Math.round(f.magnitude * 10) / 10,
          Math.round(f.angle),
          Math.round(f.magnitude * Math.cos(rad) * 100) / 100,
          Math.round(f.magnitude * Math.sin(rad) * 100) / 100,
        ]
      })
      return {
        columns: ['Force', 'Magnitude (N)', 'Angle (°)', 'Fx (N)', 'Fy (N)'],
        rows,
        xCol: 3, yCol: 4,
      }
    },
    // Mirror the bespoke completion spirit: the student has meaningfully built and
    // explored a free-body diagram — added at least one force, modified forces by
    // dragging, and changed the mass. (The shell separately enforces its own
    // interaction-count / time floor via getSimulationCriteria.)
    isComplete() {
      return forcesAdded >= 1 && forcesModified >= 1 && massChanged
    },
    destroy() {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
    },
  }
  return engine
}
