"use client"

import { useCallback, useEffect, useState } from 'react'

interface Reward { id: string; name: string; description?: string; cost_points: number; category?: string; active: boolean; owner_email?: string | null }
interface Redemption { id: string; user_email?: string; reward_name: string; cost_points: number; status: string; created_at: string }
interface Course { id: string; label: string }
interface Placement { reward_id: string; course_id: string }
interface ManageData { isAdmin: boolean; myRewards: Reward[]; library: Reward[]; myCourses: Course[]; placements: Placement[]; redemptions: Redemption[]; globals: Reward[] }

const C = { fg: 'var(--foreground)', muted: 'var(--muted-foreground)', primary: 'var(--primary)', sage: 'var(--success)', line: 'var(--border)', reward: 'var(--reward)' }
const blank = { name: '', cost_points: '', description: '', category: '' }

export default function StoreManagerPage() {
  const [data, setData] = useState<ManageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mine, setMine] = useState(blank)
  const [glob, setGlob] = useState(blank)

  const load = useCallback(() => {
    fetch('/api/rewards/manage').then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setData(d); setLoading(false) })
      .catch(() => { setError('Could not load'); setLoading(false) })
  }, [])
  useEffect(() => { load() }, [load])

  const post = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/rewards/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Save failed') }
    load()
  }
  const addMine = async () => { if (!mine.name || mine.cost_points === '') return; await post({ name: mine.name, cost_points: Number(mine.cost_points), description: mine.description || null, category: mine.category || null }); setMine(blank) }
  const addGlobal = async () => { if (!glob.name || glob.cost_points === '') return; await post({ name: glob.name, cost_points: Number(glob.cost_points), description: glob.description || null, category: glob.category || null, global: true }); setGlob(blank) }
  const toggleHidden = (r: Reward) => post({ id: r.id, active: !r.active })

  const place = async (rewardId: string, courseId: string, on: boolean) => {
    await fetch('/api/rewards/manage', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reward_id: rewardId, course_id: courseId, place: on }) })
    load()
  }
  const setStatus = async (id: string, status: string) => {
    await fetch('/api/rewards/manage', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ redemption_id: id, status }) })
    load()
  }

  if (loading) return <div className="max-w-3xl mx-auto p-4"><p className="text-sm" style={{ color: C.muted }}>Loading…</p></div>
  if (!data) return <div className="max-w-3xl mx-auto p-4"><p className="text-sm" style={{ color: 'var(--destructive)' }}>{error || 'Could not load'}</p></div>

  const placed = new Set(data.placements.map((p) => `${p.reward_id}|${p.course_id}`))
  const pending = data.redemptions.filter((r) => r.status === 'pending' || r.status === 'approved')

  const toggleAll = (rewardId: string) => {
    const allOn = data.myCourses.every((c) => placed.has(`${rewardId}|${c.id}`))
    data.myCourses.forEach((c) => {
      const on = placed.has(`${rewardId}|${c.id}`)
      if (allOn && on) place(rewardId, c.id, false)
      if (!allOn && !on) place(rewardId, c.id, true)
    })
  }

  const periodChips = (rewardId: string) => {
    if (data.myCourses.length === 0) return <span className="text-xs" style={{ color: C.muted }}>No classes yet — import a roster to place rewards.</span>
    return (
      <div className="flex flex-wrap gap-1 items-center mt-1.5">
        <span className="text-xs mr-1" style={{ color: C.muted }}>Periods:</span>
        {data.myCourses.map((c) => {
          const on = placed.has(`${rewardId}|${c.id}`)
          return (
            <button key={c.id} onClick={() => place(rewardId, c.id, !on)}
              className="text-xs rounded-full px-2.5 py-0.5 border"
              style={{ borderColor: on ? C.primary : C.line, background: on ? C.primary : 'var(--card)', color: on ? 'var(--primary-foreground)' : C.muted, cursor: 'pointer' }}>
              {c.label}
            </button>
          )
        })}
        {data.myCourses.length > 1 && (
          <button onClick={() => toggleAll(rewardId)} className="text-xs rounded-full px-2.5 py-0.5 border" style={{ borderColor: C.line, background: 'var(--card)', color: C.fg, cursor: 'pointer' }}>All</button>
        )}
      </div>
    )
  }

  const rewardCard = (r: Reward, withHide: boolean, withPlacement: boolean) => (
    <div key={r.id} className="py-2.5" style={{ borderTop: '0.5px solid var(--border)' }}>
      <div className="flex items-center gap-3">
        <span className="flex-1 text-sm" style={{ color: r.active ? C.fg : C.muted }}>
          {r.name}{r.category && <span style={{ color: C.muted }}> · {r.category}</span>}{!r.active && <span style={{ color: C.muted }}> · hidden</span>}
        </span>
        <span className="text-sm" style={{ color: C.reward }}>{r.cost_points} pts</span>
        {withHide && (
          <button onClick={() => toggleHidden(r)} className="text-xs rounded-md border px-3 py-1" style={{ borderColor: C.line, background: 'var(--card)', color: r.active ? C.muted : C.sage }}>
            {r.active ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {withPlacement && periodChips(r.id)}
    </div>
  )

  const formRow = (f: typeof blank, set: (v: typeof blank) => void, onAdd: () => void, lbl: string) => (
    <div className="rounded-lg border bg-card p-3 mb-3" style={{ borderColor: C.line }}>
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
        <input value={f.name} onChange={(e) => set({ ...f, name: e.target.value })} placeholder="Reward name" className="rounded-md border px-2 py-1 text-sm" style={{ borderColor: C.line }} />
        <input value={f.cost_points} onChange={(e) => set({ ...f, cost_points: e.target.value })} placeholder="Cost (pts)" type="number" className="rounded-md border px-2 py-1 text-sm" style={{ borderColor: C.line }} />
        <input value={f.category} onChange={(e) => set({ ...f, category: e.target.value })} placeholder="Category" className="rounded-md border px-2 py-1 text-sm" style={{ borderColor: C.line }} />
        <input value={f.description} onChange={(e) => set({ ...f, description: e.target.value })} placeholder="Description" className="rounded-md border px-2 py-1 text-sm" style={{ borderColor: C.line }} />
      </div>
      <button onClick={onAdd} className="text-xs rounded-md border px-3 py-1 mt-2" style={{ borderColor: C.line, background: C.primary, color: 'var(--primary-foreground)' }}>{lbl}</button>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto p-4" style={{ color: C.fg }}>
      <h1 className="text-xl font-medium mb-1">Rewards store</h1>
      <p className="text-sm mb-4" style={{ color: C.muted }}>
        Build each period&apos;s store separately. Add your own rewards or pick from the global library, then choose which periods each one appears in — tap a period to add it, or <strong>All</strong> to apply everywhere.
      </p>
      {error && <div className="text-sm rounded-md px-3 py-2 mb-3" style={{ background: 'var(--secondary)', color: 'var(--destructive)' }}>{error}</div>}

      <h2 className="text-sm font-medium mb-2" style={{ color: 'var(--secondary-foreground)' }}>Redemptions to fulfill</h2>
      {pending.length === 0 ? (
        <p className="text-sm mb-5" style={{ color: C.muted }}>No pending redemptions{data.isAdmin ? '' : ' from your students'}.</p>
      ) : (
        <div className="rounded-lg border bg-card px-4 mb-5" style={{ borderColor: C.line }}>
          {pending.map((r, i) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 py-2.5" style={{ borderTop: i === 0 ? 'none' : '0.5px solid var(--border)' }}>
              <span className="flex-1 min-w-[10rem] text-sm"><span style={{ color: C.fg }}>{r.reward_name}</span><span style={{ color: C.muted }}> · {r.user_email}</span></span>
              <span className="text-sm" style={{ color: C.muted }}>{r.cost_points} pts</span>
              <button onClick={() => setStatus(r.id, 'fulfilled')} className="text-xs rounded-md border px-3 py-1" style={{ borderColor: C.line, background: C.sage, color: '#fff' }}>Fulfill</button>
              <button onClick={() => setStatus(r.id, 'denied')} className="text-xs rounded-md border px-3 py-1" style={{ borderColor: C.line, color: C.muted, background: 'var(--card)' }}>Deny</button>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-sm font-medium mb-2" style={{ color: 'var(--secondary-foreground)' }}>Your rewards</h2>
      {formRow(mine, setMine, addMine, 'Add your reward')}
      <div className="rounded-lg border bg-card px-4 mb-5" style={{ borderColor: C.line }}>
        {data.myRewards.length === 0
          ? <p className="text-sm py-3" style={{ color: C.muted }}>None yet — add one above (it starts in all your periods; trim with the chips).</p>
          : data.myRewards.map((r) => rewardCard(r, true, true))}
      </div>

      <h2 className="text-sm font-medium mb-2" style={{ color: 'var(--secondary-foreground)' }}>Add from the global library</h2>
      <div className="rounded-lg border bg-card px-4 mb-5" style={{ borderColor: C.line }}>
        {data.library.length === 0
          ? <p className="text-sm py-3" style={{ color: C.muted }}>No global rewards available.</p>
          : data.library.map((r) => rewardCard(r, false, true))}
      </div>

      {data.isAdmin && (
        <>
          <h2 className="text-sm font-medium mb-2" style={{ color: 'var(--secondary-foreground)' }}>Global catalog · admin</h2>
          <p className="text-xs mb-2" style={{ color: C.muted }}>Global rewards any teacher can place. Hiding one removes it from every store and the library.</p>
          {formRow(glob, setGlob, addGlobal, 'Add global reward')}
          <div className="rounded-lg border bg-card px-4 mb-5" style={{ borderColor: C.line }}>
            {data.globals.length === 0
              ? <p className="text-sm py-3" style={{ color: C.muted }}>No global rewards yet.</p>
              : data.globals.map((r) => rewardCard(r, true, false))}
          </div>
        </>
      )}
    </div>
  )
}
