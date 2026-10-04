import { arithmetic } from './arithmetic'

/** The model and answer checker understand the same fractions and signed arithmetic. */
export function modelNumber(raw: string | undefined, fallback = 0): number {
  if (!raw?.trim()) return fallback
  return arithmetic(raw) ?? fallback
}

export function sameReportedPrecision(actual: string, expected: string, addition: boolean): boolean {
  const inspect = (text: string) => {
    const match = text.trim().match(/^[+-]?(\d+(?:\.\d*)?|\.\d+)(?:e([+-]?\d+))?$/i)
    if (!match) return null
    const digits = match[1].replace('.', '').replace(/^0+/, '')
    return { value: Number(text), figures: digits.length || 1, place: Number(match[2] || 0) - (match[1].split('.')[1]?.length || 0) }
  }
  const a = inspect(actual), e = inspect(expected)
  return !!a && !!e && Number.isFinite(a.value) && Math.abs(a.value - e.value) < Math.max(1e-10, Math.abs(e.value) * 1e-10)
    && (addition ? a.place === e.place : a.figures === e.figures)
}

/** Require the supplied values to appear as u + a*t, accepting commuted factors
 * and subtraction of a positive product when acceleration is negative. A final
 * answer with '+ 0' is not a substituted expression. */
export function substitutesVelocity(raw: string, u: number, a: number, t: number): boolean {
  const value = arithmetic(raw)
  if (value === null || Math.abs(value - (u + a * t)) > 1e-8) return false
  const clean = raw.replaceAll('−', '-').replaceAll('×', '*').replace(/\s/g, '')
  const strip = (text: string): string => {
    while (text.startsWith('(') && text.endsWith(')')) {
      let depth = 0, whole = true
      for (let i = 0; i < text.length - 1; i++) { if (text[i] === '(') depth++; if (text[i] === ')') depth--; if (depth === 0) { whole = false; break } }
      if (!whole) break
      text = text.slice(1, -1)
    }
    return text
  }
  const literal = (text: string) => {
    const s = strip(text)
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s) ? Number(s) : null
  }
  const split = (text: string, operators: string) => {
    let depth = 0
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '(') depth++; if (text[i] === ')') depth--
      if (depth === 0 && i > 0 && operators.includes(text[i]) && !'+-*/^eE'.includes(text[i - 1])) return [text.slice(0, i), text[i], text.slice(i + 1)]
    }
    return null
  }
  const sum = split(strip(clean), '+-')
  if (!sum) return false
  const productMatches = (text: string, sign: number) => {
    const product = split(strip(text), '*')
    if (!product) return false
    const left = literal(product[0]), right = literal(product[2])
    return left !== null && right !== null && Math.abs(sign * left * right - a * t) < 1e-8
      && ((Math.abs(left) === Math.abs(a) && Math.abs(right) === t) || (Math.abs(right) === Math.abs(a) && Math.abs(left) === t))
  }
  return (literal(sum[0]) === u && productMatches(sum[2], sum[1] === '-' ? -1 : 1))
    || (sum[1] === '+' && literal(sum[2]) === u && productMatches(sum[0], 1))
}

export function scientificIncoming(data: Record<string, number | string | number[]>): string {
  const first = `${data.a} × 10^${data.e}`
  return Number(data.b) === 1 && Number(data.f) === 0 ? first : `(${first}) × (${data.b} × 10^${data.f})`
}
