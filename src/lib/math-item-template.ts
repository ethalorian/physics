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

import { checkAnswer } from './math-answer-check'

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
  const composed = composeItem(prompt, template, values)
  return { prompt: composed.prompt, answerKey: composed.answerKey, values: composed.values }
}

/** Prompt + key for one ALREADY-DRAWN set of values (the half of
 *  instantiateTemplate that the grid walk reuses; also hands back the
 *  unrounded value so a validator can compare key against exact). */
function composeItem(
  prompt: string,
  template: ItemTemplate,
  values: Record<string, number>,
): InstantiatedItem & { exact: number; rounded: number } {
  const exact = evaluateExpression(template.answer, values)
  const rounded = roundSig(exact, template.sigFigs ?? 3)
  const answerKey = template.answerUnit ? `${fmt(rounded)} ${template.answerUnit}` : fmt(rounded)
  return { prompt: fillSlots(prompt, values), answerKey, values, exact, rounded }
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


// ---------------------------------------------------------------------------
// Grid validation (2026-09-04 audit).
//
// validateTemplate proves ONE seed. A template defines a whole variable grid,
// so it can pass on that seed and still hand a student an unanswerable item on
// another roll: key = 0, key equal to a number already printed in the prompt,
// or a key rounded so coarsely that the checker marks the exact answer wrong.
// validateTemplateGrid walks the WHOLE grid (or a deterministic even sample of
// it) and reports what the bank would actually produce.
//
// The tolerance question is answered by calling the real checker
// (math-answer-check.checkAnswer) rather than by copying its constant here —
// if REL_TOLERANCE ever moves, this validator moves with it.
// ---------------------------------------------------------------------------

export type TemplateIssueKind =
  /** the answer expression produced NaN/Infinity or failed to evaluate */
  | 'non-finite'
  /** the published key rounds to exactly 0 — nothing to solve for */
  | 'key-zero'
  /** the key equals a value already printed in the prompt — typing a given back earns ✓ */
  | 'key-equals-given'
  /** the checker would not accept the exact answer against the published key */
  | 'rounding-outside-tolerance'
  /** the instantiated prompt still shows a {slot} */
  | 'unfilled-slot'

export interface TemplateIssueExample {
  /** the drawn values that produced it */
  values: Record<string, number>
  /** the key as it would be published */
  answerKey: string
  /** the unrounded value, or null when evaluation failed */
  exact: number | null
  /** the instantiated prompt, or null when evaluation failed */
  prompt: string | null
  /** one line of human-readable why */
  detail: string
}

export interface TemplateIssue {
  kind: TemplateIssueKind
  /** how many combinations in the walk hit this kind */
  count: number
  example: TemplateIssueExample
}

export interface GridValidationResult {
  /** size of the full cartesian product of the variable grid */
  total: number
  /** combinations actually evaluated (=== total unless capped) */
  sampled: number
  /** true when sampled < total, i.e. the walk was an even sample */
  truncated: boolean
  /** the cap in force for this run */
  cap: number
  /** no issues and no structural error */
  ok: boolean
  /** aggregated by kind: a count and ONE concrete example each */
  issues: TemplateIssue[]
  /** structural problem from validateTemplate (authoring UI wording) */
  error?: string
}

export interface GridValidationOptions {
  /** walk at most this many combinations; beyond it, sample evenly (default 20000) */
  maxCombinations?: number
  /**
   * Also require that an answer rounded to this many significant figures is
   * accepted. OFF by default, because it asks a policy question rather than an
   * authoring one: a 2-sig-fig answer can sit up to ~5% from the key, which no
   * 3-sig-fig key can absorb at a 1% tolerance. Turn it on to size that
   * exposure across the bank.
   */
  studentSigFigs?: number
}

export const DEFAULT_MAX_COMBINATIONS = 20000

const ISSUE_ORDER: TemplateIssueKind[] = [
  'non-finite',
  'key-zero',
  'key-equals-given',
  'rounding-outside-tolerance',
  'unfilled-slot',
]

const SLOT_RE = /\{\s*([a-zA-Z_][a-zA-Z_0-9]*)\s*\}/g

function stepOf(spec: TemplateVar): number {
  return spec.step && spec.step > 0 ? spec.step : 1
}

/** How many values a var's grid holds — the same arithmetic drawValue uses,
 *  so the walk covers exactly the values a student can be dealt. */
function gridCount(spec: TemplateVar): number {
  return Math.max(1, Math.floor((spec.max - spec.min) / stepOf(spec) + 1e-9) + 1)
}

function gridValueAt(spec: TemplateVar, k: number): number {
  return parseFloat((spec.min + k * stepOf(spec)).toPrecision(12))
}

/**
 * Spread a budget of `cap` combinations over the dimensions: start every var at
 * one value, then repeatedly give the next value to whichever var currently
 * covers the smallest fraction of its range, while the product still fits.
 * Deterministic (no Math.random) and balanced, so no var is starved.
 */
function allocate(counts: number[], cap: number): number[] {
  const out = counts.map(() => 1)
  const product = () => out.reduce((a, b) => a * b, 1)
  for (;;) {
    let best = -1
    let bestRatio = Infinity
    for (let i = 0; i < counts.length; i++) {
      if (out[i] >= counts[i]) continue
      const ratio = out[i] / counts[i]
      if (ratio < bestRatio) { bestRatio = ratio; best = i }
    }
    if (best < 0) return out
    if ((product() / out[best]) * (out[best] + 1) <= cap) { out[best]++; continue }
    // the neediest var can't grow — try any other that still fits
    let grew = false
    for (let i = 0; i < counts.length; i++) {
      if (out[i] >= counts[i]) continue
      if ((product() / out[i]) * (out[i] + 1) <= cap) { out[i]++; grew = true; break }
    }
    if (!grew) return out
  }
}

/** k evenly spaced indices out of n, endpoints always included (k >= 2). */
function pickIndices(n: number, k: number): number[] {
  if (k <= 1) return [0]
  if (k >= n) return Array.from({ length: n }, (_, i) => i)
  const out: number[] = []
  for (let t = 0; t < k; t++) out.push(Math.round((t * (n - 1)) / (k - 1)))
  return out
}

/** Significant digits a printed key actually shows. Trailing zeros of an
 *  integer are ambiguous, so they don't count ("1050" → 3, "0.1" → 1). */
function significantDigits(text: string): number {
  const m = /^[-+]?(\d*)(?:\.(\d+))?/.exec(text.trim())
  if (!m) return 0
  const frac = m[2] ?? ''
  let digits = ((m[1] ?? '') + frac).replace(/^0+/, '')
  if (!frac) digits = digits.replace(/0+$/, '')
  return digits.length
}

/** Would the checker accept `student` against the published key? */
function checkerAccepts(student: string, answerKey: string, unit?: string): boolean {
  // This validator probes numeric rounding, so supply the authored unit.
  return checkAnswer(unit ? `${student} ${unit}` : student, answerKey) === 'match'
}

/**
 * Walk the whole variable grid of a template and report every way it can go
 * wrong. Aggregated by issue kind — a count plus one concrete example each,
 * never one row per combination.
 *
 * Pure and deterministic: the same template always yields the same result,
 * including which example is reported.
 */
export function validateTemplateGrid(
  prompt: string,
  template: ItemTemplate,
  opts: GridValidationOptions = {},
): GridValidationResult {
  const cap = Math.max(1, Math.floor(opts.maxCombinations ?? DEFAULT_MAX_COMBINATIONS))
  const structural = validateTemplate(prompt, template) ?? undefined
  const names = Object.keys(template?.vars ?? {}).sort()
  const bail = (error: string): GridValidationResult => ({
    total: 0, sampled: 0, truncated: false, cap, ok: false, issues: [], error,
  })
  if (names.length === 0) return bail(structural ?? 'Add at least one variable.')
  for (const name of names) {
    const v = template.vars[name]
    if (!v || !Number.isFinite(v.min) || !Number.isFinite(v.max) || v.max < v.min)
      return bail(structural ?? `Variable "${name}" needs min ≤ max.`)
    if (v.step !== undefined && !(v.step > 0))
      return bail(structural ?? `Variable "${name}" step must be > 0.`)
  }
  if (!template.answer?.trim()) return bail(structural ?? 'Add an answer expression.')

  // Only slots the prompt actually PRINTS can be typed back by a student.
  const printed = new Set<string>()
  for (const m of prompt.matchAll(SLOT_RE)) if (m[1] in template.vars) printed.add(m[1])

  const specs = names.map((n) => template.vars[n])
  const counts = specs.map(gridCount)
  const total = counts.reduce((a, b) => a * b, 1)
  const truncated = !Number.isFinite(total) || total > cap
  const perVar = truncated ? allocate(counts, cap) : counts
  const values = specs.map((spec, d) => pickIndices(counts[d], perVar[d]).map((k) => gridValueAt(spec, k)))
  const sampled = values.reduce((a, v) => a * v.length, 1)

  const found = new Map<TemplateIssueKind, TemplateIssue>()
  const flag = (kind: TemplateIssueKind, example: TemplateIssueExample) => {
    const seen = found.get(kind)
    if (seen) seen.count++
    else found.set(kind, { kind, count: 1, example })
  }

  const pos = names.map(() => 0)
  for (let c = 0; c < sampled; c++) {
    const drawn: Record<string, number> = {}
    for (let d = 0; d < names.length; d++) drawn[names[d]] = values[d][pos[d]]

    let item: ReturnType<typeof composeItem> | null = null
    try {
      item = composeItem(prompt, template, drawn)
    } catch (e) {
      flag('non-finite', {
        values: drawn, answerKey: '', exact: null, prompt: null,
        detail: e instanceof Error ? e.message : 'answer expression failed',
      })
    }

    if (item) {
      const base = { values: drawn, answerKey: item.answerKey, exact: item.exact, prompt: item.prompt }
      if (item.rounded === 0) {
        flag('key-zero', { ...base, detail: 'the key rounds to 0 — nothing left to solve for' })
      }
      for (const name of printed) {
        if (checkerAccepts(fmt(drawn[name]), item.answerKey, template.answerUnit)) {
          flag('key-equals-given', {
            ...base,
            detail: `the key matches {${name}} = ${fmt(drawn[name])}, already printed in the prompt`,
          })
          break
        }
      }
      // (a) the exact answer judged against the published key
      if (!checkerAccepts(fmt(item.exact), item.answerKey, template.answerUnit)) {
        flag('rounding-outside-tolerance', {
          ...base,
          detail: `the exact answer ${fmt(item.exact)} is not accepted against the key ${item.answerKey}`,
        })
      } else {
        // (b) the mirror: a correct answer rounded to the key's own precision,
        // and (c) — only when asked — to a student's habitual precision.
        const precisions = [significantDigits(fmt(item.rounded))]
        if (opts.studentSigFigs && opts.studentSigFigs > 0) precisions.push(Math.floor(opts.studentSigFigs))
        for (const digits of precisions) {
          if (digits <= 0) continue
          const asStudent = fmt(roundSig(item.exact, digits))
          if (!checkerAccepts(asStudent, item.answerKey, template.answerUnit)) {
            flag('rounding-outside-tolerance', {
              ...base,
              detail: `an answer rounded to ${digits} sig fig${digits === 1 ? '' : 's'} (${asStudent}) is not accepted against the key ${item.answerKey}`,
            })
            break
          }
        }
      }
      const leftover = item.prompt.match(SLOT_RE)
      if (leftover) {
        flag('unfilled-slot', { ...base, detail: `the prompt still shows ${leftover[0]}` })
      }
    }

    // odometer
    for (let d = names.length - 1; d >= 0; d--) {
      if (++pos[d] < values[d].length) break
      pos[d] = 0
    }
  }

  const issues = ISSUE_ORDER.map((k) => found.get(k)).filter((i): i is TemplateIssue => !!i)
  return { total, sampled, truncated, cap, ok: issues.length === 0 && !structural, issues, error: structural }
}
