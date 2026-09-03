'use client'

/**
 * Student side of the Present live layer — P-4 (follow mode) and P-5 (live polls).
 * Polls /api/present/live every 3 s while the lesson is open. Follow state is
 * local (a presence ping, never persisted progress). Blocks read the open poll
 * through usePresentLive() so a `question` answered during a poll is saved with
 * evidence_source 'live_poll' and respects lock / reveal.
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

export interface LiveSession {
  id: string; currentSlide: number; currentSection: number
  pollBlockId: string | null; pollLocked: boolean; pollRevealed: boolean
  blackout: boolean; timerEndsAt: string | null; updatedAt: string
}
interface Ctx {
  session: LiveSession | null
  follow: boolean
  setFollow: (on: boolean) => void
}
const PresentLiveContext = createContext<Ctx>({ session: null, follow: false, setFollow: () => {} })
export const usePresentLive = () => useContext(PresentLiveContext)

export function PresentLiveProvider({ lessonId, enabled, children }: { lessonId: string; enabled: boolean; children: ReactNode }) {
  const [session, setSession] = useState<LiveSession | null>(null)
  const [follow, setFollow] = useState(true)
  const seen = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    let active = true
    const poll = async () => {
      try {
        const r = await fetch(`/api/present/live?lesson_id=${lessonId}`, { cache: 'no-store' })
        if (!r.ok || !active) return
        const d = (await r.json()) as { session: LiveSession | null }
        if (!active) return
        // A new session re-arms follow so a student who broke away last class starts by following.
        if (d.session && d.session.id !== seen.current) { seen.current = d.session.id; setFollow(true) }
        setSession(d.session)
      } catch { /* offline tick — keep the last state */ }
    }
    poll()
    const id = window.setInterval(poll, 3000)
    return () => { active = false; window.clearInterval(id) }
  }, [lessonId, enabled])

  return <PresentLiveContext.Provider value={{ session, follow, setFollow }}>{children}</PresentLiveContext.Provider>
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
