"use client"

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { useSession } from 'next-auth/react'
import { LessonResponseStore } from '@/lib/lesson-response-store'

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

/** A store is scoped to one signed-in student and one lesson. */
export function useBlockResponses(lessonId: string, enabled = true) {
  const { data: session, status } = useSession()
  const studentId = status === 'authenticated' ? session?.user?.id : undefined
  const scope = enabled && studentId ? studentId + ':' + lessonId : null
  const current = useRef(scope)
  current.current = scope
  const store = useMemo(() => new LessonResponseStore(studentId ?? '', lessonId, () => scope !== null && current.current === scope), [studentId, lessonId, scope])
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  useEffect(() => {
    if (!scope) return
    store.activate()
    void store.load()
    const hide = () => { if (document.visibilityState === 'hidden') void store.flush() }
    const online = () => { if (store.getSnapshot().loaded) void store.flush(); else void store.load() }
    document.addEventListener('visibilitychange', hide)
    window.addEventListener('online', online)
    return () => {
      document.removeEventListener('visibilitychange', hide)
      window.removeEventListener('online', online)
      store.dispose()
    }
  }, [scope, store])
  return { ...snapshot, loadError: enabled && status === 'unauthenticated' ? 'Sign in to load your saved work.' : snapshot.loadError,
    save: store.save, draft: store.draft, retryLoad: store.load, studentId }
}
