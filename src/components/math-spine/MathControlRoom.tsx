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
import { StrokeShapes, type Stroke as DrawStroke } from '@/lib/draw/strokes'

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
  self_check?: 'match' | 'mismatch' | 'unknown' | null
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
    return <p className="text-base" style={{ color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>{sub.response}</p>
  }
  const field = (label: string, val?: string) =>
    val && String(val).trim() ? (
      <div className="text-base" style={{ marginBottom: 5 }}>
        <b style={{ color: 'var(--secondary-foreground)' }}>{label}:</b> {String(val)}
      </div>
    ) : null
  const hasBoard = (rj.workStrokes && rj.workStrokes.length > 0) || (rj.workTexts && rj.workTexts.length > 0)
  const eqnLines = Array.isArray(rj.sandbox?.lines) ? rj.sandbox!.lines!.map(String).filter((l) => l.trim()) : []
  return (
    <div>
      {field('Given', rj.given)}
      {field('Equation', rj.equation)}
      {eqnLines.length > 0 && (
        <div className="text-base" style={{ marginBottom: 5 }}>
          <b style={{ color: 'var(--secondary-foreground)' }}>Equation work:</b> {eqnLines.join('  |  ')}
        </div>
      )}
      {field('Answer', rj.answer)}
      {hasBoard && (
        <div className="mt-2">
          <div className="text-sm mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Work board (typed + drawn)</div>
          <BoardSvg strokes={rj.workStrokes} texts={rj.workTexts} />
        </div>
      )}
      {!rj.given && !rj.equation && !rj.answer && !hasBoard && eqnLines.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{sub.response || '[submitted]'}</p>
      )}
    </div>
  )
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
  const [fbGeneral, setFbGeneral] = useState(false)
  const [fbSending, setFbSending] = useState(false)
  const [fbSent, setFbSent] = useState(false)
  const [fbHistory, setFbHistory] = useState<{ id: string; message: string; created_at: string }[]>([])
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
    // The grading drawer is YOUR roster only — admin included. Other teachers'
    // students stay visible in the snapshot grid, but never open here.
    if (grid?.students.find((st) => st.id === studentId)?.ratable === false) return
    setSel({ studentId, name })
    setSubs([])
    loadStudent(studentId)
  }, [loadStudent, grid])

  const closeDrawer = () => { setSel(null); setSubs([]); setNextGate(null) }

  // A feedback draft belongs to one student — never carry it to the next.
  const fbStudentRef = useRef<string | null>(null)
  useEffect(() => {
    if (sel?.studentId !== fbStudentRef.current) {
      fbStudentRef.current = sel?.studentId ?? null
      setFbText(''); setFbGeneral(false); setFbSent(false); setFbHistory([])
      if (sel?.studentId) {
      // Timely feedback builds on what you last said — pull this student's
      // recent notes so the next one continues the conversation.
      fetch(`/api/feedback?user_id=${sel.studentId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d?.feedback) setFbHistory(d.feedback.slice(0, 3)) })
        .catch(() => setFbHistory([]))
      }
    }
  }, [sel?.studentId])

  const sendFeedback = async (competencyId: string | null) => {
    const msg = fbText.trim()
    if (!msg || !sel || fbSending) return
    setFbSending(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: sel.studentId, message: msg, competency_id: fbGeneral ? null : competencyId }),
      })
      if (!res.ok) throw new Error('send failed')
      setFbText('')
      setFbSent(true)
      setTimeout(() => setFbSent(false), 2500)
    } catch {
      setFlash('Could not send the feedback')
    } finally {
      setFbSending(false)
    }
  }

  // Keyboard-first review: 1/2/3 rate the first unrated tested competency.
  useEffect(() => {
    if (!sel) return
    const onKey = (e: KeyboardEvent) => {
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
  }, [nextGate, openStudent])

  const compById = (id: string) => grid?.competencies.find((c) => c.id === id)
  // View-only = not on YOUR roster (admin monitor mode). The queue never
  // contains these students, but the snapshot grid can open their drawer.
  const isViewOnly = (sid: string) => grid?.students.find((s) => s.id === sid)?.ratable === false
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
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(1200px, 94vw)', zIndex: 100, background: 'var(--background)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'row' }}>
            {/* roster rail — students with warm-ups to review; greyed when done */}
            <div style={{ width: 210, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Review the warm-up; rate only the competencies it tests. Keys <b>1·2·3</b> rate; finishing a student jumps to the next.</p>
            </div>

            {drawerLoading && <p className="text-sm p-5" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>}

            {!drawerLoading && !activeSub && (
              <p className="text-sm p-5" style={{ color: 'var(--muted-foreground)' }}>No pending warm-up for this student.</p>
            )}

            {!drawerLoading && activeSub && (
              <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
              {/* left: the work being judged */}
              <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 20, borderRight: '1px solid var(--border)' }}>
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
              </div>

              {/* right: the teacher's two acts — rate it, then say something
                  useful about it. Always in view. */}
              <div style={{ width: 440, flexShrink: 0, overflowY: 'auto', padding: 20, background: 'color-mix(in oklch, var(--secondary) 18%, transparent)' }}>

                <div className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  Rate the tested competenc{activeSub.tested_competency_ids.length === 1 ? 'y' : 'ies'}
                </div>
                {activeSub.tested_competency_ids.map((cid) => {
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
                            const key = `${activeSub.id}:${cid}:${lv}`
                            return (
                              <button
                                key={lv}
                                disabled={savingKey !== null}
                                onClick={() => rate(activeSub, cid, lv as 1 | 2 | 3)}
                                className="flex-1 rounded-xl font-bold disabled:opacity-50"
                                style={{
                                  padding: '14px 0', fontSize: 15, cursor: 'pointer', border: '1.5px solid var(--border)',
                                  background: lv === 1 ? 'color-mix(in oklch, var(--destructive) 12%, transparent)' : lv === 2 ? 'color-mix(in oklch, var(--reward) 22%, transparent)' : 'color-mix(in oklch, var(--success) 14%, transparent)',
                                  color: lv === 1 ? 'var(--destructive)' : lv === 2 ? 'var(--reward-foreground)' : 'var(--success)',
                                }}
                              >
                                {savingKey === key ? '…' : `${lv} · ${levelWord(lv)}`}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
                {!isViewOnly(sel.studentId) && (
                  <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Keys <b>1 · 2 · 3</b> rate the first unrated competency.</p>
                )}
                {/* Written feedback — one-way note, anchored to the tested
                    competency unless marked general. */}
                {!isViewOnly(sel.studentId) && (
                  <div className="mt-4 rounded-lg" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
                    <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '0.5px solid var(--border)' }}>
                      <span className="text-base font-bold">✎ Written feedback</span>
                      {fbSent && <span className="text-sm font-bold" style={{ color: 'var(--success)' }}>Sent ✓</span>}
                    </div>
                    <div className="px-3 pb-3 pt-2">
                      <div className="flex gap-1.5 mb-1.5">
                        {['Strength: ', 'Next step: '].map((stem) => (
                          <button key={stem} type="button" onClick={() => setFbText((t) => (t ? t.replace(/\s*$/, '\n') : '') + stem)}
                            className="rounded-full px-3 py-1.5 text-sm font-semibold" style={{ border: '1px solid var(--border)', background: 'var(--secondary)', color: 'var(--foreground)', cursor: 'pointer' }}>
                            + {stem.replace(': ', '')}
                          </button>
                        ))}
                        <label className="ml-auto flex items-center gap-1.5 text-sm" style={{ color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                          <input type="checkbox" checked={fbGeneral} onChange={(e) => setFbGeneral(e.target.checked)} /> General note
                        </label>
                      </div>
                      <textarea
                        value={fbText}
                        onChange={(e) => setFbText(e.target.value)}
                        rows={4}
                        maxLength={2000}
                        placeholder={fbGeneral ? `A note to ${sel.name.split(' ')[0]}…` : `Feedback on ${compById(activeSub.tested_competency_ids[0])?.code ?? 'this competency'}…`}
                        className="w-full rounded-lg px-3 py-2.5" 
                        style={{ border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', resize: 'vertical', fontSize: 15, lineHeight: 1.5 }}
                      />
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {fbGeneral ? 'General note' : 'On this competency'} · lands in their bell + growth page
                        </span>
                        <button type="button" onClick={() => sendFeedback(activeSub.tested_competency_ids[0] ?? null)} disabled={fbSending || !fbText.trim()}
                          className="rounded-lg px-5 py-2.5 text-sm font-bold disabled:opacity-50"
                          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
                          {fbSending ? 'Sending…' : 'Send'}
                        </button>
                      </div>
                    {fbHistory.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Your recent notes to them</div>
                        {fbHistory.map((f) => (
                          <div key={f.id} className="text-xs rounded-md px-2.5 py-1.5 mb-1.5" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                            <span style={{ whiteSpace: 'pre-wrap' }}>{f.message.length > 160 ? f.message.slice(0, 160) + '…' : f.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    </div>
                  </div>
                )}
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
