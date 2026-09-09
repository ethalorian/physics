'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { commandRequest, type CommandSession, type LiveCommandState } from '@/lib/classroom-command'
import { newerSession, watchPresentation } from '@/lib/presentation-realtime'

export function useCommandSession(id: string | null) {
  const [state, setState] = useState<LiveCommandState | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const version = useRef(0)
  const sessionId = useRef(id)
  sessionId.current = id
  useEffect(() => {
    setState(null); setError('')
    if (!id) return
    let active = true, reading = false, refreshAgain = false, connected = false, hasPoll = false
    let timeout: ReturnType<typeof setTimeout>
    const controller = new AbortController()
    const poll = async () => {
      clearTimeout(timeout)
      if (reading) { refreshAgain = true; return }
      reading = true
      const requestVersion = version.current
      try {
        const result = await commandRequest<LiveCommandState>(`/api/present/sessions/${id}`, { signal: controller.signal })
        if (active && requestVersion === version.current && !pending.current) {
          hasPoll = Boolean(result.session.poll_block_id)
          setState(old => newerSession(result.session, old?.session) ? result : old); setError('')
        }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Connection lost') }
      finally {
        reading = false
        if (active) { timeout = setTimeout(poll, refreshAgain ? 0 : connected && !hasPoll ? 5000 : 1500); refreshAgain = false }
      }
    }
    let readingCommand = false, commandAgain = false
    let commandTimer: ReturnType<typeof setTimeout>
    const refreshCommand = async () => {
      if (readingCommand) { commandAgain = true; return }
      readingCommand = true
      try {
        const data = await commandRequest<{ session: CommandSession }>(`/api/present/sessions/${id}?state_only=1`, { signal: controller.signal })
        if (active) {
          version.current++
          hasPoll = Boolean(data.session.poll_block_id)
          setState(old => old && newerSession(data.session, old.session) ? { ...old, session: data.session } : old)
          if (data.session.poll_block_id || data.session.status === 'ended') void poll()
        }
      } catch { /* periodic polling remains the recovery path */ }
      finally {
        if (active && commandAgain) { commandAgain = false; commandTimer = setTimeout(() => { readingCommand = false; void refreshCommand() }, 100) }
        else readingCommand = false
      }
    }
    const stop = watchPresentation(id, event => {
      if (event.type === 'session') void refreshCommand()
      else if (event.type === 'sync' || event.type === 'activity') void poll()
    }, ready => { const lost = connected && !ready; connected = ready; if (lost) void poll() })
    const wake = () => { if (document.visibilityState !== 'hidden') void poll() }
    window.addEventListener('online', wake); document.addEventListener('visibilitychange', wake)
    void poll()
    return () => { active = false; stop(); clearTimeout(timeout); clearTimeout(commandTimer); controller.abort(); window.removeEventListener('online', wake); document.removeEventListener('visibilitychange', wake) }
  }, [id])
  const patch = useCallback(async (body: Record<string, unknown>) => {
    if (!id || pending.current) return false
    pending.current = true; version.current++; setBusy(true); setError('')
    try {
      const data = await commandRequest<{ session: CommandSession }>(`/api/present/sessions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (sessionId.current === id) setState(old => old && newerSession(data.session, old.session) ? { ...old, session: data.session } : old)
      return true
    } catch (e) { if (sessionId.current === id) setError(e instanceof Error ? e.message : 'Control was not confirmed. Retry.'); return false }
    finally { pending.current = false; version.current++; setBusy(false) }
  }, [id])
  return { state, error, busy, patch }
}
