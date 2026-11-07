'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReadingList } from '@/lib/textbook-assignments'
import type { QuizList } from '@/lib/quizzes/types'
import type { SyllabusCatalog } from '@/lib/reading-syllabus'
import { startBrowserPerformance } from '@/lib/browser-performance-client'
import { readingFetch } from './ReadingShared'

type DashboardSyllabus = SyllabusCatalog & { staff?: boolean }
export type ReadingDashboardSource = 'syllabus' | 'readings' | 'quizzes' | 'readingCounts'
const sourceMetrics = { syllabus: 'SYLLABUS_LOAD', readings: 'READINGS_LOAD', quizzes: 'QUIZ_COUNTS_LOAD', readingCounts: 'READING_COUNTS_LOAD' } as const
type ReadingCounts = { review_counts: Record<string, number> }

export function useReadingDashboardData(calendar: boolean, requestedCourseId?: string | null) {
  const courseId = calendar ? requestedCourseId ?? '' : ''
  const scope = calendar ? `calendar:${courseId}` : 'dashboard'
  const [loadedScope, setLoadedScope] = useState(scope)
  const [syllabus, setSyllabus] = useState<DashboardSyllabus | null>(null)
  const [readings, setReadings] = useState<ReadingList | null>(null)
  const [quizzes, setQuizzes] = useState<QuizList | null>(null)
  const [readingCounts, setReadingCounts] = useState<ReadingCounts | null>(null)
  const [errors, setErrors] = useState<Partial<Record<ReadingDashboardSource, string>>>({})
  const [loading, setLoading] = useState(true), [calendarLoading, setCalendarLoading] = useState(true)
  const [updated, setUpdated] = useState<Date | null>(null), [calendarUpdated, setCalendarUpdated] = useState<Date | null>(null)
  const [revision, setRevision] = useState(0)
  const firstRequest = useRef(true), measureCalendar = useRef(calendar)
  const previousScope = useRef(scope)
  const timing = useRef<{ reporter: ReturnType<typeof startBrowserPerformance>; started: number; ready: boolean } | null>(null)
  const refresh = useCallback(() => setRevision(value => value + 1), [])
  const onCalendarReady = useCallback(() => {
    const initial = timing.current
    if (!initial || initial.ready) return
    initial.ready = true
    initial.reporter?.record({ name: 'CALENDAR_READY_MS', value: performance.now() - initial.started })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const started = performance.now()
    const reporter = firstRequest.current && measureCalendar.current && process.env.NODE_ENV === 'production'
      ? startBrowserPerformance({ scope: 'loading', route: 'reading-calendar' }) : null
    firstRequest.current = false
    timing.current = { reporter, started, ready: false }
    if (previousScope.current !== scope) {
      setSyllabus(null); setReadings(null); setQuizzes(null); setReadingCounts(null)
      setErrors({}); setUpdated(null); setCalendarUpdated(null)
    }
    previousScope.current = scope
    setLoadedScope(scope)
    setLoading(true); setCalendarLoading(true)
    const fetchSource = async <T,>(source: ReadingDashboardSource, url: string, save: (data: T | null) => void) => {
      const sourceStarted = performance.now()
      let failed = false
      try {
        const data = await readingFetch<T>(url, { signal: controller.signal })
        if (!controller.signal.aborted) { save(data); setErrors(current => ({ ...current, [source]: undefined })) }
        return data
      } catch (error) {
        failed = true
        if (!controller.signal.aborted) { save(null); setErrors(current => ({ ...current, [source]: (error as Error).message })) }
        return null
      } finally {
        if (!controller.signal.aborted) {
          reporter?.record({ name: `${sourceMetrics[source]}_MS`, value: performance.now() - sourceStarted })
          reporter?.record({ name: `${sourceMetrics[source]}_ERROR`, value: failed ? 1 : 0 })
        }
      }
    }
    const query = calendar ? '?' + new URLSearchParams({ calendar: '1', ...(courseId ? { course_id: courseId } : {}) }) : ''
    const syllabusRequest = fetchSource<DashboardSyllabus>('syllabus', '/api/reading-syllabus' + query, setSyllabus)
    const readingsRequest = fetchSource<ReadingList>('readings', '/api/readings' + query, setReadings)
    const quizzesRequest = fetchSource<QuizList>('quizzes', '/api/quizzes', setQuizzes)
    const readingCountsRequest = calendar ? fetchSource<ReadingCounts>('readingCounts', '/api/readings/review-counts' + query, setReadingCounts) : Promise.resolve(null)
    // Neither reading nor quiz review counts are required to use the planner.
    void Promise.all([syllabusRequest, readingsRequest]).then(([catalog, assignments]) => {
      if (controller.signal.aborted) return
      setCalendarLoading(false); setCalendarUpdated(new Date())
      if (catalog && assignments && catalog.staff !== false && assignments.staff !== false) {
        reporter?.record({ name: 'CALENDAR_DATA_READY_MS', value: performance.now() - started })
      }
    })
    void Promise.all([syllabusRequest, readingsRequest, quizzesRequest, readingCountsRequest]).then(() => {
      if (!controller.signal.aborted) { setLoading(false); setUpdated(new Date()) }
    })
    return () => { controller.abort(); timing.current = null; reporter?.stop() }
  }, [revision, scope, calendar, courseId])

  useEffect(() => {
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [refresh])

  const calendarReadings = useMemo(() => calendar && readings ? { ...readings, review_counts: readingCounts?.review_counts ?? {} } : readings, [calendar, readings, readingCounts])
  // Effects run after render: hide the previous class immediately, then cancel
  // its requests. Late data/counts cannot become the new class's planner.
  const current = loadedScope === scope
  return { syllabus: current ? syllabus : null, readings: current ? calendarReadings : null, quizzes: current ? quizzes : null, errors: current ? errors : {}, loading: !current || loading, calendarLoading: !current || calendarLoading, updated: current ? updated : null, calendarUpdated: current ? calendarUpdated : null, refresh, onCalendarReady }
}
