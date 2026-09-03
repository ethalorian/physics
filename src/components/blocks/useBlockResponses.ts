"use client"

import { useCallback, useEffect, useState } from 'react'

export interface StoredResponse {
  response: unknown
  created_at: string
}
/** SEI context logged with a save (never a score): how they answered and which
 *  scaffolds were on. See src/lib/sei.ts. */
export interface SaveMeta { response_mode?: string; scaffolds_used?: string[]; /** E-1: learning target slug or id */ target_id?: string; /** E-2 */ evidence_source?: string; /** MC-5 */ confidence?: 'sure' | 'unsure'; role?: string }
export type BlockResponseMap = Record<string, StoredResponse>

/**
 * Loads a student's saved responses for a lesson's capture blocks, and provides
 * a `save` that optimistically updates and POSTs (append-only) to the API.
 */
export function useBlockResponses(lessonId: string) {
  const [responses, setResponses] = useState<BlockResponseMap>({})
  const [loaded, setLoaded] = useState(false)
  /** XP awarded during this session (B-4). */
  const [xpEarned, setXpEarned] = useState(0)

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
    async (blockId: string, blockType: string, response: unknown, meta?: SaveMeta) => {
      setResponses((prev) => ({ ...prev, [blockId]: { response, created_at: new Date().toISOString() } }))
      try {
        const r = await fetch('/api/lessons/blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson_id: lessonId, block_id: blockId, block_type: blockType, response, ...(meta ?? {}) }),
        })
        // The server may augment the response (E-3 autoCheck) and award XP (B-4);
        // reflect both so gates and the Done screen read the same truth.
        if (r.ok) {
          const d = (await r.json().catch(() => null)) as { response?: unknown; xp_awarded?: number } | null
          if (d && d.response !== undefined) setResponses((prev) => ({ ...prev, [blockId]: { response: d.response, created_at: new Date().toISOString() } }))
          if (d && typeof d.xp_awarded === 'number' && d.xp_awarded > 0) setXpEarned((x) => x + d.xp_awarded!)
        }
      } catch {
        // optimistic; surface a retry later if needed
      }
    },
    [lessonId],
  )

  return { responses, save, loaded, xpEarned }
}
