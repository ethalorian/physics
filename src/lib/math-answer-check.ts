/**
 * math-answer-check — the instant self-check for warm-ups and practice reps.
 *
 * Design contract (warmup_remediation_redesign.md, decisions 1–3):
 *  - The machine judges the ANSWER; the teacher judges the FLUENCY.
 *  - Numeric-tolerance (~1% relative), unit-aware.
 *  - NEVER a false ✗: anything we can't confidently parse or compare returns
 *    'unknown', which the UI renders as "your teacher will check" — the safe
 *    fallback, not a verdict.
 *
 * Pure functions, no IO — unit-testable in isolation.
 */

export type SelfCheck = 'match' | 'mismatch' | 'unknown'

export interface ParsedQuantity {
  value: number
  unit: string // normalized; '' when no unit given
}

const REL_TOLERANCE = 0.01 // ~1%
const ABS_TOLERANCE = 1e-9 // for answers at/near zero

/** Unit synonyms → one canonical spelling. Compared AFTER lowercasing/despacing. */
const UNIT_SYNONYMS: Record<string, string> = {
  'meters': 'm', 'meter': 'm', 'metres': 'm', 'metre': 'm',
  'seconds': 's', 'second': 's', 'sec': 's', 'secs': 's',
  'm/s': 'm/s', 'ms^-1': 'm/s', 'ms-1': 'm/s', 'meterspersecond': 'm/s', 'mps': 'm/s',
  'm/s^2': 'm/s^2', 'm/s/s': 'm/s^2', 'ms^-2': 'm/s^2', 'ms-2': 'm/s^2',
  'kilograms': 'kg', 'kilogram': 'kg', 'kgs': 'kg',
  'grams': 'g', 'gram': 'g',
  'newtons': 'n', 'newton': 'n',
  'joules': 'j', 'joule': 'j',
  'watts': 'w', 'watt': 'w',
  'hertz': 'hz',
  'kilometers': 'km', 'kilometer': 'km', 'kilometres': 'km', 'kilometre': 'km',
  'centimeters': 'cm', 'centimeter': 'cm',
  'millimeters': 'mm', 'millimeter': 'mm',
  'km/h': 'km/h', 'kmh': 'km/h', 'kph': 'km/h',
  'degrees': 'deg', 'degree': 'deg', '°': 'deg',
  'percent': '%', 'pct': '%',
  'volts': 'v', 'volt': 'v',
  'amps': 'a', 'amp': 'a', 'amperes': 'a', 'ampere': 'a',
  'ohms': 'ohm', 'Ω': 'ohm',
}

const SUPERSCRIPT: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+',
}

/** Normalize unicode math typography into plain ASCII before parsing. */
function normalizeText(s: string): string {
  return s
    .replace(/−/g, '-') // minus sign
    .replace(/[×⋅·]/g, 'x') // ×, ⋅, ·
    .replace(/÷/g, '/') // ÷
    // superscript runs (incl. sign) → ^n, multi-digit safe: 10¹⁹ → 10^19, 10⁻³ → 10^-3
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (run) => '^' + [...run].map((c) => SUPERSCRIPT[c] ?? '').join(''))
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeUnit(raw: string): string {
  const u = raw.toLowerCase().replace(/\s+/g, '').replace(/\.+$/, '')
  if (!u) return ''
  return UNIT_SYNONYMS[u] ?? u
}

/**
 * Parse one quantity: plain numbers ("3.5", "-0.20", "1,200"), fractions
 * ("7/2"), scientific notation ("3.5e4", "3.5 x 10^4", "3.5*10^-3"),
 * percentages ("25%"), each with an optional trailing unit ("3.5 m/s").
 * Returns null when the string isn't a single recognizable quantity.
 */
