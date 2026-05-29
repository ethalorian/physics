import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'
import { PAL, clearField, panel, groundShadow, chip } from '@/components/simulations/lab/draw'

// Measurement precision — read a scale to the limit of the instrument. An object
// (the red target) sits at a hidden position on a ruler; the student DRAGS the
// blue measuring marker until it lines up with the object, then clicks "Take
// reading" (the green button drawn on the canvas). The engine records the reading
// at the device's precision (decimal places) and scores it: a reading is correct
// when it lands within ±precision of the true object position. This sim is NOT
// time-animated — it reacts to drag/click, so the canvas owns its own pointer
// input and asks the shell to re-read state via opts.invalidate() after each input.
//
// Faithful to the bespoke "Practice Measuring" mode: two devices (mm / cm ruler),
// precision = half the smallest division, value-correct requires |reading −
// objectPosition| ≤ precision, and the run completes once the student has taken
// 5+ readings with ≥ 60% correct.

interface Device {
  name: string
  minorDivision: number
  precision: number
  unit: string
  range: [number, number]
  description: string
}

const DEVICES: Record<string, Device> = {
  ruler_mm: {
    name: 'Ruler (mm)',
    minorDivision: 1,
    precision: 0.5,
    unit: 'mm',
    range: [0, 100],
    description: 'Standard metric ruler with millimeter markings. You can estimate to half a millimeter.',
  },
  ruler_cm: {
    name: 'Ruler (cm)',
    minorDivision: 1,
    precision: 0.5,
    unit: 'cm',
    range: [0, 15],
    description: 'Ruler with only centimeter markings. You can estimate to half a centimeter.',
  },
}

// Scene tokens mapped to the shared SimLab palette so this sim matches the rest
// of the lab. Object/target pin → force (coral); draggable reading marker →
// primary (lavender); correct feedback → accent (gold), wrong feedback → force;
// ruler ticks/body → axis/ink/surface; text → ink/mute.
const COL = {
  bg: PAL.bg, panel: PAL.surface, scale: PAL.ink, tick: PAL.ink, tickMute: PAL.mute,
  obj: PAL.force, marker: PAL.primary, markerSoft: PAL.surfaceMute,
  text: PAL.ink, mute: PAL.mute, good: PAL.accent, bad: PAL.force,
  btn: PAL.accent, btnText: PAL.onAccent, btnDisabled: PAL.gridStrong,
}

const MIN_READINGS = 5 // bespoke: total >= 5
const MIN_ACCURACY = 0.6 // bespoke: correct / total >= 0.6

interface Reading {
  device: string
  trueValue: number
  reading: number
  correct: boolean
  hasCorrectPrecision: boolean
}

