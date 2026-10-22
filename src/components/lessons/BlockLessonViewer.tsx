'use client'
import { checkInteractiveAnswer, type InteractiveTask } from '@/lib/interactive-question'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { notebookQuestions } from '@/lib/interactive-notebook'
import { LessonReadingPreview } from '@/components/readings/LessonReadingContext'
import LessonXp from './LessonXp'
import { LessonVideoXpContext } from './LessonVideoXpContext'
import TradesWorkshopView from './TradesWorkshopView'
import VideoLessonView from './VideoLessonView'
import { usesInteractiveLessonWorkspace } from '@/lib/video-lesson-workspace'
import ReflectionWorkspace from './ReflectionWorkspace'
import GraphicNovelAssignment from './GraphicNovelAssignment'
import LessonMasteryTargets from './LessonMasteryTargets'
import { physicsProblemFormat } from '@/lib/physics-problem-format'
import TeachingToolRenderer, { TeachingToolContext } from '@/components/teaching-tools/TeachingToolRenderer'
import { useCommandSession } from '@/components/present/useCommandSession'
import { answerAnchor } from './lesson-answer-guide'
import { useSession } from 'next-auth/react'
import { blockingDrafts } from '@/data/block-registry'
import type { BlockResponseMap, DraftFn, SaveMeta } from '@/components/blocks/useBlockResponses'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import SubmitLessonButton from '@/components/lessons/SubmitLessonButton'
import { useSectionProgress } from '@/components/lessons/useSectionProgress'
import type { GlossaryEntry } from '@/components/MathMarkdown'
import { useBlockResponses } from '@/components/blocks/useBlockResponses'
import { LanguageProfileProvider, LanguageDial } from '@/components/lessons/LanguageProfileProvider'
import { PresentLiveProvider, usePresentLive, useTimerLeft, fmtTimer } from '@/components/lessons/PresentLiveProvider'
import LessonTeachLink from '@/components/admin/LessonTeachLink'
import { documentRevision, sectionAnchor, sectionIndexForAnchor } from '@/lib/lesson-anchors'
import { firstLockedIndex, gateNote, pageBlockedBy } from '@/components/lessons/stepped'
import { BlockDocument, isCaptureBlock, isRequiredCaptureBlock, isBlockComplete, paginateBlocks } from '@/data/content-blocks'

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
  previewInteractiveTasks?: Record<string, InteractiveTask>
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
}

export default function BlockLessonViewer(props: BlockLessonViewerProps) {
  const { data: session } = useSession()
  const preview = !!(props.preview || props.snapshot)
  const [navigationNotice,setNavigationNotice] = useState('')
  // The language profile + scaffold dial are shared by every block on the page.
  // P-4/P-5 · students poll the live presentation (follow mode + open polls); staff drive it.
  return (
    <div onClickCapture={event=>{if(!preview)return;const link=(event.target as HTMLElement).closest('a');if(!link)return;const href=link.getAttribute('href')??'';if(href.startsWith('#')||href===(props.previewReturnHref??'/admin/lessons/'+props.lesson.id)||(props.snapshot&&href.startsWith('/api/lessons/artifacts?id=')))return;event.preventDefault();event.stopPropagation();setNavigationNotice('This link opens another area of the app. Exit preview to use it.')}}>
    {navigationNotice&&<p role="status" className="sticky top-0 z-20 rounded-lg border bg-card p-3 text-sm">{navigationNotice}<button className="ml-3 min-h-11 underline" onClick={()=>setNavigationNotice('')}>Dismiss</button></p>}
    <LessonReadingPreview.Provider value={preview}><LanguageProfileProvider preview={preview} previewProfile={props.previewProfile}>
      <PresentLiveProvider lessonId={props.lesson.id} enabled={!props.staffView && !preview} simulation={preview?props.previewLive:undefined}>
        <BlockLessonViewerInner key={`${props.lesson.id}:${session?.user?.id ?? "anonymous"}:${props.preview ? "preview" : "student"}`} {...props} preview={preview} />
      </PresentLiveProvider>
    </LanguageProfileProvider></LessonReadingPreview.Provider></div>
  )
}

