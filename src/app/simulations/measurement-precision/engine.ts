import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'
import { PAL, clearField, panel, groundShadow, chip, roundRectPath } from '@/components/simulations/lab/draw'

// Measurement precision & significant figures.
//
// Two practice modes, both with RANDOMIZED problems so the sim doubles as a lab:
//
//  1. "Read the instrument" — an object/level appears at a random position on a
//     randomly chosen (or fixed) instrument. The student TYPES the reading
//     (keyboard or on-canvas keypad). Nothing is auto-rounded for them: deciding
//     how many digits to write down IS the skill being assessed. Scoring
//     separates two failure modes — value (within ± precision of the true
//     position) and digits (decimal places match what the device justifies) —
//     so "right value, wrong sig figs" gets its own feedback.
//
//  2. "Count the sig figs" — a randomly generated recorded value (leading zeros,
//     captured zeros, trailing zeros, bare integers, scientific notation) is
//     shown and the student types how many significant figures it has. Feedback
//     states the rule that the template was built to exercise.
//
// The engine is input-driven (no step()), owns canvas pointer input like the
// original, and additionally listens for window keydown (precedent:
// maze-vectors). Completion: ≥ 5 attempts with ≥ 60% fully correct.

type Mode = 'read' | 'count'

interface Device {
  name: string
  kind: 'h-scale' | 'v-cylinder' | 'v-thermo' | 'digital'
  /** smallest marked division, device units (analog only) */
  minorDivision: number
  /** half the smallest division (analog) or last-digit resolution (digital) */
  precision: number
  /** decimal places a correctly recorded reading must have */
  decimals: number
  unit: string
  range: [number, number]
  /** label every N units on the scale */
  labelEvery: number
}

const DEVICES: Record<string, Device> = {
  ruler_mm: {
    name: 'Ruler (mm)', kind: 'h-scale', minorDivision: 1, precision: 0.5,
    decimals: 1, unit: 'mm', range: [0, 100], labelEvery: 10,
  },
  ruler_cm: {
    name: 'Ruler (cm)', kind: 'h-scale', minorDivision: 1, precision: 0.5,
    decimals: 1, unit: 'cm', range: [0, 15], labelEvery: 1,
  },
  cylinder: {
    name: 'Graduated cylinder', kind: 'v-cylinder', minorDivision: 2, precision: 1,
    decimals: 0, unit: 'mL', range: [0, 100], labelEvery: 10,
  },
  thermometer: {
    name: 'Thermometer', kind: 'v-thermo', minorDivision: 1, precision: 0.5,
    decimals: 1, unit: '°C', range: [0, 50], labelEvery: 10,
  },
  balance: {
    name: 'Digital balance', kind: 'digital', minorDivision: 0.01, precision: 0.01,
    decimals: 2, unit: 'g', range: [0, 200], labelEvery: 0,
  },
}
const READ_DEVICE_KEYS = Object.keys(DEVICES)

const COL = {
  panel: PAL.surface, scale: PAL.ink, tick: PAL.ink, tickMute: PAL.mute,
  text: PAL.ink, mute: PAL.mute, good: PAL.velocity, bad: PAL.force, mixed: PAL.accent,
  obj: PAL.force, water: PAL.cool, mercury: PAL.force,
  key: PAL.surface, keyText: PAL.ink, submit: PAL.accent, submitText: PAL.onAccent,
  inputBg: PAL.surfaceMute, lcdBg: '#26215C', lcdText: '#9EF2C9',
}

const MIN_ATTEMPTS = 5
const MIN_ACCURACY = 0.6
const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹'

// --- sig fig + formatting utilities -----------------------------------------

/** Significant figures of a plain decimal string (no sci notation, no sign). */
export function sigFigsOf(s: string): number {
  if (s.includes('.')) {
    const digits = s.replace('.', '').replace(/^0+/, '')
    return digits.length
  }
  const trimmed = s.replace(/^0+/, '').replace(/0+$/, '')
  return trimmed.length === 0 ? 1 : trimmed.length
}

