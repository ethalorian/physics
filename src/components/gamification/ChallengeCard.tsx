"use client"

// Teacher bounties refresh on return from game play and once per minute.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Swords, PartyPopper } from 'lucide-react'
import { PERIOD_LABELS, type BountyPeriod } from '@/lib/xp-bounty-period'

interface Ch {
  id: string; title: string; metric: string; target: number
  bonusXp: number; progress: number; done: boolean; bonusAwarded: boolean
  period: BountyPeriod; window: { start: string; end: string }; playHref: string
}

export default function ChallengeCard({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<Ch[]>([])

  useEffect(() => {
    let active = true
    const refresh = () => fetch('/api/xp-challenges')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (active && d?.challenges) setItems(d.challenges) })
      .catch(() => {})
    const visible = () => { if (document.visibilityState === 'visible') void refresh() }
    void refresh()
    const timer = window.setInterval(visible, 60000)
    window.addEventListener('focus', visible)
    document.addEventListener('visibilitychange', visible)
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', visible); document.removeEventListener('visibilitychange', visible) }
  }, [])

  if (items.length === 0) return null

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'color-mix(in oklch, var(--reward) 35%, var(--border))', background: 'var(--card)' }}>
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--reward)' }}>
        <Swords className="h-3.5 w-3.5" /> Assigned XP bounties
      </div>
      <div className="flex flex-col gap-3">
        {items.map((c) => {
          const pct = Math.min(1, c.progress / Math.max(1, c.target))
          return (
            <div key={c.id}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold" style={{ fontSize: compact ? 13 : 14 }}>{c.title}</span>
                <span className="ml-auto text-xs font-bold tabular-nums" style={{ color: c.done ? 'var(--success)' : 'var(--muted-foreground)' }}>
                  {c.progress} / {c.target}{c.metric === 'plays' ? '' : ' XP'}
                </span>
              </div>
              <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>{PERIOD_LABELS[c.period]} · {c.window.start} → {c.window.end} (Eastern)</p>
              <div role="progressbar" aria-label={c.title} aria-valuemin={0} aria-valuemax={c.target} aria-valuenow={Math.min(c.progress, c.target)} className="rounded-full overflow-hidden" style={{ height: 8, background: 'var(--secondary)' }}>
                <span style={{ display: 'block', height: '100%', width: `${pct * 100}%`, background: c.done ? 'var(--success)' : 'var(--reward)', transition: 'width 500ms ease', borderRadius: 9999 }} />
              </div>
              <div className="flex items-center gap-1 text-xs mt-1 font-semibold" style={{ color: c.bonusAwarded ? 'var(--success)' : 'var(--muted-foreground)' }}>
                {c.bonusAwarded ? <><PartyPopper className="h-3.5 w-3.5" /> +{c.bonusXp} XP bonus earned!</>
                  : c.bonusXp > 0 ? `Hit it → +${c.bonusXp} XP bonus` : null}
              </div>
              {!c.done && <Link href={c.playHref} className="inline-block text-xs font-semibold mt-2" style={{ color: 'var(--primary)' }}>Play assigned activity →</Link>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
