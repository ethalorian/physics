'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { commandRequest } from '@/lib/classroom-command'
import type { TeachingStudent, ToolsState } from '@/lib/presentation-tools'

export function useTeachingTools(id: string | null, display = false) {
  const [state, setState] = useState<ToolsState | null>(null)
  const [readError, setReadError] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const version = useRef(0)
  useEffect(() => {
    setState(null)
    if (!id) return
    let active = true
    let timer: ReturnType<typeof setTimeout>
    const controller = new AbortController()
    const poll = async () => {
      const v = version.current
      try {
        const data = await commandRequest<ToolsState>(`/api/present/sessions/${id}/tools${display ? '?display=1' : ''}`, { signal: controller.signal })
        if (active && !pending.current && v === version.current) { setState(data); setReadError('') }
      } catch(e) { if (active) setReadError(e instanceof Error ? e.message : 'Could not load teaching tools') }
      finally { if (active) timer = setTimeout(poll, 2500) }
    }
    void poll()
    return () => { active = false; controller.abort(); clearTimeout(timer) }
  }, [id, display])
  const action = useCallback(async (body: Record<string, unknown>) => {
    if (!id || pending.current) return null
    pending.current = true; version.current++; setBusy(true); setError('')
    try {
      const result = await commandRequest<{ state: ToolsState; selected?: TeachingStudent }>(`/api/present/sessions/${id}/tools`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setState(result.state)
      return result
    } catch(e) { setError(e instanceof Error ? e.message : 'Action not confirmed. Retry.'); return null }
    finally { pending.current = false; version.current++; setBusy(false) }
  }, [id])
  return { state, error: error || readError, busy, action }
}
