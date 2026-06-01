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
import { StrokeShapes, type Stroke as DrawStroke } from '@/lib/draw/strokes'

interface Competency { id: string; code: string; statement: string; strand: string }
interface Student { id: string; name: string; email: string }
interface Cell { value: number | null; count: number; pending: number }
interface GridData { competencies: Competency[]; students: Student[]; cells: Record<string, Record<string, Cell>> }
interface QueueItem { studentId: string; name: string; count: number; oldestAgeHours: number; aged: boolean }

interface StrokePoint { x: number; y: number }
interface Stroke { color?: string; width?: number; points: StrokePoint[] }
interface GewaResponse {
  given?: string
  equation?: string
  work?: string
  answer?: string
  workStrokes?: Stroke[]
  workTexts?: { x: number; y: number; text: string; size?: number }[]
  sandbox?: { lines?: string[]; answerIndex?: number }
}
interface Submission {
  id: string
  competency_id: string
  prompt: string | null
  response: string
  response_json?: GewaResponse | null
  status: string
  submitted_at: string
  tested_competency_ids: string[]
  rated_competency_ids: string[]
}

type BoardText = { x: number; y: number; text: string; size?: number }

function BoardSvg({ strokes, texts }: { strokes?: Stroke[]; texts?: BoardText[] }) {
  const hasStrokes = strokes && strokes.length > 0
  const hasTexts = texts && texts.length > 0
  if (!hasStrokes && !hasTexts) return null
  return (
    <svg viewBox="0 0 640 360" style={{ width: '100%', maxWidth: 400, height: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }} role="img" aria-label="student work">
      {/* typed text under the strokes, matching the student's board */}
      {(texts ?? []).map((t, i) => (
        <text key={`t${i}`} x={t.x} y={t.y} fontSize={t.size ?? 26} fill="#1A1730" fontFamily="ui-sans-serif, system-ui, sans-serif">{t.text}</text>
      ))}
      <StrokeShapes strokes={(strokes ?? []) as DrawStroke[]} />
    </svg>
  )
}

