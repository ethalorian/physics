"use client"

import { useCallback, useEffect, useRef, useState } from 'react'

export interface StoredResponse {
  response: unknown
  created_at: string
  /** true when this value is an autosaved draft, not an explicit save (never satisfies a gate) */
  draft?: boolean
}
/** SEI context logged with a save (never a score): how they answered and which
 *  scaffolds were on. See src/lib/sei.ts. */
export interface SaveMeta { response_mode?: string; scaffolds_used?: string[]; /** E-1: learning target slug or id */ target_id?: string; /** E-2 */ evidence_source?: string; /** MC-5 */ confidence?: 'sure' | 'unsure'; role?: string }
export type BlockResponseMap = Record<string, StoredResponse>
export type DraftFn = (blockId: string, blockType: string, response: unknown) => void

// Autosave cadence (decision 2026-09-04, "save as you type, sustainably"):
// a block's draft is sent DEBOUNCE ms after the last keystroke, and never later
// than MAX_WAIT ms after the first unsent change; all dirty blocks ride in one
// POST. Every change also lands in localStorage instantly, so a tab that dies
// before the flush still restores on the next open.
const DEBOUNCE_MS = 1500
const MAX_WAIT_MS = 6000
const lsKey = (lessonId: string) => `lesson-drafts:${lessonId}`

type LocalDrafts = Record<string, { response: unknown; block_type: string; updated_at: string }>
function readLocal(lessonId: string): LocalDrafts {
  try { return JSON.parse(localStorage.getItem(lsKey(lessonId)) ?? '{}') as LocalDrafts } catch { return {} }
}
function writeLocal(lessonId: string, d: LocalDrafts) {
  try { if (Object.keys(d).length === 0) localStorage.removeItem(lsKey(lessonId)); else localStorage.setItem(lsKey(lessonId), JSON.stringify(d)) } catch { /* quota / private mode */ }
}

/**
 * Loads a student's saved responses (and autosave drafts) for a lesson's capture
 * blocks. `save` is the explicit, append-only record; `draft` is the as-you-type
 * safety net (one upsert row per block, batched). `responses[id].draft === true`
 * marks a value that has not been explicitly saved — display it, never gate on it.
 */
export function useBlockResponses(lessonId: string) {
  const [responses, setResponses] = useState<BlockResponseMap>({})
  const [loaded, setLoaded] = useState(false)
  /** XP awarded during this session (B-4). */
  const [xpEarned, setXpEarned] = useState(0)
  /** 'idle' | 'dirty' | 'saving' | 'saved' | 'offline' — for a quiet status chip */
  const [draftState, setDraftState] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'offline'>('idle')

  // pending drafts not yet on the server, keyed by block id
  const pending = useRef<Record<string, { block_type: string; response: unknown }>>({})
  const lastSent = useRef<Record<string, string>>({}) // block id → JSON last sent (skip no-op sends)
  const debounceT = useRef<number | null>(null)
  const maxWaitT = useRef<number | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      fetch(`/api/lessons/blocks?lesson_id=${lessonId}`).then((r) => (r.ok ? r.json() : { responses: {} })).catch(() => ({ responses: {} })),
      fetch(`/api/lessons/drafts?lesson_id=${lessonId}`).then((r) => (r.ok ? r.json() : { drafts: {} })).catch(() => ({ drafts: {} })),
    ]).then(([a, b]) => {
      if (!active) return
      const saved = (a.responses ?? {}) as BlockResponseMap
      const drafts = (b.drafts ?? {}) as Record<string, { response: unknown; updated_at: string }>
      const local = readLocal(lessonId)
      const merged: BlockResponseMap = { ...saved }
      // newest wins: explicit save < server draft < local draft (local is what the
      // student last typed on THIS device; it may never have reached the server)
      const at = (s?: string) => (s ? new Date(s).getTime() : 0)
      for (const [id, d] of Object.entries(drafts)) {
        if (at(d.updated_at) > at(saved[id]?.created_at)) merged[id] = { response: d.response, created_at: d.updated_at, draft: true }
      }
      for (const [id, d] of Object.entries(local)) {
        if (at(d.updated_at) > at(merged[id]?.created_at)) {
          merged[id] = { response: d.response, created_at: d.updated_at, draft: true }
          pending.current[id] = { block_type: d.block_type, response: d.response } // push what the server missed
        }
      }
      setResponses(merged)
      setLoaded(true)
      if (Object.keys(pending.current).length > 0) schedule()
    })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  const flush = useCallback((beacon = false) => {
    if (debounceT.current) { window.clearTimeout(debounceT.current); debounceT.current = null }
    if (maxWaitT.current) { window.clearTimeout(maxWaitT.current); maxWaitT.current = null }
    const entries = Object.entries(pending.current).filter(([id, d]) => JSON.stringify(d.response) !== lastSent.current[id])
    pending.current = {}
    if (entries.length === 0) return
    const drafts = entries.map(([block_id, d]) => ({ block_id, block_type: d.block_type, response: d.response }))
    const body = JSON.stringify({ lesson_id: lessonId, drafts })
    for (const [id, d] of entries) lastSent.current[id] = JSON.stringify(d.response)
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon('/api/lessons/drafts', new Blob([body], { type: 'application/json' }))
      return
    }
    setDraftState('saving')
    fetch('/api/lessons/drafts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
      .then((r) => {
        if (!r.ok) throw new Error('draft')
        // the server has it — the local mirror for these blocks can go
        const local = readLocal(lessonId)
        for (const [id] of entries) delete local[id]
        writeLocal(lessonId, local)
        setDraftState('saved')
      })
      .catch(() => {
        // keep the local copy; retry on the next change or page hide
        for (const [id, d] of entries) { pending.current[id] = d; delete lastSent.current[id] }
        setDraftState('offline')
      })
  }, [lessonId])

  const schedule = useCallback(() => {
    if (debounceT.current) window.clearTimeout(debounceT.current)
    debounceT.current = window.setTimeout(() => flush(), DEBOUNCE_MS)
    if (!maxWaitT.current) maxWaitT.current = window.setTimeout(() => flush(), MAX_WAIT_MS)
  }, [flush])

  /** As-you-type: remember locally now, send to the server soon (batched). */
  const draft = useCallback<DraftFn>((blockId, blockType, response) => {
    if (response === undefined || response === null) return
    const now = new Date().toISOString()
    setResponses((prev) => ({ ...prev, [blockId]: { response, created_at: now, draft: true } }))
    pending.current[blockId] = { block_type: blockType, response }
    const local = readLocal(lessonId)
    local[blockId] = { response, block_type: blockType, updated_at: now }
    writeLocal(lessonId, local)
    setDraftState('dirty')
    schedule()
  }, [lessonId, schedule])

  // Leaving the page (tab switch, navigation, close): push whatever is pending.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flush(true) }
    const onPageHide = () => flush(true)
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onPageHide)
      flush(true)
    }
  }, [flush])

  const save = useCallback(
    async (blockId: string, blockType: string, response: unknown, meta?: SaveMeta) => {
      setResponses((prev) => ({ ...prev, [blockId]: { response, created_at: new Date().toISOString() } }))
      // The explicit save supersedes the draft everywhere.
      delete pending.current[blockId]
      lastSent.current[blockId] = JSON.stringify(response)
      const local = readLocal(lessonId); delete local[blockId]; writeLocal(lessonId, local)
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

  return { responses, save, draft, draftState, loaded, xpEarned }
}
