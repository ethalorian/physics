'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { notebookQuestions } from '@/lib/interactive-notebook'
import styles from './LessonViewer.module.css'
import { LessonReadingPreview } from '@/components/readings/LessonReadingContext'
import { lessonIdentityStyles, lessonNumber } from './LessonVisualIdentity'
import AnswerChecklist from './AnswerChecklist'
import LessonAvatar from './LessonAvatar'
import LessonXp from './LessonXp'
import { LessonVideoXpContext } from './LessonVideoXpContext'
import TradesWorkshopView from './TradesWorkshopView'
import PhysicsPathView from './PhysicsPathView'
import LessonMasteryTargets from './LessonMasteryTargets'
import { physicsProblemFormat } from '@/lib/physics-problem-format'
import TeachingToolRenderer, { TeachingToolContext } from '@/components/teaching-tools/TeachingToolRenderer'
import { useCommandSession } from '@/components/present/useCommandSession'
import { answerAnchor, answerGuide, answerStatus } from './lesson-answer-guide'
import { useSession } from 'next-auth/react'
import { blockingDrafts } from '@/data/block-registry'
import type { BlockResponseMap, DraftFn, SaveMeta } from '@/components/blocks/useBlockResponses'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import SubmitLessonButton from '@/components/lessons/SubmitLessonButton'
import SectionRail from '@/components/lessons/SectionRail'
import { buildSections, minutesLeft } from '@/components/lessons/lesson-sections'
import { useSectionProgress } from '@/components/lessons/useSectionProgress'
import type { GlossaryEntry } from '@/components/MathMarkdown'
import { useBlockResponses } from '@/components/blocks/useBlockResponses'
import { LanguageProfileProvider, LanguageDial } from '@/components/lessons/LanguageProfileProvider'
import { PresentLiveProvider, usePresentLive, useTimerLeft, fmtTimer } from '@/components/lessons/PresentLiveProvider'
import LessonTeachLink from '@/components/admin/LessonTeachLink'
import { documentRevision, sectionAnchor, sectionIndexForAnchor } from '@/lib/lesson-anchors'
import { Radio, Timer } from 'lucide-react'
import { calibrationCopy, doneTallies, firstLockedIndex, gateNote, pageBlockedBy, sectionTarget, splitHelpRuns } from '@/components/lessons/stepped'
import { Lock, Lightbulb } from 'lucide-react'
import { BlockDocument, isCaptureBlock, isRequiredCaptureBlock, isBlockComplete, paginateBlocks, pageHasVisual } from '@/data/content-blocks'
import { Home, ChevronLeft, ChevronRight, Clock, Sparkles, FlaskConical, BookOpen, Wrench, Rocket, Layers, Check, Pencil, PencilRuler, Eye, Compass, Sigma, type LucideIcon } from 'lucide-react'

interface NavLink { slug: string; title: string }
const InteractiveNotebook = dynamic(() => import('./InteractiveNotebook'), { ssr: false, loading: () => <p role="status">Loading notebook…</p> })

interface BlockLessonViewerProps {
  /** Staff preview: badge CPA-only / Honors-only blocks. Students never get this. */
  staffView?: boolean
  preview?: boolean
  snapshot?: { responses: BlockResponseMap; feedback?: string; locked: boolean; submitted: boolean; completedAnchors?: string[]; revision?: string }
  previewReturnHref?: string
  previewProfile?: import('@/lib/sei').LanguageProfile | null
  previewLive?: import('./PresentLiveProvider').LiveSession
  previewTargets?: {slug:string;statement:string;self:number|null;teacher:number|null;delta:number|null}[]
  previewFlags?: { experience: 'classic' | 'stepped'; gateCheckpoints: boolean }
  previewAnswerKeys?: Record<string, string>
  lesson: {
    id: string
    title: string
    unit?: string
    estimated_time?: number
    hero_image?: string | null
    content_blocks?: BlockDocument
    key_terms?: GlossaryEntry[]
  }
  nav?: { prev?: NavLink | null; next?: NavLink | null }
}

const DAY_META: Record<string, { label: string; Icon: LucideIcon }> = {
  ANCHOR: { label: 'Anchor', Icon: Sparkles },
  STANDARD: { label: 'Lesson', Icon: BookOpen },
  LAB: { label: 'Lab day', Icon: FlaskConical },
  WORKSHOP: { label: 'Workshop', Icon: Wrench },
  SYNTHESIS: { label: 'Synthesis', Icon: Layers },
  TRANSFER: { label: 'Transfer', Icon: Rocket },
}

export default function BlockLessonViewer(props: BlockLessonViewerProps) {
  const { data: session } = useSession()
  const preview = !!(props.preview || props.snapshot)
  const [navigationNotice,setNavigationNotice] = useState('')
  // The language profile + scaffold dial are shared by every block on the page.
  // P-4/P-5 · students poll the live presentation (follow mode + open polls); staff drive it.
  return (
    <div onClickCapture={event=>{if(!preview)return;const link=(event.target as HTMLElement).closest('a');if(!link)return;const href=link.getAttribute('href')??'';if(href.startsWith('#')||href===(props.previewReturnHref??'/admin/lessons/'+props.lesson.id))return;event.preventDefault();event.stopPropagation();setNavigationNotice('This link opens another area of the app. Exit preview to use it.')}}>
    {navigationNotice&&<p role="status" className="sticky top-0 z-20 rounded-lg border bg-card p-3 text-sm">{navigationNotice}<button className="ml-3 min-h-11 underline" onClick={()=>setNavigationNotice('')}>Dismiss</button></p>}
    <LessonReadingPreview.Provider value={preview}><LanguageProfileProvider preview={preview} previewProfile={props.previewProfile}>
      <PresentLiveProvider lessonId={props.lesson.id} enabled={!props.staffView && !preview} simulation={preview?props.previewLive:undefined}>
        <BlockLessonViewerInner key={`${props.lesson.id}:${session?.user?.id ?? "anonymous"}:${props.preview ? "preview" : "student"}`} {...props} preview={preview} />
      </PresentLiveProvider>
    </LanguageProfileProvider></LessonReadingPreview.Provider></div>
  )
}

