'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLessonVideoXp } from '@/components/lessons/LessonVideoXpContext'
import type { VideoXpStatus } from '@/lib/lesson-video-xp'

export function useVideoWatchXp(blockId: string) {
  const context = useLessonVideoXp()
  const { data: session, status: authStatus } = useSession()
  const lessonId = context?.lessonId, userId = session?.user?.id
  const enabled = !!context?.enabled && authStatus === 'authenticated' && !!userId
  const readOnly = Boolean(session?.experience)
  const onXpTotal = context?.onXpTotal
  const [status, setStatus] = useState<VideoXpStatus | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const watchSession = useRef('')
  const earned = useRef(false)
  const busy = useRef(false)
  const ready = useRef(false)
  const scope = `${enabled}:${userId}:${lessonId}:${blockId}:${retry}`
  const current = useRef(scope)
  current.current = scope

  useEffect(() => {
    setStatus(null); setError(''); earned.current = false; busy.current = false; ready.current = false
    if (!enabled || !lessonId || !userId) return
    watchSession.current = crypto.randomUUID()
    const controller = new AbortController()
    const query = new URLSearchParams({ lesson_id: lessonId, block_id: blockId, expected_user_id: userId })
    fetch(`/api/lessons/video-progress?${query}`, { cache: 'no-store', signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('XP tracking is unavailable.'); return response.json() as Promise<VideoXpStatus> })
      .then(data => { if (current.current !== scope || controller.signal.aborted) return; earned.current = data.earned > 0; ready.current = true; setStatus(data); onXpTotal?.(data.lessonXp) })
      .catch(() => { if (!controller.signal.aborted && current.current === scope) setError('XP tracking is unavailable. Retry before watching for credit.') })
    return () => { controller.abort() }
  }, [enabled, lessonId, userId, blockId, scope, retry, onXpTotal])

  const report = useCallback(async (position: number, playing: boolean) => {
    if (readOnly || !enabled || !ready.current || !lessonId || !userId || !watchSession.current || earned.current || busy.current || !Number.isFinite(position)) return
    busy.current = true
    try {
      const response = await fetch('/api/lessons/video-progress', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, block_id: blockId, expected_user_id: userId, session_id: watchSession.current, position, playing }), keepalive: true })
      if (!response.ok) throw new Error('progress')
      const data: VideoXpStatus = await response.json()
      if (current.current !== scope) return
      earned.current = data.earned > 0; setStatus(data); setError(''); onXpTotal?.(data.lessonXp)
      if (data.xpAwarded > 0) window.dispatchEvent(new CustomEvent('xp-updated'))
    } catch { if (current.current === scope) setError('Watch progress could not save. Check your connection and retry.') }
    finally { if (current.current === scope) busy.current = false }
  }, [enabled, lessonId, userId, blockId, scope, onXpTotal, readOnly])

  return { enabled, assigned: !!context, preview: !!context && !context.enabled, status, error, report, retry: () => setRetry(value => value + 1) }
}
