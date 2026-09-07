'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReleaseData, ReleaseWindow } from '@/lib/lesson-release'
export async function releaseRequest(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(20000),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data)
    throw new Error(
      data?.error ?? 'Could not save lesson access. Please retry.',
    )
  return data
}
export function useLessonRelease() {
  const [data, setData] = useState<ReleaseData | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const version = useRef(0)
  const [now, setNow] = useState(Date.now())
  const load = useCallback(async () => {
    const current = ++version.current
    try {
      const next = await releaseRequest('/api/lesson-access')
      if (
        !Array.isArray(next.classes) ||
        !Array.isArray(next.lessons) ||
        !next.windows
      )
        throw new Error('Could not load lesson access.')
      if (current === version.current) {
        setData(next)
        setError('')
      }
    } catch (e) {
      if (current === version.current)
        setError(
          e instanceof Error ? e.message : 'Could not load lesson access.',
        )
    }
  }, [])
  const invalidate = useCallback(() => {
    version.current++
  }, [])
  useEffect(() => {
    void load()
    const t = setInterval(() => setNow(Date.now()), 15000)
    return () => {
      invalidate()
      clearInterval(t)
    }
  }, [load, invalidate])
  const save = async (
    courseId: string,
    lessonId: string,
    win: ReleaseWindow,
  ) => {
    if (pending.current) return false
    pending.current = true
    setBusy(true)
    setError('')
    version.current++
    try {
      await releaseRequest(
        `/api/classes/${encodeURIComponent(courseId)}/windows`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson_id: lessonId, ...win }),
        },
      )
      setData((d) => {
        if (!d) return d
        const windows = { ...d.windows }
        if (!win.open_at && !win.close_at)
          delete windows[`${courseId}|${lessonId}`]
        else windows[`${courseId}|${lessonId}`] = win
        return { ...d, windows }
      })
      setNow(Date.now())
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save lesson access.')
      return false
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  return { data, error, setError, busy, now, load, save }
}
