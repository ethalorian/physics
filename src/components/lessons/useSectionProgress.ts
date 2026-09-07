"use client"

import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Per-section completion for the lesson reading screen.
 *
 * A section is "complete" when the student advances past it or taps its "Got it"
 * checkpoint. Completion is the source of truth for the rail's done-dots and the
 * segmented bar.
 *
 * Persistence is two-tier: localStorage gives an instant, offline-safe restore,
 * and `/api/lessons/sections` makes it follow the student across devices. On
 * load we union the local cache with the server record (so neither device loses
 * progress) and converge the server to that union; every mutation writes both.
 */
export function useSectionProgress(lessonId: string, sectionCount: number, enabled = true, anchors: string[] = [], revision = '') {
  const { data: session } = useSession()
  const studentId = session?.user?.id
  const storageKey = `lesson-sections:v3:${studentId}:${lessonId}:${revision}`
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const loadedRef = useRef(false)

  const valid = useCallback(
    (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0 && (sectionCount === 0 || (n as number) < sectionCount),
    [sectionCount],
  )

  const persistLocal = useCallback(
    (set: Set<number>) => {
      if (!enabled || !studentId) return
      try { localStorage.setItem(storageKey, JSON.stringify([...set])) } catch { /* private mode */ }
    },
    [storageKey, enabled, studentId],
  )

  const persistServer = useCallback(
    (set: Set<number>) => {
      if (!enabled || !studentId) return
      fetch('/api/lessons/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, completed: [...set], completed_anchors: [...set].map(i => anchors[i]).filter(Boolean), document_revision: revision }),
      }).catch(() => { /* optimistic; localStorage already holds it */ })
    },
    [lessonId, enabled, studentId, anchors, revision],
  )

  // Restore local immediately, then reconcile with the server (union, converge).
  useEffect(() => {
    if (!enabled || !studentId) { setCompleted(new Set()); return }
    loadedRef.current = false
    let local = new Set<number>()
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) local = new Set((JSON.parse(raw) as unknown[]).filter(valid) as number[])
    } catch { /* ignore */ }
    setCompleted(local)

    let active = true
    fetch(`/api/lessons/sections?lesson_id=${lessonId}`)
      .then((r) => (r.ok ? r.json() : { completed: [] }))
      .then((d: { completed?: unknown[]; completed_anchors?: string[]; document_revision?: string }) => {
        if (!active) return
        const server = new Set<number>(d.document_revision === revision ? (d.completed_anchors ?? []).map(a => anchors.indexOf(a)).filter(valid) : [])
        const union = new Set<number>([...local, ...server])
        setCompleted(union)
        persistLocal(union)
        // Converge the server only if the local cache held sections it lacked.
        if (union.size > server.size) persistServer(union)
        loadedRef.current = true
      })
      .catch(() => { loadedRef.current = true })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, sectionCount, enabled, studentId, storageKey, revision])

  const commit = useCallback(
    (next: Set<number>) => { persistLocal(next); persistServer(next) },
    [persistLocal, persistServer],
  )

  const markComplete = useCallback(
    (index: number) => {
      setCompleted((prev) => {
        if (prev.has(index)) return prev
        const next = new Set(prev)
        next.add(index)
        commit(next)
        return next
      })
    },
    [commit],
  )

  const toggleComplete = useCallback(
    (index: number) => {
      setCompleted((prev) => {
        const next = new Set(prev)
        if (next.has(index)) next.delete(index)
        else next.add(index)
        commit(next)
        return next
      })
    },
    [commit],
  )

  const isComplete = useCallback((index: number) => completed.has(index), [completed])

  return { completed, markComplete, toggleComplete, isComplete }
}
