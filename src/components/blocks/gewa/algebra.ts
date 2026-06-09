// ---------------------------------------------------------------------------
// GEWA algebra engine — the math model behind the drag-to-rearrange and the
// silent answer check. NOT a general CAS: it represents each MCAS formula in a
// normalized "sum of terms" form (every term is coeff · ∏numerator / ∏denominator),
// which is enough to render, evaluate, rearrange faithfully, and isolate the
// unknown for every MCAS formula that is linear/power in a single variable.
//
// Faithful freeform: the student drives which term/factor moves and in what
// order; each move applies a real inverse operation to BOTH sides, so the
// equation can never reach an invalid state. The one thing it can't fully solve
// is a variable that appears in two terms at once (Δt in Δx = v_iΔt + ½aΔt² — a
// genuine quadratic); that is detected and flagged, never faked.
// ---------------------------------------------------------------------------

export interface Factor { base: string; exp: number }            // base^exp; base is a variable/constant symbol
export interface Term { coeff: number; num: Factor[]; den: Factor[] } // coeff · ∏num / ∏den
export interface Side { terms: Term[] }                          // Σ terms
export interface Equation { lhs: Side; rhs: Side }

// ---- builders -------------------------------------------------------------
export const f = (base: string, exp = 1): Factor => ({ base, exp })
export const term = (coeff: number, num: Factor[] = [], den: Factor[] = []): Term => ({ coeff, num, den })
export const side = (...terms: Term[]): Side => ({ terms })
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x))

// ---- the MCAS formulas in normalized form (keyed by PhysicsFormula.id) -----
// Constants (G, k) are variables with values supplied at evaluation time.
export const FORMULA_AST: Record<string, Equation> = {
  'avg-speed':        { lhs: side(term(1, [f('s')])),      rhs: side(term(1, [f('d')], [f('Δt')])) },
  'avg-velocity':     { lhs: side(term(1, [f('v')])),      rhs: side(term(1, [f('Δx')], [f('Δt')])) },
  'avg-acceleration': { lhs: side(term(1, [f('a')])),      rhs: side(term(1, [f('Δv')], [f('Δt')])) },
  'final-velocity':   { lhs: side(term(1, [f('v_f')])),    rhs: side(term(1, [f('v_i')]), term(1, [f('a'), f('Δt')])) },
  'displacement':     { lhs: side(term(1, [f('Δx')])),     rhs: side(term(1, [f('v_i'), f('Δt')]), term(0.5, [f('a'), f('Δt', 2)])) },
  'momentum':         { lhs: side(term(1, [f('p')])),      rhs: side(term(1, [f('m'), f('v')])) },
  'impulse':          { lhs: side(term(1, [f('F'), f('Δt')])), rhs: side(term(1, [f('Δp')])) },
  'newton-2nd':       { lhs: side(term(1, [f('F_net')])),  rhs: side(term(1, [f('m'), f('a')])) },
  'weight':           { lhs: side(term(1, [f('F_g')])),    rhs: side(term(1, [f('m'), f('g')])) },
  'gravitation':      { lhs: side(term(1, [f('F_g')])),    rhs: side(term(1, [f('G'), f('m_1'), f('m_2')], [f('d', 2)])) },
  'coulomb':          { lhs: side(term(1, [f('F_e')])),    rhs: side(term(1, [f('k'), f('q_1'), f('q_2')], [f('d', 2)])) },
  'kinetic-energy':   { lhs: side(term(1, [f('KE')])),     rhs: side(term(0.5, [f('m'), f('v', 2)])) },
  'potential-energy': { lhs: side(term(1, [f('ΔPE')])),    rhs: side(term(1, [f('m'), f('g'), f('Δh')])) },
  'work':             { lhs: side(term(1, [f('W')])),      rhs: side(term(1, [f('F'), f('d')])) },
  'efficiency':       { lhs: side(term(1, [f('eff')])),    rhs: side(term(1, [f('E_out')], [f('E_in')])) },
  'heat':             { lhs: side(term(1, [f('Q')])),      rhs: side(term(1, [f('m'), f('c'), f('ΔT')])) },
  'wave-speed':       { lhs: side(term(1, [f('v')])),      rhs: side(term(1, [f('λ'), f('f')])) },
  'period':           { lhs: side(term(1, [f('T')])),      rhs: side(term(1, [], [f('f')])) },
  'ohms-law':         { lhs: side(term(1, [f('V')])),      rhs: side(term(1, [f('I'), f('R')])) },
}

