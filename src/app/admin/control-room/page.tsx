"use client"

import { useCallback, useEffect, useState, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// Types (mirror /api/mastery/grid and /api/mastery/student-work)
// ---------------------------------------------------------------------------
interface Target { id: string; statement: string; domain: string }
interface Student { id: string; name: string; email: string }
interface Cell { value: number | null; count: number }
interface GridData {
  unitId: string
  units: { id: string; name: string }[]
  targets: Target[]
  students: Student[]
  cells: Record<string, Record<string, Cell>>
}
interface WorkItem { lessonTitle: string; blockType: string | null; blockId: string; response: unknown; createdAt: string }
interface RecordItem { target_id: string; level: number; observed_at: string }
interface WorkData { userId: string; unitId: string; targets: Target[]; records: RecordItem[]; work: WorkItem[] }

const EVIDENCE = ['observation', 'exit ticket', 'lab', 'conversation', 'quiz']

// value (1..3 float) -> band 1/2/3 (0 = not rated)
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

function ResponseView({ response }: { response: unknown }) {
  if (response && typeof response === 'object') {
    const o = response as Record<string, unknown>
    const isGewa = 'given' in o || 'equation' in o || 'work' in o || 'answer' in o
    if (isGewa) {
      const field = (k: string, label: string) =>
        o[k] != null && String(o[k]).trim() !== '' ? (
          <div className="text-sm" style={{ marginBottom: 4 }}>
            <b style={{ color: 'var(--secondary-foreground)' }}>{label}:</b> {String(o[k])}
          </div>
        ) : null
      return (
        <div>
          {field('given', 'Given')}
          {field('equation', 'Equation')}
          {field('work', 'Work')}
          {field('answer', 'Answer')}
        </div>
      )
    }
    if ('strokes' in o) {
      const strokes = Array.isArray(o.strokes) ? (o.strokes as { color?: string; points?: { x: number; y: number }[] }[]) : []
      if (strokes.length === 0) return <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>[empty drawing]</p>
      return (
        <svg viewBox="0 0 640 360" style={{ width: '100%', maxWidth: 360, height: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }} role="img" aria-label="Student drawing">
          {strokes.map((s, i) => {
            const pts = (s.points ?? []).map((p) => `${p.x},${p.y}`).join(' ')
            if (!pts) return null
            return <polyline key={i} points={pts} fill="none" stroke={s.color || '#2D2A4A'} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          })}
        </svg>
      )
    }
    if ('pattern' in o || 'interpret' in o) {
      return (
        <div className="text-sm">
          {o.pattern != null && <div style={{ marginBottom: 4 }}><b>Pattern:</b> {String(o.pattern)}</div>}
          {o.interpret != null && <div><b>Interpretation:</b> {String(o.interpret)}</div>}
        </div>
      )
    }
    return <pre className="text-xs" style={{ whiteSpace: 'pre-wrap', color: 'var(--muted-foreground)' }}>{JSON.stringify(o, null, 2)}</pre>
  }
  if (typeof response === 'string') return <p className="text-sm">{response}</p>
  return <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{String(response)}</p>
}

export default function ControlRoomPage() {
  const [grid, setGrid] = useState<GridData | null>(null)
  const [unitId, setUnitId] = useState('unit-1')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sel, setSel] = useState<{ studentId: string; targetId: string } | null>(null)
  const [work, setWork] = useState<WorkData | null>(null)
  const [workLoading, setWorkLoading] = useState(false)
  const [evidence, setEvidence] = useState('observation')
  const [saving, setSaving] = useState(false)

  const loadGrid = useCallback((unit: string) => {
    setLoading(true)
    fetch(`/api/mastery/grid?unit_id=${encodeURIComponent(unit)}`)
      .then((r) => r.json())
      .then((d: GridData & { error?: string }) => {
        if (d.error) setError(d.error)
        else setGrid(d)
        setLoading(false)
      })
      .catch(() => { setError('Could not load the grid'); setLoading(false) })
  }, [])

  useEffect(() => { loadGrid(unitId) }, [unitId, loadGrid])

  const openCell = useCallback((studentId: string, targetId: string) => {
    setSel({ studentId, targetId })
    setWork(null)
    setWorkLoading(true)
    fetch(`/api/mastery/student-work?user_id=${encodeURIComponent(studentId)}&unit_id=${encodeURIComponent(unitId)}`)
      .then((r) => r.json())
      .then((d: WorkData) => { setWork(d); setWorkLoading(false) })
      .catch(() => setWorkLoading(false))
  }, [unitId])

  const closeDrawer = () => { setSel(null); setWork(null) }

  const saveRating = async (level: 1 | 2 | 3) => {
    if (!sel || !grid) return
    const student = grid.students.find((s) => s.id === sel.studentId)
    setSaving(true)
    try {
      await fetch('/api/mastery/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: sel.studentId, user_email: student?.email ?? null, target_id: sel.targetId, level, evidence_source: evidence }),
      })
      // Refresh the grid so the cell reflects the new rolled value.
      loadGrid(unitId)
      // Column-first: advance to the next student on the SAME target.
      const idx = grid.students.findIndex((s) => s.id === sel.studentId)
      const next = grid.students[idx + 1]
      if (next) openCell(next.id, sel.targetId)
      else closeDrawer()
    } catch {
      setError('Could not save the rating')
    } finally {
      setSaving(false)
    }
  }

  const selStudent = grid && sel ? grid.students.find((s) => s.id === sel.studentId) : null
  const selTarget = grid && sel ? grid.targets.find((t) => t.id === sel.targetId) : null
  const selHistory = work && sel ? work.records.filter((r) => r.target_id === sel.targetId) : []

  return (
    <div className="max-w-6xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Class mastery</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Tap any cell to open that student&apos;s work and rate it. These scores drive each student&apos;s Retry lane.
          </p>
        </div>
        <select
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          className="rounded-lg text-sm px-3 py-2"
          style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
        >
          {(grid?.units ?? [{ id: 'unit-1', name: 'Unit 1' }]).map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {error && <div className="text-sm rounded-md px-3 py-2 my-3" style={{ background: 'var(--secondary)', color: 'var(--destructive)' }}>{error}</div>}
      {loading && <p className="text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>Loading the grid…</p>}

      {!loading && grid && grid.students.length === 0 && (
        <p className="text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>No students on your roster yet.</p>
      )}

      {!loading && grid && grid.students.length > 0 && (
        <div className="rounded-xl border mt-4 overflow-x-auto" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 6, padding: 8 }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, zIndex: 2, background: 'var(--card)', textAlign: 'left', padding: '4px 10px', fontSize: 12, color: 'var(--muted-foreground)' }}>Student</th>
                {grid.targets.map((t, i) => (
                  <th key={t.id} title={t.statement} style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', padding: '4px 2px', minWidth: 46 }}>
                    T{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.students.map((s) => (
                <tr key={s.id}>
                  <td style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--card)', fontSize: 13, fontWeight: 500, padding: '4px 10px', whiteSpace: 'nowrap' }}>{s.name}</td>
                  {grid.targets.map((t) => {
                    const c = grid.cells[s.id]?.[t.id]
                    const b = band(c?.value ?? null)
                    return (
                      <td key={t.id} style={{ padding: 0 }}>
                        <button
                          onClick={() => openCell(s.id, t.id)}
                          title={`${s.name} · ${t.statement}`}
                          className="grid place-items-center font-bold"
                          style={{ width: 40, height: 38, borderRadius: 9, fontSize: 13, cursor: 'pointer', ...cellStyle(b) }}
                        >
                          {b === 0 ? '–' : b}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && grid && (
        <div className="flex gap-4 flex-wrap mt-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <span className="inline-flex items-center gap-1.5"><span style={{ width: 13, height: 13, borderRadius: 4, ...cellStyle(3) }} /> Got it (3)</span>
          <span className="inline-flex items-center gap-1.5"><span style={{ width: 13, height: 13, borderRadius: 4, ...cellStyle(2) }} /> Almost (2)</span>
          <span className="inline-flex items-center gap-1.5"><span style={{ width: 13, height: 13, borderRadius: 4, ...cellStyle(1) }} /> Not yet (1)</span>
          <span className="inline-flex items-center gap-1.5"><span style={{ width: 13, height: 13, borderRadius: 4, ...cellStyle(0) }} /> Not rated</span>
          <span style={{ marginLeft: 'auto' }}>Columns are learning targets — hover a header for the full statement.</span>
        </div>
      )}

      {/* scrim + drawer */}
      {sel && (
        <>
          <div onClick={closeDrawer} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'color-mix(in oklch, var(--foreground) 45%, transparent)' }} />
          <aside
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, maxWidth: '92vw', zIndex: 50,
              background: 'var(--card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
              boxShadow: '-20px 0 50px -20px color-mix(in oklch, var(--foreground) 40%, transparent)',
            }}
          >
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <button onClick={closeDrawer} style={{ float: 'right', border: 'none', background: 'transparent', color: 'var(--muted-foreground)', fontSize: 20, cursor: 'pointer' }}>×</button>
              <div className="font-bold" style={{ fontSize: 18 }}>{selStudent?.name}</div>
              <div className="text-sm" style={{ color: 'var(--muted-foreground)', marginTop: 2 }}>{selTarget?.statement}</div>
              {selTarget && <div className="text-xs" style={{ color: 'var(--muted-foreground)', marginTop: 4, textTransform: 'capitalize' }}>{selTarget.domain}</div>}
            </div>

            <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
              {/* rating history */}
              <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--muted-foreground)' }}>Rating history</div>
              {selHistory.length > 0 ? (
                <div className="flex flex-col gap-1.5 mb-5">
                  {selHistory.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-sm rounded-md px-3 py-1.5" style={{ background: 'var(--secondary)' }}>
                      <span>{fmtDate(r.observed_at)}</span>
                      <span style={{ fontWeight: 700 }}>{levelWord(r.level)} ({r.level})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>No prior ratings on this target.</p>
              )}

              {/* submitted work */}
              <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--muted-foreground)' }}>Submitted work (this unit)</div>
              {workLoading && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading work…</p>}
              {!workLoading && work && work.work.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No submitted work captured yet for this unit.</p>
              )}
              {!workLoading && work && work.work.map((w) => (
                <div key={`${w.lessonTitle}-${w.blockId}`} className="rounded-lg border p-3 mb-3" style={{ borderColor: 'var(--border)', background: 'color-mix(in oklch, var(--secondary) 40%, transparent)' }}>
                  <div className="text-xs mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                    {w.lessonTitle}{w.blockType ? ` · ${w.blockType}` : ''} · {fmtDate(w.createdAt)}
                  </div>
                  <ResponseView response={w.response} />
                </div>
              ))}
            </div>

            {/* rater */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">Your mastery rating</div>
                <select value={evidence} onChange={(e) => setEvidence(e.target.value)} className="text-xs rounded-md px-2 py-1" style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
                  {EVIDENCE.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    disabled={saving}
                    onClick={() => saveRating(lvl as 1 | 2 | 3)}
                    className="flex-1 rounded-xl font-bold"
                    style={{
                      padding: '12px 0', fontSize: 13, cursor: 'pointer', border: '1.5px solid var(--border)',
                      background: lvl === 1 ? 'color-mix(in oklch, var(--destructive) 12%, transparent)' : lvl === 2 ? 'color-mix(in oklch, var(--reward) 22%, transparent)' : 'color-mix(in oklch, var(--success) 14%, transparent)',
                      color: lvl === 1 ? 'var(--destructive)' : lvl === 2 ? 'var(--reward-foreground)' : 'var(--success)',
                    }}
                  >
                    {lvl} · {levelWord(lvl)}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                Saving advances to the next student on this target.
              </p>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