export function createMeasurementPrecisionEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
  opts?: { invalidate: () => void },
): SimEngine {
  let deviceKey = String(initial.device ?? 'ruler_mm')
  let device = DEVICES[deviceKey] ?? DEVICES.ruler_mm

  // The object (target) the student must measure, in device units. Random in the
  // bespoke; placed within range with a small sub-division offset so reading
  // requires estimating the uncertain digit.
  let objectPosition = 0
  // The current marker position (device units) the student drags to.
  let markerValue = 0

  let readings: Reading[] = []
  let lastFeedback: { correct: boolean; message: string } | null = null
  let dragging = false

  // geometry of the on-canvas "Take reading" button (screen px), set in render()
  let btn = { x: 0, y: 0, w: 0, h: 0 }

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  const decimals = () =>
    device.precision.toString().includes('.') ? device.precision.toString().split('.')[1].length : 0

  // Scale layout: a horizontal ruler spanning most of the canvas width.
  const layout = () => {
    const { w, h } = dims()
    const padX = 36
    const x0 = padX
    const x1 = w - padX
    const baselineY = Math.round(h * 0.62)
    return { x0, x1, baselineY, w, h }
  }
  const valueToX = (v: number) => {
    const { x0, x1 } = layout()
    const [lo, hi] = device.range
    return x0 + ((v - lo) / (hi - lo)) * (x1 - x0)
  }
  const xToValue = (sx: number) => {
    const { x0, x1 } = layout()
    const [lo, hi] = device.range
    const frac = Math.max(0, Math.min(1, (sx - x0) / (x1 - x0)))
    return lo + frac * (hi - lo)
  }

  const newProblem = (keepFeedback = false) => {
    const [lo, hi] = device.range
    // keep away from the very edges (bespoke used range[1]-10 .. +5 for mm)
    const span = hi - lo
    const margin = Math.min(span * 0.1, 5)
    const base = lo + margin + Math.random() * (span - 2 * margin)
    // small offset so the true value falls between marks (uncertain digit)
    objectPosition = Number((base + (Math.random() - 0.5) * 0.3).toFixed(1))
    markerValue = objectPosition // start the marker near the object
    if (!keepFeedback) lastFeedback = null
  }

  const readingValueAtMarker = () => Number(markerValue.toFixed(decimals()))

  // --- drawing --------------------------------------------------------------
  function render() {
    const { w, h, x0, x1, baselineY } = layout()
    clearField(ctx, w, h)

    // title row
    ctx.fillStyle = COL.text
    ctx.font = 'bold 13px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`${device.name}  ·  precision ± ${device.precision} ${device.unit}`, x0, 24)
    ctx.fillStyle = COL.mute
    ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText('Drag the marker to line it up with the object, then take a reading.', x0, 42)

    // ruler body — soft contact shadow + rounded surface panel
    const bodyTop = baselineY - 46
    const bodyH = 46
    groundShadow(ctx, (x0 + x1) / 2, bodyTop + bodyH + 4, (x1 - x0) / 2, 6)
    panel(ctx, x0, bodyTop, x1 - x0, bodyH, 6, COL.panel)
    ctx.strokeStyle = COL.scale
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.rect(x0, bodyTop, x1 - x0, bodyH)
    ctx.stroke()

    // ticks
    const [lo, hi] = device.range
    const nDiv = Math.floor((hi - lo) / device.minorDivision)
    ctx.textAlign = 'center'
    for (let i = 0; i <= nDiv; i++) {
      const value = lo + i * device.minorDivision
      const x = valueToX(value)
      const isMajor = value % (device.minorDivision * 5) === 0
      ctx.strokeStyle = isMajor ? COL.tick : COL.tickMute
      ctx.lineWidth = isMajor ? 1.6 : 1
      const tickH = isMajor ? 20 : 11
      ctx.beginPath()
      ctx.moveTo(x, bodyTop)
      ctx.lineTo(x, bodyTop + tickH)
      ctx.stroke()
      if (isMajor) {
        ctx.fillStyle = COL.text
        ctx.font = '10px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText(`${value}`, x, bodyTop + tickH + 12)
      }
    }
    // unit label
    ctx.fillStyle = COL.mute
    ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`units: ${device.unit}`, x1, bodyTop - 6)

    // object (red target) — a thin pin above the ruler
    const ox = valueToX(objectPosition)
    ctx.strokeStyle = COL.obj
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(ox, bodyTop - 30)
    ctx.lineTo(ox, bodyTop)
    ctx.stroke()
    ctx.fillStyle = COL.obj
    ctx.beginPath()
    ctx.moveTo(ox, bodyTop)
    ctx.lineTo(ox - 5, bodyTop - 9)
    ctx.lineTo(ox + 5, bodyTop - 9)
    ctx.closePath()
    ctx.fill()
    chip(ctx, 'object', ox, bodyTop - 38, { bg: COL.obj, color: PAL.onAccent, size: 10 })

    // marker (blue) — what the student drags
    const mx = valueToX(markerValue)
    ctx.strokeStyle = COL.marker
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(mx, bodyTop + bodyH)
    ctx.lineTo(mx, bodyTop + bodyH + 26)
    ctx.stroke()
    ctx.fillStyle = COL.marker
    ctx.beginPath()
    ctx.moveTo(mx, bodyTop + bodyH)
    ctx.lineTo(mx - 6, bodyTop + bodyH + 10)
    ctx.lineTo(mx + 6, bodyTop + bodyH + 10)
    ctx.closePath()
    ctx.fill()
    // live reading value — chip pinned over the marker, clamped to the field
    const readingLabel = `${readingValueAtMarker().toFixed(decimals())} ${device.unit}`
    ctx.font = 'bold 12px ui-sans-serif, system-ui, sans-serif'
    const tw = ctx.measureText(readingLabel).width + 16
    const cx = Math.max(x0 + tw / 2, Math.min(x1 - tw / 2, mx))
    const cy = bodyTop + bodyH + 40
    chip(ctx, readingLabel, cx, cy, { bg: COL.marker, color: PAL.onAccent, size: 12 })

    // on-canvas "Take reading" button — shared surface panel + label
    const btnW = 130
    const btnH = 30
    btn = { x: x0, y: h - btnH - 14, w: btnW, h: btnH }
    panel(ctx, btn.x, btn.y, btn.w, btn.h, 8, COL.btn)
    ctx.fillStyle = COL.btnText
    ctx.font = 'bold 12px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Take reading', btn.x + btn.w / 2, btn.y + btn.h / 2 + 4)

    // feedback text — correct uses accent (gold), wrong uses force (coral)
    ctx.textAlign = 'left'
    ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
    if (lastFeedback) {
      ctx.fillStyle = lastFeedback.correct ? COL.good : COL.bad
      wrapText(lastFeedback.message, btn.x + btn.w + 14, btn.y + 6, x1 - (btn.x + btn.w + 14), 13)
    } else {
      ctx.fillStyle = COL.mute
      ctx.fillText('Estimate one digit beyond the smallest marking.', btn.x + btn.w + 14, btn.y + 18)
    }
  }

  function wrapText(text: string, x: number, y: number, maxW: number, lh: number) {
    const words = text.split(' ')
    let line = ''
    let yy = y + lh
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, yy)
        line = word
        yy += lh
      } else {
        line = test
      }
    }
    if (line) ctx.fillText(line, x, yy)
  }

  // --- scoring (mirrors bespoke checkAnswer) --------------------------------
  function takeReading() {
    const reading = readingValueAtMarker()
    const isCorrectValue = Math.abs(reading - objectPosition) <= device.precision
    // precision check: decimal places match the device precision
    const hasCorrectPrecision = decimalsOf(reading) <= decimals()
    const correct = isCorrectValue && hasCorrectPrecision

    readings.push({
      device: device.name,
      trueValue: objectPosition,
      reading,
      correct,
      hasCorrectPrecision,
    })

    if (correct) {
      lastFeedback = {
        correct: true,
        message: `Correct! You measured ${reading.toFixed(decimals())} ${device.unit} with the proper precision.`,
      }
    } else {
      lastFeedback = {
        correct: false,
        message: `Not quite — the object is at about ${objectPosition.toFixed(decimals())} ${device.unit}. Read the scale carefully.`,
      }
    }
    // advance to a fresh problem for the next reading, keeping the feedback shown
    newProblem(true)
  }

  function decimalsOf(n: number) {
    const s = n.toString()
    return s.includes('.') ? s.split('.')[1].length : 0
  }

  const correctCount = () => readings.filter((r) => r.correct).length

  // --- pointer input --------------------------------------------------------
  function pointerPos(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  function inButton(px: number, py: number) {
    return px >= btn.x && px <= btn.x + btn.w && py >= btn.y && py <= btn.y + btn.h
  }

  function onPointerDown(e: PointerEvent) {
    const { x, y } = pointerPos(e)
    if (inButton(x, y)) {
      takeReading()
      render()
      opts?.invalidate()
      return
    }
    // begin dragging the marker
    dragging = true
    markerValue = clampToRange(xToValue(x))
    canvas.setPointerCapture?.(e.pointerId)
    render()
    opts?.invalidate()
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging) return
    const { x } = pointerPos(e)
    markerValue = clampToRange(xToValue(x))
    render()
    opts?.invalidate()
  }
  function onPointerUp(e: PointerEvent) {
    dragging = false
    canvas.releasePointerCapture?.(e.pointerId)
  }
  function clampToRange(v: number) {
    const [lo, hi] = device.range
    return Math.max(lo, Math.min(hi, v))
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.style.cursor = 'pointer'

  newProblem()

  const engine: SimEngine = {
    render,
    setParams(values: ParamValues) {
      const next = String(values.device ?? deviceKey)
      if (next !== deviceKey) {
        deviceKey = next
        device = DEVICES[deviceKey] ?? DEVICES.ruler_mm
        newProblem()
        render()
      }
    },
    reset() {
      readings = []
      lastFeedback = null
      dragging = false
      newProblem()
      render()
    },
    getReadouts() {
      const total = readings.length
      const correct = correctCount()
      const acc = total > 0 ? Math.round((correct / total) * 100) : 0
      return {
        reading: readingValueAtMarker(),
        precision: device.precision,
        readings: total,
        correct,
        accuracy: acc,
      }
    },
    getData(): SimData {
      const rows: (number | string)[][] = readings.map((r, i) => [
        i + 1,
        r.device,
        Number(r.trueValue.toFixed(decimals())),
        r.reading,
        r.correct ? 'yes' : 'no',
      ])
      return {
        columns: ['#', 'Device', 'True value', 'Your reading', 'Correct?'],
        rows,
        xCol: 0,
        yCol: 3,
      }
    },
    // Complete once the student has taken enough readings with good accuracy —
    // mirrors the bespoke gate (total >= 5 AND correct/total >= 0.6).
    isComplete() {
      const total = readings.length
      return total >= MIN_READINGS && correctCount() / total >= MIN_ACCURACY
    },
    destroy() {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
    },
  }
  return engine
}
