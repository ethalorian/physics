// This is deliberately a closed schema. Never send URLs, metric entries,
// element selectors, identifiers, user-agent strings, work or grade data.
export const BROWSER_ROUTES = ['home', 'student-gradebook', 'results', 'teaching-calendar', 'reading-calendar', 'assignment-calendar', 'other'] as const
export const READING_LOADING_METRICS = ['SYLLABUS_LOAD_MS', 'READINGS_LOAD_MS', 'QUIZ_COUNTS_LOAD_MS', 'READING_COUNTS_LOAD_MS', 'CALENDAR_DATA_READY_MS', 'CALENDAR_READY_MS', 'SYLLABUS_LOAD_ERROR', 'READINGS_LOAD_ERROR', 'QUIZ_COUNTS_LOAD_ERROR', 'READING_COUNTS_LOAD_ERROR'] as const
export const BROWSER_METRICS = ['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB', 'LONG_TASK_COUNT', 'LONG_TASK_TOTAL', 'LONG_TASK_MAX', 'OBSERVED_MS', 'INTERACTION_COUNT', 'INTERACTION_MAX', ...READING_LOADING_METRICS] as const
export type BrowserRoute = typeof BROWSER_ROUTES[number]
export type BrowserMetric = typeof BROWSER_METRICS[number]
export type BrowserPerformanceBatch = {
  version: 1
  scope: 'document' | 'view' | 'loading'
  route: BrowserRoute
  viewport: 'small' | 'medium' | 'large'
  metrics: { name: BrowserMetric; value: number }[]
}

export function browserMetricScope(name: BrowserMetric): BrowserPerformanceBatch['scope'] {
  if (READING_LOADING_METRICS.includes(name as typeof READING_LOADING_METRICS[number])) return 'loading'
  return ['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB'].includes(name) ? 'document' : 'view'
}

export function browserPerformanceRoute(pathname: string, search: string): BrowserRoute | null {
  if (pathname === '/home') return 'home'
  if (pathname === '/home/gradebook') return 'student-gradebook'
  const params = new URLSearchParams(search), view = params.get('view')
  if ((pathname === '/admin/readings/syllabus' && (!view || view === 'syllabus') || pathname === '/admin/readings' && view === 'syllabus') && !params.has('id') && !params.has('step_id') && params.get('details') !== '1') return 'reading-calendar'
  if (pathname === '/admin/interactive-assignments' || pathname === '/admin/interactive-assignments/calendar') return 'assignment-calendar'
  if (pathname === '/admin/control-room') {
    if (view === 'results') return 'results'
    if (view === 'calendar') return 'teaching-calendar'
  }
  return null
}

export function metricValue(name: unknown, value: unknown): { name: BrowserMetric; value: number } | null {
  if (!BROWSER_METRICS.includes(name as BrowserMetric) || typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
  const error = typeof name === 'string' && name.endsWith('_LOAD_ERROR')
  const count = error || name === 'LONG_TASK_COUNT' || name === 'INTERACTION_COUNT'
  const maximum = error ? 1 : name === 'CLS' ? 100 : count ? 100000 : 3600000
  if (value > maximum || count && !Number.isInteger(value)) return null
  return { name: name as BrowserMetric, value: Math.round(value * (name === 'CLS' ? 10000 : 10)) / (name === 'CLS' ? 10000 : 10) }
}

export function parseBrowserPerformance(value: unknown): BrowserPerformanceBatch | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const body = value as Record<string, unknown>
  if (Object.keys(body).some(key => !['version', 'scope', 'route', 'viewport', 'metrics'].includes(key)) || body.version !== 1 || !['document', 'view', 'loading'].includes(body.scope as string) || !BROWSER_ROUTES.includes(body.route as BrowserRoute) || !['small', 'medium', 'large'].includes(body.viewport as string) || !Array.isArray(body.metrics) || !body.metrics.length || body.metrics.length > BROWSER_METRICS.length) return null
  if (body.scope === 'loading' && body.route !== 'reading-calendar') return null
  const metrics: BrowserPerformanceBatch['metrics'] = []
  for (const item of body.metrics) {
    if (!item || typeof item !== 'object' || Object.keys(item).some(key => !['name', 'value'].includes(key))) return null
    const metric = metricValue(item.name, item.value)
    if (!metric || metrics.some(previous => previous.name === metric.name)) return null
    if (body.scope !== browserMetricScope(metric.name)) return null
    metrics.push(metric)
  }
  return { version: 1, scope: body.scope as BrowserPerformanceBatch['scope'], route: body.route as BrowserRoute, viewport: body.viewport as BrowserPerformanceBatch['viewport'], metrics }
}
