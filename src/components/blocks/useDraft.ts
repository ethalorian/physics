"use client"

import { useEffect, useRef } from 'react'

/**
 * Report a capture component's in-progress value as a draft whenever it changes.
 * Pass `undefined` while there is nothing worth keeping (untouched, empty). The
 * first render never reports (hydration is not a change); equal values (by JSON)
 * are skipped so re-renders cost nothing. Debouncing and batching live in
 * useBlockResponses.draft — this hook only says "it changed".
 */
export function useDraft<T>(onDraft: (v: T) => void, value: T | undefined) {
  const last = useRef<string | null>(null)
  const first = useRef(true)
  const json = value === undefined ? null : JSON.stringify(value)
  useEffect(() => {
    if (first.current) { first.current = false; last.current = json; return }
    if (json === null || json === last.current) return
    last.current = json
    onDraft(value as T)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json])
}
