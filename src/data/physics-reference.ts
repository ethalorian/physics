// ---------------------------------------------------------------------------
// MCAS Introductory Physics Reference Sheet — the SINGLE SOURCE OF TRUTH for
// every variable, unit, formula, and constant used across the app.
//
// Mirrors the Massachusetts Comprehensive Assessment System (DESE) Introductory
// Physics Reference Sheet that students are given on the exam, so the notation
// they practice with here matches the notation they are tested on:
//   speed s = d/Δt   ·   velocity v = Δx/Δt   ·   v_f = v_i + aΔt   ·   etc.
//
// Anything that offers variables, units, or equations (GEWA Given pickers, the
// GEWA/worked-example equation bank, the EquationSandbox unit checker, and the
// student /reference page) imports from here. Change the sheet → change one file.
//
// A source PDF of the sheet lives in the project folder:
//   MCAS-Introductory-Physics-Reference-Sheet.pdf
// ---------------------------------------------------------------------------

export interface PhysicsVariable {
  symbol: string        // display symbol, MCAS notation (e.g. 'Δx', 'v_i', 'λ')
  name: string          // what it means
  unit?: string         // SI unit it is normally expressed in (display form)
  fromFormula?: boolean // appears in a formula but not the sheet's Variables list
}

export interface PhysicsFormula {
  id: string            // stable key
  lhs: string           // the quantity this equation solves for ('v_f', 'F_net'…)
  display: string       // unicode form for chips / dropdowns (KaTeX-renderable)
  latex: string         // explicit LaTeX for typeset rendering on the reference page
  name: string          // human label
  category: FormulaCategory
}

export type FormulaCategory =
  | 'Kinematics'
  | 'Forces & Momentum'
  | 'Energy & Heat'
  | 'Waves & Electricity'

export interface PhysicsUnit {
  symbol: string        // display ('°C', 'Ω', 'N'…)
  name: string          // 'newton', 'ohm'…
}

export interface PhysicsConstant {
  symbol: string
  name: string
  value: string         // display value with units
  latex: string         // typeset form for the reference page
}

// ---------------------------------------------------------------------------
// VARIABLES (the sheet's "Variables" section, in MCAS notation). v_i / v_f are
// not listed separately on the sheet but appear in v_f = v_i + aΔt, so they are
// included (flagged) so the Given picker can offer them.
// ---------------------------------------------------------------------------
export const PHYSICS_VARIABLES: readonly PhysicsVariable[] = [
  { symbol: 'a', name: 'acceleration', unit: 'm/s²' },
  { symbol: 'c', name: 'specific heat', unit: 'J/(kg·°C)' },
  { symbol: 'd', name: 'distance', unit: 'm' },
  { symbol: 'E', name: 'energy', unit: 'J' },
  { symbol: 'eff', name: 'efficiency', unit: '' },
  { symbol: 'f', name: 'frequency', unit: 'Hz' },
  { symbol: 'F', name: 'force', unit: 'N' },
  { symbol: 'g', name: 'acceleration due to gravity', unit: 'm/s²' },
  { symbol: 'Δh', name: 'change in height', unit: 'm' },
  { symbol: 'I', name: 'current', unit: 'A' },
  { symbol: 'KE', name: 'kinetic energy', unit: 'J' },
  { symbol: 'λ', name: 'wavelength', unit: 'm' },
  { symbol: 'm', name: 'mass', unit: 'kg' },
  { symbol: 'p', name: 'momentum', unit: 'kg·m/s' },
  { symbol: 'ΔPE', name: 'change in gravitational potential energy', unit: 'J' },
  { symbol: 'q', name: 'charge of particle', unit: 'C' },
  { symbol: 'Q', name: 'heat added or removed', unit: 'J' },
  { symbol: 'R', name: 'resistance', unit: 'Ω' },
  { symbol: 's', name: 'speed', unit: 'm/s' },
  { symbol: 'Δt', name: 'change in time', unit: 's' },
  { symbol: 'T', name: 'period', unit: 's' },
  { symbol: 'ΔT', name: 'change in temperature', unit: '°C' },
  { symbol: 'v', name: 'velocity', unit: 'm/s' },
  { symbol: 'v_i', name: 'initial velocity', unit: 'm/s', fromFormula: true },
  { symbol: 'v_f', name: 'final velocity', unit: 'm/s', fromFormula: true },
  { symbol: 'V', name: 'potential difference (voltage)', unit: 'V' },
  { symbol: 'W', name: 'work', unit: 'J' },
  { symbol: 'Δx', name: 'change in position (displacement)', unit: 'm' },
] as const