function WarmupAnswer({ sub }: { sub: Submission }) {
  const rj = sub.response_json
  if (!rj) {
    return <p className="text-sm" style={{ color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>{sub.response}</p>
  }
  const field = (label: string, val?: string) =>
    val && String(val).trim() ? (
      <div className="text-sm" style={{ marginBottom: 3 }}>
        <b style={{ color: 'var(--secondary-foreground)' }}>{label}:</b> {String(val)}
      </div>
    ) : null
  const hasBoard = (rj.workStrokes && rj.workStrokes.length > 0) || (rj.workTexts && rj.workTexts.length > 0)
  return (
    <div>
      {field('Given', rj.given)}
      {field('Equation', rj.equation)}
      {field('Answer', rj.answer)}
      {hasBoard && (
        <div className="mt-2">
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Work board (typed + drawn)</div>
          <BoardSvg strokes={rj.workStrokes} texts={rj.workTexts} />
        </div>
      )}
      {!rj.given && !rj.equation && !rj.answer && !hasBoard && (
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{sub.response || '[submitted]'}</p>
      )}
    </div>
  )
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
  // Between students we pause on a gate so your eyes land before the next swap.
  const [nextGate, setNextGate] = useState<{ id: string; name: string } | null>(null)

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

  const closeDrawer = () => { setSel(null); setSubs([]); setNextGate(null) }

  // Keyboard-first review: 1/2/3 rate the first unrated tested competency.
  useEffect(() => {
    if (!sel) return
    const onKey = (e: KeyboardEvent) => {
      if (nextGate) return // gate owns the keyboard while it's up
      if (e.key === 'Escape') { closeDrawer(); return }
      if (savingKey) return
      const active = subs.find((s) => s.status === 'pending')
      if (!active) return
      const cid = active.tested_competency_ids.find((c) => !active.rated_competency_ids.includes(c))
      if (!cid) return
      if (e.key === '1' || e.key === '2' || e.key === '3') { e.preventDefault(); rate(active, cid, Number(e.key) as 1 | 2 | 3) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, subs, savingKey, nextGate])

  // Inter-student gate: any key (or Continue) advances; Esc closes instead.
  useEffect(() => {
    if (!nextGate) return
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      if (e.key === 'Escape') { setNextGate(null); closeDrawer(); return }
      const g = nextGate
      setNextGate(null)
      openStudent(g.id, g.name)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextGate, openStudent])

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
      if (!fresh.some((s) => s.status === 'pending')) {
        // Student done — advance to the next student with warm-ups to review,
        // skipping those with nothing pending. Close if everyone's caught up.
        const q = await fetch(`/api/math-spine/warmup-queue${classQuery}`).then((r) => r.json()).catch(() => ({ queue: [] }))
        const pendingIds = ((q.queue ?? []) as QueueItem[]).map((x) => x.studentId)
        const order = grid?.students.map((s) => s.id) ?? []
        const idx = order.indexOf(sel.studentId)
        const rotated = [...order.slice(idx + 1), ...order.slice(0, Math.max(0, idx))]
        const nextId = rotated.find((id) => id !== sel.studentId && pendingIds.includes(id))
        const next = grid?.students.find((s) => s.id === nextId)
        // Pause on the gate before swapping students; close when none are left.
        if (next) setNextGate({ id: next.id, name: next.name })
        else closeDrawer()
      }
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
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            Warm-ups to review · {queue.length}
          </div>
          {queue.length > 0 && (
            <button onClick={() => openStudent(queue[0].studentId, queue[0].name)} className="text-xs font-bold rounded-lg px-3 py-1.5" style={{ background: 'var(--reward)', color: 'var(--reward-foreground)', border: 'none', cursor: 'pointer' }}>Review all →</button>
          )}
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
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(640px, 96vw)', zIndex: 41, background: 'var(--background)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'row' }}>
            {/* roster rail — students with warm-ups to review; greyed when done */}
            <div style={{ width: 168, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>
                {queue.length > 0 ? `${queue.length} to review` : 'All caught up'}
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
                {grid.students.map((st) => {
                  const qc = queue.find((q) => q.studentId === st.id)?.count ?? 0
                  const done = qc === 0
                  const active = sel.studentId === st.id
                  return (
                    <button
                      key={st.id}
                      onClick={() => { if (!done) openStudent(st.id, st.name) }}
                      disabled={done}
                      title={st.name}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '7px 12px', border: 'none', borderLeft: `2px solid ${active ? 'var(--reward)' : 'transparent'}`, background: active ? 'color-mix(in oklch, var(--reward) 14%, transparent)' : 'transparent', color: 'var(--foreground)', opacity: done ? 0.45 : 1, cursor: done ? 'default' : 'pointer' }}
                    >
                      <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.name}</span>
                      {done ? <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 12 }}>✓</span>
                        : <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>{qc}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
            {/* content column */}
            <div style={{ flex: 1, minWidth: 0, padding: 20, overflowY: 'auto', position: 'relative' }}>
            <button onClick={closeDrawer} style={{ float: 'right', border: 'none', background: 'transparent', color: 'var(--muted-foreground)', fontSize: 20, cursor: 'pointer' }}>×</button>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{sel.name}</h3>
            <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>Review the warm-up; rate only the competencies it tests. Keys <b>1·2·3</b> rate; finishing a student jumps to the next.</p>

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
                <div className="mb-3"><WarmupAnswer sub={activeSub} /></div>

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
            {nextGate && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'color-mix(in oklch, var(--background) 94%, transparent)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>✓ {sel.name} — all rated</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground)' }}>Next: {nextGate.name}</div>
                <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                  {queue.find((q) => q.studentId === nextGate.id)?.count ?? 0} to review · {queue.length} student{queue.length === 1 ? '' : 's'} left
                </div>
                <button
                  onClick={() => { const g = nextGate; setNextGate(null); openStudent(g.id, g.name) }}
                  style={{ marginTop: 4, background: 'var(--reward)', color: 'var(--reward-foreground)', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  Continue →
                </button>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>or press any key · Esc to close</div>
              </div>
            )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
