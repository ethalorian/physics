'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import type { MasteryGrowthProps } from '@/components/mastery/MasteryGrowth'
import type { MathSpineGrowthProps } from '@/components/math-spine/MathSpineGrowth'
import GrowthJournal from '@/components/growth/GrowthJournal'
import s from '@/components/growth/growth.module.css'

// Physics evidence is scoped to this unit; math observations span the year.
const PHYSICS_URL = '/api/mastery/dashboard?unit_id=unit-1'
function useGrowthData<T>(url: string, identity: string | null) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ identity: string | null; data: T | null; loading: boolean; error: boolean }>({ identity: null, data: null, loading: true, error: false })
  useEffect(() => {
    if (!identity) return
    let active = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    setState({ identity, data: null, loading: true, error: false })
    fetch(url, { signal: controller.signal, cache: 'no-store' }).then(async r => {
      if (!r.ok) throw new Error('Growth unavailable')
      return await r.json() as T
    }).then(data => { if (active) setState({ identity, data, loading: false, error: false }) })
      .catch(() => { if (active) setState({ identity, data: null, loading: false, error: true }) })
      .finally(() => clearTimeout(timeout))
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [url, identity, attempt])
  return { ...(state.identity === identity ? state : { data: null, loading: true, error: false }), retry: () => setAttempt(n => n + 1) }
}
export default function GrowthPage() {
  const { data: session, status } = useSession()
  const identity = status === 'authenticated' ? session?.user?.email ?? session?.user?.id ?? 'signed-in' : null
  const physics = useGrowthData<MasteryGrowthProps>(PHYSICS_URL, identity)
  const math = useGrowthData<MathSpineGrowthProps>('/api/math-spine/dashboard', identity)
  if (status === 'loading') return <section className={s.page}><div className={s.state} role="status">Opening your learning journal…</div></section>
  if (status === 'unauthenticated') return <section className={s.page}><div className={s.state}><p className={s.eyebrow}>Your learning journal</p><h1>Your progress belongs here.</h1><p>Sign in to see your evidence, teacher feedback, and next steps.</p><Link href="/api/auth/signin?callbackUrl=%2Fdashboard%2Fgrowth" className={s.primaryLink}>Sign in to see my growth</Link></div></section>
  return <GrowthJournal key={identity} name={session?.user?.name ?? undefined} physics={physics.data} math={math.data} physicsLoading={physics.loading} mathLoading={math.loading} physicsError={physics.error} mathError={math.error} retryPhysics={physics.retry} retryMath={math.retry}/>
}
