"use client"

/**
 * VocabAssignBoard — assign vocabulary sets to a class, then read the class × words grid.
 *
 * Left: the class's assigned sets (with due dates) and every published set that can be
 * assigned. Right: for the selected set, one row per student and one column per word.
 * A cell is the student's ACCURACY on that word over every arcade attempt (n in the
 * corner). The view switch splits the same attempts by the SEI state that was on when
 * the word was attempted: "with supports" (Spanish clue showing, or full/partial level)
 * vs "without" (bare). A word that is green with supports and empty without is known
 * through the route, not yet on its own — that is the whole point of the split.
 * Bands match the Control Room: ≥80 got it · 50–79 almost · <50 not yet.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, CalendarDays, Trash2, Plus } from 'lucide-react'

type Course = { id: string; name: string; section: string | null; program?: string }
type SetRow = { id: string; label: string; slug: string | null; unit: string | null; terms: number }
type Assignment = { id: string; vocabulary_set_id: string; due_on: string | null; note: string | null; active: boolean; created_at: string }
type Term = { id: string; term: string; tier: number | null; icon: string | null; cognate: string | null }
type Cell = { attempts: number; correct: number; accuracy: number; attempts_supported: number; correct_supported: number; attempts_bare: number; correct_bare: number; last_at: string }
type Student = { id: string; name: string; wida: number | null; homeLang: string | null; cells: Record<string, Cell> }
type View = 'all' | 'supported' | 'bare'

const bandColor = (acc: number | null) => acc === null ? 'var(--muted-foreground)' : acc >= 80 ? 'var(--success)' : acc >= 50 ? 'var(--reward-foreground)' : 'var(--destructive)'
const bandBg = (acc: number | null) => acc === null ? 'transparent' : acc >= 80 ? 'color-mix(in oklch, var(--success) 14%, transparent)' : acc >= 50 ? 'color-mix(in oklch, var(--reward) 18%, transparent)' : 'color-mix(in oklch, var(--destructive) 12%, transparent)'

function pick(c: Cell | undefined, view: View): { acc: number | null; n: number } {
  if (!c) return { acc: null, n: 0 }
  const n = view === 'all' ? c.attempts : view === 'supported' ? c.attempts_supported : c.attempts_bare
  const k = view === 'all' ? c.correct : view === 'supported' ? c.correct_supported : c.correct_bare
  return n === 0 ? { acc: null, n: 0 } : { acc: Math.round((100 * k) / n), n }
}

export default function VocabAssignBoard() {
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState('')
  const [sets, setSets] = useState<SetRow[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedSet, setSelectedSet] = useState('')
  const [dueOn, setDueOn] = useState('')
  const [grid, setGrid] = useState<{ terms: Term[]; students: Student[] } | null>(null)
  const [view, setView] = useState<View>('all')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/teacher/courses').then((r) => (r.ok ? r.json() : { courses: [] })).then((d: { courses?: Course[] }) => {
      const cs = d.courses ?? []; setCourses(cs); setCourseId((c) => c || cs[0]?.id || '')
    }).catch(() => {})
  }, [])

  const loadAssignments = useCallback(async () => {
    if (!courseId) return
    const r = await fetch(`/api/vocab/assignments?course_id=${courseId}`)
    if (!r.ok) return
    const d = (await r.json()) as { assignments: Assignment[]; sets: SetRow[] }
    setSets(d.sets); setAssignments(d.assignments.filter((a) => a.active))
    setSelectedSet((s) => s && d.assignments.some((a) => a.active && a.vocabulary_set_id === s) ? s : (d.assignments.find((a) => a.active)?.vocabulary_set_id ?? ''))
  }, [courseId])
  useEffect(() => { loadAssignments() }, [loadAssignments])

  useEffect(() => {
    if (!courseId || !selectedSet) { setGrid(null); return }
    let active = true
    fetch(`/api/vocab/competency?course_id=${courseId}&set_id=${selectedSet}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (active && d) setGrid(d) }).catch(() => {})
    return () => { active = false }
  }, [courseId, selectedSet])

  const assign = async (setId: string) => {
    setBusy(true)
    await fetch('/api/vocab/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ course_id: courseId, vocabulary_set_id: setId, due_on: dueOn || null }) })
    setBusy(false); setSelectedSet(setId); loadAssignments()
  }
  const unassign = async (id: string) => {
    setBusy(true)
    await fetch('/api/vocab/assignments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setBusy(false); loadAssignments()
  }

  const setBy = useMemo(() => new Map(sets.map((s) => [s.id, s])), [sets])
  const assignedIds = useMemo(() => new Set(assignments.map((a) => a.vocabulary_set_id)), [assignments])
  const unassigned = sets.filter((s) => !assignedIds.has(s.id))

  // Column + row summaries for the current view.
  const termAvg = (termId: string) => {
    const vals = (grid?.students ?? []).map((s) => pick(s.cells[termId], view)).filter((v) => v.acc !== null).map((v) => v.acc as number)
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  }
  const studentAvg = (s: Student) => {
    const vals = (grid?.terms ?? []).map((t) => pick(s.cells[t.id], view)).filter((v) => v.acc !== null).map((v) => v.acc as number)
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/vocabulary" className="inline-flex items-center gap-1 text-sm" style={{ color: 'var(--muted-foreground)' }}><ArrowLeft size={14} /> Vocabulary</Link>
        <BookOpen size={20} style={{ color: 'var(--primary)' }} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-bold leading-tight">Assign words · read competency</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Assign a set to a class; the arcade opens on it. Every word attempt in any game lands here as accuracy — split by whether the SEI route was on.</p>
        </div>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)', minHeight: 44 }}>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? ` · ${c.section}` : ''}</option>)}
        </select>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: 'minmax(260px, 320px) minmax(0, 1fr)' }}>
        {/* ---------- assign ---------- */}
        <div className="space-y-4">
          <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Assigned to this class</div>
            {assignments.length === 0 && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Nothing assigned yet.</p>}
            <div className="space-y-1.5">
              {assignments.map((a) => {
                const s = setBy.get(a.vocabulary_set_id)
                const on = selectedSet === a.vocabulary_set_id
                return (
                  <div key={a.id} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: on ? 'color-mix(in oklch, var(--primary) 12%, var(--card))' : 'transparent', border: `1px solid ${on ? 'var(--primary)' : 'var(--border)'}` }}>
                    <button type="button" onClick={() => setSelectedSet(a.vocabulary_set_id)} className="min-w-0 flex-1 text-left">
                      <div className="text-sm font-semibold truncate">{s?.label ?? 'Set'}</div>
                      <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{s?.terms ?? '?'} words{a.due_on ? ` · due ${a.due_on}` : ''}</div>
                    </button>
                    <button type="button" onClick={() => unassign(a.id)} disabled={busy} aria-label="Unassign" title="Unassign (attempts are kept)" className="shrink-0 rounded-full p-2" style={{ color: 'var(--muted-foreground)', minWidth: 36, minHeight: 36 }}><Trash2 size={14} /></button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Assign a set</div>
            <label className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
              <CalendarDays size={13} /> Due
              <input type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} className="rounded-lg border px-2 py-1 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--background)', minHeight: 36 }} />
            </label>
            <div className="space-y-1 max-h-[46vh] overflow-y-auto pr-1">
              {unassigned.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ border: '1px solid var(--border)' }}>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{s.label}</div>
                    <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{s.unit ? `${s.unit} · ` : ''}{s.terms} words</div>
                  </div>
                  <button type="button" onClick={() => assign(s.id)} disabled={busy} className="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', minHeight: 32 }}><Plus size={12} /> Assign</button>
                </div>
              ))}
              {unassigned.length === 0 && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Every published set is assigned.</p>}
            </div>
          </div>
        </div>

        {/* ---------- competency grid ---------- */}
        <div className="rounded-2xl border p-4 min-w-0" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Competency · {setBy.get(selectedSet)?.label ?? 'pick an assigned set'}</div>
            <div className="ml-auto inline-flex rounded-full border p-0.5 text-xs" style={{ borderColor: 'var(--border)' }}>
              {([['all', 'All attempts'], ['supported', 'With supports'], ['bare', 'Without supports']] as [View, string][]).map(([v, label]) => (
                <button key={v} type="button" onClick={() => setView(v)} className="rounded-full px-3 py-1.5" style={{ background: view === v ? 'var(--primary)' : 'transparent', color: view === v ? 'var(--primary-foreground)' : 'var(--foreground)', fontWeight: view === v ? 700 : 500, minHeight: 32 }}>{label}</button>
              ))}
            </div>
          </div>
          {!grid ? (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Select an assigned set to see the class × words grid.</p>
          ) : grid.terms.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>This set has no words.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="text-xs" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th className="sticky left-0 text-left px-2 py-2 font-semibold" style={{ background: 'var(--card)', minWidth: 160 }}>Student</th>
                    {grid.terms.map((t) => (
                      <th key={t.id} className="px-1 py-2 font-semibold text-center align-bottom" style={{ minWidth: 64 }} title={t.cognate ?? undefined}>
                        <div style={{ fontSize: 18, lineHeight: 1 }}>{t.icon ?? ''}</div>
                        <div className="truncate" style={{ maxWidth: 80 }}>{t.term}</div>
                        <div className="font-normal" style={{ color: 'var(--muted-foreground)' }}>T{t.tier ?? '·'}</div>
                      </th>
                    ))}
                    <th className="px-2 py-2 text-right font-semibold" style={{ minWidth: 56 }}>Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {grid.students.map((s) => {
                    const avg = studentAvg(s)
                    return (
                      <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="sticky left-0 px-2 py-1.5 whitespace-nowrap" style={{ background: 'var(--card)' }}>
                          <div className="font-medium truncate" style={{ maxWidth: 150 }}>{s.name}</div>
                          {s.wida !== null && <div className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>WIDA {s.wida}{s.homeLang ? ` · ${s.homeLang}` : ''}</div>}
                        </td>
                        {grid.terms.map((t) => {
                          const v = pick(s.cells[t.id], view)
                          return (
                            <td key={t.id} className="px-1 py-1 text-center" title={v.n ? `${v.acc}% over ${v.n} attempt${v.n === 1 ? '' : 's'}` : 'no attempts'}>
                              <span className="inline-block rounded-md px-1.5 py-1 font-bold tabular-nums" style={{ minWidth: 40, color: bandColor(v.acc), background: bandBg(v.acc) }}>
                                {v.acc === null ? '—' : `${v.acc}`}
                                {v.n > 0 && <span className="ml-0.5 font-normal" style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>{v.n}</span>}
                              </span>
                            </td>
                          )
                        })}
                        <td className="px-2 py-1.5 text-right font-bold tabular-nums" style={{ color: bandColor(avg) }}>{avg === null ? '—' : `${avg}%`}</td>
                      </tr>
                    )
                  })}
                  <tr style={{ borderTop: '2px solid var(--border)' }}>
                    <td className="sticky left-0 px-2 py-2 font-semibold" style={{ background: 'var(--card)' }}>Class</td>
                    {grid.terms.map((t) => { const a = termAvg(t.id); return <td key={t.id} className="px-1 py-2 text-center font-bold tabular-nums" style={{ color: bandColor(a) }}>{a === null ? '—' : `${a}%`}</td> })}
                    <td />
                  </tr>
                </tbody>
              </table>
              <p className="text-[11px] mt-3" style={{ color: 'var(--muted-foreground)' }}>
                Accuracy over every arcade attempt (n = attempts). <b style={{ color: 'var(--success)' }}>≥80 got it</b> · <b style={{ color: 'var(--reward-foreground)' }}>50–79 almost</b> · <b style={{ color: 'var(--destructive)' }}>&lt;50 not yet</b>. “With supports” = the Spanish clue was showing or full/partial support was on; “without” = bare. Green with supports and blank without means the word is known through the route, not yet on its own.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