// ---------------------------------------------------------------------------
// FORMULAS (the sheet's "Formulas" section). `display` is what fills equation
// chips; `latex` is typeset on the reference page.
// ---------------------------------------------------------------------------
export const PHYSICS_FORMULAS: readonly PhysicsFormula[] = [
  // Kinematics
  { id: 'avg-speed',        lhs: 's',     name: 'average speed',          category: 'Kinematics',          display: 's = d / Δt',              latex: 's = \\dfrac{d}{\\Delta t}' },
  { id: 'avg-velocity',     lhs: 'v',     name: 'average velocity',       category: 'Kinematics',          display: 'v = Δx / Δt',             latex: 'v = \\dfrac{\\Delta x}{\\Delta t}' },
  { id: 'avg-acceleration', lhs: 'a',     name: 'average acceleration',   category: 'Kinematics',          display: 'a = Δv / Δt',             latex: 'a = \\dfrac{\\Delta v}{\\Delta t}' },
  { id: 'final-velocity',   lhs: 'v_f',   name: 'final velocity',         category: 'Kinematics',          display: 'v_f = v_i + aΔt',         latex: 'v_f = v_i + a\\,\\Delta t' },
  { id: 'displacement',     lhs: 'Δx',    name: 'displacement',           category: 'Kinematics',          display: 'Δx = v_iΔt + ½aΔt²',      latex: '\\Delta x = v_i\\,\\Delta t + \\tfrac{1}{2}a\\,\\Delta t^{2}' },
  // Forces & Momentum
  { id: 'momentum',         lhs: 'p',     name: 'momentum',               category: 'Forces & Momentum',   display: 'p = mv',                  latex: 'p = mv' },
  { id: 'impulse',          lhs: 'Δp',    name: 'impulse–momentum',       category: 'Forces & Momentum',   display: 'FΔt = Δp',                latex: 'F\\,\\Delta t = \\Delta p' },
  { id: 'newton-2nd',       lhs: 'F_net', name: "Newton's second law",    category: 'Forces & Momentum',   display: 'F_net = ma',              latex: 'F_{net} = ma' },
  { id: 'weight',           lhs: 'F_g',   name: 'weight (gravity)',       category: 'Forces & Momentum',   display: 'F_g = mg',                latex: 'F_g = mg' },
  { id: 'gravitation',      lhs: 'F_g',   name: 'universal gravitation',  category: 'Forces & Momentum',   display: 'F_g = G m₁m₂ / d²',       latex: 'F_g = G\\dfrac{m_1 m_2}{d^{2}}' },
  { id: 'coulomb',          lhs: 'F_e',   name: "Coulomb's law",          category: 'Forces & Momentum',   display: 'F_e = k q₁q₂ / d²',       latex: 'F_e = k\\dfrac{q_1 q_2}{d^{2}}' },
  // Energy & Heat
  { id: 'kinetic-energy',   lhs: 'KE',    name: 'kinetic energy',         category: 'Energy & Heat',       display: 'KE = ½mv²',               latex: 'KE = \\tfrac{1}{2}mv^{2}' },
  { id: 'potential-energy', lhs: 'ΔPE',   name: 'gravitational PE',       category: 'Energy & Heat',       display: 'ΔPE = mgΔh',              latex: '\\Delta PE = mg\\,\\Delta h' },
  { id: 'work',             lhs: 'W',     name: 'work / energy',          category: 'Energy & Heat',       display: 'W = ΔE = Fd',             latex: 'W = \\Delta E = Fd' },
  { id: 'efficiency',       lhs: 'eff',   name: 'efficiency',             category: 'Energy & Heat',       display: 'eff = E_out / E_in',      latex: 'eff = \\dfrac{E_{out}}{E_{in}}' },
  { id: 'heat',             lhs: 'Q',     name: 'heat transfer',          category: 'Energy & Heat',       display: 'Q = mcΔT',                latex: 'Q = mc\\,\\Delta T' },
  // Waves & Electricity
  { id: 'wave-speed',       lhs: 'v',     name: 'wave speed',             category: 'Waves & Electricity', display: 'v = λf',                  latex: 'v = \\lambda f' },
  { id: 'period',           lhs: 'T',     name: 'period',                 category: 'Waves & Electricity', display: 'T = 1 / f',               latex: 'T = \\dfrac{1}{f}' },
  { id: 'ohms-law',         lhs: 'V',     name: "Ohm's law",              category: 'Waves & Electricity', display: 'V = IR',                  latex: 'V = IR' },
] as const

