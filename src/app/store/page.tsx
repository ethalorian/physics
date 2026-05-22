"use client"

import { useCallback, useEffect, useState } from 'react'

interface Reward { id: string; name: string; description?: string; cost_points: number; category?: string }
interface Redemption { id: string; reward_name: string; cost_points: number; status: string; created_at: string }
interface Balance { lifetimeEarned: number; spent: number; balance: number }

const C = { indigo: '#2D2A4A', muted: '#6B6890', lavender: '#9B8EC4', sage: '#7FA68B', hairline: '#E7E4F0', tint: '#F4F2FA' }

const STATUS_COLOR: Record<string, string> = { pending: C.lavender, approved: '#B8C4DB', fulfilled: C.sage, denied: '#C08B8B' }

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

  return (
    <div className="max-w-3xl mx-auto p-4" style={{ color: C.indigo }}>
      <h1 className="text-xl font-medium mb-3">Points store</h1>

      <div className="rounded-xl border p-4 mb-4" style={{ background: C.tint, borderColor: C.hairline }}>
        <div className="text-xs" style={{ color: C.muted }}>Points to spend</div>
        <div className="text-3xl font-medium" style={{ color: C.indigo }}>{bal}</div>
        {balance && (
          <div className="text-xs mt-1" style={{ color: C.muted }}>
            {balance.lifetimeEarned} earned · {balance.spent} spent
          </div>
        )}
      </div>

      {msg && <div className="text-sm rounded-md px-3 py-2 mb-3" style={{ background: C.tint, color: C.indigo }}>{msg}</div>}
      {loading && <p className="text-sm" style={{ color: C.muted }}>Loading the store…</p>}

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {rewards.map((r) => {
          const afford = bal >= r.cost_points
          return (
            <div key={r.id} className="rounded-lg border p-4 bg-white flex flex-col" style={{ borderColor: C.hairline }}>
              <div className="font-medium" style={{ color: C.indigo }}>{r.name}</div>
              {r.description && <div className="text-sm mt-1 flex-1" style={{ color: C.muted }}>{r.description}</div>}
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-medium" style={{ color: C.lavender }}>{r.cost_points} pts</span>
                <button
                  onClick={() => redeem(r)}
                  disabled={!afford || busy === r.id}
                  className="text-sm rounded-md border px-3 py-1 disabled:opacity-50"
                  style={{ borderColor: C.hairline, background: afford ? C.sage : '#fff', color: afford ? '#fff' : C.muted }}
                >
                  {busy === r.id ? '…' : afford ? 'Redeem' : 'Need more'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <h2 className="text-sm font-medium mt-6 mb-2" style={{ color: '#4A4470' }}>Your redemptions</h2>
      {redemptions.length === 0 ? (
        <p className="text-sm" style={{ color: C.muted }}>Nothing redeemed yet.</p>
      ) : (
        <div className="rounded-lg border bg-white px-4" style={{ borderColor: C.hairline }}>
          {redemptions.map((r, i) => (
            <div key={r.id} className="flex items-center gap-3 py-2.5" style={{ borderTop: i === 0 ? 'none' : '0.5px solid #EEEBF5' }}>
              <span className="flex-1 text-sm">{r.reward_name}</span>
              <span className="text-sm" style={{ color: C.muted }}>{r.cost_points} pts</span>
              <span className="text-xs rounded px-2 py-0.5" style={{ background: '#fff', border: `1px solid ${STATUS_COLOR[r.status] ?? C.hairline}`, color: STATUS_COLOR[r.status] ?? C.muted }}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
