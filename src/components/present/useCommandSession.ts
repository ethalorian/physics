'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { commandRequest, type CommandSession, type LiveCommandState } from '@/lib/classroom-command'

export function useCommandSession(id: string | null) {
  const [state, setState] = useState<LiveCommandState | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const version = useRef(0)
  useEffect(() => {
    setState(null)
    setError('')
    if (!id) return
    let active = true
    let timeout: ReturnType<typeof setTimeout>
    const controller = new AbortController()
    const poll = async () => {
      const requestVersion = version.current
      try {
        const result = await commandRequest<LiveCommandState>(`/api/present/sessions/${id}`, { signal: controller.signal })
        if (active && requestVersion === version.current && !pending.current) { setState(result); setError('') }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Connection lost') }
      finally { if (active) timeout = setTimeout(poll, 1500) }
    }
    void poll()
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [id])
  const patch = useCallback(async (body: Record<string, unknown>) => {
    if (!id || pending.current) return false
    pending.current = true; version.current++; setBusy(true); setError('')
    try {
      const data = await commandRequest<{ session: CommandSession }>(`/api/present/sessions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setState(old => old ? { ...old, session: data.session } : null)
      return true
    } catch (e) { setError(e instanceof Error ? e.message : 'Control was not confirmed. Retry.'); return false }
    finally { pending.current = false; version.current++; setBusy(false) }
  }, [id])
  return { state, error, busy, patch }
}
