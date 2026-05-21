"use client"

import { useCallback, useEffect, useState } from 'react'

export interface StoredResponse {
  response: unknown
  created_at: string
}
export type BlockResponseMap = Record<string, StoredResponse>

/**
 * Loads a student's saved responses for a lesson's capture blocks, and provides
 * a `save` that optimistically updates and POSTs (append-only) to the API.
 */
export function useBlockResponses(lessonId: string) {
  const [responses, setResponses] = useState<BlockResponseMap>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    fetch(`/api/lessons/blocks?lesson_id=${lessonId}`)
      .then((r) => (r.ok ? r.json() : { responses: {} }))
      .then((d) => {
        if (!active) return
        setResponses(d.responses ?? {})
        setLoaded(true)
      })
      .catch(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [lessonId])

  const save = useCallback(
    async (blockId: string, blockType: string, response: unknown) => {
      setResponses((prev) => ({ ...prev, [blockId]: { response, created_at: new Date().toISOString() } }))
      try {
        await fetch('/api/lessons/blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson_id: lessonId, block_id: blockId, block_type: blockType, response }),
        })
      } catch {
        // optimistic; surface a retry later if needed
      }
    },
    [lessonId],
  )

  return { responses, save, loaded }
}
