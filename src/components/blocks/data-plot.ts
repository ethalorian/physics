/** Whole-value parsing: blank cells and unit-suffixed text are not measurements. */
export function numericCell(value: unknown): number | null {
  if (typeof value !== 'string' || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** Include zero explicitly; retain small measurements instead of rounding them away. */
export function axisRange(values: number[]): { min: number; max: number } {
  const valid = values.filter(Number.isFinite)
  const min = Math.min(0, ...valid), max = Math.max(0, ...valid)
  return min === max ? { min: -1, max: 1 } : { min, max }
}

export function formatTick(n: number): string {
  return Number(n.toPrecision(3)).toString()
}
