/** SI-unit models shared by the diagrams and scientific regression checks. */
export const GRAVITY = 9.8
export function motionAt(v0: number, acceleration: number, time: number) {
  return { position: v0 * time + .5 * acceleration * time * time, velocity: v0 + acceleration * time }
}
export function projectileFlight(speed: number, angleDegrees: number, height: number) {
  const angle = angleDegrees * Math.PI / 180, vx = speed * Math.cos(angle), vy = speed * Math.sin(angle)
  const duration = (vy + Math.sqrt(vy * vy + 2 * GRAVITY * height)) / GRAVITY
  return { vx, vy, duration, range: vx * duration, peak: height + Math.max(0, vy) ** 2 / (2 * GRAVITY), at: (t: number) => ({ x: vx * t, y: height + vy * t - .5 * GRAVITY * t * t, vy: vy - GRAVITY * t }) }
}
export function linearDrag(time: number, terminal: number) {
  const tau = terminal / GRAVITY
  return { speed: terminal * (1 - Math.exp(-time / tau)), distance: terminal * (time - tau * (1 - Math.exp(-time / tau))), acceleration: GRAVITY * Math.exp(-time / tau) }
}
export function cableTension(weight: number, angleDegrees: number) { return weight / (2 * Math.sin(angleDegrees * Math.PI / 180)) }