// ---- introspection --------------------------------------------------------
const symbolsInTerm = (t: Term): Set<string> => new Set([...t.num, ...t.den].map((x) => x.base))
export function symbolsInSide(s: Side): Set<string> {
  const out = new Set<string>()
  s.terms.forEach((t) => symbolsInTerm(t).forEach((b) => out.add(b)))
  return out
}
export function symbolsInEquation(eq: Equation): string[] {
  return [...new Set([...symbolsInSide(eq.lhs), ...symbolsInSide(eq.rhs)])]
}
/** How many terms (across both sides) contain `sym`. >1 ⇒ not isolatable here. */
export function termOccurrences(eq: Equation, sym: string): number {
  return [...eq.lhs.terms, ...eq.rhs.terms].filter((t) => symbolsInTerm(t).has(sym)).length
}

// ---- evaluation -----------------------------------------------------------
const evalFactor = (x: Factor, env: Record<string, number>): number => {
  const base = env[x.base]
  if (base === undefined) throw new Error(`no value for ${x.base}`)
  return Math.pow(base, x.exp)
}
const evalTerm = (t: Term, env: Record<string, number>): number => {
  let v = t.coeff
  for (const x of t.num) v *= evalFactor(x, env)
  for (const x of t.den) v /= evalFactor(x, env)
  return v
}
export const evalSide = (s: Side, env: Record<string, number>): number =>
  s.terms.reduce((acc, t) => acc + evalTerm(t, env), 0)

// ---- faithful freeform moves ----------------------------------------------
const otherSide = (eq: Equation, which: 'lhs' | 'rhs'): 'lhs' | 'rhs' => (which === 'lhs' ? 'rhs' : 'lhs')

/** Move an additive TERM to the other side, flipping its sign. Always legal. */
export function moveTerm(eq: Equation, which: 'lhs' | 'rhs', termIndex: number): Equation {
  const next = clone(eq)
  const from = next[which].terms
  const t = from.splice(termIndex, 1)[0]
  t.coeff = -t.coeff
  next[otherSide(eq, which)].terms.push(t)
  return next
}

/**
 * Move a FACTOR across the '=' (multiply/divide both sides). Only legal when the
 * source side is a single term — otherwise dividing a sum by a factor wouldn't
 * distribute. `pos` is which group it currently sits in. A numerator factor goes
 * to the other side's denominator and vice-versa.
 */
export function canMoveFactors(s: Side): boolean { return s.terms.length === 1 }
export function moveFactor(eq: Equation, which: 'lhs' | 'rhs', pos: 'num' | 'den', factorIndex: number): Equation {
  if (eq[which].terms.length !== 1) throw new Error('factor moves need a single-term side')
  const next = clone(eq)
  const src = next[which].terms[0]
  const fac = (pos === 'num' ? src.num : src.den).splice(factorIndex, 1)[0]
  // dividing both sides by a numerator factor == multiply every term on the
  // other side's denominator by it; clean because we keep sides as Σ terms.
  const dst = next[otherSide(eq, which)]
  dst.terms.forEach((t) => { if (pos === 'num') t.den.push(fac); else t.num.push(fac) })
  return mergeFactors(next)
}

// Combine repeated bases within each term (a·a ⇒ a², a/a ⇒ 1) so display stays tidy.
function mergeFactors(eq: Equation): Equation {
  const fixTerm = (t: Term) => {
    const acc: Record<string, number> = {}
    t.num.forEach((x) => { acc[x.base] = (acc[x.base] || 0) + x.exp })
    t.den.forEach((x) => { acc[x.base] = (acc[x.base] || 0) - x.exp })
    const num: Factor[] = [], den: Factor[] = []
    Object.entries(acc).forEach(([base, exp]) => {
      if (exp > 0) num.push({ base, exp })
      else if (exp < 0) den.push({ base, exp: -exp })
    })
    return { coeff: t.coeff, num, den }
  }
  return { lhs: side(...eq.lhs.terms.map(fixTerm)), rhs: side(...eq.rhs.terms.map(fixTerm)) }
}