/** Decimal places actually typed (string-based: "4.50" → 2, Number would drop it). */
function decimalsTyped(s: string): number {
  const i = s.indexOf('.')
  return i === -1 ? 0 : s.length - i - 1
}

const randInt = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const randDigit = () => randInt(1, 9)

interface ReadProblem {
  mode: 'read'
  deviceKey: string
  /** true position in device units (may carry one digit beyond the recordable place) */
  trueValue: number
  /** what a correct record looks like, e.g. "47.3" */
  expected: string
}
interface CountProblem {
  mode: 'count'
  display: string
  sig: number
  rule: string
}
type Problem = ReadProblem | CountProblem

interface Attempt {
  mode: Mode
  shown: string
  expected: string
  answer: string
  valueOk: boolean
  digitsOk: boolean
  correct: boolean
}

// --- count-mode problem templates (each targets one zero rule) ---------------

function genCountProblem(): CountProblem {
  const pick = randInt(1, 5)
  if (pick === 1) {
    // leading zeros: 0.00340
    const zeros = '0'.repeat(randInt(1, 3))
    const core = `${randDigit()}${randInt(0, 9)}${Math.random() < 0.4 ? '0' : randDigit()}`
    const display = `0.${zeros}${core}`
    return {
      mode: 'count', display, sig: sigFigsOf(display),
      rule: 'Leading zeros are placeholders — never significant. Count from the first nonzero digit.',
    }
  }
  if (pick === 2) {
    // captured zeros: 40.07, 1002, 60.4
    const display = Math.random() < 0.5
      ? `${randDigit()}0${'0'.repeat(randInt(0, 1))}${randDigit()}`
      : `${randDigit()}0.0${randDigit()}`
    return {
      mode: 'count', display, sig: sigFigsOf(display),
      rule: 'Zeros sandwiched between nonzero digits are always significant.',
    }
  }
  if (pick === 3) {
    // trailing zeros after a decimal point: 12.300, 5.0
    const display = `${randDigit()}${Math.random() < 0.5 ? `${randInt(0, 9)}` : ''}.${randDigit()}${'0'.repeat(randInt(1, 2))}`
    return {
      mode: 'count', display, sig: sigFigsOf(display),
      rule: 'Trailing zeros after a decimal point ARE significant — writing them claims you measured that precisely.',
    }
  }
  if (pick === 4) {
    // bare integer with trailing zeros: 4500
    const display = `${randDigit()}${Math.random() < 0.5 ? `${randDigit()}` : ''}${'0'.repeat(randInt(1, 3))}`
    return {
      mode: 'count', display, sig: sigFigsOf(display),
      rule: 'Trailing zeros in a whole number with no decimal point are NOT significant (ambiguous — scientific notation would fix this).',
    }
  }
  // scientific notation: 3.40 × 10⁵
  const mantissa = `${randDigit()}.${randInt(0, 9)}${Math.random() < 0.5 ? '0' : ''}`
  const exp = randInt(2, 8)
  const expStr = `${exp}`.split('').map((c) => SUPERSCRIPT[Number(c)]).join('')
  return {
    mode: 'count', display: `${mantissa} × 10${expStr}`, sig: sigFigsOf(mantissa),
    rule: 'In scientific notation, every digit of the mantissa is significant — that is the whole point of writing it this way.',
  }
}

function genReadProblem(deviceParam: string): ReadProblem {
  const deviceKey = deviceParam === 'random'
    ? READ_DEVICE_KEYS[randInt(0, READ_DEVICE_KEYS.length - 1)]
    : deviceParam
  const device = DEVICES[deviceKey] ?? DEVICES.ruler_mm
  const [lo, hi] = device.range
  const span = hi - lo
  const margin = Math.min(span * 0.12, 8)

  let trueValue: number
  if (device.kind === 'digital') {
    // bias toward trailing zeros so "record ALL displayed digits" gets exercised
    let v = lo + margin + Math.random() * (span - 2 * margin)
    v = Number(v.toFixed(2))
    const r = Math.random()
    if (r < 0.3) v = Number(v.toFixed(1)) // ...X0 → display 23.40
    else if (r < 0.4) v = Math.round(v) // ...00 → display 88.00
    trueValue = v
  } else {
    // land between marks so the final digit must be estimated
    const base = lo + margin + Math.random() * (span - 2 * margin)
    trueValue = Number(base.toFixed(device.decimals === 0 ? 1 : device.decimals))
  }
  return {
    mode: 'read',
    deviceKey,
    trueValue,
    expected: trueValue.toFixed(device.decimals),
  }
}

