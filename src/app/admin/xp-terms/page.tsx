"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
type Term = { id: string; course_id: string; label: string; starts_at: string; ends_at: string; minimum_xp: number; grade_points: number }
type Course = { id: string; name: string; track: string }
function Rule({ term }: { term: Term }) {
 const [message, setMessage] = useState('')
 const [busy, setBusy] = useState(false)
 return <form className="space-y-4 rounded-2xl border p-5" onSubmit={async e => {
  e.preventDefault(); setBusy(true); setMessage('')
  const f = new FormData(e.currentTarget)
  try {
   const response = await fetch('/api/teacher/xp-terms', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: term.id, label: f.get('label'), starts_at: new Date(String(f.get('start')) + 'Z').toISOString(), ends_at: new Date(String(f.get('end')) + 'Z').toISOString(), minimum_xp: Number(f.get('xp')), grade_points: Number(f.get('points')) }) })
   const result = await response.json(); if (!response.ok) throw new Error(result.error)
   setMessage('Published. Students will see this requirement on Home.')
  } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save. Retry.') } finally { setBusy(false) }
 }}>
 <div className="grid gap-4 sm:grid-cols-2">
 <label className="grid gap-1 text-sm">Term name<input required name="label" defaultValue={term.label} className="min-h-11 rounded-lg border bg-background p-2" /></label>
 <label className="grid gap-1 text-sm">Minimum earned XP<input required type="number" min="1" max="100000" name="xp" defaultValue={term.minimum_xp} className="min-h-11 rounded-lg border bg-background p-2" /></label>
 <label className="grid gap-1 text-sm">Starts (UTC, inclusive)<input required type="datetime-local" name="start" defaultValue={new Date(term.starts_at).toISOString().slice(0,16)} className="min-h-11 rounded-lg border bg-background p-2" /></label>
 <label className="grid gap-1 text-sm">Ends (UTC, exclusive)<input required type="datetime-local" name="end" defaultValue={new Date(term.ends_at).toISOString().slice(0,16)} className="min-h-11 rounded-lg border bg-background p-2" /></label>
 <label className="grid gap-1 text-sm">Term-average points after minimum<input required type="number" min="0" max="100" step="0.5" name="points" defaultValue={term.grade_points} className="min-h-11 rounded-lg border bg-background p-2" /></label>
 </div><button disabled={busy} className="min-h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">{busy ? 'Publishing…' : 'Publish term rule'}</button><p role="status" className="text-sm">{message}</p>
 </form>
}
export default function XpTerms() {
 const [data,setData] = useState<{ courses: Course[]; terms: Term[] } | null>(null)
 const [error,setError] = useState('')
 useEffect(() => { const c = new AbortController(); fetch('/api/teacher/xp-terms', { signal: c.signal }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setData(d) }).catch(e => { if (!c.signal.aborted) setError(e.message) }); return () => c.abort() },[])
 return <main className="mx-auto max-w-4xl space-y-6 p-5 py-8"><Link href="/admin/control-room" className="underline">← Control room</Link><h1 className="text-3xl font-bold">Term XP requirements</h1><p>Starting policy: 1,400 standard / 1,800 Honors XP each term for +5 term-average points. Spending XP does not reduce eligibility. Dates are a starting calendar for 2026–27; update them to match your school calendar. The tracker reports eligibility; apply the points when finalizing grades.</p>{error ? <p role="alert">{error}</p> : !data ? <p role="status">Loading your courses…</p> : data.courses.map(c => <section key={c.id} className="space-y-3"><h2 className="text-xl font-bold">{c.name} · {c.track === 'honors' ? 'Honors' : 'Standard'}</h2>{data.terms.filter(t=>t.course_id===c.id).map(t=><Rule key={t.id} term={t} />)}</section>)}</main>
}
