"use client"

import { useCallback, useEffect, useState } from 'react'

// One shared class/section scope for the admin power-tools (Control Room,
// analytics, roster, pacing). The selected class persists in localStorage under
// a single key, so picking a class in one tool carries to the others — no
// context provider or new API needed. Components stay in sync within a tab via
// a custom event, and across tabs via the native `storage` event.

const KEY = 'admin:class-scope'
const EVT = 'admin:class-scope-change'

export interface ClassScope { id: string; label: string | null }

function read(): ClassScope | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<ClassScope> | null
    if (!v || typeof v.id !== 'string' || !v.id) return null
    return { id: v.id, label: typeof v.label === 'string' ? v.label : null }
  } catch {
    return null
  }
}

export function useClassScope(): {
  /** null until mounted (SSR-safe), then the stored class id or null = all classes */
  classId: string | null
  classLabel: string | null
  /** true once the stored value has been read on the client */
  ready: boolean
  /** pass null to clear back to "all classes" */
  setClassScope: (id: string | null, label?: string | null) => void
} {
  const [scope, setScope] = useState<ClassScope | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setScope(read())
    setReady(true)
    const sync = () => setScope(read())
    window.addEventListener('storage', sync)
    window.addEventListener(EVT, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(EVT, sync)
    }
  }, [])

  const setClassScope = useCallback((id: string | null, label?: string | null) => {
    try {
      if (id) window.localStorage.setItem(KEY, JSON.stringify({ id, label: label ?? null }))
      else window.localStorage.removeItem(KEY)
    } catch { /* storage unavailable — scope just won't persist */ }
    window.dispatchEvent(new Event(EVT))
  }, [])

  return { classId: scope?.id ?? null, classLabel: scope?.label ?? null, ready, setClassScope }
}
