export interface RaceConditions {
  radius: number
  speed: number
  laps: number
  direction: 'clockwise' | 'counterclockwise'
}
export const DEFAULT_RACE: RaceConditions = { radius: 100, speed: 20, laps: 1, direction: 'clockwise' }
const clean = (n: number) => Math.abs(n) < 1e-8 ? 0 : n

/** East is +x, north is +y. The start is the eastern edge of the track. */
export function raceMeasurement(conditions: RaceConditions, fraction: number) {
  const { radius, speed, laps, direction } = conditions
  const progress = Math.max(0, Math.min(1, fraction))
  const turns = laps * progress
  const sign = direction === 'clockwise' ? -1 : 1
  const angle = sign * 2 * Math.PI * turns
  const distance = 2 * Math.PI * radius * turns
  const time = distance / speed
  const dx = clean(radius * (Math.cos(angle) - 1))
  const dy = clean(radius * Math.sin(angle))
  const displacement = clean(Math.hypot(dx, dy))
  const vx = clean(-sign * speed * Math.sin(angle))
  const vy = clean(sign * speed * Math.cos(angle))
  return { progress, turns, angle, distance, time, dx, dy, displacement, vx, vy,
    averageSpeed: time ? distance / time : 0,
    averageVx: time ? dx / time : 0, averageVy: time ? dy / time : 0,
    averageVelocity: time ? displacement / time : 0 }
}
export function compass(x: number, y: number): string {
  if (Math.hypot(x, y) < 1e-8) return 'no direction (zero vector)'
  const degrees = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
  return ['east', 'northeast', 'north', 'northwest', 'west', 'southwest', 'south', 'southeast'][Math.round(degrees / 45) % 8]
}
export interface RaceTrial { id: number; conditions: RaceConditions }
export function restoreRaceTrials(value: unknown): RaceTrial[] {
  if (!Array.isArray(value)) return []
  return value.filter((trial): trial is RaceTrial => {
    const c = trial?.conditions
    return Number.isSafeInteger(trial?.id) && trial.id > 0 && c && [25, 50, 100, 150].includes(c.radius) && [5, 10, 20, 40].includes(c.speed) && [0.25, 0.5, 0.75, 1, 1.5, 2].includes(c.laps) && ['clockwise', 'counterclockwise'].includes(c.direction)
  }).slice(0, 12)
}
