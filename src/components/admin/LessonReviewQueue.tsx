"use client"

import { useCallback, useEffect, useState, useRef, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
const BlockRenderer = dynamic(() => import('@/components/blocks/BlockRenderer'), { ssr: false })
import type { BlockDocument } from '@/data/content-blocks'
import type { BlockResponseMap } from '@/components/blocks/useBlockResponses'
import { EVIDENCE_LABEL, EVIDENCE_SOURCES, type EvidenceSource } from '@/lib/evidence'

interface Submission { id: string; user_id: string; lesson_id: string; name: string; lessonTitle: string; submitted_at: string }
interface Evidence { id: string; user_id: string; lesson_id: string | null; name: string; lessonTitle: string; response: unknown; block_type: string; evidence_source: string | null; untargeted: boolean; unlinked: boolean; created_at: string }
interface SubmittedWork {
  targets?: { id: string; slug: string; statement: string }[]
  submissions: { id: string; contentSnapshot?: BlockDocument | null; legacySnapshot: boolean }[]
  work: { blockId: string; blockType: string | null; response: unknown; createdAt: string }[]
}

function EvidenceRepair({ evidence, unitId, onLinked }: { evidence: Evidence; unitId: string; onLinked: () => void }) {
  const [lessonId, setLessonId] = useState(evidence.lesson_id ?? '')
  const [targetId, setTargetId] = useState('')
  const [options, setOptions] = useState<{ lessons: { id: string; title: string }[]; targets: { id: string; statement: string; lessonIds: string[] }[] }>({ lessons: [], targets: [] })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    fetch(`/api/mastery/lesson-review?unit_id=${encodeURIComponent(unitId)}`).then(async (res) => {
      const data = await res.json(); if (!res.ok) throw new Error(data.error ?? 'Could not load targets')
      if (active) setOptions(data)
    }).catch((e) => { if (active) setError(e.message) })
    return () => { active = false }
  }, [unitId])
  async function link() {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/mastery/lesson-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'link', response_id: evidence.id, lesson_id: lessonId || null, target_id: targetId || null }) })
      const data = await res.json(); if (!res.ok) throw new Error(data.error ?? 'Could not repair attribution')
      onLinked()
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not repair attribution') }
    finally { setBusy(false) }
  }
  return <div className="my-3 rounded border p-3">
    <p className="mb-2 text-sm">Repair the lesson or target attribution. The original response stays unchanged.</p>
    <div className="flex flex-wrap gap-2">
      <select aria-label="Evidence lesson" disabled={Boolean(evidence.lesson_id)} value={lessonId} onChange={(e) => { setLessonId(e.target.value); setTargetId('') }} className="max-w-full rounded border bg-card p-2 text-sm"><option value="">Choose lesson</option>{options.lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select>
      <select aria-label="Evidence target" value={targetId} onChange={(e) => setTargetId(e.target.value)} className="max-w-full rounded border bg-card p-2 text-sm"><option value="">Choose target</option>{options.targets.filter((t) => !lessonId || t.lessonIds.includes(lessonId)).map((t) => <option key={t.id} value={t.id}>{t.statement}</option>)}</select>
      <button disabled={busy || (!lessonId && !targetId)} className="rounded border px-3 py-1 text-sm" onClick={() => void link()}>Save attribution</button>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>
}

