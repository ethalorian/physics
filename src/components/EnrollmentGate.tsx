"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import EnrollmentGateScreen from '@/components/EnrollmentGateScreen'

interface Status { enrolled: boolean; isStudent: boolean }

// Module-level cache so navigating between gated pages doesn't refetch.
let _cache: Status | null = null

interface Props {
  children: React.ReactNode
}

/**
 * Wraps a CLIENT-COMPONENT page. Renders children when the viewer is staff or
 * an enrolled student; renders the gate screen for un-enrolled students. RSC
 * pages should call the same enrollment helper server-side instead, so the
 * gated content never lands in the initial HTML.
 */
export default function EnrollmentGate({ children }: Props) {
  const { data: session } = useSession()
  const [status, setStatus] = useState<Status | null>(_cache)

  useEffect(() => {
    if (_cache) return
    let cancelled = false
    fetch('/api/me/enrollment')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Status | null) => {
        if (cancelled || !d) return
        _cache = { enrolled: d.enrolled, isStudent: d.isStudent }
        setStatus(_cache)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (!status) {
    return <div className="max-w-3xl mx-auto p-5 text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading…</div>
  }
  if (!status.isStudent || status.enrolled) return <>{children}</>
  const firstName = (session?.user?.name ?? '').split(' ')[0]
  return <EnrollmentGateScreen firstName={firstName} />
}
