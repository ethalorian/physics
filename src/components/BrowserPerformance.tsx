'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useReportWebVitals } from 'next/web-vitals'
import { usePathname, useSearchParams } from 'next/navigation'
import { startBrowserPerformance } from '@/lib/browser-performance-client'
import { browserPerformanceRoute } from '@/lib/browser-performance'

export default function BrowserPerformance() {
  const reporter = useRef<ReturnType<typeof startBrowserPerformance>>(null)
  const report = useCallback((metric: { name: string; value: number }) => reporter.current?.record(metric), [])
  useReportWebVitals(report)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    reporter.current = startBrowserPerformance({ scope: 'document', route: browserPerformanceRoute(location.pathname, location.search) ?? 'other' })
    return () => { reporter.current?.stop(); reporter.current = null }
  }, [])
  return null
}

// Separate view observations follow SPA navigation. Native Web Vitals above
// remain document-scoped so an initial paint is never attributed to a later tab.
export function ViewPerformance() {
  const pathname = usePathname(), params = useSearchParams()
  const route = browserPerformanceRoute(pathname, params.toString())
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !route) return
    const reporter = startBrowserPerformance({ scope: 'view', route })
    return () => reporter?.stop()
  }, [route])
  return null
}
