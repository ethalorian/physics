import { NextRequest, NextResponse } from 'next/server'
import { parseBrowserPerformance } from '@/lib/browser-performance'

// A small best-effort per-instance ceiling; no IPs, cookies or user identifiers
// are retained for rate limiting. These observations are not an audit ledger.
let windowStarted = 0, accepted = 0
const empty = (status = 204) => new NextResponse(null, { status, headers: { 'Cache-Control': 'no-store' } })

// eslint-disable-next-line no-restricted-syntax -- Intentionally public, bounded numeric telemetry; no authentication, database reads or writes.
export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return empty(403)
  if (!request.headers.get('content-type')?.startsWith('application/json')) return empty(415)
  const now = Date.now()
  if (now - windowStarted >= 60000) { windowStarted = now; accepted = 0 }
  if (accepted >= 120) return empty()
  const reader = request.body?.getReader()
  if (!reader) return empty(400)
  let bytes = 0, body = ''
  const decoder = new TextDecoder()
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      bytes += chunk.value.byteLength
      if (bytes > 2048) { await reader.cancel(); return empty(413) }
      body += decoder.decode(chunk.value, { stream: true })
    }
    body += decoder.decode()
    const batch = parseBrowserPerformance(JSON.parse(body))
    if (!batch) return empty(400)
    // Check again after reading, since concurrent bodies may finish together.
    if (accepted >= 120) return empty()
    accepted++
    console.info('[browser-performance]', JSON.stringify({ ...batch, sampleRate: 1 }))
    return empty()
  } catch { return empty(400) }
}