function BlockLessonViewerInner({ lesson, staffView = false, preview = false, previewTargets, previewFlags, previewAnswerKeys = {}, previewInteractiveTasks = {}, snapshot, previewReturnHref }: BlockLessonViewerProps) {
  const session = useSession().data
  const inspection = Boolean(session?.experience)
  const observer = session?.user?.role === 'observer'
  const previewLabel = observer ? 'Observer preview' : 'Teacher preview'
  const exitHref = previewReturnHref ?? `/admin/lessons/${lesson.id}`
  const [teachingSessionId] = useState<string|null>(null)
  const teachingCommand = useCommandSession(staffView?teachingSessionId:null)
  const blocks = useMemo(() => lesson.content_blocks ? physicsProblemFormat(lesson.id,lesson.content_blocks).blocks : [], [lesson.id,lesson.content_blocks])
  const notebookChecks = useMemo(() => lesson.content_blocks ? notebookQuestions({ ...lesson.content_blocks, blocks }) : null, [lesson.content_blocks, blocks])

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
    const interactiveTask = previewInteractiveTasks[id]
    const checked = interactiveTask ? checkInteractiveAnswer(interactiveTask,response) : key && response && typeof response === 'object'
      ? { ...response, autoCheck: (response as { optionId?: string }).optionId === key ? 'match' : 'mismatch' } : response
    setPlayResponses((prev) => ({ ...prev, [id]: { response: checked, created_at: new Date().toISOString() } }))
    return true
  }, [preview, staffView, previewAnswerKeys, previewInteractiveTasks, persistSave, snapshot])
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
  const configuredStepped = ((preview ? previewFlags?.experience : exp?.flags.experience) ?? 'stepped') === 'stepped'
  const stepped = usesInteractiveLessonWorkspace(lesson.content_blocks) || configuredStepped
  const gating = !staffView && configuredStepped && ((preview ? previewFlags?.gateCheckpoints : exp?.flags.gateCheckpoints) ?? true)
  const presentLive = exp?.flags.presentLive ?? true

  // Split the lesson into pages: each save-required block rides with the
  // reference blocks that set it up. Each page is one "section".
  const pages = useMemo(() => paginateBlocks(blocks), [blocks])
  const pageCount = pages.length

  // Current page, restored from localStorage so a reload returns to the spot.
  const anchors = useMemo(() => pages.map(sectionAnchor), [pages])
  const revision = useMemo(() => documentRevision(pages), [pages])
  const storageKey = `lesson-page:v3:${store.studentId}:${lesson.id}`
  const [pageIdx, setPageIdx] = useState(0)
  const [videoWorkRequest, setVideoWorkRequest] = useState(0)
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
    setVideoWorkRequest(value => value + 1)
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
  const page = pages[pageIdx]
  const isLast = pageIdx === pageCount - 1
  const checkpointNote = gating && page ? gateNote(pageBlockedBy(page, committed)) : null
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

  if (lesson.content_blocks?.reflection?.kind === 'graphic-novel') {
    const readOnly = inspection || !!snapshot || staffView || submissionLocked || !submissionStatusLoaded
    const ready = interactive.length > 0 && interactive.every(b => isBlockComplete(b, responses[b.id]?.response))
    return <GraphicNovelAssignment id={lesson.id} title={lesson.title} document={lesson.content_blocks} responses={responses} draft={draft} save={save}
      readOnly={readOnly} submitted={submitted} preview={preview || staffView} draftState={draftState} feedback={reviewFeedback}
      toolbar={<Link className="inline-flex min-h-11 items-center text-sm underline" href={preview || staffView ? exitHref : '/home'}>{preview || staffView ? 'Back to lesson workspace' : 'Back to my calendar'}</Link>}
      footer={<div className="space-y-3 rounded-xl border bg-card p-5"><h2 className="font-semibold">Submit your work</h2>
        {snapshot || staffView ? <p className="text-sm">Read-only view · submission is disabled.</p> : preview ? <p className="text-sm">Teacher preview · submission is disabled.</p> : <SubmitLessonButton lessonId={lesson.id} blocked={!ready || readOnly} complete={allTasksDone} prepare={() => store.savePending(blocks)} onChange={state => { setSubmissionStatusLoaded(true); setReviewFeedback(state.feedback ?? ''); setSubmitted(Boolean(state.submittedAt) && state.locked); setSubmissionLocked(state.locked) }}/>}</div>}
    />
  }

  if (lesson.content_blocks?.reflection) {
    const readOnly = inspection || !!snapshot || staffView || submissionLocked || !submissionStatusLoaded
    const ready = interactive.every(b => isBlockComplete(b, responses[b.id]?.response))
    const reflectionWork = blocks.filter(isCaptureBlock), reflectionBrief = blocks.filter(b => !isCaptureBlock(b))
    return <ReflectionWorkspace title={lesson.title} initialView={reflectionBrief.length ? 'side' : 'work'}
      toolbar={<><Link className="inline-flex min-h-11 items-center underline" href={preview || staffView ? exitHref : '/home'}>{preview || staffView ? 'Back to lesson workspace' : 'Back to my calendar'}</Link><LanguageDial/></>}
      brief={<><BlockRenderer blocks={reflectionBrief} referenceBlocks={blocks} lessonId={lesson.id} readOnly glossary={glossary}/><p className="mt-4 text-sm text-muted-foreground">{doneTasks} of {totalTasks} saved. Submit when ready.</p>{(preview || staffView) && <p className="mt-4 text-sm">{snapshot ? 'Read-only submitted work' : 'Teacher preview · no student work is changed'}</p>}{reviewFeedback && <section aria-label="Teacher feedback" className="mt-4 rounded-lg border p-3"><h2 className="font-semibold">Teacher feedback</h2><p className="whitespace-pre-wrap text-sm">{reviewFeedback}</p></section>}</>}
      work={<BlockRenderer key={submissionLocked ? 'locked' : 'open'} blocks={reflectionWork} referenceBlocks={blocks} lessonId={lesson.id} responses={responses} hydrated save={save} draft={draft} glossary={glossary} targets={viewerTargets} readOnly={readOnly}/>}
      footer={<section className="space-y-3 rounded-xl border bg-card p-5" aria-label="Submit reflection"><h2 className="font-semibold">Submit your work</h2><p className="text-sm text-muted-foreground">Your teacher will review your work.</p>{snapshot || staffView ? <p className="text-sm">Read-only view · submission is disabled.</p> : preview ? <p className="text-sm">Teacher preview · uploads and submission are disabled.</p> : <SubmitLessonButton lessonId={lesson.id} blocked={!ready || readOnly} complete={allTasksDone} prepare={() => store.savePending(blocks)} onChange={state => { setSubmissionStatusLoaded(true); setReviewFeedback(state.feedback ?? ''); setSubmitted(Boolean(state.submittedAt) && state.locked); setSubmissionLocked(state.locked) }}/>}</section>}
    />
  }

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
    return <LessonVideoXpContext.Provider value={videoXp}><VideoLessonView
      title={lesson.title} unit={lesson.unit} focus={lesson.content_blocks.learningPath?.focus ?? ''} exitHref={preview || staffView ? exitHref : '/lessons'} previewLabel={previewLabel} preview={preview} staff={staffView}
      pages={pages} current={pageIdx} done={doneTasks} total={totalTasks} workRequest={videoWorkRequest} onGo={breakAway} isLocked={isLocked} isDone={sectionDone} checkpointNote={checkpointNote}
      next={()=>{if(!page.hasCapture)void markComplete(pageIdx);breakAway(pageIdx+1)}}
      draftStatus={submissionLocked || submitted ? 'Submitted for teacher review' : draftState === 'offline' ? 'Draft sync failed · reconnect to save' : draftState === 'dirty' || draftState === 'saving' ? 'Saving draft…' : draftState === 'saved' ? 'Draft kept · save each response when ready' : allTasksDone ? 'Responses saved · ready to submit' : 'Work at your own pace'}
      toolbar={<LanguageDial/>}
      mastery={<>{!observer&&<LessonXp blocks={blocks} earned={preview || staffView || !store.loaded ? undefined : xpSession}/>}<LessonMasteryTargets snapshot={!!snapshot} preview={preview||staffView} targets={preview ? viewerTargets : viewerTargets?.map(t=>({...t,teacher:exp?.mastery[t.slug]??null}))}/></>}
      follow={<>{reviewFeedback&&<section aria-label="Teacher feedback" className="mb-5 rounded-xl border bg-card p-5"><h2 className="font-semibold">Your teacher’s feedback</h2><p className="mt-2 whitespace-pre-wrap text-sm">{reviewFeedback}</p></section>}{liveQuestionLink}{!staffView && live.session ? <button type="button" className="mb-4 min-h-11 text-sm text-primary underline" onClick={()=>{live.setFollow(!live.follow);if(!live.follow&&liveSection!==null)goTo(liveSection)}}>{live.follow?'Following teacher':'Rejoin teacher'}{timerLeft!==null?' · '+fmtTimer(timerLeft):''}</button> : null}</>}
      support={supportBlocks.length ? <BlockRenderer blocks={supportBlocks} referenceBlocks={blocks} lessonId={lesson.id} readOnly glossary={glossary} collapseReferences={false}/> : null}
      submit={finishPanel}>
      {page.blocks.every(b=>b.referencePanel||b.type==='instruction_video')&&<p className="text-base leading-7 text-muted-foreground">{blocks.some(b=>b.type==='instruction_video') ? 'Watch the video at your own pace. When you are ready, continue to the worked example and practice. You can keep the video beside your work or return to it at any point.' : 'Explore the classroom scene, then continue to the worked example and practice. Your learning targets, vocabulary, and language support are available below.'}</p>}
      <BlockRenderer interactiveQuestions key={submissionLocked?'submitted':'editable'} hideBlockHeadings blocks={page.blocks.filter(b=>!b.referencePanel&&b.type!=='instruction_video')} referenceBlocks={blocks} lessonId={lesson.id} responses={responses} hydrated={responsesLoaded} save={save} draft={draft} targets={viewerTargets} glossary={glossary} trackBadges={staffView} readOnly={inspection||!!snapshot||staffView||submissionLocked||(!preview&&!submissionStatusLoaded)} readOnlyExceptBlockId={!inspection&&!staffView&&submissionLocked?live.session?.pollBlockId??undefined:undefined}/>
    </VideoLessonView></LessonVideoXpContext.Provider>

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

  // Historical submissions remain reviewable after their authoring UI is retired.
  if (snapshot) return <section className="mx-auto max-w-4xl space-y-4 p-6">
    <h1 className="text-xl font-semibold">{lesson.title}</h1>
    <p>Read-only submitted work</p>
    {snapshot.feedback && <p className="whitespace-pre-wrap">{snapshot.feedback}</p>}
    <BlockRenderer blocks={blocks} referenceBlocks={blocks} lessonId={lesson.id} responses={snapshot.responses} hydrated readOnly glossary={glossary}/>
    <Link className="inline-flex min-h-11 items-center underline" href={exitHref}>Back to lesson workspace</Link>
  </section>

  return <section className="mx-auto max-w-xl space-y-4 rounded-xl border bg-card p-6">
    <h1 className="text-xl font-semibold">This lesson format has been retired</h1>
    <p>Open the learning library or your calendar for current assignments.</p>
    <Link className="inline-flex min-h-11 items-center text-primary underline" href={preview || staffView ? exitHref : '/home'}>Back to {preview || staffView ? 'lesson workspace' : 'my calendar'}</Link>
  </section>
}
