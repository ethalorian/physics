/**
 * math-item-template — "shared prompt, varied numbers" (redesign decision 11).
 *
 * A spiral item may carry a template: variable ranges plus an answer
 * expression. The prompt keeps its wording with {a}-style slots; every student
 * on the rung sees the SAME problem structure on the same day (the discussion
 * asset survives) with DIFFERENT numbers (answers don't transfer).
 *
 * Determinism contract: instantiate(item, seed) is pure. The daily warm-up
 * seeds with user+item+day so the numbers a student sees at 8am are the ones
 * their submission is checked against at 9am; practice mode uses a random
 * seed returned to the client and echoed back on check.
 *
 * Pure functions, no IO — unit-testable in isolation.
 */

export interface TemplateVar {
  min: number
  max: number
  /** grid step; default 1 (integers). Use 0.1, 0.5 … for decimals. */
  step?: number
}

export interface ItemTemplate {
  /** variable name → range; names must match {name} slots in the prompt */
  vars: Record<string, TemplateVar>
  /** answer expression over the vars, e.g. "d / t" or "0.5 * m * v^2" */
  answer: string
  /** unit appended to the computed answer key, e.g. "m/s" */
  answerUnit?: string
  /** significant figures for the computed key (default 3) */
  sigFigs?: number
}

export interface InstantiatedItem {
  prompt: string
  answerKey: string
  values: Record<string, number>
}

// ---------------------------------------------------------------------------
// Seeded randomness: string hash → mulberry32 PRNG.
// ---------------------------------------------------------------------------

function hashString(s: string): number {
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
// Expression evaluator: + - * / ^, parens, unary minus, numbers, variables,
// and the functions a physics warm-up needs (trig in DEGREES). Recursive
// descent — no eval(), no Function(), nothing dynamic.
// ---------------------------------------------------------------------------

const FUNCTIONS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  sin: (d) => Math.sin((d * Math.PI) / 180),
  cos: (d) => Math.cos((d * Math.PI) / 180),
  tan: (d) => Math.tan((d * Math.PI) / 180),
  log10: Math.log10,
  ln: Math.log,
}

export function evaluateExpression(expr: string, vars: Record<string, number>): number {
  let i = 0
  const s = expr.replace(/\s+/g, '')
  if (!s) throw new Error('empty expression')

  function parseExpr(): number {
    let v = parseTerm()
    while (s[i] === '+' || s[i] === '-') {
      const op = s[i++]
      const r = parseTerm()
      v = op === '+' ? v + r : v - r
    }
    return v
  }
  function parseTerm(): number {
    let v = parsePower()
    while (s[i] === '*' || s[i] === '/') {
      const op = s[i++]
      const r = parsePower()
      v = op === '*' ? v * r : v / r
    }
    return v
  }
  function parsePower(): number {
    const base = parseUnary()
    if (s[i] === '^') {
      i++
      return Math.pow(base, parsePower()) // right-associative
    }
    return base
  }
  function parseUnary(): number {
    if (s[i] === '-') { i++; return -parseUnary() }
    if (s[i] === '+') { i++; return parseUnary() }
    return parseAtom()
  }
  function parseAtom(): number {
    if (s[i] === '(') {
      i++
      const v = parseExpr()
      if (s[i] !== ')') throw new Error(`expected ) at ${i}`)
      i++
      return v
    }
    const num = /^\d+(?:\.\d+)?(?:e[-+]?\d+)?/i.exec(s.slice(i))
    if (num) { i += num[0].length; return parseFloat(num[0]) }
    const word = /^[a-zA-Z_][a-zA-Z_0-9]*/.exec(s.slice(i))
    if (word) {
      i += word[0].length
      const name = word[0]
      if (s[i] === '(') {
        const fn = FUNCTIONS[name.toLowerCase()]
        if (!fn) throw new Error(`unknown function "${name}"`)
        i++
        const arg = parseExpr()
        if (s[i] !== ')') throw new Error(`expected ) at ${i}`)
        i++
        return fn(arg)
      }
      if (name === 'pi' || name === 'PI') return Math.PI
      if (!(name in vars)) throw new Error(`unknown variable "${name}"`)
      return vars[name]
    }
    throw new Error(`unexpected "${s[i]}" at ${i}`)
  }

  const result = parseExpr()
  if (i !== s.length) throw new Error(`unexpected "${s[i]}" at ${i}`)
  if (!Number.isFinite(result)) throw new Error('expression did not produce a finite number')
  return result
}

// ---------------------------------------------------------------------------
// Instantiation
// ---------------------------------------------------------------------------

function roundSig(v: number, sig: number): number {
  if (v === 0) return 0
  const mag = Math.floor(Math.log10(Math.abs(v)))
  const factor = Math.pow(10, sig - 1 - mag)
  return Math.round(v * factor) / factor
}

/** Render a value without float dust ("0.30000000000000004" → "0.3"). */
function fmt(v: number): string {
  return String(parseFloat(v.toPrecision(12)))
}

function drawValue(spec: TemplateVar, rnd: () => number): number {
  const step = spec.step && spec.step > 0 ? spec.step : 1
  const n = Math.max(1, Math.floor((spec.max - spec.min) / step + 1e-9) + 1)
  const v = spec.min + Math.floor(rnd() * n) * step
  return parseFloat(v.toPrecision(12))
}

/** Replace {name} slots; tolerate extra whitespace like {  a }. */
function fillSlots(text: string, values: Record<string, number>): string {
  return text.replace(/\{\s*([a-zA-Z_][a-zA-Z_0-9]*)\s*\}/g, (whole, name) =>
    name in values ? fmt(values[name]) : whole,
  )
}

/**
 * Deterministically instantiate a templated item. Throws on a malformed
 * template — callers treat that as "not templated" and fall back to the
 * static prompt/key (never block a student on an authoring mistake).
 */
export function instantiateTemplate(
  prompt: string,
  template: ItemTemplate,
  seed: string,
): InstantiatedItem {
  const names = Object.keys(template.vars ?? {})
  if (names.length === 0) throw new Error('template has no vars')
  const rnd = mulberry32(hashString(seed))
  const values: Record<string, number> = {}
  for (const name of names.sort()) values[name] = drawValue(template.vars[name], rnd)
  const raw = evaluateExpression(template.answer, values)
  const rounded = roundSig(raw, template.sigFigs ?? 3)
  const answerKey = template.answerUnit ? `${fmt(rounded)} ${template.answerUnit}` : fmt(rounded)
  return { prompt: fillSlots(prompt, values), answerKey, values }
}

/** Validate an authored template; returns an error message or null if usable. */
export function validateTemplate(prompt: string, template: ItemTemplate): string | null {
  const names = Object.keys(template.vars ?? {})
  if (names.length === 0) return 'Add at least one variable.'
  for (const name of names) {
    const v = template.vars[name]
    if (!/^[a-zA-Z_][a-zA-Z_0-9]*$/.test(name)) return `Variable name "${name}" is invalid.`
    if (!Number.isFinite(v.min) || !Number.isFinite(v.max) || v.max < v.min)
      return `Variable "${name}" needs min ≤ max.`
    if (v.step !== undefined && !(v.step > 0)) return `Variable "${name}" step must be > 0.`
    if (!new RegExp(`\\{\\s*${name}\\s*\\}`).test(prompt))
      return `The prompt never uses {${name}}.`
  }
  if (!template.answer?.trim()) return 'Add an answer expression.'
  try {
    instantiateTemplate(prompt, template, 'validate')
  } catch (e) {
    return e instanceof Error ? `Answer expression: ${e.message}` : 'Answer expression failed.'
  }
  return null
}
