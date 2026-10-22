/** Fictional, planar constant-velocity model. Coordinates are in million km. */
export interface AsteroidControls { speed: number; angle: number; days: number; uncertainty: number }
export const ASTEROID_DEFAULTS: AsteroidControls = { speed: 8.5, angle: 15, days: 160, uncertainty: .2 }
export const STORY_EPISODES = [
  { slug: 'day-1-the-briefing', part: 1, index: 0 },
  { slug: 'day-3-velocity', part: 2, index: 1 },
  { slug: 'day-4-velocity-time-vectors', part: 3, index: 2 },
  { slug: 'day-5-predicting-position', part: 3, index: 3 },
] as const
export function storyEpisode(slug: string) { return STORY_EPISODES.find(episode => episode.slug === slug) }
const bounded = (value: number, low: number, high: number, fallback: number) => Number.isFinite(value) ? Math.max(low, Math.min(high, value)) : fallback
export function asteroidModel(controls: AsteroidControls) {
  const speed = bounded(controls.speed, 2, 12, 8.5)
  const angle = bounded(controls.angle, 0, 45, 15)
  const days = bounded(controls.days, 0, 200, 160)
  const uncertainty = bounded(controls.uncertainty, 0, .5, .2)
  const vx = -speed * Math.cos(angle * Math.PI / 180), vy = speed * Math.sin(angle * Math.PI / 180)
  const position = (day: number) => ({x: 120 + vx * day * 86400 / 1e6, y: vy * day * 86400 / 1e6})
  const point = position(days)
  const bound = .05 + uncertainty * days * 86400 / 1e6
  const distance = Math.hypot(point.x, point.y)
  const closing = distance > 1e-10 ? -(point.x * vx + point.y * vy) / distance : null
  return {speed,angle,days,uncertainty,vx,vy,point,bound,distance,closing,start:position(0),observation:position(1),end:position(200)}
}