export const FORMULA_CATEGORIES: readonly FormulaCategory[] = [
  'Kinematics', 'Forces & Momentum', 'Energy & Heat', 'Waves & Electricity',
] as const

// ---------------------------------------------------------------------------
// UNIT SYMBOLS (the sheet's "Unit Symbols" section).
// ---------------------------------------------------------------------------
export const PHYSICS_UNITS: readonly PhysicsUnit[] = [
  { symbol: 'A', name: 'ampere' },
  { symbol: 'C', name: 'coulomb' },
  { symbol: '°C', name: 'degree Celsius' },
  { symbol: 'Hz', name: 'hertz' },
  { symbol: 'J', name: 'joule' },
  { symbol: 'kg', name: 'kilogram' },
  { symbol: 'm', name: 'meter' },
  { symbol: 'N', name: 'newton' },
  { symbol: 'Ω', name: 'ohm' },
  { symbol: 's', name: 'second' },
  { symbol: 'V', name: 'volt' },
] as const

// ---------------------------------------------------------------------------
// CONSTANTS / DEFINITIONS (the sheet's "Definitions" section).
// ---------------------------------------------------------------------------
export const PHYSICS_CONSTANTS: readonly PhysicsConstant[] = [
  { symbol: 'c', name: 'speed of EM waves in a vacuum', value: '3 × 10⁸ m/s',          latex: 'c = 3 \\times 10^{8}\\ \\text{m/s}' },
  { symbol: 'G', name: 'universal gravitational constant', value: '6.7 × 10⁻¹¹ N·m²/kg²', latex: 'G = 6.7 \\times 10^{-11}\\ \\tfrac{\\text{N}\\cdot\\text{m}^2}{\\text{kg}^2}' },
  { symbol: 'k', name: "Coulomb's constant", value: '9 × 10⁹ N·m²/C²',                latex: 'k = 9 \\times 10^{9}\\ \\tfrac{\\text{N}\\cdot\\text{m}^2}{\\text{C}^2}' },
  { symbol: 'g', name: 'acceleration due to gravity (Earth surface)', value: '≈ 10 m/s²', latex: 'g \\approx 10\\ \\text{m/s}^2' },
] as const

// Unit identities from the sheet (1 N = 1 kg·m/s², 1 J = 1 N·m).
export const PHYSICS_IDENTITIES: readonly { display: string; latex: string }[] = [
  { display: '1 N = 1 kg·m/s²', latex: '1\\ \\text{N} = 1\\ \\tfrac{\\text{kg}\\cdot\\text{m}}{\\text{s}^2}' },
  { display: '1 J = 1 N·m',     latex: '1\\ \\text{J} = 1\\ \\text{N}\\cdot\\text{m}' },
] as const

// ---------------------------------------------------------------------------
// DERIVED HELPERS — what the pickers, equation bank, and unit checker consume.
// ---------------------------------------------------------------------------

/** Every MCAS variable symbol, for the GEWA "Given" symbol dropdown. */
export const MCAS_SYMBOLS: readonly string[] = PHYSICS_VARIABLES.map((v) => v.symbol)

/** The 19 formulas as equation-bank strings, for GEWA / worked examples. */
export const MCAS_EQUATION_BANK: readonly string[] = PHYSICS_FORMULAS.map((f) => f.display)

/**
 * Units offered in dropdowns: the 11 MCAS base units plus the compound units
 * (built only from MCAS base units) that real answers carry.
 */
export const MCAS_UNIT_OPTIONS: readonly string[] = [
  'm', 'kg', 's', 'm/s', 'm/s²', 'N', 'J', 'A', 'C', 'V', 'Ω', 'Hz', '°C', 'kg·m/s',
] as const

