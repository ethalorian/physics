"use client"

// The student's daily XP goal — set by THEIR teacher (per-teacher, not global).
// School days: a progress ring that fills. Weekends/vacations/holidays: hit
// the goal and a one-time bonus XP award lands automatically.

import { useEffect, useState } from 'react'
import { Flame, PartyPopper } from 'lucide-react'

interface GoalStatus {
  configured: boolean
  kind?: 'school' | 'weekend' | 'special'
  label?: string
  goal?: number
  earned?: number
  bonus?: number
  bonusAwarded?: boolean
}

export default function XpGoalRing({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<GoalStatus | null>(null)

  useEffect(() => {
    fetch('/api/xp-goal')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setStatus(d) })
      .catch(() => {})
  }, [])

  if (!status?.configured || !status.goal) return null
  const earned = status.earned ?? 0
  const goal = status.goal
  const pct = Math.min(1, earned / goal)
  const done = earned >= goal
  const isSpecial = status.kind !== 'school'
  const ringColor = done ? 'var(--success)' : isSpecial ? 'var(--reward)' : 'var(--primary)'
  const R = compact ? 26 : 34
  const C = 2 * Math.PI * R
  const size = compact ? 64 : 84

  return (
    <div className="rounded-xl border p-4 flex items-center gap-4" style={{ borderColor: done ? `color-mix(in oklch, var(--success) 40%, var(--border))` : 'var(--border)', background: 'var(--card)' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${earned} of ${goal} XP today`}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="var(--secondary)" strokeWidth={compact ? 6 : 8} />
        <circle
          cx={size / 2} cy={size / 2} r={R} fill="none"
          stroke={ringColor} strokeWidth={compact ? 6 : 8} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
        <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fontSize={compact ? 13 : 16} fontWeight={700} fill="var(--foreground)">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: ringColor }}>
          <Flame className="h-3.5 w-3.5" /> {status.label} goal
        </div>
        <div className="font-bold tabular-nums" style={{ fontSize: compact ? 15 : 18, color: 'var(--foreground)' }}>
          {earned} / {goal} XP today
        </div>
        {isSpecial && (status.bonus ?? 0) > 0 && (
          <div className="flex items-center gap-1 text-xs mt-0.5 font-semibold" style={{ color: status.bonusAwarded ? 'var(--success)' : 'var(--reward)' }}>
            <PartyPopper className="h-3.5 w-3.5" />
            {status.bonusAwarded ? `+${status.bonus} XP bonus earned!` : `Hit it → +${status.bonus} XP bonus`}
          </div>
        )}
        {!isSpecial && done && (
          <div className="text-xs mt-0.5 font-semibold" style={{ color: 'var(--success)' }}>Goal hit — nice work.</div>
        )}
      </div>
    </div>
  )
}
