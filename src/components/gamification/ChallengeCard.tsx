"use client"

// Today's XP challenges — set by the student's teacher. Progress bars fill
// live; hitting the daily target pays the bonus automatically (server-side,
// once per day). Renders nothing when no challenge applies.

import { useEffect, useState } from 'react'
import { Swords, PartyPopper } from 'lucide-react'

interface Ch {
  id: string; title: string; metric: string; target: number
  bonusXp: number; progress: number; done: boolean; bonusAwarded: boolean
}

export default function ChallengeCard({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<Ch[]>([])

  useEffect(() => {
    fetch('/api/xp-challenges')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.challenges) setItems(d.challenges) })
      .catch(() => {})
  }, [])

  if (items.length === 0) return null

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'color-mix(in oklch, var(--reward) 35%, var(--border))', background: 'var(--card)' }}>
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--reward)' }}>
        <Swords className="h-3.5 w-3.5" /> Today&apos;s challenge{items.length > 1 ? 's' : ''}
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
              <div className="rounded-full overflow-hidden" style={{ height: 8, background: 'var(--secondary)' }}>
                <span style={{ display: 'block', height: '100%', width: `${pct * 100}%`, background: c.done ? 'var(--success)' : 'var(--reward)', transition: 'width 500ms ease', borderRadius: 9999 }} />
              </div>
              <div className="flex items-center gap-1 text-xs mt-1 font-semibold" style={{ color: c.bonusAwarded ? 'var(--success)' : 'var(--muted-foreground)' }}>
                {c.bonusAwarded ? <><PartyPopper className="h-3.5 w-3.5" /> +{c.bonusXp} XP bonus earned!</>
                  : c.bonusXp > 0 ? `Hit it → +${c.bonusXp} XP bonus` : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
