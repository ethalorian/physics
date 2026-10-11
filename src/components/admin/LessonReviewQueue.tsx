"use client"

import { useCallback, useEffect, useState, useRef, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { summarizeLessonInbox, newSubmissionIds, type InboxLesson } from '@/lib/lesson-inbox'
import type { MasteryReviewItem } from '@/lib/mastery-review-queue'
import styles from './LessonReviewQueue.module.css'
const BlockRenderer = dynamic(() => import('@/components/blocks/BlockRenderer'), { ssr: false })
import { paginateBlocks, type BlockDocument } from '@/data/content-blocks'
import type { BlockResponseMap } from '@/components/blocks/useBlockResponses'
import { EVIDENCE_LABEL, EVIDENCE_SOURCES, type EvidenceSource } from '@/lib/evidence'

const ageDays=(value:string)=>Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/86400000))
const ageLabel=(value:string)=>{const d=ageDays(value);return d===0?'Today':d===1?'1 day waiting':d+' days waiting'}
const countLabel = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`
interface Submission { id: string; user_id: string; lesson_id: string; name: string; lessonTitle: string; submitted_at: string; ratingCount: number; reviewedAt: string | null; feedback: string | null }
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

interface Props {
  unitId: string; classQuery: string; lessonId?: string; lessons?: InboxLesson[];
  targetReviews?: MasteryReviewItem[]; visibleTargetReviews?: number; nameFilter?: string; targetFiltered?: boolean;
  onLessonChange?: (id: string) => void; onClearFilters?: () => void; onDataChanged?: () => void;
  onRateTarget?: (studentId: string, targetId: string, context?: { lessonId?: string; submissionId?: string | null }) => void;
  refreshVersion?: number; onReviewed: () => void; renderResponse: (response: unknown) => ReactNode;
}
export default function LessonReviewQueue({ unitId, classQuery, onReviewed, renderResponse, lessonId = '', lessons = [],
  targetReviews = [], visibleTargetReviews = 0, nameFilter = '', targetFiltered = false, onLessonChange, onClearFilters, onDataChanged, onRateTarget, refreshVersion = 0 }: Props) {
  const loadVersion = useRef(0)
  const workVersion = useRef(0)
  const invalidateQueue = useCallback(() => { loadVersion.current++ }, [])
  const invalidateWork = useCallback(() => { workVersion.current++ }, [])
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null)
  const params = useSearchParams()
  const olderOnly = params.get('older') === '1'
  const mode = params.get('inbox') === 'returned' ? 'returned' : params.get('inbox') === 'evidence' ? 'evidence' : 'submissions'
  const source = params.get('source') ?? ''
  const setFilter = (key: string, value: string) => {
    const p = new URLSearchParams(window.location.search)
    if (value) p.set(key, value); else p.delete(key)
    window.history.replaceState(null, '', '?' + p)
  }
  const setOlderOnly = (value: boolean) => setFilter('older', value ? '1' : '')
  const setMode = (value: string) => setFilter('inbox', value === 'submissions' ? '' : value)
  const setSource = (value: string) => setFilter('source', value)
  const [queueLoading,setQueueLoading]=useState(true)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [returned, setReturned] = useState<Submission[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [selected, setSelected] = useState<Submission | null>(null)
  const [sectionIndex, setSectionIndex] = useState(0)
  const reviewPanel = useRef<HTMLElement | null>(null)
  useEffect(() => { if (selected) reviewPanel.current?.focus() }, [selected])
  const [work, setWork] = useState<SubmittedWork | null>(null)
  const [error, setError] = useState('')
  const [queueError, setQueueError] = useState('')
  const [checkedAt, setCheckedAt] = useState<Date | null>(null)
  const [snapshotScope, setSnapshotScope] = useState('')
  const [newIds, setNewIds] = useState<string[]>([])
  const known = useRef<{ scope: string; ids: Set<string>; fingerprint: string } | null>(null)
  const scope = unitId + classQuery
  const activeScope = useRef(scope)
  activeScope.current = scope
  const [busy, setBusy] = useState(false)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [feedback,setFeedback]=useState('')
  const [truncated, setTruncated] = useState(false)
  const feedbackDraft = useRef('')
  feedbackDraft.current = feedback
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (feedbackDraft.current.trim()) { event.preventDefault(); event.returnValue = '' } }
    const leave = (event: MouseEvent) => {
      if (feedbackDraft.current.trim() && (event.target as Element).closest('a[href], [data-quiz-leave], [data-reading-leave]') && !window.confirm('Leave this feedback without returning it?')) { event.preventDefault(); event.stopPropagation() }
    }
    window.addEventListener('beforeunload', unload); document.addEventListener('click', leave, true)
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', leave, true) }
  }, [])
  const load = useCallback(async () => {
    if (activeScope.current !== scope) return
    const version = ++loadVersion.current
    setQueueLoading(true)
    try {
      const res = await fetch(`/api/mastery/queue?unit_id=${encodeURIComponent(unitId)}${classQuery}&evidence_source=${encodeURIComponent(source)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not load review queue')
      if (version !== loadVersion.current || activeScope.current !== scope) return
      const pending: Submission[] = data.submissions ?? []
      const previous = known.current?.scope === scope ? known.current : null
      const incoming = newSubmissionIds(previous?.ids ?? null, pending)
      const fingerprint = JSON.stringify([pending.map(s => [s.id, s.ratingCount]), (data.evidence ?? []).map((e: Evidence) => [e.id, e.created_at])])
      setNewIds(ids => [...new Set([...(previous ? ids : []), ...incoming])].filter(id => pending.some(sub => sub.id === id)))
      known.current = { scope, ids: new Set(pending.map(s => s.id)), fingerprint }
      setSubmissions(pending); setReturned(data.returned ?? []); setEvidence(data.evidence ?? []); setTruncated(Boolean(data.evidenceMayBeTruncated))
      setQueueError(''); setCheckedAt(new Date()); setSnapshotScope(scope)
      if (previous && previous.fingerprint !== fingerprint) onDataChanged?.()
    } catch (e) { if (version === loadVersion.current) setQueueError(e instanceof Error ? e.message : 'Could not load review queue') } finally { if (version === loadVersion.current) setQueueLoading(false) }
  }, [unitId, classQuery, source, scope, onDataChanged])
  useEffect(() => {
    void load()
    const refresh = () => { if (document.visibilityState === 'visible') void load() }
    const timer = window.setInterval(refresh, 60000)
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh)
    return () => { invalidateQueue(); window.clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [load, refreshVersion, invalidateQueue])
  useEffect(() => { setSelected(null); setWork(null); setFeedback(''); setError(''); setOpeningId(null); invalidateWork(); return invalidateWork }, [scope, invalidateWork])
  async function open(sub: Submission, assess = false) {

    const version = ++workVersion.current
    setSelected(sub); setFeedback(''); setSectionIndex(0); setWork(null); setError(''); setOpeningId(sub.id)
    setNewIds(ids => ids.filter(id => id !== sub.id))
    try {
      const res = await fetch(`/api/mastery/student-work?unit_id=${encodeURIComponent(unitId)}&user_id=${encodeURIComponent(sub.user_id)}&lesson_id=${encodeURIComponent(sub.lesson_id)}&submission_id=${encodeURIComponent(sub.id)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not load submitted work')
      if (version === workVersion.current) {
        setWork(data)
        if (assess && onRateTarget) {
          const pending = targetReviews.find(item => item.studentId === sub.user_id && item.lessonId === sub.lesson_id && item.submissionId === sub.id)
          const target = data.targets?.find((t: { id: string }) => t.id === pending?.targetId) ?? data.targets?.[0]
          if (target) onRateTarget(sub.user_id, target.id, { lessonId: sub.lesson_id, submissionId: sub.id })
        }
      }
    } catch (e) { if (version === workVersion.current) setError(e instanceof Error ? e.message : 'Could not load submitted work') }
    finally { if (version === workVersion.current) setOpeningId(null) }
  }
  async function review(id: string, isEvidence = false) {
    if (!isEvidence && !work?.submissions.some((sub) => sub.id === id)) return
    if(!isEvidence&&!feedback.trim()){setError('Add feedback and a next step before returning the lesson.');return}
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/mastery/lesson-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(isEvidence ? { response_id: id } : { submission_id: id, action:'return', feedback }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Review failed')
      if (activeScope.current !== scope) return
      if (!isEvidence) { workVersion.current++; setSelected(null); setWork(null); setFeedback('') }
      await load(); onReviewed()
    } catch (e) { setError(e instanceof Error ? e.message : 'Review failed') }
    finally { setBusy(false) }
  }
  const inScope = snapshotScope === scope
  const pending = inScope ? submissions : [], past = inScope ? returned : [], savedEvidence = inScope ? evidence : []
  const matches = (item: { lesson_id: string | null; name: string }) => (!lessonId || item.lesson_id === lessonId) && item.name.toLowerCase().includes(nameFilter.toLowerCase())
  const visibleSubmissions = pending.filter(s => matches(s) && (!olderOnly || ageDays(s.submitted_at) >= 3)).sort((a,b) => a.submitted_at.localeCompare(b.submitted_at))
  const visibleReturned = past.filter(matches)
  const displayedSubmissions = mode === 'returned' ? visibleReturned : visibleSubmissions
  const assessmentLabel = (sub: Submission) => sub.ratingCount ? sub.ratingCount + ' target rating' + (sub.ratingCount === 1 ? '' : 's') + ' saved' : 'Not yet rated'
  const visibleEvidence = savedEvidence.filter(e => matches(e) && (!olderOnly || ageDays(e.created_at) >= 3)).sort((a,b) => a.created_at.localeCompare(b.created_at))
  const hiddenSubmissions = pending.length - visibleSubmissions.length
  const hiddenTargets = Math.max(0, targetReviews.length - visibleTargetReviews)
  const lessonRows = summarizeLessonInbox(lessons, pending, savedEvidence, targetReviews)
  const filtersActive = !!lessonId || !!nameFilter || olderOnly || !!source || targetFiltered || hiddenTargets > 0
  function showAll() { setOlderOnly(false); setSource(''); setMode('submissions'); onClearFilters?.() }
  function focusLesson(id: string) { setOlderOnly(false); setSource(''); setMode('submissions'); onLessonChange?.(id) }
  useEffect(() => { setSelected(null); setWork(null); setError(''); setOpeningId(null); workVersion.current++ }, [lessonId, mode, nameFilter])
  const returnedSelection = past.find(sub => sub.id === selected?.id)
  const viewingReturned = mode === 'returned' || !!returnedSelection
  const snapshot = work?.submissions.find((s) => s.id === selected?.id)
  const reviewPages = paginateBlocks(snapshot?.contentSnapshot?.blocks ?? [])
  const reviewPage = reviewPages[sectionIndex]
  const responses: BlockResponseMap = Object.fromEntries((work?.work ?? []).map((w) => [w.blockId, { response: w.response, block_type: w.blockType, created_at: w.createdAt }]))
  return <section className={styles.inbox} aria-label="Lesson inbox">
    <header className={styles.heading}><div><h2>Lesson inbox</h2><p>Student work for this assessment unit · {classQuery ? 'Selected class or teacher' : 'Your classes'} · Oldest submissions first.</p></div>
      <div className={styles.refresh}><button disabled={queueLoading} onClick={() => { void load(); onDataChanged?.() }}>{queueLoading ? 'Checking…' : 'Refresh submissions'}</button><small>{inScope && checkedAt ? `Checked ${checkedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Checking for student work…'}</small></div>
    </header>
    {!selected && <div className={styles.counts} aria-label="Lesson work totals"><span><strong>{inScope ? pending.length : '—'}</strong>submissions awaiting feedback or return</span><span><strong>{targetReviews.length}</strong>target reviews</span><span><strong>{inScope ? savedEvidence.length : '—'}</strong>saved responses{source ? ' in this source' : ''}</span></div>}
    {inScope && newIds.length > 0 && <div className={styles.notice} role="status"><div><strong>{newIds.length} new student {newIds.length === 1 ? 'submission' : 'submissions'}</strong><p>Received since your last check. New work is marked in the list.</p></div><button onClick={showAll}>Show all submissions</button></div>}
    {queueError && <div className={styles.notice} role="alert"><div><strong>Student work could not be refreshed.</strong><p>{queueError}{inScope ? ' The last loaded results are still shown.' : ''}</p></div><button onClick={() => void load()}>Retry queue</button></div>}
    {!selected && <div className={styles.lessons}>
      <label className={styles.lessonPicker}>Focus on a lesson<select aria-label="Review lesson" value={lessonId} onChange={e => focusLesson(e.target.value)}>
        <option value="">All lessons · {inScope ? pending.length : '—'} submissions</option>
        {lessonRows.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.title} · {countLabel(lesson.submissions, 'submission')} · {countLabel(lesson.targets, 'target review')}</option>)}
      </select></label>
    </div>}
    {inScope && filtersActive && <div className={styles.notice} role="status"><div><strong>{hiddenSubmissions > 0 ? `${hiddenSubmissions} pending ${hiddenSubmissions === 1 ? 'submission is' : 'submissions are'} outside this view.` : 'You are viewing filtered lesson work.'}</strong><p>{hiddenTargets > 0 ? `${countLabel(hiddenTargets, 'target review')} ${hiddenTargets === 1 ? 'remains' : 'remain'} outside the current grading queue. ` : ''}{nameFilter ? `Student: ${nameFilter}. ` : ''}{olderOnly ? 'Only work waiting three or more days. ' : ''}{source ? 'Evidence source filter is on.' : ''}</p></div><button onClick={showAll}>Clear filters · show all work</button></div>}
    {!selected && <><nav className={styles.tabs} aria-label="Lesson inbox views">
      <button aria-pressed={mode === 'submissions'} onClick={() => setMode('submissions')}>Submitted lessons ({pending.length})</button>
      <button aria-pressed={mode === 'evidence'} onClick={() => setMode('evidence')}>Saved evidence ({savedEvidence.length})</button>
      <button aria-pressed={mode === 'returned'} onClick={() => setMode('returned')}>Returned for revision ({past.length})</button>
    </nav>
    <div className={styles.filters}><span>{mode === 'submissions' ? `Showing ${visibleSubmissions.length} of ${pending.length} submissions` : mode === 'returned' ? `Showing ${visibleReturned.length} of ${past.length} returned lessons` : `Showing ${visibleEvidence.length} of ${savedEvidence.length} saved responses`}{queueLoading && inScope ? ' · Refreshing…' : ''}</span>
      {mode !== 'returned' && <label><input type="checkbox" checked={olderOnly} onChange={e => setOlderOnly(e.target.checked)} />Waiting 3 or more days</label>}
      {mode === 'evidence' && <select aria-label="Evidence source" value={source} onChange={e => setSource(e.target.value)}><option value="">All sources</option>{EVIDENCE_SOURCES.map(s => <option key={s} value={s}>{EVIDENCE_LABEL[s]}</option>)}<option value="untagged">Missing source</option></select>}
    </div>
    </>}
    <div className={styles.body}>
    {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}{selected && <button className="ml-2 min-h-11 underline" onClick={() => void open(selected)}>Retry submitted work</button>}</p>}
    {queueLoading && !inScope && <p role="status">Loading student submissions…</p>}
    {mode !== 'evidence' && <>
      {inScope && !queueError && displayedSubmissions.length === 0 && <p className={styles.empty}>{mode === 'returned' ? 'No returned lessons match this view.' : pending.length ? 'No submissions match these filters. Other student work is waiting — use Clear filters above.' : 'No submitted lessons are awaiting return in this class and assessment unit. Saved evidence and target reviews are counted above.'}</p>}
      {!selected && <div className={styles.list}>{displayedSubmissions.map(sub => <article key={sub.id} className={styles.submission} data-new={newIds.includes(sub.id)}>
        <div><h3>{sub.name}{newIds.includes(sub.id) && <span className={styles.newBadge}>New</span>}</h3><p>{sub.lessonTitle}</p><small>{assessmentLabel(sub)} · {mode === 'returned' ? 'Returned for revision' : ageLabel(sub.submitted_at)} · {new Date(sub.submitted_at).toLocaleString()}</small></div>
        <div className={styles.rowActions}><button className={styles.primary} aria-label={`Review ${sub.name} · ${sub.lessonTitle}`} disabled={busy || openingId === sub.id} onClick={() => void open(sub)}>{openingId === sub.id ? 'Opening…' : 'Review submission →'}</button></div>
      </article>)}</div>}
      {selected && <section ref={reviewPanel} tabIndex={-1} aria-label="Submitted lesson">
        <div className={styles.reviewNavigation}>
          <button onClick={() => { if (feedback.trim() && !window.confirm('Leave this feedback without returning it?')) return; invalidateWork(); setSelected(null); setWork(null); setFeedback(''); setError('') }}>← Back to lesson inbox</button>
          <span>Submission {displayedSubmissions.findIndex(sub => sub.id === selected.id) + 1} of {displayedSubmissions.length}</span>
          <div>{[-1, 1].map(direction => {
            const next = displayedSubmissions[displayedSubmissions.findIndex(sub => sub.id === selected.id) + direction]
            return <button key={direction} disabled={!next || busy} onClick={() => { if (feedback.trim() && !window.confirm('Leave this feedback without returning it?')) return; void open(next) }}>{direction < 0 ? 'Previous' : 'Next'}</button>
          })}</div>
        </div>
        <h3 className="font-semibold">{selected.name} · {selected.lessonTitle}</h3><p className="mt-1 text-sm text-muted-foreground">{assessmentLabel(selected)} · {viewingReturned ? 'Returned for revision' : 'Awaiting return'}</p>{viewingReturned && (returnedSelection?.feedback || selected.feedback) && <p className="my-3 whitespace-pre-wrap rounded border p-3 text-sm"><strong>Returned feedback: </strong>{returnedSelection?.feedback || selected.feedback}</p>}
        {!work && !error && <p role="status">Loading submitted work…</p>}
        {snapshot?.legacySnapshot && <p className="text-sm text-muted-foreground">Legacy submission: responses are reconstructed up to submission time; the original lesson text was not captured.</p>}
        {reviewPage && <div className="mt-3 rounded-xl border p-4">
          <nav aria-label="Submitted lesson sections" className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <button className="min-h-11 rounded-lg border px-3 disabled:opacity-40" disabled={sectionIndex === 0} onClick={() => setSectionIndex(i => i - 1)}>Previous section</button>
            <label className="text-sm">Section <select aria-label="Submitted lesson section" className="min-h-11 rounded-lg border bg-card px-2" value={sectionIndex} onChange={e => setSectionIndex(Number(e.target.value))}>{reviewPages.map((_, i) => <option key={i} value={i}>{i + 1} of {reviewPages.length}</option>)}</select></label>
            <button className="min-h-11 rounded-lg border px-3 disabled:opacity-40" disabled={sectionIndex === reviewPages.length - 1} onClick={() => setSectionIndex(i => i + 1)}>Next section</button>
          </nav>
          <BlockRenderer key={`${selected.id}:${sectionIndex}`} blocks={reviewPage.blocks} referenceBlocks={snapshot?.contentSnapshot?.blocks} lessonId={selected.lesson_id} responses={responses} targets={work?.targets} hydrated readOnly />
        </div>}
        {work && <details open={!snapshot?.contentSnapshot?.blocks} className="my-3 rounded border p-3"><summary className="cursor-pointer font-semibold">Captured responses · all saved fields</summary>{work.work.map((w) => <div key={w.blockId} className="my-3 rounded border p-3"><p className="text-xs text-muted-foreground">{w.blockType} · {w.blockId}</p>{renderResponse(w.response)}</div>)}</details>}

        {work?.targets && onRateTarget && <section aria-label="Assess this lesson’s targets" className="my-3 rounded-lg border p-3"><h4 className="font-medium">Assessment targets</h4><p className="mb-2 text-xs text-muted-foreground">Open a target to review the captured answers and record mastery. Returning a lesson does not create a rating.</p>{work.targets.map(t => <button key={t.id} className="mr-2 mb-2 min-h-11 rounded border px-3 py-2 text-sm" onClick={() => onRateTarget(selected.user_id,t.id,{lessonId:selected.lesson_id,submissionId:selected.id})}>{t.statement} — assess</button>)}</section>}
        {work && !viewingReturned && <label className="my-3 block text-sm font-medium">Feedback and next step<textarea className="mt-2 block min-h-28 w-full rounded-lg border bg-card p-3" rows={3} maxLength={3000} value={feedback} onChange={e=>setFeedback(e.target.value)} disabled={busy} placeholder="What is working, and what should the student revise?"/></label>}
        {work && !viewingReturned && <button disabled={busy} className="mt-3 rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50" onClick={() => void review(selected.id)}>Return with feedback</button>}
      </section>}
    </>}
    {mode === 'evidence' && <>
      {visibleEvidence.length === 0 && !queueLoading && !queueError && <p className={styles.empty}>No saved responses match this view. Check the lesson counts above or clear the filters.</p>}
      <p className="mb-2 text-sm text-muted-foreground">Saved evidence can be reviewed without turning in or unlocking a lesson. Unlinked work is shown across units.</p>
      {truncated && <p role="status" className="text-sm">Showing the most recent 1,000 responses. Narrow the source or class for older work.</p>}
      {visibleEvidence.map((item) => <details key={item.id} onToggle={(event) => { if (event.currentTarget.open) setExpandedEvidence(item.id) }} className="mb-2 rounded border p-3"><summary className="cursor-pointer text-sm">{ageLabel(item.created_at)} · {item.name} · {item.lessonTitle} · {EVIDENCE_LABEL[item.evidence_source as EvidenceSource] ?? 'Missing source'}{item.untargeted ? ' · Untargeted' : ''}</summary>
        <p className="my-1 text-xs text-muted-foreground">{item.block_type} · {new Date(item.created_at).toLocaleString()}</p>
        {renderResponse(item.response)}
        {expandedEvidence === item.id && (item.untargeted || item.unlinked) && <details><summary className="cursor-pointer text-sm">Advanced · repair attribution</summary><EvidenceRepair evidence={item} unitId={unitId} onLinked={() => { void load(); onReviewed() }} /></details>}

        <button disabled={busy} className="mt-2 rounded border px-3 py-1 text-sm" onClick={() => void review(item.id, true)}>Mark evidence reviewed</button>
      </details>)}
    </>}
    </div>
  </section>
}