/**
 * The atomic MCAS unit tokens (lowercased) a compound unit may be built from.
 * The checker splits a unit on / · * and requires every piece to be in here.
 * STRICT to the MCAS sheet — non-MCAS units (km, g, min, kelvin, watt…) are
 * intentionally absent. To relax, add tokens here in one place.
 */
export const MCAS_BASE_UNIT_TOKENS: ReadonlySet<string> = new Set([
  'a',   // ampere
  'c',   // coulomb
  '°c',  // degree Celsius
  'hz',  // hertz
  'j',   // joule
  'kg',  // kilogram
  'm',   // meter
  'n',   // newton
  'ω',   // ohm
  's',   // second
  'v',   // volt
])

/**
 * True if `u` is a valid MCAS unit (atomic or a compound of MCAS base units).
 * Mirrors the previous EquationSandbox logic but sourced from the sheet.
 */
export function isMcasUnit(u: string): boolean {
  const cleaned = u.replace(/[()]/g, '').trim()
  if (cleaned.length === 0) return false
  return cleaned
    .split(/[\s/·*]+/)
    .filter(Boolean)
    .every((p) => MCAS_BASE_UNIT_TOKENS.has(p.replace(/[²³⁴]/g, '').replace(/\^\d+/g, '').toLowerCase()))
}

/** Look up a variable's meaning/unit by symbol (e.g. for tooltips). */
export function variableBySymbol(symbol: string): PhysicsVariable | undefined {
  return PHYSICS_VARIABLES.find((v) => v.symbol === symbol)
}

// ---------------------------------------------------------------------------
// UNIT CONVERSIONS — common off-sheet units → their MCAS base. Used by the GEWA
// "Given" step: a known entered in km/cm/g/min/h auto-converts to m/kg/s when it
// drops into the equation, and the block shows the student WHY (the factor and
// what changed). The conversion target is always an MCAS base unit.
// ---------------------------------------------------------------------------
export interface UnitConversion {
  from: string      // unit as entered ('km')
  to: string        // MCAS base unit ('m')
  factor: number    // multiply the value by this to reach `to`
  rule: string      // human explanation ('1 km = 1,000 m')
}

export const UNIT_CONVERSIONS: readonly UnitConversion[] = [
  { from: 'km', to: 'm', factor: 1000, rule: '1 km = 1,000 m' },
  { from: 'cm', to: 'm', factor: 0.01, rule: '100 cm = 1 m' },
  { from: 'mm', to: 'm', factor: 0.001, rule: '1,000 mm = 1 m' },
  { from: 'g', to: 'kg', factor: 0.001, rule: '1,000 g = 1 kg' },
  { from: 'mg', to: 'kg', factor: 1e-6, rule: '1,000,000 mg = 1 kg' },
  { from: 'min', to: 's', factor: 60, rule: '1 min = 60 s' },
  { from: 'h', to: 's', factor: 3600, rule: '1 h = 3,600 s' },
  { from: 'hr', to: 's', factor: 3600, rule: '1 hr = 3,600 s' },
  { from: 'ms', to: 's', factor: 0.001, rule: '1,000 ms = 1 s' },
  { from: 'km/h', to: 'm/s', factor: 1 / 3.6, rule: '1 m/s = 3.6 km/h' },
] as const

/** Units the GEWA "Given" dropdown offers: MCAS units plus the convertible ones. */
export const GEWA_UNIT_OPTIONS: readonly string[] = [
  ...MCAS_UNIT_OPTIONS,
  ...UNIT_CONVERSIONS.map((c) => c.from).filter((u) => !MCAS_UNIT_OPTIONS.includes(u)),
]

/**
 * Convert a value+unit to MCAS base units when needed. Returns the converted
 * value, the MCAS unit, and the rule to show the student — or null when the unit
 * is already MCAS (or unknown, in which case it is left untouched).
 */
export function convertToMcas(value: number, unit: string): { value: number; unit: string; rule: string } | null {
  const c = UNIT_CONVERSIONS.find((x) => x.from === unit)
  if (!c) return null
  return { value: value * c.factor, unit: c.to, rule: c.rule }
}
