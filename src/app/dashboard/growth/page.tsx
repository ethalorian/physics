"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import MasteryGrowth, { MasteryGrowthProps } from '@/components/mastery/MasteryGrowth'

const UNIT_ID = 'unit-1'
const UNIT_NAME = 'Unit 1 — Motion & Forces (Asteroid 2026-XJ)'

export default function GrowthPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<MasteryGrowthProps | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch(`/api/mastery/dashboard?unit_id=${UNIT_ID}`)
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
          unitName: UNIT_NAME,
          targets: d.targets ?? [],
          records: d.records ?? [],
          taskResult: d.taskResult ?? undefined,
        })
        setLoading(false)
      })
      .catch((e) => {
        if (!active) return
        setError(e instanceof Error ? e.message : 'Could not load growth')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [session?.user?.name])

  return (
    <div className="max-w-3xl mx-auto p-4">
      {loading && <p className="text-sm text-muted-foreground">Loading your growth…</p>}
      {error && <p className="text-sm text-red-600">Could not load your growth: {error}</p>}
      {data && <MasteryGrowth {...data} />}
    </div>
  )
}
