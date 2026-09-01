"use client"

// Daily XP goal settings — scoped to the SIGNED-IN teacher (ctx.scopeEmail on
// the server). Admin edits their own goals here like any teacher; there is no
// global value. School days fill a ring; weekend/vacation/holiday goals pay a
// one-time bonus XP award when a student hits them.

import { useCallback, useEffect, useState } from 'react'
import { Flame, Plus, Trash2 } from 'lucide-react'

interface Goals { school_day_goal: number; special_day_goal: number; special_day_bonus: number }
interface SpecialDay { id: string; label: string; start_date: string; end_date: string }

export default function XpGoalSettings() {
  const [goals, setGoals] = useState<Goals | null>(null)
  const [days, setDays] = useState<SpecialDay[]>([])
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(0)
  const [newDay, setNewDay] = useState({ label: '', start_date: '', end_date: '' })
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/teacher/xp-goals')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) { setGoals(d.goals); setDays(d.specialDays ?? []) } })
      .catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  const put = async (body: Record<string, unknown>) => {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/teacher/xp-goals', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Save failed') }
      setSavedAt(Date.now())
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!goals) return null
  const num = (v: string) => Math.max(0, Math.min(500, parseInt(v || '0', 10) || 0))

  const field = (label: string, value: number, onChange: (n: number) => void, hint: string) => (
    <label className="block">
      <span className="text-xs font-semibold" style={{ color: 'var(--secondary-foreground)' }}>{label}</span>
      <input
        type="number" min={0} max={500} value={value}
        onChange={(e) => onChange(num(e.target.value))}
        className="w-full mt-1 rounded-lg px-3 py-2 text-base tabular-nums"
        style={{ border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
      />
      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{hint}</span>
    </label>
  )

  return (
    <div className="rounded-2xl border p-5 h-full" style={{ borderColor: 'color-mix(in oklch, var(--reward) 32%, var(--border))', background: 'color-mix(in oklch, var(--reward) 5%, var(--card))' }}>
      <div className="grid place-items-center mb-3" style={{ width: 44, height: 44, borderRadius: 12, background: 'color-mix(in oklch, var(--reward) 18%, transparent)', color: 'var(--reward)' }}>
        <Flame size={22} />
      </div>
      <div className="font-bold" style={{ fontSize: 16 }}>Daily XP goals</div>
      <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
        Your classes only. School days fill a progress ring; weekend and vacation goals pay a bonus when hit.
      </p>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))' }}>
        {field('School day', goals.school_day_goal, (n) => setGoals({ ...goals, school_day_goal: n }), 'XP goal · ring only')}
        {field('Off day', goals.special_day_goal, (n) => setGoals({ ...goals, special_day_goal: n }), 'weekend / vacation goal')}
        {field('Bonus', goals.special_day_bonus, (n) => setGoals({ ...goals, special_day_bonus: n }), 'XP paid when hit')}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button onClick={() => put({ goals })} disabled={saving}
          className="rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
          {saving ? 'Saving…' : 'Save goals'}
        </button>
        {savedAt > 0 && Date.now() - savedAt < 4000 && <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>Saved ✓</span>}
        {error && <span className="text-xs" style={{ color: 'var(--destructive)' }}>{error}</span>}
      </div>

      <div className="text-xs font-bold uppercase tracking-wide mt-4 mb-2" style={{ color: 'var(--muted-foreground)' }}>Vacations & holidays</div>
      <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>Weekends count automatically. Add ranges for breaks — those days use the off-day goal + bonus.</p>
      {days.map((d) => (
        <div key={d.id} className="flex items-center gap-2 text-sm rounded-lg px-3 py-2 mb-1.5" style={{ background: 'var(--secondary)' }}>
          <span className="font-semibold">{d.label}</span>
          <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>{d.start_date} → {d.end_date}</span>
          <button onClick={() => put({ removeSpecialDayId: d.id })} className="ml-auto" title="Remove"
            style={{ border: 'none', background: 'transparent', color: 'var(--muted-foreground)', cursor: 'pointer' }}>
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap items-end gap-2 mt-2">
        <input placeholder="Label (e.g. Winter break)" value={newDay.label} onChange={(e) => setNewDay({ ...newDay, label: e.target.value })}
          className="flex-1 min-w-[130px] rounded-lg px-2.5 py-1.5 text-sm" style={{ border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
        <input type="date" value={newDay.start_date} onChange={(e) => setNewDay({ ...newDay, start_date: e.target.value })}
          className="rounded-lg px-2 py-1.5 text-sm" style={{ border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
        <input type="date" value={newDay.end_date} onChange={(e) => setNewDay({ ...newDay, end_date: e.target.value })}
          className="rounded-lg px-2 py-1.5 text-sm" style={{ border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
        <button
          onClick={() => { if (newDay.label && newDay.start_date && newDay.end_date) { put({ addSpecialDay: newDay }); setNewDay({ label: '', start_date: '', end_date: '' }) } }}
          disabled={saving || !newDay.label || !newDay.start_date || !newDay.end_date}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
          style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer' }}>
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  )
}
