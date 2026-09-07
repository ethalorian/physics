export interface FlightState { x: number; y: number; vx: number; vy: number }

const G = 9.8

/** Exact motion over a constant linear-drag interval (k has units s⁻¹). */
export function advanceFlight(s: FlightState, dt: number, k: number): FlightState {
  if (k === 0) return {
    x: s.x + s.vx * dt, y: s.y + s.vy * dt - G * dt * dt / 2,
    vx: s.vx, vy: s.vy - G * dt,
  }
  const z = k * dt
  const q = -Math.expm1(-z) / k
  // Series avoids cancellation in the gravity displacement for tiny intervals.
  const gravityTime = Math.abs(z) < 1e-4
    ? dt * dt * (0.5 - z / 6 + z * z / 24 - z * z * z / 120)
    : (dt - q) / k
  return {
    x: s.x + s.vx * q, y: s.y + s.vy * q - G * gravityTime,
    vx: s.vx * Math.exp(-z), vy: s.vy * Math.exp(-z) - G * q,
  }
}

/** Stop precisely at ground contact and retain the velocity just before impact. */
export function stepFlight(s: FlightState, dt: number, k: number) {
  const next = advanceFlight(s, dt, k)
  if (next.y > 0) return { state: next, elapsed: dt, landed: false }
  let lo = 0, hi = dt
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2
    if (advanceFlight(s, mid, k).y > 0) lo = mid
    else hi = mid
  }
  const elapsed = (lo + hi) / 2
  return { state: { ...advanceFlight(s, elapsed, k), y: 0 }, elapsed, landed: true }
}
