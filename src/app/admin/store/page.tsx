"use client"

import { useCallback, useEffect, useState } from 'react'

interface Reward { id: string; name: string; description?: string; cost_points: number; category?: string; active: boolean }
interface Redemption { id: string; user_email?: string; reward_name: string; cost_points: number; status: string; created_at: string }

const C = {
  indigo: 'var(--foreground)',
  muted: 'var(--muted-foreground)',
  lavender: 'var(--primary)',
  sage: 'var(--success)',
  hairline: 'var(--border)',
  tint: 'var(--secondary)',
  reward: 'var(--reward)',
}

export default function AdminStorePage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', cost_points: '', description: '', category: '' })

  const load = useCallback(() => {
    fetch('/api/rewards/manage')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else { setRewards(d.rewards ?? []); setRedemptions(d.redemptions ?? []) }
        setLoading(false)
      })
      .catch(() => { setError('Could not load'); setLoading(false) })
  }, [])

  useEffect(() => { load() }, [load])

  const addReward = async () => {
    if (!form.name || form.cost_points === '') return
    await fetch('/api/rewards/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, cost_points: Number(form.cost_points), description: form.description || null, category: form.category || null }),
    })
    setForm({ name: '', cost_points: '', description: '', category: '' })
    load()
  }

  const setStatus = async (id: string, status: string) => {
    await fetch('/api/rewards/manage', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redemption_id: id, status }),
    })
    load()
  }

  const pending = redemptions.filter((r) => r.status === 'pending' || r.status === 'approved')
  const done = redemptions.filter((r) => r.status === 'fulfilled' || r.status === 'denied')

  return (
    <div className="max-w-3xl mx-auto p-4" style={{ color: C.indigo }}>
      <h1 className="text-xl font-medium mb-3">Rewards store</h1>
      {error && <div className="text-sm rounded-md px-3 py-2 mb-3" style={{ background: 'var(--secondary)', color: 'var(--destructive)' }}>{error}</div>}
      {loading && <p className="text-sm" style={{ color: C.muted }}>Loading…</p>}

      <h2 className="text-sm font-medium mb-2" style={{ color: 'var(--secondary-foreground)' }}>Redemptions to fulfill</h2>
      {pending.length === 0 ? (
        <p className="text-sm mb-5" style={{ color: C.muted }}>No pending redemptions.</p>
      ) : (
        <div className="rounded-lg border bg-card px-4 mb-5" style={{ borderColor: C.hairline }}>
          {pending.map((r, i) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 py-2.5" style={{ borderTop: i === 0 ? 'none' : '0.5px solid var(--border)' }}>
              <span className="flex-1 min-w-[10rem] text-sm">
                <span style={{ color: C.indigo }}>{r.reward_name}</span>
                <span style={{ color: C.muted }}> · {r.user_email}</span>
              </span>
              <span className="text-sm" style={{ color: C.muted }}>{r.cost_points} pts</span>
              <button onClick={() => setStatus(r.id, 'fulfilled')} className="text-xs rounded-md border px-3 py-1" style={{ borderColor: C.hairline, background: C.sage, color: '#fff' }}>Fulfill</button>
              <button onClick={() => setStatus(r.id, 'denied')} className="text-xs rounded-md border px-3 py-1" style={{ borderColor: C.hairline, color: C.muted, background: 'var(--card)' }}>Deny</button>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-sm font-medium mb-2" style={{ color: 'var(--secondary-foreground)' }}>Catalog</h2>
      <div className="rounded-lg border bg-card p-3 mb-3" style={{ borderColor: C.hairline }}>
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Reward name" className="rounded-md border px-2 py-1 text-sm" style={{ borderColor: C.hairline }} />
          <input value={form.cost_points} onChange={(e) => setForm({ ...form, cost_points: e.target.value })} placeholder="Cost (pts)" type="number" className="rounded-md border px-2 py-1 text-sm" style={{ borderColor: C.hairline }} />
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="rounded-md border px-2 py-1 text-sm" style={{ borderColor: C.hairline }} />
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded-md border px-2 py-1 text-sm" style={{ borderColor: C.hairline }} />
        </div>
        <button onClick={addReward} className="text-xs rounded-md border px-3 py-1 mt-2" style={{ borderColor: C.hairline, background: C.lavender, color: '#fff' }}>Add reward</button>
      </div>
      <div className="rounded-lg border bg-card px-4 mb-5" style={{ borderColor: C.hairline }}>
        {rewards.map((r, i) => (
          <div key={r.id} className="flex items-center gap-3 py-2.5" style={{ borderTop: i === 0 ? 'none' : '0.5px solid var(--border)' }}>
            <span className="flex-1 text-sm" style={{ color: r.active ? C.indigo : C.muted }}>{r.name}{!r.active && ' (hidden)'}</span>
            <span className="text-sm" style={{ color: C.reward }}>{r.cost_points} pts</span>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <>
          <h2 className="text-sm font-medium mb-2" style={{ color: 'var(--secondary-foreground)' }}>History</h2>
          <div className="rounded-lg border bg-card px-4" style={{ borderColor: C.hairline }}>
            {done.slice(0, 30).map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 py-2" style={{ borderTop: i === 0 ? 'none' : '0.5px solid var(--border)' }}>
                <span className="flex-1 text-sm" style={{ color: C.muted }}>{r.reward_name} · {r.user_email}</span>
                <span className="text-xs" style={{ color: r.status === 'fulfilled' ? C.sage : '#C08B8B' }}>{r.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