export function parseQuantity(raw: string): ParsedQuantity | null {
  let s = normalizeText(raw)
  if (!s) return null
  // Strip explanatory tails authors add to keys: "24 m (area = 6 x 4)."
  s = s.replace(/\s*\([^()]*\)\s*[.!]?\s*$/, '').replace(/[.!\s]+$/, '').trim()
  // Strip approximation lead-ins: "about 40 m/s", "≈ 5440 m/s", "~2200"
  s = s.replace(/^(?:about|approx(?:imately)?|roughly|around|~|≈)\s*/i, '')
  // Strip lead-ins students type: "v = 3.5 m/s", "answer: 42"
  const eq = s.match(/(?:=|:)\s*([^=:]+)$/)
  if (eq) s = eq[1].trim()
  s = s.replace(/^(?:about|approx(?:imately)?|roughly|around|~|≈)\s*/i, '')

  const NUM = '[-+]?\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|[-+]?\\d*\\.?\\d+(?:e[-+]?\\d+)?'

  // bare power of ten: "10^6", "10^-3"
  const pow = s.match(/^10\s*\^\s*([-+]?\d+)\s*(.*)$/)
  if (pow) {
    const unit = pow[2].trim()
    if (!/[=]/.test(unit) && !/\d(?!$)/.test(unit.replace(/\^[-+]?\d+/g, ''))) {
      return { value: Math.pow(10, parseInt(pow[1], 10)), unit: normalizeUnit(unit) }
    }
  }

  // a x 10^b (with optional unit)
  let m = s.match(new RegExp(`^(${NUM})\\s*[x*]\\s*10\\s*\\^?\\s*([-+]?\\d+)\\s*(.*)$`, 'i'))
  if (m) {
    const base = parseFloat(m[1].replace(/,/g, ''))
    const exp = parseInt(m[2], 10)
    if (Number.isFinite(base)) return { value: base * Math.pow(10, exp), unit: normalizeUnit(m[3]) }
  }

  // simple fraction a/b — only when both sides are bare numbers (so "3 m/s" doesn't trip)
  m = s.match(/^([-+]?\d*\.?\d+)\s*\/\s*(\d*\.?\d+)\s*$/)
  if (m) {
    const den = parseFloat(m[2])
    if (den !== 0) return { value: parseFloat(m[1]) / den, unit: '' }
  }

  // plain number + optional unit (unit must not start with a digit)
  m = s.match(new RegExp(`^(${NUM})\\s*([^\\d].*)?$`, 'i'))
  if (m) {
    const v = parseFloat(m[1].replace(/,/g, ''))
    if (!Number.isFinite(v)) return null
    const rawUnit = (m[2] ?? '').trim()
    // Reject "units" that are really more math (digits or =) — but exponents
    // inside a unit are legitimate ("m/s^2"), so ignore ^n before testing.
    if (/[\d=]/.test(rawUnit.replace(/\^[-+]?\d+/g, ''))) return null
    const unit = normalizeUnit(rawUnit)
    if (unit === '%') return { value: v / 100, unit: '' } // percentage → proportion, unitless
    return { value: v, unit }
  }
  return null
}

function numbersMatch(a: number, b: number): boolean {
  if (Math.abs(a - b) <= ABS_TOLERANCE) return true
  const scale = Math.max(Math.abs(a), Math.abs(b))
  return scale > 0 && Math.abs(a - b) / scale <= REL_TOLERANCE
}

/**
 * Scan free text for every quantity in it (multi-part answers: "horizontal
 * ≈ 5440 m/s; vertical ≈ 2540 m/s" → [5440, 2540]). Handles a×10^b inline.
 * Numbers glued to a leading letter (v0, x2d) are variables, not quantities.
 */
export function findQuantities(raw: string): number[] {
  const s = normalizeText(raw)
  const out: number[] = []
  // fraction | bare 10^b | number (glued trailing letters = variable, skip),
  // then optional ×10^b, then optional %.
  const re = /(?<![\w.^/])(?:([-+]?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)(?![\w.])|10\s*\^\s*([-+]?\d+)(?![\d.])|([-+]?\d{1,3}(?:,\d{3})+(?:\.\d+)?|[-+]?\d*\.?\d+(?:e[-+]?\d+)?)(?![a-zA-Z])(\s*[x*]\s*10\s*\^\s*([-+]?\d+))?(\s*%)?)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(s)) !== null) {
    let v: number
    if (m[1] !== undefined && m[2] !== undefined) {
      const den = parseFloat(m[2])
      if (den === 0) continue
      v = parseFloat(m[1]) / den
    } else if (m[3] !== undefined) {
      v = Math.pow(10, parseInt(m[3], 10))
    } else if (m[4]) {
      v = parseFloat(m[4].replace(/,/g, ''))
      if (m[5] && m[6] !== undefined) v *= Math.pow(10, parseInt(m[6], 10))
      if (m[7]) v /= 100
    } else {
      continue
    }
    if (Number.isFinite(v)) out.push(v)
  }
  return out
}

/**
 * Drop authoring noise before scanning a key: parentheticals, em-dash tails,
 * and — per ';'-separated part — everything before the last '='/'≈', so
 * "horizontal = 6000·cos25° ≈ 5440 m/s" scans as just "5440 m/s".
 */
