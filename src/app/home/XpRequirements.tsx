'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, ArrowRight } from 'lucide-react'
import type { UnitXpReport } from '@/lib/xp-policy'
import styles from './home.module.css'

export default function XpRequirements({ full = false }: { full?: boolean }) {
  const [data, setData] = useState<UnitXpReport | null>(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    const refresh = async () => {
      try {
        const response = await fetch('/api/xp-policy', { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('XP unavailable')
        const next = await response.json() as UnitXpReport
        if (!Array.isArray(next.units) || !Number.isFinite(next.unitTarget)) throw new Error('Invalid XP report')
        if (!controller.signal.aborted) { setData(next); setError(false) }
      } catch { if (!controller.signal.aborted) setError(true) }
    }
    void refresh()
    window.addEventListener('focus', refresh)
    window.addEventListener('xp-updated', refresh)
    return () => { controller.abort(); window.removeEventListener('focus', refresh); window.removeEventListener('xp-updated', refresh) }
  }, [retry])
  const term = data?.term
  const unit = data?.units.find(u => u.id === data.currentUnitId)
  const earned = term?.earned ?? 0
  const remaining = term ? Math.max(0, term.minimum_xp - earned) : undefined
  if (!full) return <section aria-labelledby="xp-requirements-title" className={styles.termXp}>
    <div className="flex flex-wrap items-center justify-between gap-x-4"><h2 id="xp-requirements-title" className="flex items-center gap-2 text-sm font-semibold"><Star size={18} aria-hidden="true" />Term XP</h2><Link href="/xp" className="inline-flex min-h-11 items-center gap-2 text-xs font-medium text-primary underline underline-offset-4">XP details<ArrowRight size={16} aria-hidden="true" /></Link></div>
    {error ? <div role="alert" className="mt-2 text-sm"><p>XP progress is unavailable. Your earnings are kept.</p><button className="mt-2 min-h-11 rounded-md border px-4 font-semibold" onClick={() => setRetry(n => n + 1)}>Retry XP progress</button></div>
      : !data ? <p role="status" className="mt-2 text-sm text-muted-foreground">Loading your XP progress…</p>
      : term ? <div className="mt-2 space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm"><p className="font-semibold tabular-nums"><strong className={styles.termEarned}>{earned.toLocaleString()}</strong> / {term.minimum_xp.toLocaleString()} XP</p><span className="text-xs text-muted-foreground">{term.label}</span></div>
        <progress aria-label="Term XP requirement progress" max={Math.max(1, term.minimum_xp)} value={Math.min(earned, term.minimum_xp)} className={styles.unitProgress} />
        <p role="status" className="text-sm text-muted-foreground">{remaining === 0 ? `Minimum met · eligible for +${term.grade_points} term-average points.` : `${remaining?.toLocaleString()} XP to go for +${term.grade_points} term-average points.`}</p>
      </div> : <p className="mt-2 text-sm text-muted-foreground">Your teacher hasn’t published a term minimum yet. Your earned XP is still saved.</p>}
  </section>
  return <section aria-labelledby="xp-requirements-title" className="rounded-3xl border-2 border-reward bg-reward/15 p-5 sm:p-7 text-foreground">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><Star size={18} aria-hidden="true" />Your XP requirement</p><h2 id="xp-requirements-title" className="mt-2 text-2xl font-bold">Progress toward your term-average points</h2></div><Link href="/xp" className="inline-flex min-h-11 items-center gap-2 font-semibold underline">How XP works <ArrowRight size={16} /></Link></div>
    {error ? <div role="alert" className="mt-4"><p>XP progress is unavailable. Your earnings are kept.</p><button className="mt-2 min-h-11 rounded-xl border px-4 font-semibold" onClick={() => setRetry(n => n + 1)}>Retry XP progress</button></div> : !data ? <p role="status" className="mt-4">Loading your XP progress…</p> : <>
      {term ? <>
        <p className="mt-3 font-semibold">{term.label} · {new Date(term.starts_at).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}–{new Date(new Date(term.ends_at).getTime() - 1).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}</p>
        <div className="my-5 grid grid-cols-3 gap-3">{[[earned,'XP earned'],[term.minimum_xp,'XP minimum'],[remaining,'XP still needed']].map(([n,label]) => <div key={label}><strong className="block text-3xl sm:text-4xl tabular-nums">{Number(n).toLocaleString()}</strong><span className="text-xs sm:text-sm">{label}</span></div>)}</div>
        <progress aria-label="Term XP requirement progress" max={term.minimum_xp} value={Math.min(earned,term.minimum_xp)} className="h-3 w-full accent-primary" />
        <p role="status" className="mt-3 font-semibold">{remaining === 0 ? `XP minimum met — eligible for ${term.grade_points} term-average points.` : `Earn ${remaining?.toLocaleString()} more XP to meet the minimum for ${term.grade_points} term-average points.`}</p>
      </> : <p className="mt-4 rounded-xl border border-reward/40 p-4">Your teacher hasn’t published the term minimum yet. Your unit earnings appear below; term-average eligibility will appear once the rule is published.</p>}
      <p className="mt-3 text-sm">XP you spend on rewards still counts toward the minimum. This tracks earned XP, not your wallet balance.</p>
      <div className="mt-5 border-t border-reward/40 pt-4"><p className="text-sm font-bold">{data.track === 'honors' ? 'Honors' : 'Standard'} unit earning plan · {data.unitTarget} XP</p><p className="mt-1 text-sm">{data.lessonTarget} from lesson evidence + {data.mathTarget} from math activities. Extra practice may earn more.</p>
      {unit && <div className="mt-3"><strong>{unit.name}</strong><p className="mt-1 text-sm">{unit.lesson_earned + unit.math_earned} XP earned · {Math.max(0,data.unitTarget-unit.lesson_earned-unit.math_earned)} XP to the unit target</p></div>}</div>
      {full && <div className="mt-6 space-y-3">{data.units.map(u => <div key={u.id} className="rounded-xl border border-reward/40 p-4"><h3 className="font-bold">{u.name}</h3><p className="mt-1 text-sm">{u.evidence_count ? `${u.lesson_earned} / ${u.lesson_available} lesson XP · ${u.math_earned} / ${u.math_target} planned math XP` : 'Lesson rewards will appear when this unit is published.'}</p></div>)}</div>}
    </>}
  </section>
}
