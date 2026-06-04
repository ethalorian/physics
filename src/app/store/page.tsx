"use client"

import { useCallback, useEffect, useState } from 'react'
import EnrollmentGate from '@/components/EnrollmentGate'

interface Reward { id: string; name: string; description?: string; cost_points: number; category?: string; grant_lesson_id?: string | null }
interface Redemption { id: string; reward_id?: string; reward_name: string; cost_points: number; status: string; created_at: string }
interface Balance { lifetimeEarned: number; spent: number; balance: number }

const C = {
  indigo: 'var(--foreground)',
  muted: 'var(--muted-foreground)',
  lavender: 'var(--primary)',
  sage: 'var(--success)',
  hairline: 'var(--border)',
  tint: 'var(--secondary)',
  reward: 'var(--reward)',
}

const STATUS_COLOR: Record<string, string> = { pending: C.lavender, approved: C.muted, fulfilled: C.sage, denied: 'var(--destructive)' }

export default function StorePage() {
  const [balance, setBalance] = useState<Balance | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/rewards/store')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setMsg(d.error)
        else { setBalance(d.balance); setRewards(d.rewards ?? []); setRedemptions(d.redemptions ?? []) }
        setLoading(false)
      })
      .catch(() => { setMsg('Could not load the store'); setLoading(false) })
  }, [])

  useEffect(() => { load() }, [load])

  const redeem = async (r: Reward) => {
    setBusy(r.id); setMsg(null)
    try {
      const res = await fetch('/api/rewards/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reward_id: r.id }) })
      const d = await res.json()
      if (!res.ok) setMsg(d.error || 'Could not redeem')
      else { setMsg(`Requested: ${r.name}. Your teacher will fulfill it.`); load() }
    } catch { setMsg('Could not redeem') } finally { setBusy(null) }
  }

  const bal = balance?.balance ?? 0

  // Car parts are earned by passing build lessons (not bought); everything else is a normal priced reward.
  const carParts = rewards.filter((r) => r.grant_lesson_id || r.category === 'Car Part')
  const shopRewards = rewards.filter((r) => !(r.grant_lesson_id || r.category === 'Car Part'))
  // Only FULFILLED rows count as earned — auto-grants are inserted fulfilled, so a
  // stray pending/denied row can never light up a part.
  const earnedIds = new Set(redemptions.filter((d) => d.status === 'fulfilled').map((d) => d.reward_id).filter(Boolean) as string[])
  const earnedCount = carParts.filter((p) => earnedIds.has(p.id)).length
  // Redemption history: hide the auto-granted parts (shown in the build section above).
  const carPartIds = new Set(carParts.map((p) => p.id))
  const shopRedemptions = redemptions.filter((d) => !(d.reward_id && carPartIds.has(d.reward_id)))

  return (
    <EnrollmentGate>
    <div className="max-w-3xl mx-auto p-4" style={{ color: C.indigo }}>
      <h1 className="text-xl font-medium mb-3">Points store</h1>

      <div className="rounded-xl border p-4 mb-4" style={{ background: C.tint, borderColor: C.hairline }}>
        <div className="text-xs" style={{ color: C.muted }}>Points to spend</div>
        <div className="text-3xl font-medium" style={{ color: C.reward }}>{bal}</div>
        {balance && (
          <div className="text-xs mt-1" style={{ color: C.muted }}>
            {balance.lifetimeEarned} earned · {balance.spent} spent
          </div>
        )}
      </div>

      {msg && <div className="text-sm rounded-md px-3 py-2 mb-3" style={{ background: C.tint, color: C.indigo }}>{msg}</div>}
      {loading && <p className="text-sm" style={{ color: C.muted }}>Loading the store…</p>}

      {/* Your car build — parts earned by passing each Unit 8 build lesson */}
      {carParts.length > 0 && (
        <section className="mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm font-medium" style={{ color: 'var(--secondary-foreground)' }}>Your car build</h2>
            <span className="text-xs" style={{ color: C.muted }}>{earnedCount} of {carParts.length} parts earned</span>
          </div>
          <p className="text-xs mb-3" style={{ color: C.muted }}>
            Pass each build day (score 60 or higher) to unlock the materials you need for the next day. No points needed — earn it by mastering the lesson.
          </p>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {carParts.map((p) => {
              const earned = earnedIds.has(p.id)
              return (
                <div
                  key={p.id}
                  className="rounded-lg border p-4 flex flex-col"
                  style={{
                    borderColor: earned ? C.sage : C.hairline,
                    background: earned ? 'color-mix(in srgb, var(--success) 8%, var(--card))' : 'var(--card)',
                    opacity: earned ? 1 : 0.85,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium" style={{ color: C.indigo }}>{p.name}</div>
                    <span aria-hidden style={{ color: earned ? C.sage : C.muted }}>{earned ? '✓' : '🔒'}</span>
                  </div>
                  {p.description && <div className="text-sm mt-1 flex-1" style={{ color: C.muted }}>{p.description}</div>}
                  <div className="mt-3 text-xs font-medium" style={{ color: earned ? C.sage : C.muted }}>
                    {earned ? 'Earned' : 'Locked'}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Priced rewards (if any are active) */}
      {shopRewards.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-medium mb-2" style={{ color: 'var(--secondary-foreground)' }}>Spend your points</h2>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {shopRewards.map((r) => {
              const afford = bal >= r.cost_points
              return (
                <div key={r.id} className="rounded-lg border p-4 bg-card flex flex-col" style={{ borderColor: C.hairline }}>
                  <div className="font-medium" style={{ color: C.indigo }}>{r.name}</div>
                  {r.description && <div className="text-sm mt-1 flex-1" style={{ color: C.muted }}>{r.description}</div>}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-medium" style={{ color: C.reward }}>{r.cost_points} pts</span>
                    <button
                      onClick={() => redeem(r)}
                      disabled={!afford || busy === r.id}
                      className="text-sm rounded-md border px-3 py-1 disabled:opacity-50"
                      style={{ borderColor: C.hairline, background: afford ? C.sage : 'var(--card)', color: afford ? '#fff' : C.muted }}
                    >
                      {busy === r.id ? '…' : afford ? 'Redeem' : 'Need more'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <h2 className="text-sm font-medium mt-6 mb-2" style={{ color: 'var(--secondary-foreground)' }}>Your redemptions</h2>
      {shopRedemptions.length === 0 ? (
        <p className="text-sm" style={{ color: C.muted }}>Nothing redeemed yet.</p>
      ) : (
        <div className="rounded-lg border bg-card px-4" style={{ borderColor: C.hairline }}>
          {shopRedemptions.map((r, i) => (
            <div key={r.id} className="flex items-center gap-3 py-2.5" style={{ borderTop: i === 0 ? 'none' : '0.5px solid var(--border)' }}>
              <span className="flex-1 text-sm">{r.reward_name}</span>
              <span className="text-sm" style={{ color: C.muted }}>{r.cost_points} pts</span>
              <span className="text-xs rounded px-2 py-0.5" style={{ background: 'var(--card)', border: `1px solid ${STATUS_COLOR[r.status] ?? C.hairline}`, color: STATUS_COLOR[r.status] ?? C.muted }}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
    </EnrollmentGate>
  )
}