function cleanKeyForScan(key: string): string {
  const stripped = key.replace(/\([^()]*\)/g, ' ').replace(/—.*$/, ' ')
  return stripped
    .split(';')
    .map((seg) => {
      const cut = Math.max(seg.lastIndexOf('='), seg.lastIndexOf('≈'))
      return cut >= 0 ? seg.slice(cut + 1) : seg
    })
    .join(';')
}

/**
 * Multi-part comparison (numbers only — unit words in scanned free text are
 * too noisy to judge, and a unit error is the teacher's call, never an auto ✗):
 *  - every key part found, in order → 'match'
 *  - every part found but out of order → 'unknown' (could be an ordering task)
 *  - student supplied enough numbers but parts are missing → 'mismatch'
 *  - student supplied fewer numbers than parts → 'unknown' (partial answer)
 */
function checkMultipart(studentValues: number[], keyValues: number[]): SelfCheck {
  if (studentValues.length === 0) return 'unknown'
  // ordered subsequence
  let i = 0
  for (const sv of studentValues) {
    if (i < keyValues.length && numbersMatch(sv, keyValues[i])) i++
  }
  if (i === keyValues.length) return 'match'
  // unordered multiset
  const pool = [...studentValues]
  let found = 0
  for (const kv of keyValues) {
    const j = pool.findIndex((sv) => numbersMatch(sv, kv))
    if (j >= 0) {
      pool.splice(j, 1)
      found++
    }
  }
  if (found === keyValues.length) return 'unknown'
  return studentValues.length >= keyValues.length ? 'mismatch' : 'unknown'
}

/** Last-resort comparison for non-numeric keys ("x = v/t", "slope"). */
function normalizeLoose(s: string): string {
  return normalizeText(s).toLowerCase().replace(/[\s.]+/g, '')
}

/**
 * Compare a student's answer to one accepted key form.
 *  - both parse numerically → tolerance compare; units compared only when BOTH
 *    supplied: equal (after synonyms) → number decides; different → 'unknown'
 *    (could be an unconverted km vs m — a teacher call, never an auto ✗).
 *  - key doesn't parse → exact-ish string compare; mismatch → 'unknown'
 *    (free-text keys are not the machine's to judge).
 */
function checkOne(student: string, key: string): SelfCheck {
  const kq = parseQuantity(key)
  const sq = parseQuantity(student)
  if (kq) {
    if (!sq) return normalizeLoose(student) === normalizeLoose(key) ? 'match' : 'unknown'
    if (kq.unit && sq.unit && kq.unit !== sq.unit) return 'unknown'
    return numbersMatch(sq.value, kq.value) ? 'match' : 'mismatch'
  }
  return normalizeLoose(student) === normalizeLoose(key) ? 'match' : 'unknown'
}

/**
 * Self-check a student answer against an answer key that may list several
 * accepted forms ("7/2 or 3.5", "0.5; 1/2"). Any form matching wins; a
 * confident mismatch requires at least one numeric comparison that failed and
 * no form that returned 'unknown' promotion to match.
 */
export function checkAnswer(studentAnswer: string | null | undefined, answerKey: string | null | undefined): SelfCheck {
  const student = (studentAnswer ?? '').trim()
  const key = (answerKey ?? '').trim()
  if (!student || !key) return 'unknown'

  // Multi-part keys first: if the cleaned key holds 2+ DIFFERENT quantities
  // ("horizontal ≈ 5440; vertical ≈ 2540"), the student must supply them all.
  // Equal quantities ("1/4 and 0.25") are alternative spellings, not parts —
  // they fall through to the forms logic below.
  const keyValues = findQuantities(cleanKeyForScan(key))
  if (keyValues.length >= 2 && keyValues.some((v) => !numbersMatch(v, keyValues[0]))) {
    return checkMultipart(findQuantities(student), keyValues)
  }

  const forms = key
    .split(/\s*(?:\bor\b|\band\b|;|\|)\s*/i)
    .map((f) => f.trim())
    .filter(Boolean)
  const candidates = forms.length > 0 ? forms : [key]

  let sawMismatch = false
  for (const form of candidates) {
    const r = checkOne(student, form)
    if (r === 'match') return 'match'
    if (r === 'mismatch') sawMismatch = true
  }
  return sawMismatch ? 'mismatch' : 'unknown'
}