export default function LessonReviewQueue({ unitId, classQuery, onReviewed, renderResponse }: { unitId: string; classQuery: string; onReviewed: () => void; renderResponse: (response: unknown) => ReactNode }) {
  const loadVersion = useRef(0)
  const workVersion = useRef(0)
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null)
  const [mode, setMode] = useState<'submissions' | 'evidence'>('submissions')
  const [source, setSource] = useState('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [selected, setSelected] = useState<Submission | null>(null)
  const [work, setWork] = useState<SubmittedWork | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [truncated, setTruncated] = useState(false)
  const load = useCallback(async () => {
    const version = ++loadVersion.current
    try {
      const res = await fetch(`/api/mastery/queue?unit_id=${encodeURIComponent(unitId)}${classQuery}&evidence_source=${encodeURIComponent(source)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not load review queue')
      if (version !== loadVersion.current) return
      setSubmissions(data.submissions ?? []); setEvidence(data.evidence ?? []); setTruncated(Boolean(data.evidenceMayBeTruncated)); setError('')
    } catch (e) { if (version === loadVersion.current) setError(e instanceof Error ? e.message : 'Could not load review queue') }
  }, [unitId, classQuery, source])
  const invalidateRequests = useCallback(() => { loadVersion.current++; workVersion.current++ }, [])
  useEffect(() => { void load(); setSelected(null); setWork(null); workVersion.current++; return invalidateRequests }, [load, invalidateRequests])
  async function open(sub: Submission) {
    const version = ++workVersion.current
    setSelected(sub); setWork(null); setError('')
    try {
      const res = await fetch(`/api/mastery/student-work?unit_id=${encodeURIComponent(unitId)}&user_id=${encodeURIComponent(sub.user_id)}&lesson_id=${encodeURIComponent(sub.lesson_id)}&submission_id=${encodeURIComponent(sub.id)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not load submitted work')
      if (version === workVersion.current) setWork(data)
    } catch (e) { if (version === workVersion.current) setError(e instanceof Error ? e.message : 'Could not load submitted work') }
  }
  async function review(id: string, isEvidence = false) {
    if (!isEvidence && !work?.submissions.some((sub) => sub.id === id)) return
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/mastery/lesson-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(isEvidence ? { response_id: id } : { submission_id: id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Review failed')
      if (!isEvidence) { workVersion.current++; setSelected(null); setWork(null) }
      await load(); onReviewed()
    } catch (e) { setError(e instanceof Error ? e.message : 'Review failed') }
    finally { setBusy(false) }
  }
  const snapshot = work?.submissions.find((s) => s.id === selected?.id)
  const responses: BlockResponseMap = Object.fromEntries((work?.work ?? []).map((w) => [w.blockId, { response: w.response, block_type: w.blockType, created_at: w.createdAt }]))
  return <details className="my-4 rounded-xl border bg-card p-4">
    <summary className="cursor-pointer font-semibold">Lesson review · {submissions.length} pending submissions</summary>
    <p className="my-2 text-sm text-muted-foreground">Review each submitted lesson explicitly to unlock revision. Record mastery ratings separately in the target grid.</p>
    <div className="mb-3 flex flex-wrap gap-2">
      <button className="rounded border px-3 py-1" aria-pressed={mode === 'submissions'} onClick={() => setMode('submissions')}>Submitted lessons ({submissions.length})</button>
      <button className="rounded border px-3 py-1" aria-pressed={mode === 'evidence'} onClick={() => setMode('evidence')}>Low-stakes evidence ({evidence.length})</button>
      {mode === 'evidence' && <select aria-label="Evidence source" className="rounded border bg-card px-2" value={source} onChange={(e) => setSource(e.target.value)}><option value="">All sources</option>{EVIDENCE_SOURCES.map((s) => <option key={s} value={s}>{EVIDENCE_LABEL[s]}</option>)}<option value="untagged">Missing source</option></select>}
    </div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {mode === 'submissions' && <>
      {submissions.length === 0 && <p className="text-sm text-muted-foreground">No lessons awaiting review.</p>}
      <div className="flex flex-wrap gap-2">{submissions.map((sub) => <button key={sub.id} className="rounded border p-2 text-left text-sm" onClick={() => void open(sub)}>{sub.name} · {sub.lessonTitle}<span className="block text-xs text-muted-foreground">Submitted {new Date(sub.submitted_at).toLocaleString()}</span></button>)}</div>
      {selected && <section className="mt-4 border-t pt-3" aria-label="Submitted lesson">
        <h3 className="font-semibold">{selected.name} · {selected.lessonTitle}</h3>
        {!work && !error && <p role="status">Loading submitted work…</p>}
        {snapshot?.legacySnapshot && <p className="text-sm text-muted-foreground">Legacy submission: responses are reconstructed up to submission time; the original lesson text was not captured.</p>}
        {snapshot?.contentSnapshot?.blocks && <BlockRenderer key={selected.id} blocks={snapshot.contentSnapshot.blocks} lessonId={selected.lesson_id} responses={responses} targets={work?.targets} hydrated readOnly />}
        {work && <details open={!snapshot?.contentSnapshot?.blocks} className="my-3 rounded border p-3"><summary className="cursor-pointer font-semibold">Captured responses · all saved fields</summary>{work.work.map((w) => <div key={w.blockId} className="my-3 rounded border p-3"><p className="text-xs text-muted-foreground">{w.blockType} · {w.blockId}</p>{renderResponse(w.response)}</div>)}</details>}

        {work && <button disabled={busy} className="mt-3 rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50" onClick={() => void review(selected.id)}>Mark this lesson reviewed · allow revision</button>}
      </section>}
    </>}
    {mode === 'evidence' && <>
      <p className="mb-2 text-sm text-muted-foreground">Saved evidence can be reviewed without turning in or unlocking a lesson. Unlinked work is shown across units.</p>
      {truncated && <p role="status" className="text-sm">Showing the most recent 1,000 responses. Narrow the source or class for older work.</p>}
      {evidence.map((item) => <details key={item.id} onToggle={(event) => { if (event.currentTarget.open) setExpandedEvidence(item.id) }} className="mb-2 rounded border p-3"><summary className="cursor-pointer text-sm">{item.name} · {item.lessonTitle} · {EVIDENCE_LABEL[item.evidence_source as EvidenceSource] ?? 'Missing source'}{item.untargeted ? ' · Untargeted' : ''}</summary>
        <p className="my-1 text-xs text-muted-foreground">{item.block_type} · {new Date(item.created_at).toLocaleString()}</p>
        {renderResponse(item.response)}
        {expandedEvidence === item.id && (item.untargeted || item.unlinked) && <EvidenceRepair evidence={item} unitId={unitId} onLinked={() => { void load(); onReviewed() }} />}

        <button disabled={busy} className="mt-2 rounded border px-3 py-1 text-sm" onClick={() => void review(item.id, true)}>Mark evidence reviewed</button>
      </details>)}
    </>}
  </details>
}
