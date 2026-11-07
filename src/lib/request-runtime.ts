import 'server-only'
import { AsyncLocalStorage } from 'node:async_hooks'

type Metric = { count: number; ms: number }
export type LookupName = 'roles' | 'memberships' | 'poll_sessions'
type LookupTransport = { count: number; headersMs: number; maxHeadersMs: number; slowCount: number; errors: number; upstreamCount: number; upstreamMs: number; maxUpstreamMs: number }
type RequestState = {
  memo: Map<string, Promise<unknown>>
  metrics: Map<string, Metric>
  lookups: Map<LookupName, LookupTransport>
  canMemoize: boolean
  finished: boolean
}
const requests = new AsyncLocalStorage<RequestState>()

/** Only explicitly selected reads are reused, and only during one GET/HEAD.
 * Writes and nested route invocations always get fresh reads. No user data is
 * retained between requests or reused by work scheduled after the response. */
export function requestRead<T>(key: string, read: () => Promise<T>): Promise<T> {
  const state = requests.getStore()
  if (!state?.canMemoize || state.finished) return read()
  const previous = state.memo.get(key)
  if (previous) return previous as Promise<T>
  const pending = Promise.resolve().then(read)
  state.memo.set(key, pending)
  void pending.catch(() => { if (state.memo.get(key) === pending) state.memo.delete(key) })
  return pending
}

export async function requestTiming<T>(name: string, operation: () => PromiseLike<T> | T): Promise<T> {
  const state = requests.getStore()
  if (!state || state.finished) return await operation()
  const start = performance.now()
  try { return await operation() }
  finally {
    if (!state.finished) {
      const metric = state.metrics.get(name) ?? { count: 0, ms: 0 }
      metric.count++
      metric.ms += performance.now() - start
      state.metrics.set(name, metric)
    }
  }
}

/** Counts completed database operations at instrumented read sites, including
 * pagination and response decoding. Parallel durations are additive, not wall time. */
export function observedDatabase<T>(operation: () => PromiseLike<T>): Promise<T> {
  return requestTiming('db_observed', operation)
}

/** Full query time includes body decoding; transport time below ends at headers. */
export function observedLookup<T>(name: LookupName, operation: () => PromiseLike<T>): Promise<T> {
  return observedDatabase(() => requestTiming(`db_${name}`, operation))
}

/** Only fixed categories and numeric measurements enter logs. Never record the
 * URL, filters, headers, response body, credentials or the caller's identity. */
export async function lookupTransport(name: LookupName, operation: () => Promise<Response>): Promise<Response> {
  const state = requests.getStore()
  if (!state || state.finished) return operation()
  const start = performance.now()
  let response: Response | undefined
  try { response = await operation(); return response }
  finally {
    if (!state.finished) {
      const elapsed = performance.now() - start
      const metric = state.lookups.get(name) ?? { count: 0, headersMs: 0, maxHeadersMs: 0, slowCount: 0, errors: 0, upstreamCount: 0, upstreamMs: 0, maxUpstreamMs: 0 }
      metric.count++; metric.headersMs += elapsed; metric.maxHeadersMs = Math.max(metric.maxHeadersMs, elapsed)
      if (elapsed >= 500) metric.slowCount++
      if (!response?.ok) metric.errors++
      const header = response?.headers.get('x-envoy-upstream-service-time')
      // This is upstream processing + its network hop, not pure SQL execution.
      if (header && /^\d+(?:\.\d+)?$/.test(header)) {
        const upstream = Number(header)
        if (Number.isFinite(upstream) && upstream <= 86_400_000) {
          metric.upstreamCount++; metric.upstreamMs += upstream; metric.maxUpstreamMs = Math.max(metric.maxUpstreamMs, upstream)
        }
      }
      state.lookups.set(name, metric)
    }
  }
}

// Explicit labels prevent query strings, student IDs or arbitrary URL segments
// from entering timing logs. Expand this list as more routes are investigated.
const timedRoutes = new Set(['/api/home', '/api/present/live', '/api/present/invitations', '/api/review-desk', '/api/assessment-results', '/api/student-progress', '/api/me/enrollment'])

export async function runApiRequest(request: Request, handler: () => Promise<Response>): Promise<Response> {
  const state: RequestState = { memo: new Map(), metrics: new Map(), lookups: new Map(), canMemoize: ['GET', 'HEAD'].includes(request.method), finished: false }
  return requests.run(state, async () => {
    const start = performance.now()
    let response: Response | undefined
    try { response = await handler(); return response }
    finally {
      state.finished = true
      state.memo.clear()
      const total = performance.now() - start
      const metrics = Object.fromEntries([...state.metrics].map(([name, metric]) => [name, { count: metric.count, ms: Math.round(metric.ms * 10) / 10 }]))
      const lookups = Object.fromEntries([...state.lookups].map(([name, metric]) => [name, Object.fromEntries(Object.entries(metric).map(([key, value]) => [key, Math.round(value * 10) / 10]))]))
      // Aggregate timings only; no source keys, work, identities or query text.
      if (response) try { response.headers.append('Server-Timing', [
        `total;dur=${total.toFixed(1)}`,
        ...[...state.metrics].map(([name, metric]) => `${name};dur=${metric.ms.toFixed(1)}`),
      ].join(', ')) } catch { /* Immutable response headers must not affect the API result. */ }
      const configured = Number(process.env.BACKEND_TIMING_SAMPLE_RATE ?? '0.01')
      const sampleRate = Number.isFinite(configured) ? Math.min(1, Math.max(0, configured)) : 0.01
      if (total >= 1000 || !response || response.status >= 500 || [...state.lookups.values()].some(m => m.slowCount || m.errors) || Math.random() < sampleRate) {
        const pathname = new URL(request.url).pathname
        console.info('[backend-timing]', JSON.stringify({ route: timedRoutes.has(pathname) ? pathname : '/api/other', method: request.method, status: response?.status ?? 500, totalMs: Math.round(total * 10) / 10, metrics, ...(state.lookups.size ? { lookups } : {}) }))
      }
    }
  })
}
