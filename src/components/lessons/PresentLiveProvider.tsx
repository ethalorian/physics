'use client'

/**
 * Student side of the Present live layer — P-4 (follow mode) and P-5 (live polls).
 * Polls /api/present/live every 3 s while the lesson is open. Follow state is
 * local (a presence ping, never persisted progress). Blocks read the open poll
 * through usePresentLive() so a `question` answered during a poll is saved with
 * evidence_source 'live_poll' and respects lock / reveal.
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

import StudentLiveTools from './StudentLiveTools'
import type { Pulse } from '@/lib/presentation-tools'
import { acceptsLiveState } from '@/lib/student-live-state'

export interface LiveSession {
  commandRevision?: number
  teachingTools?: import('@/lib/teaching-tool-spec').TeachingToolStates;
  pulse?: Pulse | null; pulseChoice?: number | null; helpRequested?: boolean
  currentAnchor: string | null; pollRunId: string | null; reveal: { correctOptionId?: string; feedback?: Record<string, string> } | null
  id: string; currentSlide: number; currentSection: number
  pollBlockId: string | null; pollLocked: boolean; pollRevealed: boolean
  blackout: boolean; timerEndsAt: string | null; updatedAt: string
}
interface Ctx {
  session: LiveSession | null
  follow: boolean
  setFollow: (on: boolean) => void
  stale: boolean
}
const PresentLiveContext = createContext<Ctx>({ session: null, follow: false, stale: false, setFollow: () => {} })
export const usePresentLive = () => useContext(PresentLiveContext)

export function PresentLiveProvider({ lessonId, enabled, children, simulation }: { lessonId: string; enabled: boolean; children: ReactNode; simulation?: LiveSession }) {
  const [session, setSession] = useState<LiveSession | null>(null)
  const [follow, setFollow] = useState(true)
  const [stale, setStale] = useState(false)
  const seen = useRef<string | null>(null)

  useEffect(() => {
    setSession(null); setStale(false); seen.current = null
    if (!enabled) return
    let active = true, reading = false, refreshAgain = false
    let latest: LiveSession | null = null
    let timer: ReturnType<typeof setTimeout>
    let controller: AbortController | null = null
    const poll = async () => {
      clearTimeout(timer)
      if (reading) { refreshAgain = true; return }
      reading = true
      controller = new AbortController()
      const deadline = setTimeout(() => controller?.abort(), 12000)
      try {
        const r = await fetch(`/api/present/live?lesson_id=${encodeURIComponent(lessonId)}`, { cache: 'no-store', signal: controller.signal })
        if (!r.ok) throw new Error('Live class unavailable')
        const d = (await r.json()) as { session: LiveSession | null }
        if (!active) return
        if (d.session && !acceptsLiveState(d.session, latest)) return
        // A new session re-arms follow so a student who broke away last class starts by following.
        if (d.session && d.session.id !== seen.current) { seen.current = d.session.id; setFollow(true) }
        latest = d.session; setSession(d.session); setStale(false)
      } catch { if (active) setStale(true) }
      finally {
        clearTimeout(deadline); reading = false
        if (active) { timer = setTimeout(poll, refreshAgain ? 0 : 3000); refreshAgain = false }
      }
    }
    const wake = () => { if (document.visibilityState !== 'hidden') void poll() }
    const offline = () => setStale(true)
    window.addEventListener('online', wake); window.addEventListener('offline', offline); window.addEventListener('pageshow', wake); document.addEventListener('visibilitychange', wake)
    void poll()
    return () => { active = false; clearTimeout(timer); controller?.abort(); window.removeEventListener('online', wake); window.removeEventListener('offline', offline); window.removeEventListener('pageshow', wake); document.removeEventListener('visibilitychange', wake) }
  }, [lessonId, enabled])

  return <PresentLiveContext.Provider value={{ session:simulation??session, follow, setFollow, stale }}>{enabled && stale && <p role="status" className="border-b bg-muted px-4 py-2 text-sm">Live class connection interrupted. Showing the last confirmed update; reconnecting… You can keep working.</p>}{enabled && <StudentLiveTools session={session} />}{children}</PresentLiveContext.Provider>
}

/** Seconds left on the class timer, or null. */
export function useTimerLeft(endsAt: string | null | undefined): number | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!endsAt) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [endsAt])
  if (!endsAt) return null
  return Math.max(0, Math.round((new Date(endsAt).getTime() - now) / 1000))
}

export function fmtTimer(s: number): string {
  const m = Math.floor(s / 60), r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}