/** Is `sym` fully isolated (alone on a side as coeff 1 · sym¹)? */
export function isIsolated(eq: Equation, sym: string): 'lhs' | 'rhs' | null {
  const lone = (s: Side) => s.terms.length === 1 && s.terms[0].coeff === 1 &&
    s.terms[0].den.length === 0 && s.terms[0].num.length === 1 &&
    s.terms[0].num[0].base === sym && s.terms[0].num[0].exp === 1
  if (lone(eq.lhs)) return 'lhs'
  if (lone(eq.rhs)) return 'rhs'
  return null
}

// ---- symbolic solve (for the silent answer check) -------------------------
// Isolates `sym` when it occurs in exactly one term, then evaluates the other
// side with the knowns. Handles a single power on the unknown via a root.
// Returns null when it can't be isolated (e.g. the Δt quadratic) — the caller
// then falls back to "we don't judge the number, the teacher does."
export function solveValue(eq: Equation, sym: string, env: Record<string, number>): number | null {
  if (termOccurrences(eq, sym) !== 1) return null
  let work: Equation = clone(eq)
  // Put the term containing sym on lhs, everything else on rhs.
  const onLhs = work.lhs.terms.some((t) => symbolsInTerm(t).has(sym))
  if (!onLhs) work = { lhs: clone(work.rhs), rhs: clone(work.lhs) }
  // Move away any additive terms on lhs that don't contain sym.
  for (let i = work.lhs.terms.length - 1; i >= 0; i--) {
    if (!symbolsInTerm(work.lhs.terms[i]).has(sym)) work = moveTerm(work, 'lhs', i)
  }
  if (work.lhs.terms.length !== 1) return null
  const t = work.lhs.terms[0]
  // Strip every factor that isn't sym, and the coefficient, onto rhs numerically.
  let rhsVal: number
  try { rhsVal = evalSide(work.rhs, env) } catch { return null }
  rhsVal /= t.coeff
  for (const x of t.num) { if (x.base !== sym) { try { rhsVal /= Math.pow(env[x.base], x.exp) } catch { return null } } }
  for (const x of t.den) { if (x.base !== sym) { try { rhsVal *= Math.pow(env[x.base], x.exp) } catch { return null } } }
  // Now rhsVal == sym^exp (exp from sym's own factor, num positive / den negative).
  const inNum = t.num.find((x) => x.base === sym)
  const inDen = t.den.find((x) => x.base === sym)
  const exp = inNum ? inNum.exp : inDen ? -inDen.exp : 1
  if (exp === 1) return rhsVal
  const root = Math.pow(Math.abs(rhsVal), 1 / Math.abs(exp))
  return exp > 0 ? root : 1 / root
}

// ---- LaTeX rendering ------------------------------------------------------
const SUP = '_i v_f net g e out in 1 2'.length // (noop to keep tree-shakers calm)
function factorLatex(x: Factor): string {
  const sub = x.base.includes('_') ? x.base.replace('_', '_{') + '}' : x.base
  return x.exp === 1 ? sub : `${sub}^{${x.exp}}`
}
function termLatex(t: Term, isFirst: boolean): string {
  const mag = Math.abs(t.coeff)
  const numParts = t.num.map(factorLatex)
  const denParts = t.den.map(factorLatex)
  const coeffStr = mag === 1 && (numParts.length || denParts.length)
    ? '' : (mag === 0.5 ? '\\tfrac{1}{2}' : String(round(mag)))
  const numStr = (coeffStr ? coeffStr + ' ' : '') + (numParts.join(' ') || (coeffStr ? '' : '1'))
  let body: string
  if (denParts.length) body = `\\dfrac{${numStr || '1'}}{${denParts.join(' ')}}`
  else body = numStr || '0'
  const sign = t.coeff < 0 ? '-' : isFirst ? '' : '+'
  return (sign ? sign + ' ' : '') + body
}
function sideLatex(s: Side): string {
  if (s.terms.length === 0) return '0'
  return s.terms.map((t, i) => termLatex(t, i === 0)).join(' ')
}
export function equationLatex(eq: Equation): string {
  return `${sideLatex(eq.lhs)} = ${sideLatex(eq.rhs)}`
}
const round = (n: number) => (Number.isInteger(n) ? n : parseFloat(n.toFixed(4)))
void SUP
