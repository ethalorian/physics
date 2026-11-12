// Number fields keep their existing grading contract. A fraction or scientific
// notation can represent one numeric value without putting markup in the answer.
export function numericMathEntry(line: string): string | null {
  const text = line.trim().replace(/−/g, '-').replace(/\s+/g, '')
  const digits = '(?:\\d+\\.?\\d*|\\.\\d+)'
  const scalar = '[-+]?' + digits
  const factor = '(?:' + scalar + '|[-+]?\\(' + scalar + '\\))'
  if (new RegExp('^' + scalar + '(?:e[-+]?\\d+)?$', 'i').test(text))
    return Number.isFinite(Number(text)) ? text : null

  const fraction = text.match(new RegExp('^(' + factor + ')/(' + factor + ')$'))
  const power = text.match(new RegExp('^(?:(' + factor + ')(?:xx|[×⋅·*x]))?10\\^(\\([-+]?\\d+\\)|[-+]?\\d+)$'))
  function numberOf(token: string) {
    const wrapped = token.match(/^([-+]?)\((.+)\)$/)
    return wrapped ? (wrapped[1] === '-' ? -1 : 1) * Number(wrapped[2]) : Number(token)
  }
  const value = fraction ? numberOf(fraction[1]) / numberOf(fraction[2])
    : power ? numberOf(power[1] ?? '1') * 10 ** numberOf(power[2]) : NaN
  return Number.isFinite(value) ? String(value) : null
}
