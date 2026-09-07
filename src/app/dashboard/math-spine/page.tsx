'use client'

import MathFeedbackLoop from '@/components/math-spine/MathFeedbackLoop'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import MathSpineGrowth, { MathSpineGrowthProps } from '@/components/math-spine/MathSpineGrowth'

export default function MathSpinePage() {
  const { data: session } = useSession()
  const [reload, setReload] = useState(0)
  const [data, setData] = useState<MathSpineGrowthProps | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true); setError(null)
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
  }, [session?.user?.name, reload])

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <header className="mb-4"><h1 className="text-2xl font-semibold">My math learning</h1><p className="mt-1 text-muted-foreground">Use feedback. See what you can do. Choose your next step.</p><button className="min-h-11 text-sm underline" onClick={()=>setReload(n=>n+1)} disabled={loading}>Refresh my learning</button></header>
      {loading && <p className="text-sm text-muted-foreground">Loading your math literacy…</p>}
      {error && <p className="text-sm text-red-600">Could not load your math literacy: {error}</p>}
      <MathFeedbackLoop refreshKey={reload} />
      {data && <MathSpineGrowth {...data} />}
    </div>
  )
}
