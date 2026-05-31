'use client'

/**
 * MathControlRoom — the "Math" view of the control room (review-first).
 *
 * Leads with the WARM-UPS TO REVIEW queue: rating happens only from a submitted
 * warm-up, and only on the competency(s) that warm-up actually tests. Open a
 * student → read their answer once → rate each tested competency (1-2-3). Each
 * rating writes the observation (milestones + points fire); the submission
 * resolves once every tested competency is rated. The 11-competency grid sits
 * below as a READ-ONLY class snapshot — it never implies "fill in all eleven."
 *
 * Self-contained so the main control-room file only gains a view toggle. Scoped
 * to the control room's active class via `classId`.
 */
import { useCallback, useEffect, useState, type CSSProperties } from 'react'

interface Competency { id: string; code: string; statement: string; strand: string }
interface Student { id: string; name: string; email: string }
interface Cell { value: number | null; count: number; pending: number }
interface GridData { competencies: Competency[]; students: Student[]; cells: Record<string, Record<string, Cell>> }
interface QueueItem { studentId: string; name: string; count: number; oldestAgeHours: number; aged: boolean }

interface Submission {
  id: string
  competency_id: string
  prompt: string | null
  response: string
  status: string
  submitted_at: string
  tested_competency_ids: string[]
  rated_competency_ids: string[]
}

