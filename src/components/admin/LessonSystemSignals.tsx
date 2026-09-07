'use client'

/**
 * LessonSystemSignals — O-1 of docs/LESSON_SYSTEM_RULES.md.
 * Four read-only cards on the Observatory: misconception clusters (wrong + sure),
 * calibration drift, support use, and group-work comparisons. No controls render —
 * an observer and an admin see the same thing (O-2).
 */
import { useEffect, useState } from 'react'
import { AlertTriangle, Scale, Languages, Users } from 'lucide-react'

interface Signals {
  coverage: { responses: number; supersededResponses: number; loggedResponses: number; missingLogs: number; missingSource: number; from: string | null; through: string | null }
  misconception: { slug: string; statement: string; flags: number; students: number }[]
  calibration: { pairs: number; calibrated: number; over: number; under: number; overTargets: { slug: string; over: number }[] }
  scaffold: { heavyPairs: number; lightPairs: number; heavyMean: number | null; lightMean: number | null; targets: { slug: string; heavyMean: number; lightMean: number; gap: number }[] }
  lobby: { targets: number; withPairs: number; withoutPairs: number; withMean: number | null; withoutMean: number | null; perTarget: { slug: string; withMean: number; withoutMean: number; delta: number }[] }
}

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : '—')
const lvl = (v: number | null) => (v === null ? '—' : v.toFixed(2))

export default function LessonSystemSignals({ unit }: { unit: string }) {
  const [sig, setSig] = useState<Signals | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [loadedUnit, setLoadedUnit] = useState<string | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    setSig(null); setError(null); setLoadedUnit(null)
    fetch(`/api/analytics/signals?unit=${encodeURIComponent(unit)}`, { signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error('Could not load lesson signals.'); return response.json() })
      .then((data) => { if (!controller.signal.aborted) { setSig(data); setLoadedUnit(unit) } })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not load lesson signals.') })
    return () => controller.abort()
  }, [unit, retry])
  if (error) return <div role="alert" className="mt-6 rounded-xl border p-4 text-sm">{error} <button className="min-h-11 underline px-3" onClick={() => setRetry((value) => value + 1)}>Retry</button></div>
  if (!sig || loadedUnit !== unit) return <p role="status" className="mt-6 text-sm text-muted-foreground">Loading lesson signals…</p>
  const card = (icon: React.ReactNode, title: string, sub: string, body: React.ReactNode) => (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>{icon} {title}</div>
      <div className="text-xs mt-0.5 mb-3" style={{ color: 'var(--muted-foreground)' }}>{sub}</div>
      {body}
    </div>
  )
  const empty = (t: string) => <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t}</p>
  return (
    <div className="mt-6">
      <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>Lesson-system signals · read-only</div>
      <p className="text-xs text-muted-foreground mb-3">{sig.coverage.responses} latest evidence records; {sig.coverage.supersededResponses} older saves excluded. Support logs: {sig.coverage.loggedResponses} known, {sig.coverage.missingLogs} unknown. {sig.coverage.missingSource} records lack a source. {sig.coverage.from && sig.coverage.through ? `Evidence dates: ${sig.coverage.from.slice(0, 10)} to ${sig.coverage.through.slice(0, 10)}.` : 'No scoped evidence yet.'} Group comparisons describe recorded participation and do not establish a causal effect.</p>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {card(<AlertTriangle size={14} style={{ color: 'var(--destructive)' }} />, 'Misconceptions', 'Wrong + sure on a checkpoint, by target', sig.misconception.length === 0 ? empty('No wrong-and-sure flags yet.') : (
          <ul className="space-y-1.5 text-sm">
            {sig.misconception.map((m) => (
              <li key={m.slug} className="flex items-start justify-between gap-2">
                <span className="min-w-0"><b>{m.slug}</b> <span style={{ color: 'var(--muted-foreground)' }}>{m.statement.slice(0, 70)}{m.statement.length > 70 ? '…' : ''}</span></span>
                <span className="shrink-0 tabular-nums font-semibold" style={{ color: 'var(--destructive)' }}>{m.students} students · {m.flags}</span>
              </li>
            ))}
          </ul>
        ))}
        {card(<Scale size={14} style={{ color: 'var(--primary)' }} />, 'Calibration drift', 'Latest self-rating vs latest teacher rating', sig.calibration.pairs === 0 ? empty('No rated pairs yet — calibration is knowable only after a teacher rating.') : (
          <div className="text-sm">
            <div className="tabular-nums"><b style={{ color: 'var(--success)' }}>{pct(sig.calibration.calibrated, sig.calibration.pairs)} calibrated</b> · <b style={{ color: 'var(--reward-foreground)' }}>{pct(sig.calibration.over, sig.calibration.pairs)} over</b> · <b style={{ color: 'var(--primary)' }}>{pct(sig.calibration.under, sig.calibration.pairs)} under</b> <span style={{ color: 'var(--muted-foreground)' }}>· {sig.calibration.pairs} pairs</span></div>
            {sig.calibration.overTargets.length > 0 && <div className="text-xs mt-1.5" style={{ color: 'var(--muted-foreground)' }}>Over-rating clusters: {sig.calibration.overTargets.map((t) => `${t.slug} (${t.over})`).join(' · ')}</div>}
          </div>
        ))}
        {card(<Languages size={14} style={{ color: 'var(--reward-foreground)' }} />, 'Support use comparison', 'Latest teacher level: support on ≥50% vs <50% of logged work', sig.scaffold.heavyPairs + sig.scaffold.lightPairs === 0 ? empty('No rated work with scaffold logs yet.') : (
          <div className="text-sm">
            <div className="tabular-nums">More support <b>{lvl(sig.scaffold.heavyMean)}</b> <span style={{ color: 'var(--muted-foreground)' }}>({sig.scaffold.heavyPairs})</span> · Less support <b>{lvl(sig.scaffold.lightMean)}</b> <span style={{ color: 'var(--muted-foreground)' }}>({sig.scaffold.lightPairs})</span></div>
            {sig.scaffold.targets.length > 0 && <div className="text-xs mt-1.5" style={{ color: 'var(--muted-foreground)' }}>Largest gaps: {sig.scaffold.targets.map((t) => `${t.slug} ${t.gap > 0 ? '+' : ''}${t.gap}`).join(' · ')}</div>}
            <div className="text-[11px] mt-1.5" style={{ color: 'var(--muted-foreground)' }}>These are associations, not evidence that support caused a rating difference. Unknown logs are excluded; ratings and work may come from different dates.</div>
          </div>
        ))}
        {card(<Users size={14} style={{ color: 'var(--success)' }} />, 'Group-work comparison', 'Latest teacher level on targets with group artifacts', sig.lobby.targets === 0 ? empty('No lobby artifacts tagged to a target yet.') : (
          <div className="text-sm">
            <div className="tabular-nums">With lobby <b>{lvl(sig.lobby.withMean)}</b> <span style={{ color: 'var(--muted-foreground)' }}>({sig.lobby.withPairs})</span> · No recorded lobby <b>{lvl(sig.lobby.withoutMean)}</b> <span style={{ color: 'var(--muted-foreground)' }}>({sig.lobby.withoutPairs})</span> · {sig.lobby.targets} targets</div>
            {sig.lobby.perTarget.length > 0 && <div className="text-xs mt-1.5" style={{ color: 'var(--muted-foreground)' }}>By target: {sig.lobby.perTarget.map((t) => `${t.slug} ${t.delta > 0 ? '+' : ''}${t.delta}`).join(' · ')}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
