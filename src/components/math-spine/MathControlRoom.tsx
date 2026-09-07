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
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import MathWorkReview from './MathWorkReview'
import type { MathResponse } from '@/lib/math-response'


interface Competency { id: string; code: string; statement: string; strand: string }
interface Student { id: string; name: string; email: string; ratable?: boolean }
type RungState = 'not-yet' | 'almost' | 'got-it' | 'refresh'
interface Cell { value: number | null; count: number; pending: number; state?: RungState | null }
interface GridData {
  competencies: Competency[]
  students: Student[]
  cells: Record<string, Record<string, Cell>>
  currentRung?: Record<string, { competencyId: string; kind: string } | null>
}
interface QueueItem { studentId: string; name: string; count: number; oldestAgeHours: number; aged: boolean }

type GewaResponse = MathResponse
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
  feedback?: { message: string }[]
  revision?: { id: string; response_json: MathResponse; message: string; needs_help: boolean; status: string }
  self_check?: 'match' | 'mismatch' | 'unknown' | null
}

function WarmupAnswer({ sub }: { sub: Submission }) {
  return <MathWorkReview key={sub.id} value={sub.response_json} fallback={sub.response} />
}

// Snapshot cells speak the picker's four-state vocabulary (the same words
// students see), not raw colour bands. Never colour-only: each state pairs a
// colour with a glyph/value so the grid survives colour-blindness and print.
const STATE_META: Record<RungState, { word: string; glyph: string; style: CSSProperties }> = {
  'got-it':  { word: 'Got it',          glyph: '',  style: { background: 'color-mix(in oklch, var(--success) 78%, transparent)', color: '#fff' } },
  'almost':  { word: 'Almost',          glyph: '',  style: { background: 'color-mix(in oklch, var(--reward) 75%, transparent)', color: 'var(--reward-foreground)' } },
  'not-yet': { word: 'Not yet',         glyph: '',  style: { background: 'color-mix(in oklch, var(--destructive) 70%, transparent)', color: '#fff' } },
  'refresh': { word: 'Needs a refresh', glyph: '↻', style: { background: 'color-mix(in oklch, var(--primary) 65%, transparent)', color: '#fff' } },
}
const EMPTY_CELL: CSSProperties = { background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px dashed var(--border)' }
function stateOf(cell: Cell): RungState | null {
  if (cell.state) return cell.state
  if (cell.value == null) return null
  return cell.value >= 2.5 ? 'got-it' : cell.value >= 1.5 ? 'almost' : 'not-yet'
}
type SnapshotSort = 'name' | 'progress' | 'needs-me'
const levelWord = (l: number) => (l === 1 ? 'Not yet' : l === 2 ? 'Almost' : 'Got it')
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export default function MathControlRoom({ classId, teacher }: { classId?: string | null; teacher?: string | null }) {
  // class + (admin-only) teacher scope, as one query string.
  const scopeParams = new URLSearchParams()
  if (classId) scopeParams.set('class', classId)
  if (teacher) scopeParams.set('teacher', teacher)
  const classQuery = scopeParams.size > 0 ? `?${scopeParams.toString()}` : ''
  const [grid, setGrid] = useState<GridData | null>(null)
  const [snapshotSort, setSnapshotSort] = useState<SnapshotSort>('name')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState<{ studentId: string; name: string } | null>(null)
  const [subs, setSubs] = useState<Submission[]>([])
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  // Written feedback (one-way note to the student, lands in their bell + growth page)
  const [fbText, setFbText] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | null>(null)
  const [requestRevision, setRequestRevision] = useState(false)
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

  const studentLoad = useRef(0)
  const loadStudent = useCallback((studentId: string) => {
    const generation = ++studentLoad.current
    setDrawerLoading(true)
    return fetch(`/api/math-spine/student-warmups?user_id=${encodeURIComponent(studentId)}`)
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Could not load work'); return d })
      .then((d) => {
        if (generation !== studentLoad.current) return [] as Submission[]
        const enriched = (d.submissions ?? []).map((sub: Submission) => ({ ...sub,
          feedback: (d.feedback ?? []).filter((f: { submission_id: string }) => f.submission_id === sub.id),
          revision: (d.revisions ?? []).find((r: { submission_id: string }) => r.submission_id === sub.id),
        }))
        setSubs(enriched)
        setDrawerLoading(false)
        return enriched as Submission[]
      })
      .catch((e) => { if (generation === studentLoad.current) { setDrawerLoading(false); setFlash(e.message) } return [] as Submission[] })
  }, [])

  const openStudent = useCallback((studentId: string, name: string) => {
    if (savingKey) return
    // The grading drawer is YOUR roster only — admin included. Other teachers'
    // students stay visible in the snapshot grid, but never open here.
    if (grid?.students.find((st) => st.id === studentId)?.ratable === false) return
    setSel({ studentId, name })
    setSubs([])
    loadStudent(studentId)
  }, [loadStudent, grid, savingKey])

  const closeDrawer = useCallback(() => { if (savingKey) return; studentLoad.current++; setSel(null); setSubs([]); setNextGate(null) }, [savingKey])

  const draftId = subs.find(s => s.status === 'pending' || s.revision?.status === 'pending')?.id
  const loadedDraft = useRef<string | null>(null)
  useEffect(() => {
    loadedDraft.current = null
    setFbText(''); setSelectedLevel(null); setRequestRevision(false)
    if (!draftId) return
    try {
      const raw = sessionStorage.getItem('math-review:' + draftId)
      if (raw) { const d = JSON.parse(raw); setFbText(d.message ?? ''); setSelectedLevel(d.level ?? null); setRequestRevision(d.revision ?? false) }
    } catch {}
    loadedDraft.current = draftId
  }, [draftId])
  useEffect(() => {
    if (!draftId || loadedDraft.current !== draftId) return
    // Defer until the restore effect's state updates have rendered.
    const timer = setTimeout(() => { try { sessionStorage.setItem('math-review:' + draftId, JSON.stringify({ message: fbText, level: selectedLevel, revision: requestRevision })) } catch {} }, 100)
    return () => clearTimeout(timer)
  }, [draftId, fbText, selectedLevel, requestRevision])

  useEffect(() => {
    if (!sel) return
    const previous = document.activeElement as HTMLElement | null
    const dialog = document.querySelector<HTMLElement>('[aria-label="Review math work"]')
    dialog?.querySelector<HTMLElement>('button')?.focus()
    return () => previous?.focus()
  }, [sel])

  // Keyboard-first review: 1/2/3 rate the first unrated tested competency.
  useEffect(() => {
    if (!sel) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const dialog = document.querySelector<HTMLElement>('[aria-label="Review math work"]')
        const fields = Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), textarea:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]') ?? []).filter(el => el.getClientRects().length > 0)
        const first = fields[0], last = fields[fields.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
      if (nextGate) return // gate owns the keyboard while it's up
      const el = document.activeElement
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')
      if (e.key === 'Escape') {
        // Mid-draft Escape must not close the drawer and eat the feedback text.
        if (typing && el.tagName === 'TEXTAREA') { (el as HTMLElement).blur(); return }
        closeDrawer(); return
      }
      if (typing) return
      if (savingKey || e.repeat) return
      if (sel && isViewOnly(sel.studentId)) return // another teacher's student
      const active = subs.find((s) => s.status === 'pending' || s.revision?.status === 'pending')
      if (!active) return
      const cid = active.tested_competency_ids.find((c) => !active.rated_competency_ids.includes(c))
      if (!cid) return
      if (e.key === '1' || e.key === '2' || e.key === '3') { e.preventDefault(); setSelectedLevel(Number(e.key) as 1 | 2 | 3) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, subs, savingKey, nextGate])

  // Inter-student gate: any key (or Continue) advances; Esc closes instead.
  // Grace period: a rating keystroke in flight when the gate appears must not
  // silently advance it (see the control-room gate for the same rationale).
  useEffect(() => {
    if (!nextGate) return
    const armedAt = Date.now()
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || Date.now() - armedAt < 400) return
      e.preventDefault()
      if (e.key === 'Escape') { setNextGate(null); closeDrawer(); return }
      const g = nextGate
      setNextGate(null)
      openStudent(g.id, g.name)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextGate, openStudent, closeDrawer])

  const compById = (id: string) => grid?.competencies.find((c) => c.id === id)
  // View-only = not on YOUR roster (admin monitor mode). The queue never
  // contains these students, but the snapshot grid can open their drawer.
  const isViewOnly = (sid: string) => grid?.students.find((s) => s.id === sid)?.ratable === false
  const currentValue = (studentId: string, competencyId: string) =>
    grid?.cells[studentId]?.[competencyId]?.value ?? null

  async function rate(submission: Submission, competencyId: string, level: 1 | 2 | 3 | null) {
    if (!sel || savingKey) return
    const key = `${submission.id}:${competencyId}:${level}`
    setSavingKey(key)
    try {
      const res = await fetch(submission.revision?.status === 'pending' ? '/api/math-spine/revision' : '/api/math-spine/warmup-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submission.id, competency_id: competencyId, level, message: fbText, request_revision: requestRevision, action: submission.revision?.status === 'pending' ? 'acknowledge' : undefined }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Save failed')
      try { sessionStorage.removeItem('math-review:' + submission.id) } catch {}
      setFbText(''); setSelectedLevel(null); setRequestRevision(false)
      const awarded = (d.awarded ?? []) as { milestone: string; points: number }[]
      if (awarded.length > 0) {
        const pts = awarded.reduce((s, g) => s + g.points, 0)
        setFlash(`🎉 +${pts} pts for ${sel.name}`)
        setTimeout(() => setFlash(null), 3000)
      }
      refresh()
      const fresh = await loadStudent(sel.studentId)
      if (!fresh.some((s) => s.status === 'pending' || s.revision?.status === 'pending')) {
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
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Review was not saved. Please retry.')
    } finally {
      setSavingKey(null)
    }
  }

  if (loading) return <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading math spine…</p>
  if (!grid) return <p className="text-sm" style={{ color: 'var(--destructive)' }}>Could not load the math grid.</p>
  if (grid.students.length === 0) return <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No students in scope.</p>

  const activeSub = subs.find((s) => s.status === 'pending' || s.revision?.status === 'pending') ?? null

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

      {/* Read-only class snapshot — reads in LADDER order with the picker's
          own four-state vocabulary. Three layers of summary so the grid is
          scannable even when it's mostly empty (start of year):
          1. a class ladder strip (how many students sit in each state, per rung)
          2. a per-student summary (today's rung + fluent count)
          3. the cells themselves (value + state colour + ↻ glyph, never colour-only) */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Class snapshot</div>
        <div className="flex items-center gap-1" role="group" aria-label="Sort students">
          {([['name', 'A–Z'], ['progress', 'Most progress'], ['needs-me', 'Needs me first']] as [SnapshotSort, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setSnapshotSort(v)}
              className="text-[11px] font-semibold rounded-md px-2 py-1"
              aria-pressed={snapshotSort === v}
              style={{ border: '1px solid var(--border)', cursor: 'pointer', background: snapshotSort === v ? 'var(--primary)' : 'var(--card)', color: snapshotSort === v ? 'var(--primary-foreground)' : 'var(--muted-foreground)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {(() => {
        const comps = grid.competencies
        // Per-competency class tallies (the ladder strip + column footers).
        const tally = comps.map((c) => {
          const t = { 'got-it': 0, 'almost': 0, 'not-yet': 0, 'refresh': 0, none: 0 }
          for (const st of grid.students) {
            const state = stateOf(grid.cells[st.id]?.[c.id] ?? { value: null, count: 0, pending: 0 })
            if (state) t[state]++
            else t.none++
          }
          return t
        })
        const n = grid.students.length
        // Per-student rollups for sorting + the summary column.
        const rollup = new Map(grid.students.map((st) => {
          let fluent = 0, needs = 0, evidence = 0
          for (const c of comps) {
            const state = stateOf(grid.cells[st.id]?.[c.id] ?? { value: null, count: 0, pending: 0 })
            if (state) evidence++
            if (state === 'got-it') fluent++
            if (state === 'not-yet' || state === 'refresh') needs++
          }
          return [st.id, { fluent, needs, evidence }] as const
        }))
        const students = [...grid.students].sort((a, b) => {
          if (snapshotSort === 'progress') return (rollup.get(b.id)!.fluent - rollup.get(a.id)!.fluent) || a.name.localeCompare(b.name)
          if (snapshotSort === 'needs-me') return (rollup.get(b.id)!.needs - rollup.get(a.id)!.needs) || (rollup.get(b.id)!.evidence - rollup.get(a.id)!.evidence) || a.name.localeCompare(b.name)
          return a.name.localeCompare(b.name)
        })
        const compByIdLocal = new Map(comps.map((c) => [c.id, c]))
        return (
          <>
            {/* 1 — class ladder strip */}
            <div className="rounded-xl border p-3 mb-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Where the class is on the ladder</div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${comps.length}, minmax(44px, 1fr))`, gap: 6 }}>
                {comps.map((c, i) => {
                  const t = tally[i]
                  const seg = (count: number, color: string) => count > 0 ? <div style={{ height: Math.max(3, Math.round((count / Math.max(1, n)) * 44)), background: color, borderRadius: 2 }} /> : null
                  return (
                    <div key={c.id} title={`${c.code} — ${c.statement}\nGot it ${t['got-it']} · Almost ${t.almost} · Not yet ${t['not-yet']} · Refresh ${t.refresh} · No evidence ${t.none}`}
                      style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 1, height: 48, justifyContent: 'flex-start' }}>
                        {seg(t['got-it'], 'color-mix(in oklch, var(--success) 80%, transparent)')}
                        {seg(t.almost, 'color-mix(in oklch, var(--reward) 75%, transparent)')}
                        {seg(t['not-yet'], 'color-mix(in oklch, var(--destructive) 70%, transparent)')}
                        {seg(t.refresh, 'color-mix(in oklch, var(--primary) 65%, transparent)')}
                        {seg(t.none, 'var(--muted)')}
                      </div>
                      <div className="text-[10px] font-bold mt-1" style={{ color: 'var(--muted-foreground)' }}>{c.code}</div>
                      <div className="text-[10px] tabular-nums" style={{ color: t['got-it'] > 0 ? 'var(--success)' : 'var(--muted-foreground)' }}>{t['got-it']}/{n}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 2+3 — the grid, with a per-student summary column */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'separate', borderSpacing: 2 }}>
                <thead>
                  <tr>
                    <th style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--background)', textAlign: 'left', padding: '4px 8px', fontSize: 12 }}>Student</th>
                    <th style={{ padding: '4px 8px', fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>Today&apos;s rung</th>
                    {comps.map((c) => (
                      <th key={c.id} title={c.statement} scope="col" style={{ padding: '4px 6px', fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 600 }}>{c.code}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((st) => {
                    const roll = rollup.get(st.id)!
                    const rung = grid.currentRung?.[st.id] ?? null
                    const rungComp = rung ? compByIdLocal.get(rung.competencyId) : null
                    const rungWord = rung?.kind === 'refresh' ? 'refresh' : rung?.kind === 'recheck' ? 're-check' : rung?.kind === 'maintenance' ? 'stretch' : 'climb'
                    return (
                      <tr key={st.id}>
                        <td style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--background)', padding: '4px 8px', fontSize: 13, whiteSpace: 'nowrap' }}>
                          {st.name}
                          <span className="tabular-nums" style={{ marginLeft: 6, fontSize: 11, color: roll.fluent > 0 ? 'var(--success)' : 'var(--muted-foreground)' }}>{roll.fluent}/{comps.length}</span>
                        </td>
                        <td style={{ padding: '2px 8px 2px 4px', whiteSpace: 'nowrap' }}>
                          {roll.evidence === 0 ? (
                            <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>No evidence yet · starts at {rungComp?.code ?? comps[0]?.code}</span>
                          ) : rungComp ? (
                            <span className="text-[11px] font-semibold rounded-md px-1.5 py-0.5" title={rungComp.statement}
                              style={{ background: 'color-mix(in oklch, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>
                              {rungComp.code} · {rungWord}
                            </span>
                          ) : null}
                        </td>
                        {comps.map((c) => {
                          const cell = grid.cells[st.id]?.[c.id] ?? { value: null, count: 0, pending: 0 }
                          const state = stateOf(cell)
                          const meta = state ? STATE_META[state] : null
                          const label = `${st.name} · ${c.code}: ${state ? STATE_META[state].word : 'no evidence yet'}${cell.value != null ? ` (${cell.value.toFixed(1)})` : ''}${cell.pending ? ` · ${cell.pending} to review` : ''}`
                          return (
                            <td key={c.id} style={{ padding: 0 }}>
                              <div role="img" aria-label={label} title={label}
                                style={{ ...(meta ? meta.style : EMPTY_CELL), position: 'relative', width: 40, height: 30, borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                                {cell.value === null ? '·' : cell.value.toFixed(1)}
                                {meta?.glyph && <span aria-hidden style={{ fontSize: 11 }}>{meta.glyph}</span>}
                                {cell.pending > 0 && (
                                  <span style={{ position: 'absolute', top: 2, right: 3, width: 7, height: 7, borderRadius: '50%', background: 'var(--destructive)' }} />
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* legend — the same four words students see, plus the empty state */}
            <div className="flex items-center gap-3 flex-wrap mt-2 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              {(['got-it', 'almost', 'not-yet', 'refresh'] as RungState[]).map((k) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <span style={{ ...STATE_META[k].style, width: 14, height: 14, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>{STATE_META[k].glyph}</span>
                  {STATE_META[k].word}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5"><span style={{ ...EMPTY_CELL, width: 14, height: 14, borderRadius: 4, display: 'inline-block' }} /> No evidence yet</span>
              <span className="inline-flex items-center gap-1.5"><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--destructive)', display: 'inline-block' }} /> Warm-up waiting</span>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
              Read-only overview in ladder order. Rate from the review queue above — only the competencies a warm-up tests.
            </p>
          </>
        )
      })()}

      {/* Review drawer */}
      {sel && (
        <>
          <div onClick={closeDrawer} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'color-mix(in oklch, var(--foreground) 45%, transparent)' }} />
          <div role="dialog" aria-modal="true" aria-label="Review math work" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(1200px, 100vw)', zIndex: 100, background: 'var(--background)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'row' }}>
            {/* roster rail — students with warm-ups to review; greyed when done */}
            <div className="hidden xl:flex" style={{ width: 180, flexShrink: 0, borderRight: '1px solid var(--border)', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>
                {queue.length > 0 ? `${queue.length} to review` : 'All caught up'}
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
                {grid.students.filter((st) => st.ratable !== false).map((st) => {
                  const qc = queue.find((q) => q.studentId === st.id)?.count ?? 0
                  const done = qc === 0
                  const active = sel.studentId === st.id
                  return (
                    <button
                      key={st.id}
                      onClick={() => { if (!done) openStudent(st.id, st.name) }}
                      disabled={done}
                      title={st.name}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', borderLeft: `2px solid ${active ? 'var(--reward)' : 'transparent'}`, background: active ? 'color-mix(in oklch, var(--reward) 14%, transparent)' : 'transparent', color: 'var(--foreground)', opacity: done ? 0.45 : 1, cursor: done ? 'default' : 'pointer' }}
                    >
                      <span style={{ flex: 1, fontSize: 14, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.name}</span>
                      {done ? <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 12 }}>✓</span>
                        : <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>{qc}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
            {/* content column */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ padding: '16px 20px 10px', borderBottom: '1px solid var(--border)' }}>
              <button onClick={closeDrawer} style={{ float: 'right', border: 'none', background: 'transparent', color: 'var(--muted-foreground)', fontSize: 26, lineHeight: 1, cursor: 'pointer' }}>×</button>
              <h3 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{sel.name}</h3>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Review the warm-up; rate only the competencies it tests. Keys <b>1·2·3</b> select a rating; Save review sends your feedback and continues.</p>
            </div>

            {drawerLoading && <p className="text-sm p-5" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>}

            {!drawerLoading && !activeSub && (
              <p className="text-sm p-5" style={{ color: 'var(--muted-foreground)' }}>No pending warm-up for this student.</p>
            )}

            {!drawerLoading && activeSub && (
              <div className="flex flex-col lg:flex-row overflow-y-auto" style={{ flex: 1, minHeight: 0 }}>
              {/* left: the work being judged */}
              <div className="lg:flex-1 lg:overflow-y-auto" style={{ minWidth: 0, flexShrink: 0, padding: 20, borderRight: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>
                  <span>Submitted {fmtDate(activeSub.submitted_at)}</span>
                  {/* Instant self-check triage chip: the machine's verdict on the ANSWER only */}
                  {activeSub.self_check === 'match' && (
                    <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: 'var(--viz-up-surface)', color: 'var(--viz-up)' }}>✓ answer matched</span>
                  )}
                  {activeSub.self_check === 'mismatch' && (
                    <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: 'color-mix(in oklch, var(--viz-down) 12%, transparent)', color: 'var(--viz-down)' }}>✗ answer off</span>
                  )}
                </div>
                {activeSub.prompt && (
                  <p className="text-base mb-3" style={{ color: 'var(--foreground)' }}><b style={{ color: 'var(--muted-foreground)' }}>Prompt:</b> {activeSub.prompt}</p>
                )}
                <WarmupAnswer sub={activeSub} />
                {activeSub.feedback?.map((f,i) => <p key={i} className="my-3 rounded border p-3"><b>Your feedback:</b> {f.message}</p>)}
                {activeSub.revision && <section className="mt-4 border-t pt-4"><h4 className="font-bold">Student response {activeSub.revision.needs_help ? '· asks for help' : '· correction'}</h4><p className="my-2 whitespace-pre-wrap">{activeSub.revision.message}</p><MathWorkReview key={activeSub.revision.id} value={activeSub.revision.response_json} /></section>}
              </div>

              {/* right: the teacher's two acts — rate it, then say something
                  useful about it. Always in view. */}
              <div className="w-full lg:w-[400px] lg:overflow-y-auto" style={{ flexShrink: 0, padding: 20, background: 'color-mix(in oklch, var(--secondary) 18%, transparent)' }}>

                <div className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  {activeSub.revision ? 'Respond to the student' : 'Rate the tested competency'}
                </div>
                {!activeSub.revision && activeSub.tested_competency_ids.map((cid) => {
                  const comp = compById(cid)
                  const rated = activeSub.rated_competency_ids.includes(cid)
                  const cur = currentValue(sel.studentId, cid)
                  return (
                    <div key={cid} className="rounded-xl p-4 mb-3" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
                      <div className="flex items-start gap-2.5 mb-2">
                        <span className="text-sm font-bold rounded-md px-2.5 py-1 tabular-nums shrink-0" style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>{comp?.code ?? '?'}</span>
                        <span className="text-[15px]" style={{ color: 'var(--foreground)', lineHeight: 1.45 }}>{comp?.statement ?? cid}</span>
                      </div>
                      <div className="text-sm mb-2.5" style={{ color: 'var(--muted-foreground)' }}>
                        {cur === null ? 'Not yet rated' : `Currently ${cur.toFixed(1)} · ${cur >= 2.5 ? 'Got it' : cur >= 1.5 ? 'Almost' : 'Not yet'}`}
                      </div>
                      {rated ? (
                        <div className="text-base font-bold rounded-lg py-3 text-center" style={{ background: 'color-mix(in oklch, var(--success) 12%, transparent)', color: 'var(--success)' }}>✓ Rated</div>
                      ) : sel && isViewOnly(sel.studentId) ? (
                        <div className="text-sm rounded-lg py-2.5 px-3" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>View only — their teacher rates this</div>
                      ) : (
                        <div className="flex gap-2">
                          {[1, 2, 3].map((lv) => {
                            return (
                              <button
                                key={lv}
                                disabled={savingKey !== null}
                                onClick={() => setSelectedLevel(lv as 1 | 2 | 3)}
                                aria-pressed={selectedLevel === lv}
                                className="flex-1 rounded-xl font-bold disabled:opacity-50"
                                style={{
                                  padding: '14px 0', fontSize: 15, cursor: 'pointer', border: '1.5px solid var(--border)',
                                  background: lv === 1 ? 'color-mix(in oklch, var(--destructive) 12%, transparent)' : lv === 2 ? 'color-mix(in oklch, var(--reward) 22%, transparent)' : 'color-mix(in oklch, var(--success) 14%, transparent)',
                                  color: lv === 1 ? 'var(--destructive)' : lv === 2 ? 'var(--reward-foreground)' : 'var(--success)',
                                }}
                              >
                                {selectedLevel === lv ? '✓ ' : ''}{`${lv} · ${levelWord(lv)}`}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
                {!activeSub.revision && !isViewOnly(sel.studentId) && (
                  <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Keys <b>1 · 2 · 3</b> select a rating. Save when your feedback is ready.</p>
                )}
                <div className="mt-4 space-y-3 rounded-lg border p-3">
                  <p className="text-sm"><b>Rating anchors:</b> 1 — succeeds with mathematical support; 2 — independent in a routine context; 3 — transfers to a new context and explains why. Language access is not a penalty.</p>
                  <p className="text-xs text-muted-foreground">One observation is evidence, not proof of lasting fluency. Use a later independent task to confirm transfer.</p>
                  <label className="block text-sm font-semibold" htmlFor="math-review-note">{activeSub.revision ? 'Acknowledge the response / arrange help' : 'Feedback and next step'}</label>
                  <textarea id="math-review-note" rows={4} maxLength={2000} disabled={savingKey !== null} value={fbText} onChange={e => { setFbText(e.target.value); try { sessionStorage.setItem('math-review:' + activeSub.id, JSON.stringify({message:e.target.value,level:selectedLevel,revision:requestRevision})) } catch {} }} className="w-full rounded border bg-background p-2" placeholder="Name one useful next step, or record the outcome of a conversation." />
                  {!activeSub.revision && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={requestRevision} onChange={e => setRequestRevision(e.target.checked)} /> Ask for a correction, explanation, or help request</label>}
                  {!activeSub.revision && <button type="button" className="min-h-11 text-sm underline" onClick={() => { setSelectedLevel(null); setRequestRevision(true) }}>Need more evidence before rating</button>}
                  <button type="button" className="min-h-11 w-full rounded bg-primary px-4 text-primary-foreground disabled:opacity-50" disabled={savingKey !== null || (activeSub.revision ? !fbText.trim() : (!selectedLevel && !requestRevision) || (requestRevision && !fbText.trim()))} onClick={() => rate(activeSub, activeSub.competency_id, selectedLevel)}>{savingKey ? 'Saving…' : activeSub.revision ? 'Save acknowledgment' : 'Save review and continue'}</button>
                  {activeSub.revision && <p className="text-xs text-muted-foreground">Acknowledging a coached correction adds no fluency rating. Check independence on a later task.</p>}
                  {flash && <p role="status" className="text-sm">{flash}</p>}
                </div>
              </div>
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
