import { browserMetricScope, metricValue, type BrowserMetric, type BrowserPerformanceBatch } from './browser-performance'
import { EXPERIENCE_MARKER } from './experience'

type Options = Pick<BrowserPerformanceBatch, 'route' | 'scope'>

export function startBrowserPerformance({ route, scope }: Options) {
  const blocked = () => document.cookie.split('; ').some(cookie => cookie.startsWith(EXPERIENCE_MARKER + '=')) || navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
  if (blocked()) return null
  const viewport: BrowserPerformanceBatch['viewport'] = innerWidth < 768 ? 'small' : innerWidth < 1200 ? 'medium' : 'large'
  const pending = new Map<BrowserMetric, number>(), sent = new Set<BrowserMetric>()
  const maxRequests = scope === 'loading' ? 6 : scope === 'document' ? 6 : 12
  let stopped = false, requests = 0, started = performance.now(), longTasks = 0, total = 0, maximum = 0, interactionMax = 0
  let ended: number | null = document.visibilityState === 'hidden' ? started : null
  const interactions = new Set<number>(), observers: PerformanceObserver[] = []
  let longTaskSupport = false, eventSupport = false
  const record = (metric: { name: string; value: number }) => {
    if (stopped || scope === 'view' || sent.has(metric.name as BrowserMetric)) return
    const safe = metricValue(metric.name, metric.value)
    if (safe && browserMetricScope(safe.name) === scope) pending.set(safe.name, safe.value)
  }
  const collect = (entries: PerformanceEntry[]) => {
    for (const entry of entries) {
      if (entry.startTime < started || ended !== null && entry.startTime >= ended || !Number.isFinite(entry.duration) || entry.duration < 0) continue
      if (entry.entryType === 'longtask') { longTasks++; total += entry.duration; maximum = Math.max(maximum, entry.duration) }
      if (entry.entryType === 'event') {
        const id = (entry as PerformanceEntry & { interactionId?: number }).interactionId
        if (id && interactions.size < 1000) { interactions.add(id); interactionMax = Math.max(interactionMax, entry.duration) }
      }
    }
  }
  if (scope === 'view' && typeof PerformanceObserver !== 'undefined') {
    for (const type of ['longtask', 'event']) {
      if (!PerformanceObserver.supportedEntryTypes?.includes(type)) continue
      let observer: PerformanceObserver | null = null
      try {
        observer = new PerformanceObserver(list => { if (document.visibilityState === 'visible') collect(list.getEntries()) })
        observer.observe(type === 'event' ? { type, durationThreshold: 16 } as PerformanceObserverInit : { type })
        observers.push(observer)
        if (type === 'longtask') longTaskSupport = true
        else eventSupport = true
      } catch { observer?.disconnect() }
    }
  }
  const flush = () => {
    if (stopped || requests >= maxRequests || blocked()) return
    for (const observer of observers) collect(observer.takeRecords())
    if (scope === 'view') {
      const end = ended ?? performance.now(), observed = end - started
      if (observed < 1) return
      const values = { OBSERVED_MS: observed, ...(longTaskSupport ? { LONG_TASK_COUNT: longTasks, LONG_TASK_TOTAL: total, LONG_TASK_MAX: maximum } : {}), ...(eventSupport ? { INTERACTION_COUNT: interactions.size, INTERACTION_MAX: interactionMax } : {}) }
      if (!longTaskSupport && !eventSupport) return
      for (const [name, value] of Object.entries(values)) { const safe = metricValue(name, value); if (safe) pending.set(safe.name, safe.value) }
      longTasks = 0; total = 0; maximum = 0; interactionMax = 0; interactions.clear(); started = end
    }
    if (!pending.size) return
    const metrics = Array.from(pending, ([name, value]) => ({ name, value }))
    pending.clear(); metrics.forEach(metric => sent.add(metric.name)); requests++
    const body: BrowserPerformanceBatch = { version: 1, scope, route, viewport, metrics }
    // No credentials, referrer, query strings, entries or DOM attribution.
    // Best effort only: no blocking work, retries, cookies or local storage.
    try {
      void fetch('/api/browser-performance', { method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {})
    } catch { /* Measurement failures must never affect the application. */ }
    if (requests >= maxRequests) { observers.forEach(observer => observer.disconnect()); clearInterval(timer) }
  }
  const visibility = () => {
    if (document.visibilityState === 'hidden') { ended = performance.now(); queueMicrotask(flush) }
    else { flush(); started = performance.now(); ended = null }
  }
  const pagehide = () => { ended ??= performance.now(); queueMicrotask(flush) }
  document.addEventListener('visibilitychange', visibility)
  window.addEventListener('pagehide', pagehide)
  const timer = setInterval(() => { if (document.visibilityState === 'visible') flush() }, 30000)
  return {
    record,
    stop() {
      flush(); stopped = true; pending.clear(); observers.forEach(observer => observer.disconnect()); clearInterval(timer)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('pagehide', pagehide)
    },
  }
}