function BlockLessonViewerInner({ lesson, nav, staffView = false, preview = false, previewTargets, previewFlags, previewAnswerKeys = {}, snapshot, previewReturnHref }: BlockLessonViewerProps) {
  const session = useSession().data
  const inspection = Boolean(session?.experience)
  const observer = session?.user?.role === 'observer'
  const previewLabel = observer ? 'Observer preview' : 'Teacher preview'
  const exitHref = previewReturnHref ?? `/admin/lessons/${lesson.id}`
  const [teachingSessionId] = useState<string|null>(null)
  const teachingCommand = useCommandSession(staffView?teachingSessionId:null)
  const blocks = useMemo(() => lesson.content_blocks ? physicsProblemFormat(lesson.id,lesson.content_blocks).blocks : [], [lesson.id,lesson.content_blocks])
  const notebookChecks = useMemo(() => lesson.content_blocks ? notebookQuestions({ ...lesson.content_blocks, blocks }) : null, [lesson.content_blocks, blocks])
  const dayType = lesson.content_blocks?.dayType
  const day = dayType ? DAY_META[dayType] : undefined
  const trim = (s: string) => (s.length > 28 ? s.slice(0, 27) + '…' : s)

  // Key terms feed the hover-def popovers in prose. Guard the shape so a
  // malformed JSON column can never break the reader.
  const keyTerms = useMemo<GlossaryEntry[]>(
    () => (Array.isArray(lesson.key_terms) ? lesson.key_terms.filter((t) => t && t.term && t.definition) : []),
    [lesson.key_terms],
  )
  // SEI principle 2: the Tier 2 academic words are the hidden barrier, so the
  // glossary reads the lesson's tiered vocab set (Tier 2 + 3) as well as key_terms.
  const [vocabTerms, setVocabTerms] = useState<GlossaryEntry[]>([])
  useEffect(() => {
    if (preview) return
    let active = true
    fetch(`/api/lessons/${lesson.id}/vocab`).then((r) => (r.ok ? r.json() : { terms: [] })).then((d: { terms?: { term: string; definition: string; tier?: number | null; cognate?: string | null; part_of_speech?: string | null; example?: string | null }[] }) => {
      if (!active) return
      setVocabTerms((d.terms ?? []).filter((t) => t.term && t.definition && (t.tier ?? 3) >= 2).map((t) => ({ term: t.term, definition: t.definition, cognate: t.cognate ?? undefined, tier: t.tier ?? undefined, partOfSpeech: t.part_of_speech ?? undefined, example: t.example ?? undefined })))
    }).catch(() => {})
    return () => { active = false }
  }, [lesson.id, preview])
  const glossary = useMemo<GlossaryEntry[]>(() => {
    const seen = new Set(vocabTerms.map((t) => t.term.toLowerCase()))
    return [...vocabTerms, ...keyTerms.filter((t) => !seen.has(t.term.toLowerCase()))]
  }, [keyTerms, vocabTerms])

  // One source of truth for responses, shared with the renderer so progress
  // fills as the student saves interactive blocks.
  const store = useBlockResponses(lesson.id, !preview && !staffView)
  const { draft: persistDraft, save: persistSave } = store
  const [playResponses, setPlayResponses] = useState<BlockResponseMap>(snapshot?.responses ?? {})
  const responses = preview ? playResponses : store.responses
  const responsesLoaded = preview || staffView || store.loaded
  const draftState = preview ? 'idle' : store.draftState
  const xpSession = preview ? 0 : store.xpEarned
  const draft: DraftFn = useCallback((id, type, response) => {
    if (snapshot) return
    if (preview) setPlayResponses((prev) => ({ ...prev, [id]: { response, created_at: new Date().toISOString(), draft: true } }))
    else if (!staffView) persistDraft(id, type, response)
  }, [preview, staffView, persistDraft, snapshot])
  const save = useCallback(async (id: string, type: string, response: unknown, meta?: SaveMeta) => {
    if (staffView || snapshot) return false
    if (!preview) return persistSave(id, type, response, meta)
    const key = previewAnswerKeys[id]
    const checked = key && response && typeof response === 'object'
      ? { ...response, autoCheck: (response as { optionId?: string }).optionId === key ? 'match' : 'mismatch' } : response
    setPlayResponses((prev) => ({ ...prev, [id]: { response: checked, created_at: new Date().toISOString() } }))
    return true
  }, [preview, staffView, previewAnswerKeys, persistSave, snapshot])
  // Drafts are shown (the student sees what they typed) but never COUNT: gates,
  // progress, tallies and the exit-ticket hold read only explicit saves.
  const committed = useMemo(() => Object.fromEntries(Object.entries(responses).filter(([, v]) => !v.draft)), [responses])

  // A-5 · the class's reader flags + S-4 mastery + S-6 calibration, one fetch.
  const [exp, setExp] = useState<{ flags: { experience: 'classic' | 'stepped'; gateCheckpoints: boolean; presentLive?: boolean }; mastery: Record<string, number>; calibration: { slug: string; statement: string; self: number | null; teacher: number | null; delta: number | null }[]; xpEarned: number; lobbyToday?: boolean } | null>(null)
  useEffect(() => {
    if (preview) return
    let active = true
    fetch(`/api/lessons/experience?lesson_id=${lesson.id}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (active && d?.flags) setExp(d) }).catch(() => {})
    return () => { active = false }
  }, [lesson.id, preview])
  const viewerTargets = preview ? previewTargets : exp?.calibration
  const stepped = ((preview ? previewFlags?.experience : exp?.flags.experience) ?? 'stepped') === 'stepped'
  const gating = !staffView && stepped && ((preview ? previewFlags?.gateCheckpoints : exp?.flags.gateCheckpoints) ?? true)
  const presentLive = exp?.flags.presentLive ?? true

  // Split the lesson into pages: each save-required block rides with the
  // reference blocks that set it up. Each page is one "section".
  const pages = useMemo(() => paginateBlocks(blocks), [blocks])
  const pageCount = pages.length
  const sections = useMemo(() => buildSections(pages, lesson.estimated_time), [pages, lesson.estimated_time])

  // Current page, restored from localStorage so a reload returns to the spot.
  const anchors = useMemo(() => pages.map(sectionAnchor), [pages])
  const revision = useMemo(() => documentRevision(pages), [pages])
  const storageKey = `lesson-page:v3:${store.studentId}:${lesson.id}`
  const [pageIdx, setPageIdx] = useState(0)
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null)
  const [submissionLocked, setSubmissionLocked] = useState(snapshot?.locked ?? false)
  const [submissionStatusLoaded, setSubmissionStatusLoaded] = useState(preview || staffView)
  const [submissionAt,setSubmissionAt]=useState<string|null>(null)
  const [reviewFeedback,setReviewFeedback]=useState(snapshot?.feedback ?? '')
  useEffect(() => {
    if (preview || staffView || (stepped && !notebookChecks && lesson.content_blocks?.presentation==='physics-path')) return
    let active = true
    fetch(`/api/lessons/submit?lesson_id=${lesson.id}`).then(r => r.ok ? r.json() : null).then(d => { if (active && d) {setSubmissionLocked(Boolean(d.locked));setSubmitted(Boolean(d.submittedAt)&&Boolean(d.locked));setSubmissionAt(d.submittedAt??null);setReviewFeedback(d.feedback??'');setSubmissionStatusLoaded(true)} }).catch(() => {})
    return () => { active = false }
  }, [lesson.id, preview, staffView, stepped, notebookChecks, lesson.content_blocks?.presentation])
  const [submitted, setSubmitted] = useState(snapshot?.submitted ?? false)
  useEffect(() => {
    if (preview || !store.studentId) return
    try {
      const saved = sectionIndexForAnchor(pages, localStorage.getItem(storageKey))
      if (Number.isInteger(saved) && saved >= 0 && saved < pageCount) setPageIdx(saved)
    } catch { /* private mode — start at 0 */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, pageCount])
  // S-2 / B-3 · sections after an unsatisfied gate are locked (readable when gating is off).
  const lockedFrom = useMemo(() => firstLockedIndex(pages, committed, gating), [pages, committed, gating])
  const isLocked = (i: number) => i >= lockedFrom
  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(pageCount - 1, i))
    if (isLocked(clamped)) return
    setPageIdx(clamped)
    try { if (!preview && !staffView) localStorage.setItem(storageKey, anchors[clamped] ?? '') } catch { /* ignore */ }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openAnswer = (index: number, blockId: string) => {
    if (isLocked(index)) return
    breakAway(index)
    setPendingAnswer(blockId)
  }

  // P-4 · follow mode: a student device moves to the projector's section while
  // following; tapping the rail (or Prev/Next) breaks away. Gates still apply —
  // a locked section shows the catch-up note instead of jumping.
  const live = usePresentLive()
  const resolvedLiveSection = sectionIndexForAnchor(pages, live.session?.currentAnchor)
  const liveSection = resolvedLiveSection >= 0 ? resolvedLiveSection : null
  const timerLeft = useTimerLeft(live.session?.timerEndsAt)
  useEffect(() => {
    if (staffView || !presentLive || !live.session || !live.follow || liveSection === null) return
    if (liveSection === pageIdx || isLocked(liveSection)) return
    setPageIdx(Math.max(0, Math.min(pageCount - 1, liveSection)))
    // Follow position is transient: independent anchor is never overwritten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveSection, live.follow, live.session?.id, lockedFrom])
  const breakAway = (i: number) => { if (live.session && i !== liveSection) live.setFollow(false); goTo(i) }
  const pollPage = pages.findIndex(p => p.blocks.some(b => b.id === live.session?.pollBlockId))
  const liveQuestionLink = !staffView && live.session?.pollBlockId && pollPage >= 0 ? <div className="rounded-lg border bg-card p-3 text-sm" role="status">
    <strong>{live.session.pollRevealed ? 'Live question · results revealed' : live.session.pollLocked ? 'Live question · responses paused' : 'Live question open'}</strong>
    {isLocked(pollPage) ? <p>Finish the current checkpoint to open the question in step {pollPage + 1}.</p> : <button type="button" className="ml-2 min-h-11 rounded-lg border px-3 font-semibold" onClick={() => openAnswer(pollPage, live.session!.pollBlockId!)}>Open this question · step {pollPage + 1}</button>}
  </div> : null

  // Per-section completion (the honest progress thread): explicit "Got it"
  // checkpoints, persisted per lesson. A section also reads done once passed.
  const { markComplete, isComplete: locallyComplete } = useSectionProgress(lesson.id, pageCount, !preview && !staffView, anchors, revision)
  const isComplete = (index:number) => snapshot ? snapshot.revision===revision && !!snapshot.completedAnchors?.includes(anchors[index]) : locallyComplete(index)
  const sectionDone = (i: number) => pages[i]?.hasCapture ? pages[i].captureBlocks.filter(isRequiredCaptureBlock).every((b) => isBlockComplete(b, committed[b.id]?.response)) : isComplete(i)
  useEffect(() => {
    if (!notebookChecks || preview || staffView || !responsesLoaded || submissionLocked) return
    pages.forEach((section, index) => {
      if (section.hasCapture && section.captureBlocks.filter(isRequiredCaptureBlock).every(block => isBlockComplete(block, committed[block.id]?.response))) markComplete(index)
    })
  }, [notebookChecks, pages, committed, preview, staffView, responsesLoaded, submissionLocked, markComplete])

  // Whole-lesson task progress (the "tasks saved" bar).
  const interactive = useMemo(() => blocks.filter(isRequiredCaptureBlock), [blocks])
  const totalTasks = interactive.length
  const doneTasks = interactive.filter((b) => isBlockComplete(b, committed[b.id]?.response)).length
  const allTasksDone = totalTasks > 0 && doneTasks === totalTasks
  // MC-6 · lobby day: self-rating opens only after the individual exit ticket is saved.
  const exitPending = blocks.filter((b) => b.type === 'exit_ticket' && isRequiredCaptureBlock(b)).some((b) => !isBlockComplete(b, committed[b.id]?.response))
  const selfRatingHold = !staffView && exp?.lobbyToday && exitPending
    ? 'Your group worked on this today. Save your own exit ticket first — then rate yourself on what YOU can do. · Primero guarda tu boleto de salida, luego califícate.'
    : null

  const page = pages[pageIdx]
  const isLast = pageIdx === pageCount - 1
  const checkpointNote = gating && page ? gateNote(pageBlockedBy(page, committed)) : null
  // Every page leads with a visual. If the page's own blocks already include a
  // figure/diagram/sketch, we let those carry it; otherwise we render an
  // illustrated step banner so no page is a wall of text.
  const ownVisual = page ? pageHasVisual(page) : false
  const StepIcon: LucideIcon = page?.hasCapture ? PencilRuler : isLast ? Rocket : pageIdx === 0 ? Compass : Eye
  const optionalPractice = Boolean(page?.hasCapture && page.captureBlocks.every(b => b.requiredForCompletion === false))
  const stepKind = optionalPractice ? 'Optional practice' : page?.hasCapture ? 'Your task' : pageIdx === 0 ? 'Get oriented' : isLast ? 'Wrap up' : 'Read & think'
  // Soft-gate: an unsaved save-block on this page shows a nudge but never blocks Next.
  const pageUnsaved = page ? page.captureBlocks.filter((b) => isRequiredCaptureBlock(b) && !isBlockComplete(b, committed[b.id]?.response)) : []

  // Tasks bar fills by saved work.
  const minsLeft = minutesLeft(sections, pageIdx)
  const pendingBlocks = blockingDrafts(blocks, responses)
  useEffect(() => {
    if (responsesLoaded && pageIdx >= lockedFrom) setPageIdx(Math.max(0, lockedFrom - 1))
  }, [responsesLoaded, lockedFrom, pageIdx])
  useEffect(() => {
    if (!pendingAnswer || !responsesLoaded) return
    const target = document.getElementById(answerAnchor(lesson.id, pendingAnswer))
    if (!target) return
    target.focus({ preventScroll: true })
    target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
    setPendingAnswer(null)
  }, [pendingAnswer, pageIdx, responsesLoaded, lesson.id])
  if (!preview && store.loadError) return <div role="alert" className="mx-auto max-w-xl rounded-xl border p-6">
    <p>{store.loadError}</p><button type="button" onClick={() => void store.retryLoad()} className="mt-3 rounded-lg bg-primary px-4 py-2 text-primary-foreground">Retry loading saved work</button>
  </div>
  if (!responsesLoaded) return <p role="status" className="p-6">Loading your saved work…</p>

  const videoXp = { lessonId: lesson.id, enabled: !preview && !staffView && !snapshot, onXpTotal: store.recordXpTotal }

  if (stepped && notebookChecks && lesson.content_blocks?.interactiveNotebook) {
    const mappedIds = new Set(notebookChecks.map(block => block.id))
    const extraBlocks = blocks.filter(block => block.id !== lesson.content_blocks!.interactiveNotebook!.sourceBlockId && !mappedIds.has(block.id))
    const readOnly = inspection || !!snapshot || staffView || submissionLocked || !submissionStatusLoaded
    const readyToSubmit = interactive.every(block => isBlockComplete(block, responses[block.id]?.response))
    return <LessonVideoXpContext.Provider value={videoXp}><main className="mx-auto w-full max-w-6xl space-y-5 px-3 pb-24 sm:px-5" data-interactive-notebook="units">
      <header className="space-y-2 py-2"><div className="flex flex-wrap items-center justify-between gap-3"><Link className="inline-flex min-h-11 items-center text-sm underline" href={preview || staffView ? exitHref : '/lessons'}>{(preview || staffView) && !observer ? 'Back to lesson workspace' : 'Back to lessons'}</Link><h1 className="text-xl font-semibold">{lesson.title}</h1><span className="text-sm text-muted-foreground">{doneTasks} of {totalTasks} tasks saved</span></div>
        {(preview || staffView) && <p className="rounded-lg border bg-secondary p-3 text-sm" role="status">{snapshot ? 'Read-only student lesson · showing saved work' : staffView ? `${previewLabel} · answers are read-only` : 'Student preview · answers and submission are temporary'}</p>}
        <details><summary className="min-h-11 cursor-pointer text-sm font-medium">Learning targets & language support</summary><div className="space-y-3 py-3"><LanguageDial/><p className="text-sm text-muted-foreground">Practice feedback helps you check your thinking; your teacher reviews the submitted work.</p><LessonMasteryTargets snapshot={!!snapshot} preview={preview || staffView} targets={viewerTargets}/></div></details>
      </header>
      {!submissionStatusLoaded && <p role="status" className="text-sm">Checking whether this work is editable. If this message remains, <button type="button" className="min-h-11 underline" onClick={() => window.location.reload()}>reload submission status</button>.</p>}
      {reviewFeedback && <section aria-label="Teacher feedback" className="rounded-xl border bg-card p-4"><h2 className="font-semibold">Your teacher’s feedback</h2><p className="mt-2 whitespace-pre-wrap text-sm">{reviewFeedback}</p></section>}
      {live.session && <p className="text-sm text-muted-foreground">Your notebook answers stay independent of the classroom demonstration.</p>}
      {liveQuestionLink}
      <InteractiveNotebook questions={notebookChecks} responses={responses} draft={draft} save={save} readOnly={readOnly} draftState={draftState}/>
      <details className="rounded-xl border bg-card p-4" open={live.session?.pollBlockId && mappedIds.has(live.session.pollBlockId) ? true : undefined}><summary className="min-h-11 cursor-pointer font-medium">Question list & learning supports</summary><p className="mb-4 text-sm text-muted-foreground">These are the same questions and saved answers as the notebook. Use this view for live questions or if the notebook cannot load.</p><BlockRenderer key={submissionLocked ? 'locked' : 'open'} blocks={notebookChecks} referenceBlocks={blocks} lessonId={lesson.id} responses={responses} hydrated save={save} draft={draft} targets={viewerTargets} glossary={glossary} readOnly={readOnly} readOnlyExceptBlockId={!inspection && !staffView && !snapshot && submissionLocked ? live.session?.pollBlockId ?? undefined : undefined}/></details>
      {extraBlocks.length > 0 && <section aria-label="Finish the lesson" className="space-y-4"><h2 className="text-xl font-semibold">Finish the lesson</h2><BlockRenderer key={submissionLocked ? 'locked' : 'open'} blocks={extraBlocks} referenceBlocks={blocks} lessonId={lesson.id} responses={responses} hydrated save={save} draft={draft} targets={viewerTargets} glossary={glossary} readOnly={readOnly}/></section>}
      <section aria-label="Submit notebook" className="space-y-3 rounded-xl border bg-card p-5">
        {!readyToSubmit && !readOnly && <p className="text-sm">Answer all five checks and complete the reflection before submitting. Draft answers will be saved when you submit.</p>}
        {snapshot || staffView ? <p className="text-sm">Read-only view · submission is disabled.</p> : preview ? <button type="button" className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground disabled:opacity-50" disabled={!readyToSubmit || submitted} onClick={async () => { for (const block of blocks) if (responses[block.id]?.draft) await save(block.id, block.type, responses[block.id].response); setSubmitted(true); setSubmissionLocked(true) }}>{submitted ? 'Preview submitted' : 'Submit preview'}</button> : <SubmitLessonButton lessonId={lesson.id} blocked={!readyToSubmit} complete={allTasksDone} prepare={() => store.savePending(blocks)} onChange={state => { setSubmitted(Boolean(state.submittedAt) && state.locked); setSubmissionLocked(state.locked) }}/>}
        {submissionLocked && <p role="status" className="text-sm">Submitted work is locked until your teacher reviews it.</p>}
      </section>
    </main></LessonVideoXpContext.Provider>
  }

  if (stepped && lesson.content_blocks?.presentation === 'physics-path' && page) {
    const supportBlocks = blocks.filter(b => b.referencePanel && !isCaptureBlock(b))
    const missing = interactive.filter(b=>!isBlockComplete(b,responses[b.id]?.response))
    const firstUnsaved = interactive.find(b=>!isBlockComplete(b,committed[b.id]?.response))
    const changedAfterSubmission = Boolean(submissionAt && (pendingBlocks.length || Object.values(responses).some(r=>Date.parse(r.created_at)>Date.parse(submissionAt))))
    const finishTitle = !preview && !staffView && !submissionStatusLoaded ? 'Checking submission status…' : submissionLocked || submitted ? 'Submitted for teacher review' : submissionAt ? changedAfterSubmission ? 'Changes not submitted' : 'Submitted · reviewed' : allTasksDone ? 'Answers saved · not submitted' : 'Lesson not submitted'
    const finishPanel = observer ? <section className="mb-5 rounded-xl border bg-card p-5 text-sm" aria-label="Observer access"><h2 className="font-semibold">Observer preview</h2><p className="mt-2">Explore the lesson and watch its videos. Answers and submissions are read-only.</p></section> : <section id="lesson-submission" tabIndex={-1} aria-label="Lesson submission" className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-5">
      <div className="min-w-0 flex-1 space-y-2"><h2 className="text-lg font-semibold" role="status">{staffView?previewLabel:finishTitle}</h2>
        <p className="text-sm">{doneTasks} of {totalTasks} required responses saved.</p>
        {!submissionLocked && !submitted && <p className="max-w-xl text-sm text-muted-foreground">Complete the responses, then submit your lesson for teacher review. Saving answers and earning XP do not submit it.</p>}
        {firstUnsaved && !submissionLocked && !submitted && <button type="button" className="min-h-11 text-sm font-semibold text-primary underline" onClick={()=>openAnswer(pages.findIndex(p=>p.blocks.some(b=>b.id===firstUnsaved.id)),firstUnsaved.id)}>Go to next response →</button>}
      </div>
      {staffView||snapshot?<p className="text-sm">Read-only preview · submissions are disabled.</p>:preview?<button type="button" className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground disabled:opacity-50" disabled={missing.length>0||submitted} onClick={async()=>{for(const b of blocks)if(responses[b.id]?.draft)await save(b.id,b.type,responses[b.id].response);setSubmitted(true);setSubmissionLocked(true)}}>{submitted?'Preview submitted':'Submit preview'}</button>:<SubmitLessonButton lessonId={lesson.id} blocked={missing.length>0} blockedReason={`Complete ${missing.length} remaining required response${missing.length===1?'':'s'} to submit.`} prepare={()=>store.savePending(blocks)} onChange={st=>{setSubmissionStatusLoaded(true);setReviewFeedback(st.feedback??'');setSubmissionAt(st.submittedAt);setSubmitted(Boolean(st.submittedAt)&&st.locked);setSubmissionLocked(st.locked)}}/>}
    </section>
    return <LessonVideoXpContext.Provider value={videoXp}><PhysicsPathView previewLabel={previewLabel} preview={preview} title={lesson.title} focus={lesson.content_blocks.learningPath?.focus ?? ''} pages={pages} current={pageIdx} done={doneTasks} total={totalTasks} staff={staffView} onGo={breakAway} isLocked={isLocked}
      next={()=>{if(!page.hasCapture)void markComplete(pageIdx);breakAway(pageIdx+1)}}
      toolbar={<LanguageDial/>}
      mastery={<>{!observer&&<LessonXp blocks={blocks} earned={preview || staffView || !store.loaded ? undefined : xpSession}/>}<LessonMasteryTargets snapshot={!!snapshot} preview={preview||staffView} targets={preview ? viewerTargets : viewerTargets?.map(t=>({...t,teacher:exp?.mastery[t.slug]??null}))}/></>}
      follow={<>{finishPanel}{reviewFeedback&&!submissionLocked&&<section aria-label="Teacher feedback" className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-5"><h2 className="font-semibold">Your teacher’s feedback</h2><p className="mt-2 whitespace-pre-wrap text-sm">{reviewFeedback}</p><p className="mt-2 text-sm text-muted-foreground">Revise your saved answers, then submit the lesson again.</p></section>}{liveQuestionLink}{!staffView && live.session ? <button type="button" className="mb-4 min-h-11 text-sm text-primary underline" onClick={()=>{live.setFollow(!live.follow);if(!live.follow&&liveSection!==null)goTo(liveSection)}}>{live.follow?'Following teacher':'Rejoin teacher'}{timerLeft!==null?' · '+fmtTimer(timerLeft):''}</button> : null}</>}
      support={supportBlocks.length ? <section aria-label="Reading and vocabulary" className="mt-8 space-y-5 border-t pt-6"><h3 className="text-lg font-semibold">Reading & vocabulary</h3><BlockRenderer blocks={supportBlocks} referenceBlocks={blocks} lessonId={lesson.id} readOnly glossary={glossary} collapseReferences={false}/></section> : null}
      submit={observer ? <p className="mt-5 text-sm text-muted-foreground">Observer preview · answers and submission are read-only.</p> : <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm"><span>{submissionLocked||submitted?'Submitted for teacher review.':allTasksDone?'Your responses are saved. Submit the lesson to turn it in.':'Continue through the lesson and complete each required response.'}</span><button type="button" className="min-h-11 rounded-lg border px-4 font-semibold" onClick={()=>{const panel=document.getElementById('lesson-submission');panel?.focus({preventScroll:true});panel?.scrollIntoView({behavior:'smooth',block:'center'})}}>{submissionLocked||submitted?'View submission status':'Finish & submit ↑'}</button></div>}>
      <BlockRenderer key={submissionLocked?'submitted':'editable'} hideBlockHeadings blocks={page.blocks.filter(b=>!b.referencePanel)} referenceBlocks={blocks} lessonId={lesson.id} responses={responses} hydrated={responsesLoaded} save={save} draft={draft} targets={viewerTargets} glossary={glossary} trackBadges={staffView} readOnly={inspection||!!snapshot||staffView||submissionLocked||(!preview&&!submissionStatusLoaded)} readOnlyExceptBlockId={!inspection && !staffView&&submissionLocked?live.session?.pollBlockId??undefined:undefined}/>
    </PhysicsPathView></LessonVideoXpContext.Provider>
  }

  if (stepped && lesson.content_blocks?.presentation === 'trades-workshop' && page) {
    const opener = page.blocks.find(b => b.teachingTool)
    const referenceBlocks = page.blocks.filter(b => b !== opener && !page.captureBlocks.includes(b))
    const illustrated = opener?.teachingTool?.kind === 'case-board' && opener.teachingTool.frames[0]?.image?.startsWith('/trades-etf/workshop/')
    return <LessonVideoXpContext.Provider value={videoXp}><TeachingToolContext.Provider value={staffView&&teachingCommand.state?{role:'teacher',states:teachingCommand.state.session.teaching_tool_state??{},busy:teachingCommand.busy,command:c=>teachingCommand.patch({teaching_tool:c,expected_command_revision:teachingCommand.state!.session.command_revision})}:null}><TradesWorkshopView preview={preview} exitHref={exitHref} title={lesson.title} pages={pages} current={pageIdx} responses={responses} staff={staffView} locked={submissionLocked} done={doneTasks} total={totalTasks} onGo={breakAway} isLocked={isLocked}
      toolbar={staffView && !observer && !preview && presentLive ? <LessonTeachLink lessonId={lesson.id}/> : <span>{previewLabel}</span>}
      follow={<>{reviewFeedback&&!submissionLocked&&<section aria-label="Teacher feedback" className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-5"><h2 className="font-semibold">Your teacher’s feedback</h2><p className="mt-2 whitespace-pre-wrap text-sm">{reviewFeedback}</p><p className="mt-2 text-sm text-muted-foreground">Revise your saved answers, then submit the lesson again.</p></section>}{liveQuestionLink}{!staffView && live.session ? <button type="button" onClick={()=>{live.setFollow(!live.follow);if(!live.follow&&liveSection!==null)goTo(liveSection)}}>{live.follow?'Following teacher':'Rejoin teacher'}{timerLeft!==null?' · '+fmtTimer(timerLeft):''}</button> : null}</>}
      scene={<>{teachingCommand.error && <p role="alert">{teachingCommand.error}</p>}{opener ? <TeachingToolRenderer key={opener.id} block={opener}/> : null}{referenceBlocks.length > 0 && (illustrated ? <details key={opener?.id} open={opener?.workshop?.stage === 'Brief'} className="my-6 rounded-xl border bg-card p-5"><summary className="min-h-11 cursor-pointer font-semibold">{opener?.workshop?.stage === 'Plan' ? 'Worked solution and reference' : 'Materials, finished work and reference'}</summary><BlockRenderer hideBlockHeadings blocks={referenceBlocks} referenceBlocks={blocks} lessonId={lesson.id} readOnly /></details> : <BlockRenderer hideBlockHeadings blocks={referenceBlocks} referenceBlocks={blocks} lessonId={lesson.id} readOnly />)}</>}
      task={<BlockRenderer hideBlockHeadings blocks={page.captureBlocks} referenceBlocks={blocks} lessonId={lesson.id} responses={responses} hydrated={responsesLoaded} save={save} draft={draft} targets={viewerTargets} glossary={glossary} trackBadges={staffView} readOnly={inspection||!!snapshot||staffView||submissionLocked} readOnlyExceptBlockId={!inspection && !staffView&&submissionLocked?live.session?.pollBlockId??undefined:undefined} />}
      submit={!staffView && isLast ? <>
        {submissionLocked ? <p>This lesson was submitted. Your teacher can return it if you need to work on the rebuilt activity; your earlier submission is kept.</p> : <p>Submit your work when you are ready for review. Changed answers are saved when you submit. Your teacher checks the work; practice attempts do not become grades.</p>}
        {pendingBlocks.length>0 && <p role="status">Your changed responses will be saved when you submit.</p>}
        {preview ? <button type="button" disabled={!!snapshot||!allTasksDone||pendingBlocks.length>0||submitted} onClick={()=>setSubmitted(true)}>{submitted?'Preview submitted':'Submit workshop (preview)'}</button> : <SubmitLessonButton lessonId={lesson.id} prepare={() => store.savePending(blocks)} complete={allTasksDone} onChange={st=>{setSubmitted(Boolean(st.submittedAt)&&st.locked);setSubmissionLocked(st.locked)}}/>}
        {submitted && <p role="status">Submitted · awaiting your teacher’s review. {xpSession} XP earned.</p>}
      </> : null}
    /></TeachingToolContext.Provider></LessonVideoXpContext.Provider>
  }

  return (
    <LessonVideoXpContext.Provider value={videoXp}><div className={`${styles.viewer} mx-auto px-4 pb-28`} style={{ maxWidth: 1240, color: 'var(--foreground)' }}>
      <style>{lessonIdentityStyles}</style>
      <div className="lg:grid lg:gap-8" style={{ gridTemplateColumns: 'minmax(0, 1fr) 256px' }}>
        {/* main reading column */}
        <div className="min-w-0" style={{ maxWidth: 760, marginInline: 'auto', width: '100%' }}>
          {/* compact sticky header: identity + section counter + progress */}
          <div
            className={`${styles.header} relative z-20 px-4 pt-3 pb-3`}
            style={{ background: 'color-mix(in oklch, var(--background) 92%, transparent)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className={styles.identity}>
              {!staffView && !preview && <LessonAvatar />}
              <div className="min-w-0">
                <Link href={preview ? exitHref : "/home"} className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <ChevronLeft size={14} /> Home
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  {day && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5" style={{ background: 'var(--secondary)', color: 'var(--primary)' }}>
                      <day.Icon size={11} /> {day.label}
                    </span>
                  )}
                  <h1 className={styles.title}>{lesson.title}</h1>
                </div>
              </div>
              </div>
              {/* honest section counter: where you are + how much is left */}
              <div className="inline-flex items-center gap-2 text-xs flex-wrap" style={{ color: 'var(--muted-foreground)' }}>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  Section {pageIdx + 1} of {pageCount}
                </span>
                {minsLeft > 0 && (
                  <span className="inline-flex items-center gap-1">· <Clock size={12} /> ~{minsLeft} min left</span>
                )}
                {/* autosave status — drafts are kept as you type; Save is still the record */}
                {!staffView && draftState !== 'idle' && (
                  <span className="inline-flex items-center gap-1" title="Drafts are kept automatically. Save each answer, then submit the lesson for review." style={{ color: draftState === 'offline' ? 'var(--reward-foreground)' : 'var(--muted-foreground)' }}>
                    · {draftState === 'dirty' || draftState === 'saving' ? 'Saving draft…' : draftState === 'saved' ? 'Draft kept' : 'Draft sync failed — retry when connected'}
                  </span>
                )}
                {/* quick-peek at the reference sheet without losing your place */}
                <a
                  href={preview ? exitHref : "/reference"}
                  target="_blank"
                  rel="noopener"
                  title="Open the reference sheet in a new tab"
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold"
                  style={{ border: '1px solid var(--border)', color: 'var(--primary)', background: 'var(--card)' }}
                >
                  <Sigma size={11} /> Reference
                </a>
                {staffView && !preview && presentLive && (
                  <LessonTeachLink lessonId={lesson.id}/>
                )}
              </div>
            </div>

            {/* SEI level dial — visible to the student (principle 7) */}
            <details className="mt-2"><summary className="cursor-pointer text-sm font-semibold">Language support</summary><div className="mt-2"><LanguageDial /></div></details>

            {/* P-4 · live class: follow chip + class timer */}
            {!staffView && live.session && (
              <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
                {live.follow ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold" style={{ background: 'color-mix(in oklch, var(--reward) 18%, var(--card))', color: 'var(--reward-foreground)', border: '1px solid color-mix(in oklch, var(--reward) 45%, var(--border))', minHeight: 28 }}>
                    <Radio size={12} /> Following your teacher{liveSection !== null && isLocked(liveSection) ? ` · finish this checkpoint to catch up to section ${liveSection + 1}` : ''}
                  </span>
                ) : (
                  <button type="button" onClick={() => { live.setFollow(true); if (liveSection !== null) goTo(liveSection) }} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold" style={{ background: 'var(--card)', color: 'var(--primary)', border: '1px solid var(--border)', minHeight: 28 }}>
                    <Radio size={12} /> Follow teacher{liveSection !== null ? ` · section ${liveSection + 1}` : ''}
                  </button>
                )}
                {timerLeft !== null && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-bold tabular-nums" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: timerLeft === 0 ? 'var(--destructive)' : 'var(--foreground)', minHeight: 28 }}>
                    <Timer size={12} /> {fmtTimer(timerLeft)}
                  </span>
                )}
              </div>
            )}

            {liveQuestionLink}

            {/* segmented progress — one segment per section */}
            <div className="mt-2 flex items-center gap-1" aria-hidden>
              {sections.map((_, i) => {
                const cur = i === pageIdx
                const done = sectionDone(i)
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-full"
                    style={{
                      height: 6,
                      transition: 'background .2s cubic-bezier(0.16,1,0.3,1)',
                      background: cur ? 'var(--primary)' : done ? 'var(--success)' : 'var(--secondary)',
                    }}
                  />
                )
              })}
            </div>
            {/* tasks-saved bar — how much work is logged */}
            {totalTasks > 0 && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-xs font-medium inline-flex items-center gap-1" style={{ color: allTasksDone ? 'var(--success)' : 'var(--muted-foreground)' }}>
                  {allTasksDone ? <Check size={12} /> : <Pencil size={11} />}
                  {doneTasks} of {totalTasks} responses saved · progress, not a mastery score
                </span>
              </div>
            )}
          </div>

          <LessonXp blocks={blocks} earned={preview || staffView || !store.loaded ? undefined : xpSession} />

          {/* visual step banner — guarantees a non-text element atop every page. */}
          {page && !stepped && (
            <div
              className="mt-4 rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border)' }}
            >
              <div
                className="flex items-center gap-3 px-4"
                style={{
                  paddingTop: ownVisual ? 10 : 18,
                  paddingBottom: ownVisual ? 10 : 18,
                  background: page.hasCapture
                    ? 'color-mix(in oklch, var(--reward) 16%, var(--card))'
                    : 'color-mix(in oklch, var(--primary) 12%, var(--card))',
                }}
              >
                <span
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: ownVisual ? 34 : 46, height: ownVisual ? 34 : 46, borderRadius: '50%',
                    background: page.hasCapture ? 'var(--reward)' : 'var(--primary)',
                    color: page.hasCapture ? 'var(--reward-foreground)' : 'var(--primary-foreground)',
                  }}
                >
                  <StepIcon size={ownVisual ? 18 : 24} />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                    Section {pageIdx + 1} · {stepKind}
                  </div>
                  {!ownVisual && (
                    <div className="text-sm" style={{ color: 'var(--foreground)' }}>
                      {page.hasCapture ? 'Show the idea and why it makes sense. A short explanation or labeled diagram is welcome.' : 'Take this in before you move on.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* the current page — blocks get the full column width.
              `lesson-reading` scopes the key-equation styling (see globals.css). */}
          {page && stepped && (
            <section className={`${styles.stepCard} lesson-chapter`} aria-labelledby="lesson-step-title">
              <span className={`${styles.chapterNumber} lesson-chapter-number`} aria-hidden="true">{lessonNumber(pageIdx + 1)}</span>
              <div className={styles.stepTop}>
                <span className={styles.stepIcon}><StepIcon size={24} aria-hidden="true" /></span>
                <span className={styles.eyebrow}>{stepKind} · Step {pageIdx + 1} of {pageCount}</span>
                {sections[pageIdx]?.minutes > 0 && <span className={styles.time}><Clock size={13} /> ~{sections[pageIdx].minutes} min</span>}
              </div>
              <h2 id="lesson-step-title" className="lesson-headline lesson-chapter-title">{sections[pageIdx]?.title}</h2>
              <div className={styles.activityFlow} aria-label="Activity sequence">
                <span><BookOpen size={15} /> Explore</span><ChevronRight size={14} aria-hidden="true" /><span><PencilRuler size={15} /> {page.hasCapture ? 'Try it' : 'Think it through'}</span><ChevronRight size={14} aria-hidden="true" /><span><Check size={15} /> {page.hasCapture ? 'Save your work' : 'Continue'}</span>
              </div>
              <div className={styles.instruction}><div>
                <strong>{submissionLocked ? 'Review your work' : optionalPractice ? 'Optional practice' : page.hasCapture ? (pageUnsaved.length ? 'What to do' : 'Responses saved') : 'Start here'}</strong>
                <p>{submissionLocked ? 'Read your submitted answers and any available feedback below.'
                  : checkpointNote && pageUnsaved.length === 0 ? checkpointNote
                  : optionalPractice ? 'Discuss or try this activity if it helps. You can continue without saving a response. Any response you do save remains available to your teacher.' : page.hasCapture ? (pageUnsaved.length ? 'Read the material, complete the activity below, then save your answer.' : isLast ? 'Review your answers, then submit your lesson below.' : 'Check your thinking, then continue to the next step.')
                  : 'Read and explore the material below. When you’re ready, continue to the next step.'}</p>
                </div><button type="button" className={styles.startActivity} onClick={() => { const first = page.captureBlocks.find(b => answerStatus(b, responses) !== 'Saved') ?? page.captureBlocks[0]; if (first) { openAnswer(pageIdx, first.id); return } const activity = document.getElementById('lesson-activity'); activity?.focus({ preventScroll: true }); activity?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }) }}>{submissionLocked ? 'View work' : page.hasCapture ? 'Open activity' : 'Let’s explore'} <ChevronRight size={16} aria-hidden="true" /></button>
              </div>
              {page.hasCapture && !optionalPractice && <div className={styles.stepStatus} role="status">{pageUnsaved.length ? <Pencil size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />} {page.captureBlocks.filter(isRequiredCaptureBlock).filter(b => isBlockComplete(b, committed[b.id]?.response)).length} of {page.captureBlocks.filter(isRequiredCaptureBlock).length} required responses saved in this step</div>}
            </section>
          )}

          {totalTasks > 0 && <details className={`${styles.mobileAnswers} lg:hidden`}>
            <summary>All lesson answers · {doneTasks} of {totalTasks} saved</summary>
            <AnswerChecklist pages={pages} responses={responses} currentIndex={pageIdx} isLocked={isLocked} onOpen={openAnswer} />
          </details>}
          {page?.hasCapture && <div className={styles.currentAnswers} aria-label="Answers in this step">
            <strong><Pencil size={17} /> Responses in this step</strong>
            {page.captureBlocks.map(block => <button type="button" key={block.id} onClick={() => openAnswer(pageIdx, block.id)}>
              <span>{answerGuide(block).title}<small>{answerGuide(block).parts.join(' · ')}</small></span><span>{answerStatus(block, responses)} <ChevronRight size={15} /></span>
            </button>)}
          </div>}
          <div id="lesson-activity" tabIndex={-1} aria-label="Current lesson activity" className={`${styles.workspace} mt-4 lesson-reading`}>
            <div className={styles.workspaceLabel}><span>{page?.hasCapture ? 'THE ACTIVITY' : 'EXPLORE THE IDEA'}</span><span>STEP {lessonNumber(pageIdx + 1)}</span></div>
            {page && stepped ? (
              splitHelpRuns(page.blocks).map((run, ri) => {
                if (!run.help) return <BlockRenderer showResponseGuide referenceBlocks={blocks} readOnly={inspection || !!snapshot || staffView || submissionLocked} readOnlyExceptBlockId={!inspection && !staffView && submissionLocked ? live.session?.pollBlockId ?? undefined : undefined} key={ri} blocks={run.blocks} lessonId={lesson.id} responses={responses} hydrated={responsesLoaded} save={save} draft={draft} targets={viewerTargets} glossary={glossary} trackBadges={staffView} selfRatingHold={selfRatingHold} />
                // S-4 · help drawer: open by default unless the student already rates Almost / Got it on the section's target.
                const t = sectionTarget(page)
                const level = t ? exp?.mastery[t] : undefined
                const openDefault = !(typeof level === 'number' && level >= 2)
                return (
                  <details key={`${pageIdx}:${ri}`} open={openDefault} className={`${styles.help} my-3 rounded-2xl border`} style={{ borderColor: 'var(--border)', background: 'color-mix(in oklch, var(--primary) 5%, var(--card))' }}>
                    <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                      <Lightbulb size={15} /> Help & worked example
                      <span className="text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}>· open or close</span>
                    </summary>
                    <div className="px-4 pb-3"><BlockRenderer showResponseGuide referenceBlocks={blocks} readOnly={inspection || !!snapshot || staffView || submissionLocked} readOnlyExceptBlockId={!inspection && !staffView && submissionLocked ? live.session?.pollBlockId ?? undefined : undefined} blocks={run.blocks} lessonId={lesson.id} responses={responses} hydrated={responsesLoaded} save={save} draft={draft} targets={viewerTargets} glossary={glossary} trackBadges={staffView} selfRatingHold={selfRatingHold} /></div>
                  </details>
                )
              })
            ) : page ? (
              <BlockRenderer showResponseGuide referenceBlocks={blocks} readOnly={inspection || !!snapshot || staffView || submissionLocked} readOnlyExceptBlockId={!inspection && !staffView && submissionLocked ? live.session?.pollBlockId ?? undefined : undefined} blocks={page.blocks} lessonId={lesson.id} responses={responses} hydrated={responsesLoaded} save={save} draft={draft} targets={viewerTargets} glossary={glossary} trackBadges={staffView} selfRatingHold={selfRatingHold} />
            ) : (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>This lesson does not have content yet.</p>
            )}
          </div>

          {/* soft nudge: unsaved save-blocks on this page (never blocks Next) */}
          {!staffView && !submissionLocked && pageUnsaved.length > 0 && (
            <div
              className="mt-4 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2"
              style={{ background: 'color-mix(in oklch, var(--reward) 14%, var(--card))', border: '1px solid color-mix(in oklch, var(--reward) 45%, var(--border))', color: 'var(--foreground)' }}
            >
              <Pencil size={15} style={{ color: 'var(--reward-foreground)' }} />
              <span>
                {gating && page && pageBlockedBy(page, committed) ? gateNote(pageBlockedBy(page, committed)) : `${pageUnsaved.length === 1 ? 'Save your response' : 'Save your responses'} when ready. You can return to this section before submitting.`}
              </span>
            </div>
          )}

          {/* submit appears on the last page only */}
          {!staffView && isLast && blocks.length > 0 && (
            <div
              className="mt-6 p-5 rounded-2xl flex items-center justify-between gap-4 flex-wrap"
              style={{
                border: allTasksDone ? '2px solid color-mix(in oklch, var(--success) 55%, var(--border))' : '1px solid var(--border)',
                background: allTasksDone ? 'color-mix(in oklch, var(--success) 8%, var(--card))' : 'var(--card)',
              }}
            >
              <div className="text-sm max-w-sm" style={{ color: 'var(--muted-foreground)' }}>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Submit your work for review.</span>{' '}
                Check that your answers show what you understand and why. Clear reasoning matters more than length. Submit saves your changed answers and sends your work to your teacher. You can submit even if some activities are unfinished.
              </div>
              {pendingBlocks.length > 0 && <div className="w-full text-sm" role="status">
                <p>These changed answers will be saved when you submit:</p>
                <ul className="mt-1 list-disc pl-5">{pendingBlocks.map((b) => {
                  const index = pages.findIndex((p) => p.blocks.some((x) => x.id === b.id))
                  return <li key={b.id}><button type="button" className="underline" onClick={() => breakAway(Math.min(index, Math.max(0, lockedFrom - 1)))}>Section {index + 1}: {sections[index]?.title}</button></li>
                })}</ul>
              </div>}
              {preview ? <button type="button" disabled={!!snapshot||!allTasksDone || pendingBlocks.length > 0 || submitted} onClick={() => setSubmitted(true)} className="rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50">{submitted ? 'Preview submitted' : 'Submit lesson (preview)'}</button> :
                <SubmitLessonButton lessonId={lesson.id} prepare={() => store.savePending(blocks)} complete={allTasksDone} onChange={(st) => { setSubmitted(Boolean(st.submittedAt)&&st.locked); setSubmissionLocked(st.locked) }} />}
            </div>
          )}

          {/* S-6 · Done screen: what was auto-checked, what awaits rating, XP earned + pending, calibration read-back */}
          {isLast && stepped && submitted && (() => {
            const t = doneTallies(blocks, committed)
            const xpTotal = xpSession
            const rated = (exp?.calibration ?? []).filter((c) => c.teacher !== null)
            return (
              <div className="mt-4 rounded-2xl border p-5" style={{ borderColor: 'color-mix(in oklch, var(--success) 45%, var(--border))', background: 'color-mix(in oklch, var(--success) 8%, var(--card))' }}>
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--success)' }}>Submitted</div>
                <h2 className="lesson-headline mt-0.5 text-title-2" style={{ color: 'var(--foreground)' }}>{lesson.title} is in.</h2>
                <div className="mt-3 grid gap-2 text-sm" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}><div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Auto-checked</div><div className="text-lg font-bold">{t.autoChecked > 0 ? `${t.autoRight} of ${t.autoChecked} right` : '—'}</div></div>
                  <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}><div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Awaiting your teacher’s rating</div><div className="text-lg font-bold">{t.awaiting}</div></div>
                  <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}><div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>XP</div><div className="text-lg font-bold" style={{ color: 'var(--reward-foreground)' }}>+{xpTotal} earned{Math.max(0,blocks.reduce((sum,b)=>sum+(b.xp ?? 0),0)-xpTotal) > 0 ? <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}> · +{Math.max(0,blocks.reduce((sum,b)=>sum+(b.xp ?? 0),0)-xpTotal)} available</span> : null}</div></div>
                </div>
                {rated.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)' }}>How you rated yourself vs. your teacher</div>
                    {rated.map((c) => (
                      <div key={c.slug} className="text-sm rounded-xl border p-3 mb-2" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                        <div className="font-semibold" style={{ color: 'var(--foreground)' }}>{c.statement}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>You: {c.self ?? '—'} · Teacher: {c.teacher}</div>
                        {calibrationCopy(c.delta) && <div className="mt-1" style={{ color: 'var(--foreground)' }}>{calibrationCopy(c.delta)}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {rated.length === 0 && <p className="text-sm mt-3" style={{ color: 'var(--muted-foreground)' }}>When your teacher adds a rating, this screen shows how your self-rating compared.</p>}
              </div>
            )
          })()}

          {/* page nav — S-5: pinned in the stepped reader, with the gate note naming the missing thing */}
          <div className={`${styles.navigation} ${stepped ? 'mt-6 pt-3 pb-3 flex items-center justify-between gap-3 sticky bottom-0 z-20 px-4' : 'mt-6 pt-5 flex items-center justify-between gap-3'}`}
            style={stepped ? { borderTop: '1px solid var(--border)', background: 'color-mix(in oklch, var(--background) 94%, transparent)', backdropFilter: 'blur(8px)' } : { borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => breakAway(pageIdx - 1)}
              disabled={pageIdx === 0}
              className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--card)', cursor: pageIdx === 0 ? 'default' : 'pointer' }}
            >
              <ChevronLeft size={16} /> Back
            </button>

            <label className="lg:hidden min-w-0 flex-1 text-sm">
              <span className="sr-only">Lesson section</span>
              <select aria-label="Lesson section" value={pageIdx} onChange={(e) => breakAway(Number(e.target.value))}
                className="w-full min-h-11 rounded-lg border bg-background px-2">
                {sections.map((section, i) => <option key={i} value={i} disabled={isLocked(i)}>
                  {i + 1} of {pageCount}: {section.title}{isLocked(i) ? ' (locked)' : ''}
                </option>)}
              </select>
            </label>

            {isLast ? (
              !submitted && !staffView ? (
                <Link href={preview ? exitHref : "/home"} className="text-sm underline">Leave without submitting</Link>
              ) : nav?.next ? (
                <Link href={`/lessons/${nav.next.slug}`} className="inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-bold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: '0 8px 22px -8px color-mix(in oklch, var(--primary) 70%, transparent)' }}>
                  Next: {trim(nav.next.title)} <ChevronRight size={16} />
                </Link>
              ) : (
                <Link href={preview ? exitHref : "/home"} className="inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-bold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: '0 8px 22px -8px color-mix(in oklch, var(--primary) 70%, transparent)' }}>
                  Finish <ChevronRight size={16} />
                </Link>
              )
            ) : (
              <div className={styles.nextAction}>
                {stepped && page && gateNote(pageBlockedBy(page, committed)) && gating && (
                  <span className="text-xs inline-flex items-center gap-1" style={{ color: 'var(--reward-foreground)' }}><Lock size={12} /> {gateNote(pageBlockedBy(page, committed))}</span>
                )}
                <button
                  onClick={() => { if (!staffView && !page?.hasCapture) markComplete(pageIdx); breakAway(pageIdx + 1) }}
                  disabled={isLocked(pageIdx + 1)}
                  className="inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-bold disabled:opacity-40"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: '0 8px 22px -8px color-mix(in oklch, var(--primary) 70%, transparent)', border: 'none', cursor: isLocked(pageIdx + 1) ? 'not-allowed' : 'pointer' }}
                >
                  {page?.hasCapture ? 'Continue' : 'Read & continue'} <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* quiet home link */}
          <div className="mt-4 text-center">
            <Link href={preview ? exitHref : "/home"} className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <Home size={13} /> Back to home
            </Link>
          </div>
        </div>
        {/* Supporting lesson path follows the reading column (desktop only). */}
        <aside className="hidden lg:block">
          <div className="sticky" style={{ top: 96 }}>
            <AnswerChecklist pages={pages} responses={responses} currentIndex={pageIdx} isLocked={isLocked} onOpen={openAnswer} />
            <details className={styles.pathDetails}><summary>Lesson path</summary><SectionRail sections={sections} currentIndex={pageIdx} isComplete={sectionDone} isLocked={isLocked} onJump={breakAway} /></details>
          </div>
        </aside>

      </div>
    </div></LessonVideoXpContext.Provider>
  )
}
