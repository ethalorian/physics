/** Physics shared by the avatar ruler, replay, and graph. Time is in seconds. */
export const MOTION_SECONDS = 10
export const MOTION_BOUNDS = [-20, 30] as const
export function positionAt(start: number, velocity: number, time: number) {
  return start + velocity * Math.max(0, Math.min(MOTION_SECONDS, time))
}
export function journeyMetrics(route: number[], secondsPerStep: number, time?: number) {
  const steps = Math.max(0, route.length - 1)
  const duration = steps * secondsPerStep
  const elapsed = Math.max(0, Math.min(duration, time ?? duration))
  const progress = secondsPerStep > 0 ? elapsed / secondsPerStep : 0
  const index = Math.min(steps, Math.floor(progress)), fraction = progress - index
  const start = route[0] ?? 0
  const position = (route[index] ?? start) + ((route[index + 1] ?? route[index] ?? start) - (route[index] ?? start)) * fraction
  let distance = 0
  for (let i = 1; i <= index; i++) distance += Math.abs(route[i] - route[i - 1])
  if (index < steps) distance += Math.abs(route[index + 1] - route[index]) * fraction
  const displacement = position - start
  return { position, distance, displacement, elapsed, duration, speed: elapsed > 0 ? distance / elapsed : null, velocity: elapsed > 0 ? displacement / elapsed : null }
}
