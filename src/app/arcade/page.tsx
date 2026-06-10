"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Coins, Trophy, Crown, Gamepad2, Sparkles } from 'lucide-react'

/**
 * The Arcade floor. Ranked play costs XP (a pure sink — vocab games are the
 * earners); the payout is the public leaderboard. Each cabinet card shows the
 * coin price, the player's best, this week's leader, and the all-time record.
 */

type Cabinet = {
  slug: string
  name: string
  blurb: string | null
  unit: string | null
  accent: string | null
  costXp: number
  myBest: number
  myWeeklyRank: number | null
  weeklyLeader: { name: string; score: number } | null
  hallOfFame: { name: string; score: number } | null
}
type CabinetResponse = {
  balance: { balance: number; lifetimeEarned: number; spent: number }
  freeCreditAvailable: boolean
  games: Cabinet[]
}

export default function ArcadePage() {
  const [data, setData] = useState<CabinetResponse | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/arcade/cabinet')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Sign in to enter the arcade'))))
      .then(setData)
      .catch((e) => setErr(e.message))
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <div className="flex items-center justify-between flex-wrap gap-3 mt-2 mb-1">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center" style={{ width: 44, height: 44, borderRadius: 12, background: 'color-mix(in oklch, var(--primary) 16%, transparent)', color: 'var(--primary)' }}>
            <Gamepad2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">The Arcade</h1>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Ranked runs cost XP. Glory is the only payout.
            </p>
          </div>
        </div>
        {data && (
          <div className="flex items-center gap-2 rounded-xl border px-4 py-2" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <Coins size={18} style={{ color: 'var(--primary)' }} />
            <span className="font-semibold">{data.balance.balance.toLocaleString()} XP</span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>spendable</span>
          </div>
        )}
      </div>

      <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
        <Sparkles size={13} />
        Low on XP? Vocabulary games and lessons are the earners — the arcade only spends.
      </p>

      {data?.freeCreditAvailable && (
        <div className="rounded-xl border px-4 py-3 mb-5 text-sm font-medium flex items-center gap-2"
          style={{ borderColor: 'var(--primary)', background: 'color-mix(in oklch, var(--primary) 12%, transparent)' }}>
          <Coins size={16} style={{ color: 'var(--primary)' }} />
          Your first coin is on the house — one free ranked run. Make it count.
        </div>
      )}

      {err && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{err}</p>}
      {!data && !err && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Powering on the cabinets…</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {data?.games.map((g) => {
          const accent = g.accent || 'var(--primary)'
          const canAfford = data.balance.balance >= g.costXp || data.freeCreditAvailable
          return (
            <div key={g.slug} className="rounded-2xl border p-5 flex flex-col" style={{ borderColor: 'var(--border)', background: 'var(--card)', boxShadow: `inset 0 3px 0 ${accent}` }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold tracking-wide" style={{ color: accent }}>{g.name}</h2>
                  {g.unit && <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>{g.unit}</span>}
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold rounded-full border px-3 py-1" style={{ borderColor: 'var(--border)' }}>
                  <Coins size={14} style={{ color: accent }} /> {g.costXp} XP
                </span>
              </div>
              {g.blurb && <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>{g.blurb}</p>}

              <div className="mt-4 grid grid-cols-1 gap-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}><Trophy size={14} /> Week leader</span>
                  <span className="font-medium">{g.weeklyLeader ? `${g.weeklyLeader.name} — ${g.weeklyLeader.score.toLocaleString()}` : 'unclaimed'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}><Crown size={14} /> Hall of Fame</span>
                  <span className="font-medium">{g.hallOfFame ? `${g.hallOfFame.name} — ${g.hallOfFame.score.toLocaleString()}` : 'be the first'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--muted-foreground)' }}>Your best</span>
                  <span className="font-medium">{g.myBest ? g.myBest.toLocaleString() : '—'}{g.myWeeklyRank ? ` (#${g.myWeeklyRank} this week)` : ''}</span>
                </div>
              </div>

              <Link
                href={`/arcade/${g.slug}`}
                className="mt-4 text-center text-sm font-semibold rounded-lg px-4 py-2.5"
                style={{ background: canAfford ? accent : 'var(--muted)', color: canAfford ? '#04060d' : 'var(--muted-foreground)' }}
              >
                {data.freeCreditAvailable ? '▶ FREE CREDIT' : canAfford ? '▶ INSERT COIN' : `Need ${g.costXp} XP`}
              </Link>
            </div>
          )
        })}
      </div>

      {data && data.games.length === 0 && (
        <p className="text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>No cabinets are powered on yet. Check back soon.</p>
      )}
    </div>
  )
}