function band(v: number | null): 0 | 1 | 2 | 3 {
  if (v == null) return 0
  if (v >= 2.5) return 3
  if (v >= 1.5) return 2
  return 1
}
function cellStyle(b: 0 | 1 | 2 | 3): CSSProperties {
  if (b === 3) return { background: 'color-mix(in oklch, var(--success) 80%, transparent)', color: '#fff' }
  if (b === 2) return { background: 'color-mix(in oklch, var(--reward) 75%, transparent)', color: 'var(--reward-foreground)' }
  if (b === 1) return { background: 'color-mix(in oklch, var(--destructive) 72%, transparent)', color: '#fff' }
  return { background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px dashed var(--border)' }
}
const levelWord = (l: number) => (l === 1 ? 'Not yet' : l === 2 ? 'Almost' : 'Got it')
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export default function MathControlRoom({ classId }: { classId?: string | null }) {
  const classQuery = classId ? `?class=${encodeURIComponent(classId)}` : ''
  const [grid, setGrid] = useState<GridData | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState<{ studentId: string; name: string } | null>(null)
  const [subs, setSubs] = useState<Submission[]>([])
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const refresh = useCallback(() => {
    Promise.all([
      fetch(`/api/math-spine/math-grid${classQuery}`).then((r) => r.json()),
      fetch(`/api/math-spine/warmup-queue${classQuery}`).then((r) => r.json()),
    ])
      .then(([g, q]) => {
        setGrid(g?.error ? null : g)
        setQueue(q?.queue ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [classQuery])

  useEffect(() => { refresh() }, [refresh])

  const loadStudent = useCallback((studentId: string) => {
    setDrawerLoading(true)
    return fetch(`/api/math-spine/student-warmups?user_id=${encodeURIComponent(studentId)}`)
      .then((r) => r.json())
      .then((d) => {
        setSubs(d.submissions ?? [])
        setDrawerLoading(false)
        return (d.submissions ?? []) as Submission[]
      })
      .catch(() => { setDrawerLoading(false); return [] as Submission[] })
  }, [])

  const openStudent = useCallback((studentId: string, name: string) => {
    setSel({ studentId, name })
    setSubs([])
    loadStudent(studentId)
  }, [loadStudent])

  const closeDrawer = () => { setSel(null); setSubs([]) }

  const compById = (id: string) => grid?.competencies.find((c) => c.id === id)
  const currentValue = (studentId: string, competencyId: string) =>
    grid?.cells[studentId]?.[competencyId]?.value ?? null

  async function rate(submission: Submission, competencyId: string, level: 1 | 2 | 3) {
    if (!sel) return
    const key = `${submission.id}:${competencyId}:${level}`
    setSavingKey(key)
    try {
      const res = await fetch('/api/math-spine/warmup-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submission.id, competency_id: competencyId, level }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Save failed')
      const awarded = (d.awarded ?? []) as { milestone: string; points: number }[]
      if (awarded.length > 0) {
        const pts = awarded.reduce((s, g) => s + g.points, 0)
        setFlash(`🎉 +${pts} pts for ${sel.name}`)
        setTimeout(() => setFlash(null), 3000)
      }
      refresh()
      const fresh = await loadStudent(sel.studentId)
      if (!fresh.some((s) => s.status === 'pending')) closeDrawer()
    } catch {
      // keep drawer open on error
    } finally {
      setSavingKey(null)
    }
  }

  if (loading) return <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading math spine…</p>
  if (!grid) return <p className="text-sm" style={{ color: 'var(--destructive)' }}>Could not load the math grid.</p>
  if (grid.students.length === 0) return <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No students in scope.</p>

  const activeSub = subs.find((s) => s.status === 'pending') ?? null

  return (
    <div>
      {flash && (
        <div className="text-sm rounded-md px-3 py-2 mb-3" style={{ background: 'color-mix(in oklch, var(--success) 18%, transparent)', color: 'var(--foreground)' }}>
          {flash}
        </div>
      )}

      {/* Review-first: the warm-ups waiting to be rated. */}
      <div className="rounded-xl border p-4 mb-5" style={{ borderColor: 'color-mix(in oklch, var(--reward) 35%, var(--border))', background: 'color-mix(in oklch, var(--reward) 8%, transparent)' }}>
        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>
          Warm-ups to review · {queue.length}
        </div>
        {queue.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>All caught up — no warm-ups waiting.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {queue.map((q) => (
              <button
                key={q.studentId}
                onClick={() => openStudent(q.studentId, q.name)}
                className="text-sm rounded-lg px-3 py-1.5 border"
                style={{ borderColor: q.aged ? 'var(--destructive)' : 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
                title={`${q.count} pending · oldest ${q.oldestAgeHours}h`}
              >
                {q.name} · {q.count}{q.aged ? ' ⚠' : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Read-only class snapshot. */}
      <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Class snapshot</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 2 }}>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, background: 'var(--background)', textAlign: 'left', padding: '4px 8px', fontSize: 12 }}>Student</th>
              {grid.competencies.map((c) => (
                <th key={c.id} title={c.statement} style={{ padding: '4px 6px', fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 600 }}>{c.code}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.students.map((s) => (
              <tr key={s.id}>
                <td style={{ position: 'sticky', left: 0, background: 'var(--background)', padding: '4px 8px', fontSize: 13, whiteSpace: 'nowrap' }}>{s.name}</td>
                {grid.competencies.map((c) => {
                  const cell = grid.cells[s.id]?.[c.id] ?? { value: null, count: 0, pending: 0 }
                  const b = band(cell.value)
                  return (
                    <td key={c.id} style={{ padding: 0 }}>
                      <div
                        style={{ ...cellStyle(b), position: 'relative', width: 40, height: 30, borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title={`${c.code} · ${cell.value === null ? 'not rated' : cell.value.toFixed(1)}${cell.pending ? ` · ${cell.pending} to review` : ''}`}
                      >
                        {cell.value === null ? '·' : cell.value.toFixed(1)}
                        {cell.pending > 0 && (
                          <span style={{ position: 'absolute', top: 2, right: 3, width: 7, height: 7, borderRadius: '50%', background: 'var(--destructive)' }} />
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
        Read-only overview. Rate from the review queue above — only the competencies a warm-up tests.
      </p>

      {/* Review drawer */}
      {sel && (
        <>
          <div onClick={closeDrawer} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'color-mix(in oklch, var(--foreground) 45%, transparent)' }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(480px, 94vw)', zIndex: 41, background: 'var(--background)', borderLeft: '1px solid var(--border)', padding: 20, overflowY: 'auto' }}>
            <button onClick={closeDrawer} style={{ float: 'right', border: 'none', background: 'transparent', color: 'var(--muted-foreground)', fontSize: 20, cursor: 'pointer' }}>×</button>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{sel.name}</h3>
            <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>Review the warm-up; rate only the competencies it tests.</p>

            {drawerLoading && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>}

            {!drawerLoading && !activeSub && (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No pending warm-up for this student.</p>
            )}

            {!drawerLoading && activeSub && (
              <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Submitted {fmtDate(activeSub.submitted_at)}</div>
                {activeSub.prompt && (
                  <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}><b>Prompt:</b> {activeSub.prompt}</p>
                )}
                <p className="text-sm mb-3" style={{ color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>{activeSub.response}</p>

                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>
                  Rate the tested competenc{activeSub.tested_competency_ids.length === 1 ? 'y' : 'ies'}
                </div>
                {activeSub.tested_competency_ids.map((cid) => {
                  const comp = compById(cid)
                  const rated = activeSub.rated_competency_ids.includes(cid)
                  const cur = currentValue(sel.studentId, cid)
                  return (
                    <div key={cid} className="py-2.5" style={{ borderTop: '0.5px solid var(--border)' }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-medium rounded px-2 py-0.5 tabular-nums" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{comp?.code ?? '?'}</span>
                        <span className="text-[13px]" style={{ color: 'var(--foreground)' }}>{comp?.statement ?? cid}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)', minWidth: 92 }}>
                          {cur === null ? 'not yet rated' : `now ${cur.toFixed(1)} (${levelWord(band(cur))})`}
                        </span>
                        {rated ? (
                          <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>✓ rated</span>
                        ) : (
                          [1, 2, 3].map((lv) => {
                            const key = `${activeSub.id}:${cid}:${lv}`
                            return (
                              <button
                                key={lv}
                                disabled={savingKey !== null}
                                onClick={() => rate(activeSub, cid, lv as 1 | 2 | 3)}
                                className="text-xs rounded-md border px-2.5 py-1 disabled:opacity-50"
                                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                              >
                                {savingKey === key ? '…' : `${lv} · ${levelWord(lv)}`}
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