// --- engine -------------------------------------------------------------------

export function createMeasurementPrecisionEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
  opts?: { invalidate: () => void },
): SimEngine {
  let mode: Mode = (String(initial.mode ?? 'read') as Mode)
  let deviceParam = String(initial.device ?? 'random')

  let problem: Problem = mode === 'read' ? genReadProblem(deviceParam) : genCountProblem()
  let typed = ''
  let attempts: Attempt[] = []
  let lastFeedback: { tone: 'good' | 'bad' | 'mixed'; lines: string[] } | null = null

  // hit targets rebuilt every render (CSS px)
  let keypad: { label: string; x: number; y: number; w: number; h: number }[] = []
  let submitBtn = { x: 0, y: 0, w: 0, h: 0 }

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }
  const device = () => (problem.mode === 'read' ? DEVICES[problem.deviceKey] : null)

  const newProblem = (keepFeedback = false) => {
    problem = mode === 'read' ? genReadProblem(deviceParam) : genCountProblem()
    typed = ''
    if (!keepFeedback) lastFeedback = null
  }

  // --- scoring ---------------------------------------------------------------

  function submit() {
    if (!typed || typed === '.' || typed === '-') return
    if (problem.mode === 'read') {
      const dev = DEVICES[problem.deviceKey]
      const value = Number(typed)
      const valueOk = Number.isFinite(value) && Math.abs(value - problem.trueValue) <= dev.precision
      const digitsOk = decimalsTyped(typed) === dev.decimals
      const correct = valueOk && digitsOk
      attempts.push({
        mode, shown: dev.name, expected: `${problem.expected} ${dev.unit}`,
        answer: `${typed} ${dev.unit}`, valueOk, digitsOk, correct,
      })
      if (correct) {
        lastFeedback = { tone: 'good', lines: [`Correct — ${typed} ${dev.unit}: right value, recorded to the place this instrument justifies.`] }
      } else if (valueOk && !digitsOk) {
        const got = decimalsTyped(typed)
        lastFeedback = {
          tone: 'mixed',
          lines: [
            `Right value, wrong precision. You wrote ${got} decimal place${got === 1 ? '' : 's'}; this device justifies exactly ${dev.decimals}.`,
            got > dev.decimals
              ? `Writing ${typed} claims more precision than a ${dev.name.toLowerCase()} allows.`
              : `Writing ${typed} throws away precision the instrument gives you — record the estimated digit. Expected ${problem.expected} ${dev.unit}.`,
          ],
        }
      } else if (!valueOk && digitsOk) {
        lastFeedback = { tone: 'bad', lines: [`Right number of digits, but the value is off — it reads about ${problem.expected} ${dev.unit}.`] }
      } else {
        lastFeedback = { tone: 'bad', lines: [`Not quite — it reads about ${problem.expected} ${dev.unit}, recorded to ${dev.decimals} decimal place${dev.decimals === 1 ? '' : 's'}.`] }
      }
    } else {
      const n = Number(typed)
      const correct = n === problem.sig
      attempts.push({
        mode, shown: problem.display, expected: `${problem.sig}`,
        answer: typed, valueOk: correct, digitsOk: correct, correct,
      })
      lastFeedback = correct
        ? { tone: 'good', lines: [`Correct — ${problem.display} has ${problem.sig} significant figures.`, problem.rule] }
        : { tone: 'bad', lines: [`${problem.display} has ${problem.sig} sig figs, not ${typed}.`, problem.rule] }
    }
    newProblem(true)
  }

  const correctCount = () => attempts.filter((a) => a.correct).length

  // --- drawing -----------------------------------------------------------------

  function render() {
    const { w, h } = dims()
    clearField(ctx, w, h)
    const padX = 36
    const x0 = padX
    const x1 = w - padX

    // header
    ctx.textAlign = 'left'
    ctx.fillStyle = COL.text
    ctx.font = 'bold 13px ui-sans-serif, system-ui, sans-serif'
    if (problem.mode === 'read') {
      const dev = DEVICES[problem.deviceKey]
      ctx.fillText(`${dev.name}  ·  smallest division ${dev.minorDivision} ${dev.unit}`, x0, 24)
      ctx.fillStyle = COL.mute
      ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText(
        dev.kind === 'digital'
          ? 'Record EVERY digit the display shows — trailing zeros included.'
          : 'Read all certain digits, then estimate ONE more. Type the reading.',
        x0, 42,
      )
    } else {
      ctx.fillText('How many significant figures?', x0, 24)
      ctx.fillStyle = COL.mute
      ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
      ctx.fillText('Type the count, then submit.', x0, 42)
    }

    // instrument / value area: y 50 .. h-178
    const areaTop = 52
    const areaBottom = h - 178
    if (problem.mode === 'read') {
      const dev = DEVICES[problem.deviceKey]
      if (dev.kind === 'h-scale') drawHScale(dev, problem.trueValue, x0, x1, areaTop, areaBottom)
      else if (dev.kind === 'v-cylinder') drawCylinder(dev, problem.trueValue, w, areaTop, areaBottom)
      else if (dev.kind === 'v-thermo') drawThermometer(dev, problem.trueValue, w, areaTop, areaBottom)
      else drawBalance(dev, problem.trueValue, w, areaTop, areaBottom)
    } else {
      // value card
      const cw = Math.min(280, x1 - x0)
      const cx = (w - cw) / 2
      const cy = (areaTop + areaBottom) / 2
      groundShadow(ctx, w / 2, cy + 34, cw / 2.4, 7)
      panel(ctx, cx, cy - 32, cw, 64, 10, COL.panel)
      ctx.fillStyle = COL.text
      ctx.font = 'bold 26px ui-monospace, SFMono-Regular, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(problem.display, w / 2, cy + 9)
      ctx.textAlign = 'left'
    }

    // answer row: input panel + unit + submit
    const rowY = h - 168
    const inputW = 110
    const inputH = 30
    panel(ctx, x0, rowY, inputW, inputH, 8, COL.inputBg)
    ctx.strokeStyle = PAL.gridStrong
    ctx.lineWidth = 1.5
    roundRectPath(ctx, x0, rowY, inputW, inputH, 8)
    ctx.stroke()
    ctx.fillStyle = typed ? COL.text : COL.mute
    ctx.font = 'bold 15px ui-monospace, SFMono-Regular, monospace'
    ctx.fillText(typed || '…', x0 + 10, rowY + 20)
    // blinking-less caret
    if (typed) {
      const tw = ctx.measureText(typed).width
      ctx.fillStyle = PAL.primary
      ctx.fillRect(x0 + 11 + tw, rowY + 7, 2, 16)
    }
    ctx.fillStyle = COL.mute
    ctx.font = '12px ui-sans-serif, system-ui, sans-serif'
    const unitText = problem.mode === 'read' ? DEVICES[problem.deviceKey].unit : 'sig figs'
    ctx.fillText(unitText, x0 + inputW + 8, rowY + 20)

    const sw = 86
    submitBtn = { x: x0 + inputW + 8 + ctx.measureText(unitText).width + 14, y: rowY, w: sw, h: inputH }
    panel(ctx, submitBtn.x, submitBtn.y, submitBtn.w, submitBtn.h, 8, COL.submit)
    ctx.fillStyle = COL.submitText
    ctx.font = 'bold 12px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Submit ⏎', submitBtn.x + sw / 2, rowY + 20)
    ctx.textAlign = 'left'

    // keypad (bottom-left): digits + . + backspace
    const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', '⌫']
    const kw = 38
    const kh = 26
    const gap = 5
    const kTop = h - 130
    keypad = []
    keys.forEach((k, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const kx = x0 + col * (kw + gap)
      const ky = kTop + row * (kh + gap)
      keypad.push({ label: k, x: kx, y: ky, w: kw, h: kh })
      panel(ctx, kx, ky, kw, kh, 6, COL.key)
      ctx.strokeStyle = PAL.gridStrong
      ctx.lineWidth = 1
      roundRectPath(ctx, kx, ky, kw, kh, 6)
      ctx.stroke()
      ctx.fillStyle = COL.keyText
      ctx.font = 'bold 13px ui-sans-serif, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(k, kx + kw / 2, ky + 18)
    })
    ctx.textAlign = 'left'

    // feedback to the right of the keypad
    const fx = x0 + 3 * (kw + gap) + 18
    const fMaxW = x1 - fx
    ctx.font = '11.5px ui-sans-serif, system-ui, sans-serif'
    if (lastFeedback) {
      const tone = lastFeedback.tone === 'good' ? COL.good : lastFeedback.tone === 'mixed' ? COL.mixed : COL.bad
      ctx.fillStyle = tone
      let yy = kTop + 4
      for (const line of lastFeedback.lines) yy = wrapText(line, fx, yy, fMaxW, 14) + 6
    } else {
      ctx.fillStyle = COL.mute
      wrapText(
        problem.mode === 'read'
          ? 'Type your reading with exactly the digits this instrument justifies — no more, no fewer.'
          : 'Count carefully: which zeros are significant here, and why?',
        fx, kTop + 4, fMaxW, 14,
      )
    }
  }

  // returns the y after the last line drawn
  function wrapText(text: string, x: number, y: number, maxW: number, lh: number): number {
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
    return yy
  }

  // --- instrument renderers ---------------------------------------------------

  function drawHScale(dev: Device, value: number, x0: number, x1: number, top: number, bottom: number) {
    const baselineY = Math.round((top + bottom) / 2 + 24)
    const bodyTop = baselineY - 46
    const bodyH = 46
    const [lo, hi] = dev.range
    const vx = (v: number) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0)

    groundShadow(ctx, (x0 + x1) / 2, bodyTop + bodyH + 4, (x1 - x0) / 2, 6)
    panel(ctx, x0, bodyTop, x1 - x0, bodyH, 6, COL.panel)
    ctx.strokeStyle = COL.scale
    ctx.lineWidth = 2
    ctx.strokeRect(x0, bodyTop, x1 - x0, bodyH)

    const nDiv = Math.floor((hi - lo) / dev.minorDivision)
    ctx.textAlign = 'center'
    for (let i = 0; i <= nDiv; i++) {
      const value_ = lo + i * dev.minorDivision
      const x = vx(value_)
      const isMajor = value_ % dev.labelEvery === 0
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
        ctx.fillText(`${value_}`, x, bodyTop + tickH + 12)
      }
    }
    ctx.fillStyle = COL.mute
    ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`units: ${dev.unit}`, x1, bodyTop - 6)
    ctx.textAlign = 'left'

    // object pin
    const ox = vx(value)
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
    chip(ctx, 'read me', ox, bodyTop - 38, { bg: COL.obj, color: PAL.onAccent, size: 10 })
  }

  function drawCylinder(dev: Device, value: number, w: number, top: number, bottom: number) {
    const cw = 84
    const cx = w / 2 - cw / 2
    const cTop = top + 8
    const cBottom = bottom - 6
    const [lo, hi] = dev.range
    const vy = (v: number) => cBottom - ((v - lo) / (hi - lo)) * (cBottom - cTop)

    groundShadow(ctx, w / 2, cBottom + 5, cw * 0.7, 6)
    panel(ctx, cx, cTop, cw, cBottom - cTop, 6, COL.panel)
    ctx.strokeStyle = COL.scale
    ctx.lineWidth = 2
    ctx.strokeRect(cx, cTop, cw, cBottom - cTop)

    // water
    const wy = vy(value)
    ctx.globalAlpha = 0.35
    ctx.fillStyle = COL.water
    ctx.fillRect(cx + 2, wy, cw - 4, cBottom - wy - 2)
    ctx.globalAlpha = 1
    // meniscus
    ctx.strokeStyle = COL.water
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.ellipse(cx + cw / 2, wy, cw / 2 - 3, 4, 0, 0, Math.PI)
    ctx.stroke()

    // ticks on right wall, labels outside
    const nDiv = Math.floor((hi - lo) / dev.minorDivision)
    for (let i = 0; i <= nDiv; i++) {
      const v = lo + i * dev.minorDivision
      const y = vy(v)
      const isMajor = v % dev.labelEvery === 0
      ctx.strokeStyle = isMajor ? COL.tick : COL.tickMute
      ctx.lineWidth = isMajor ? 1.6 : 1
      const tickW = isMajor ? 18 : 10
      ctx.beginPath()
      ctx.moveTo(cx + cw, y)
      ctx.lineTo(cx + cw - tickW, y)
      ctx.stroke()
      if (isMajor) {
        ctx.fillStyle = COL.text
        ctx.font = '10px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText(`${v}`, cx + cw + 6, y + 3)
      }
    }
    ctx.fillStyle = COL.mute
    ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(`units: ${dev.unit}`, cx + cw + 6, cTop - 4)
    chip(ctx, 'read the bottom of the meniscus', cx - 12, cTop + 8, { bg: COL.water, color: PAL.onAccent, size: 10, align: 'right' })
  }

  function drawThermometer(dev: Device, value: number, w: number, top: number, bottom: number) {
    const tw = 22
    const cx = w / 2 - tw / 2
    const bulbR = 15
    const tTop = top + 8
    const tBottom = bottom - bulbR * 2 - 4
    const [lo, hi] = dev.range
    const vy = (v: number) => tBottom - ((v - lo) / (hi - lo)) * (tBottom - tTop)

    groundShadow(ctx, w / 2, tBottom + bulbR * 2 + 2, bulbR * 1.6, 5)
    // tube
    panel(ctx, cx, tTop, tw, tBottom - tTop + bulbR, tw / 2, COL.panel)
    ctx.strokeStyle = COL.scale
    ctx.lineWidth = 2
    roundRectPath(ctx, cx, tTop, tw, tBottom - tTop + bulbR, tw / 2)
    ctx.stroke()
    // bulb
    ctx.fillStyle = COL.mercury
    ctx.beginPath()
    ctx.arc(w / 2, tBottom + bulbR, bulbR, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = COL.scale
    ctx.stroke()
    // column
    const my = vy(value)
    ctx.fillStyle = COL.mercury
    ctx.fillRect(cx + tw / 2 - 4, my, 8, tBottom + bulbR - my)

    // ticks on left, labels outside
    const nDiv = Math.floor((hi - lo) / dev.minorDivision)
    ctx.textAlign = 'right'
    for (let i = 0; i <= nDiv; i++) {
      const v = lo + i * dev.minorDivision
      const y = vy(v)
      const isMajor = v % dev.labelEvery === 0
      const isMid = v % (dev.labelEvery / 2) === 0
      ctx.strokeStyle = isMajor ? COL.tick : COL.tickMute
      ctx.lineWidth = isMajor ? 1.6 : 1
      const tickW = isMajor ? 16 : isMid ? 11 : 7
      ctx.beginPath()
      ctx.moveTo(cx, y)
      ctx.lineTo(cx - tickW, y)
      ctx.stroke()
      if (isMajor) {
        ctx.fillStyle = COL.text
        ctx.font = '10px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText(`${v}`, cx - tickW - 4, y + 3)
      }
    }
    ctx.textAlign = 'left'
    ctx.fillStyle = COL.mute
    ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(`units: ${dev.unit}`, cx + tw + 8, tTop + 4)
  }

  function drawBalance(dev: Device, value: number, w: number, top: number, bottom: number) {
    const bw = 220
    const bx = w / 2 - bw / 2
    const cy = (top + bottom) / 2
    // platform + body
    groundShadow(ctx, w / 2, cy + 52, bw / 2.2, 7)
    panel(ctx, bx, cy - 10, bw, 58, 10, COL.panel)
    ctx.strokeStyle = COL.scale
    ctx.lineWidth = 2
    roundRectPath(ctx, bx, cy - 10, bw, 58, 10)
    ctx.stroke()
    // platform with object
    ctx.strokeStyle = COL.scale
    ctx.beginPath()
    ctx.moveTo(bx + 30, cy - 10)
    ctx.lineTo(bx + bw - 30, cy - 10)
    ctx.stroke()
    ctx.fillStyle = COL.obj
    ctx.beginPath()
    ctx.arc(w / 2, cy - 26, 14, 0, Math.PI * 2)
    ctx.fill()
    // LCD
    const lw = 130
    const lx = w / 2 - lw / 2
    panel(ctx, lx, cy + 2, lw, 34, 6, COL.lcdBg)
    ctx.fillStyle = COL.lcdText
    ctx.font = 'bold 20px ui-monospace, SFMono-Regular, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`${value.toFixed(dev.decimals)} ${dev.unit}`, w / 2, cy + 26)
    ctx.textAlign = 'left'
  }

  // --- input ------------------------------------------------------------------

  function press(key: string) {
    if (key === '⌫' || key === 'Backspace') {
      typed = typed.slice(0, -1)
    } else if (key === 'Enter') {
      submit()
    } else if (key === '.') {
      if (!typed.includes('.') && problem.mode === 'read') typed += typed ? '.' : '0.'
    } else if (/^[0-9]$/.test(key)) {
      if (typed.length < 8) typed += key
    } else {
      return
    }
    render()
    opts?.invalidate()
  }

  function pointerPos(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  function onPointerDown(e: PointerEvent) {
    const { x, y } = pointerPos(e)
    if (x >= submitBtn.x && x <= submitBtn.x + submitBtn.w && y >= submitBtn.y && y <= submitBtn.y + submitBtn.h) {
      press('Enter')
      return
    }
    for (const k of keypad) {
      if (x >= k.x && x <= k.x + k.w && y >= k.y && y <= k.y + k.h) {
        press(k.label)
        return
      }
    }
  }
  function onKeyDown(e: KeyboardEvent) {
    const t = e.target as HTMLElement | null
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
    if (/^[0-9]$/.test(e.key) || e.key === '.' || e.key === 'Backspace' || e.key === 'Enter') {
      e.preventDefault()
      press(e.key)
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('keydown', onKeyDown)
  canvas.style.cursor = 'pointer'

  const engine: SimEngine = {
    render,
    setParams(values: ParamValues) {
      const nextMode = String(values.mode ?? mode) as Mode
      const nextDevice = String(values.device ?? deviceParam)
      if (nextMode !== mode || nextDevice !== deviceParam) {
        mode = nextMode
        deviceParam = nextDevice
        newProblem()
        render()
      }
    },
    reset() {
      attempts = []
      lastFeedback = null
      newProblem()
      render()
    },
    getReadouts() {
      const total = attempts.length
      const correct = correctCount()
      return {
        attempts: total,
        correct,
        valueOk: attempts.filter((a) => a.valueOk).length,
        digitsOk: attempts.filter((a) => a.digitsOk).length,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      }
    },
    getData(): SimData {
      const rows: (number | string)[][] = attempts.map((a, i) => [
        i + 1,
        a.mode === 'read' ? 'Read' : 'Count',
        a.shown,
        a.expected,
        a.answer,
        a.valueOk ? 'yes' : 'no',
        a.digitsOk ? 'yes' : 'no',
      ])
      return {
        columns: ['#', 'Mode', 'Problem', 'Expected', 'Your answer', 'Value ✓', 'Sig figs ✓'],
        rows,
        xCol: 0,
        yCol: 4,
      }
    },
    isComplete() {
      const total = attempts.length
      return total >= MIN_ATTEMPTS && correctCount() / total >= MIN_ACCURACY
    },
    destroy() {
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    },
  }
  return engine
}
