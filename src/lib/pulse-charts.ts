import catalog from '@/data/pulse-catalog.json'

export const DEFAULT_PULSE_CHART = 'neon-current-arcade'
export const PULSE_CHARTS = catalog.songs.flatMap(song => catalog.levels.map(level => ({
  id: `${song.id}-${level.id}`,
  label: `${song.title} · ${level.name} · ${level.keys.length} keys`,
})))
export function pulseChart(value: unknown) {
  return PULSE_CHARTS.find(chart => chart.id === value)
}
