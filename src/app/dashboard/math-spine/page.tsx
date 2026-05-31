'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import MathSpineGrowth, { MathSpineGrowthProps } from '@/components/math-spine/MathSpineGrowth'

export default function MathSpinePage() {
  const { data: session } = useSession()
  const [data, setData] = useState<MathSpineGrowthProps | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/math-spine/dashboard')
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}))
          throw new Error(body.error || `Request failed (${r.status})`)
        }
        return r.json()
      })
      .then((d) => {
        if (!active) return
        setData({
          studentName: session?.user?.name ?? undefined,
          competencies: d.competencies ?? [],
          records: d.records ?? [],
          grants: d.grants ?? [],
          mathPointsEarned: d.mathPointsEarned ?? 0,
        })
        setLoading(false)
      })
      .catch((e) => {
        if (!active) return
        setError(e instanceof Error ? e.message : 'Could not load math literacy')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [session?.user?.name])

  return (
    <div className="max-w-3xl mx-auto p-4">
      {loading && <p className="text-sm text-muted-foreground">Loading your math literacy…</p>}
      {error && <p className="text-sm text-red-600">Could not load your math literacy: {error}</p>}
      {data && <MathSpineGrowth {...data} />}
    </div>
  )
}
