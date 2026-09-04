'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import SubmitLessonButton from '@/components/lessons/SubmitLessonButton'
import SectionRail from '@/components/lessons/SectionRail'
import { buildSections, minutesLeft } from '@/components/lessons/lesson-sections'
import { useSectionProgress } from '@/components/lessons/useSectionProgress'
import type { GlossaryEntry } from '@/components/MathMarkdown'
import { useBlockResponses } from '@/components/blocks/useBlockResponses'
import { LanguageProfileProvider, LanguageDial } from '@/components/lessons/LanguageProfileProvider'
import { PresentLiveProvider, usePresentLive, useTimerLeft, fmtTimer } from '@/components/lessons/PresentLiveProvider'
import PresentLiveLayer from '@/components/present/PresentLiveLayer'
import { Radio, Timer } from 'lucide-react'
import { calibrationCopy, doneTallies, firstLockedIndex, gateNote, pageBlockedBy, sectionTarget, splitHelpRuns } from '@/components/lessons/stepped'
import { Lock, Lightbulb } from 'lucide-react'
import { BlockDocument, isCaptureBlock, isBlockComplete, paginateBlocks, pageHasVisual, type DeckBlock } from '@/data/content-blocks'
import { Home, ChevronLeft, ChevronRight, Clock, Sparkles, FlaskConical, BookOpen, Wrench, Rocket, Layers, Check, CheckCircle2, Pencil, PencilRuler, Eye, Compass, Sigma, type LucideIcon } from 'lucide-react'

interface NavLink { slug: string; title: string }

interface BlockLessonViewerProps {
  /** Staff preview: badge CPA-only / Honors-only blocks. Students never get this. */
  staffView?: boolean
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
  // The language profile + scaffold dial are shared by every block on the page.
  // P-4/P-5 · students poll the live presentation (follow mode + open polls); staff drive it.
  return (
    <LanguageProfileProvider>
      <PresentLiveProvider lessonId={props.lesson.id} enabled={!props.staffView}>
        <BlockLessonViewerInner {...props} />
      </PresentLiveProvider>
    </LanguageProfileProvider>
  )
}

function BlockLessonViewerInner({ lesson, nav, staffView = false }: BlockLessonViewerProps) {
  const blocks = useMemo(() => lesson.content_blocks?.blocks ?? [], [lesson.content_blocks])
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
    let active = true
    fetch(`/api/lessons/${lesson.id}/vocab`).then((r) => (r.ok ? r.json() : { terms: [] })).then((d: { terms?: { term: string; definition: string; tier?: number | null; cognate?: string | null; part_of_speech?: string | null; example?: string | null }[] }) => {
      if (!active) return
      setVocabTerms((d.terms ?? []).filter((t) => t.term && t.definition && (t.tier ?? 3) >= 2).map((t) => ({ term: t.term, definition: t.definition, cognate: t.cognate ?? undefined, tier: t.tier ?? undefined, partOfSpeech: t.part_of_speech ?? undefined, example: t.example ?? undefined })))
    }).catch(() => {})
    return () => { active = false }
  }, [lesson.id])
  const glossary = useMemo<GlossaryEntry[]>(() => {
    const seen = new Set(keyTerms.map((t) => t.term.toLowerCase()))
    return [...keyTerms, ...vocabTerms.filter((t) => !seen.has(t.term.toLowerCase()))]
  }, [keyTerms, vocabTerms])

  // One source of truth for responses, shared with the renderer so progress
  // fills as the student saves interactive blocks.
  const { responses, save, draft, draftState, loaded: responsesLoaded, xpEarned: xpSession } = useBlockResponses(lesson.id)
  // Drafts are shown (the student sees what they typed) but never COUNT: gates,
  // progress, tallies and the exit-ticket hold read only explicit saves.
  const committed = useMemo(() => Object.fromEntries(Object.entries(responses).filter(([, v]) => !v.draft)), [responses])

  // A-5 · the class's reader flags + S-4 mastery + S-6 calibration, one fetch.
  const [exp, setExp] = useState<{ flags: { experience: 'classic' | 'stepped'; gateCheckpoints: boolean; presentLive?: boolean }; mastery: Record<string, number>; calibration: { slug: string; statement: string; self: number | null; teacher: number | null; delta: number | null }[]; xpEarned: number; lobbyToday?: boolean } | null>(null)
  useEffect(() => {
    let active = true
    fetch(`/api/lessons/experience?lesson_id=${lesson.id}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (active && d?.flags) setExp(d) }).catch(() => {})
    return () => { active = false }
  }, [lesson.id])
  const stepped = (exp?.flags.experience ?? 'stepped') === 'stepped'
  const gating = stepped && (exp?.flags.gateCheckpoints ?? true)
  const presentLive = exp?.flags.presentLive ?? true

  // Split the lesson into pages: each save-required block rides with the
  // reference blocks that set it up. Each page is one "section".
  const pages = useMemo(() => paginateBlocks(blocks), [blocks])
  const pageCount = pages.length
  const sections = useMemo(() => buildSections(pages, lesson.estimated_time), [pages, lesson.estimated_time])

  // Current page, restored from localStorage so a reload returns to the spot.
  const storageKey = `lesson-page:${lesson.id}`
  const [pageIdx, setPageIdx] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(storageKey))
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
    try { localStorage.setItem(storageKey, String(clamped)) } catch { /* ignore */ }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // P-4 · follow mode: a student device moves to the projector's section while
  // following; tapping the rail (or Prev/Next) breaks away. Gates still apply —
  // a locked section shows the catch-up note instead of jumping.
  const live = usePresentLive()
  const liveSection = live.session?.currentSection ?? null
  const timerLeft = useTimerLeft(live.session?.timerEndsAt)
  useEffect(() => {
    if (staffView || !presentLive || !live.session || !live.follow || liveSection === null) return
    if (liveSection === pageIdx || isLocked(liveSection)) return
    setPageIdx(Math.max(0, Math.min(pageCount - 1, liveSection)))
    try { localStorage.setItem(storageKey, String(liveSection)) } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveSection, live.follow, live.session?.id, lockedFrom])
  const breakAway = (i: number) => { if (live.session && i !== liveSection) live.setFollow(false); goTo(i) }
  const deckBlock = useMemo(() => (blocks.find((b) => b.type === 'deck') as DeckBlock | undefined) ?? null, [blocks])

  // Per-section completion (the honest progress thread): explicit "Got it"
  // checkpoints, persisted per lesson. A section also reads done once passed.
  const { markComplete, isComplete } = useSectionProgress(lesson.id, pageCount)
  const sectionDone = (i: number) => isComplete(i) || i < pageIdx

  // Whole-lesson task progress (the "tasks saved" bar).
  const interactive = useMemo(() => blocks.filter(isCaptureBlock), [blocks])
  const totalTasks = interactive.length
  const doneTasks = interactive.filter((b) => isBlockComplete(b, committed[b.id]?.response)).length
  const allTasksDone = totalTasks > 0 && doneTasks === totalTasks
  // MC-6 · lobby day: self-rating opens only after the individual exit ticket is saved.
  const exitPending = blocks.filter((b) => b.type === 'exit_ticket').some((b) => !isBlockComplete(b, committed[b.id]?.response))
  const selfRatingHold = !staffView && exp?.lobbyToday && exitPending
    ? 'Your group worked on this today. Save your own exit ticket first — then rate yourself on what YOU can do. · Primero guarda tu boleto de salida, luego califícate.'
    : null

  const page = pages[pageIdx]
  const isLast = pageIdx === pageCount - 1
  // Every page leads with a visual. If the page's own blocks already include a
  // figure/diagram/sketch, we let those carry it; otherwise we render an
  // illustrated step banner so no page is a wall of text.
  const ownVisual = page ? pageHasVisual(page) : false
  const StepIcon: LucideIcon = page?.hasCapture ? PencilRuler : isLast ? Rocket : pageIdx === 0 ? Compass : Eye
  const stepKind = page?.hasCapture ? 'Your task' : pageIdx === 0 ? 'Get oriented' : isLast ? 'Wrap up' : 'Read & think'
  // Soft-gate: an unsaved save-block on this page shows a nudge but never blocks Next.
  const pageUnsaved = page ? page.captureBlocks.filter((b) => !isBlockComplete(b, committed[b.id]?.response)) : []

  // Tasks bar fills by saved work.
  const taskPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0
  const minsLeft = minutesLeft(sections, pageIdx)

  return (
    <div className="mx-auto px-4 pb-28" style={{ maxWidth: 1120, color: 'var(--foreground)' }}>
      <div className="lg:grid lg:gap-8" style={{ gridTemplateColumns: '216px minmax(0, 1fr)' }}>
        {/* sticky section rail — the lesson's wayfinding spine (desktop only) */}
        <aside className="hidden lg:block">
          <div className="sticky" style={{ top: 96 }}>
            <SectionRail sections={sections} currentIndex={pageIdx} isComplete={sectionDone} isLocked={isLocked} onJump={breakAway} />
          </div>
        </aside>

        {/* main reading column */}
        <div className="min-w-0" style={{ maxWidth: 760, marginInline: 'auto', width: '100%' }}>
          {/* compact sticky header: identity + section counter + progress */}
          <div
            className="sticky top-0 z-20 -mx-4 px-4 pt-3 pb-3"
            style={{ background: 'color-mix(in oklch, var(--background) 92%, transparent)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <Link href="/home" className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <ChevronLeft size={14} /> Home
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  {day && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: 'var(--reward)', color: 'var(--reward-foreground)' }}>
                      <day.Icon size={11} /> {day.label}
                    </span>
                  )}
                  <h1 className="text-base font-semibold tracking-tight truncate" style={{ maxWidth: 360 }}>{lesson.title}</h1>
                </div>
              </div>
              {/* honest section counter: where you are + how much is left */}
              <div className="inline-flex items-center gap-2 text-xs whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  Section {pageIdx + 1} of {pageCount}
                </span>
                {minsLeft > 0 && (
                  <span className="inline-flex items-center gap-1">· <Clock size={12} /> ~{minsLeft} min left</span>
                )}
                {/* autosave status — drafts are kept as you type; Save is still the record */}
                {!staffView && draftState !== 'idle' && (
                  <span className="inline-flex items-center gap-1" title="Your typing is kept automatically. Press Save on a block to turn it in." style={{ color: draftState === 'offline' ? 'var(--reward-foreground)' : 'var(--muted-foreground)' }}>
                    · {draftState === 'dirty' || draftState === 'saving' ? 'Saving draft…' : draftState === 'saved' ? 'Draft kept' : 'Offline — kept on this device'}
                  </span>
                )}
                {/* quick-peek at the reference sheet without losing your place */}
                <a
                  href="/reference"
                  target="_blank"
                  rel="noopener"
                  title="Open the reference sheet in a new tab"
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold"
                  style={{ border: '1px solid var(--border)', color: 'var(--primary)', background: 'var(--card)' }}
                >
                  <Sigma size={11} /> Reference
                </a>
                {staffView && presentLive && (
                  <PresentLiveLayer lessonId={lesson.id} lessonTitle={lesson.title} pages={pages} sections={sections} deck={deckBlock} onSectionChange={(i) => { if (!isLocked(i)) setPageIdx(i) }} />
                )}
              </div>
            </div>

            {/* SEI level dial — visible to the student (principle 7) */}
            <div className="mt-2"><LanguageDial /></div>

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
                      background: cur ? 'var(--reward)' : done ? 'var(--primary)' : 'var(--secondary)',
                    }}
                  />
                )
              })}
            </div>
            {/* tasks-saved bar — how much work is logged */}
            {totalTasks > 0 && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${taskPct}%`, background: 'var(--reward)' }} />
                </div>
                <span className="text-[11px] font-medium whitespace-nowrap inline-flex items-center gap-1" style={{ color: allTasksDone ? 'var(--success)' : 'var(--muted-foreground)' }}>
                  {allTasksDone ? <Check size={12} /> : <Pencil size={11} />}
                  {doneTasks} of {totalTasks} tasks saved
                </span>
              </div>
            )}
          </div>

          {/* visual step banner — guarantees a non-text element atop every page. */}
          {page && (
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
                  <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                    Section {pageIdx + 1} · {stepKind}
                  </div>
                  {!ownVisual && (
                    <div className="text-sm" style={{ color: 'var(--foreground)' }}>
                      {page.hasCapture ? 'Read the setup, then save your work below.' : 'Take this in before you move on.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* the current page — blocks get the full column width.
              `lesson-reading` scopes the key-equation styling (see globals.css). */}
          {/* S-3 · section header: eyebrow + serif headline + one context line */}
          {page && stepped && (
            <div className="mt-5 mb-1">
              <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>{stepKind} · section {pageIdx + 1} of {pageCount}</div>
              <h2 className="lesson-headline mt-0.5" style={{ fontSize: 26, lineHeight: 1.15, letterSpacing: '-0.01em', color: 'var(--foreground)' }}>{sections[pageIdx]?.title}</h2>
              <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {sections[pageIdx]?.minutes ? `~${sections[pageIdx].minutes} min · ` : ''}{page.hasCapture ? 'Read the setup, then save your work.' : 'Take this in before you move on.'}
              </div>
            </div>
          )}

          <div className="mt-4 lesson-reading">
            {page && stepped ? (
              splitHelpRuns(page.blocks).map((run, ri) => {
                if (!run.help) return <BlockRenderer key={ri} blocks={run.blocks} lessonId={lesson.id} responses={responses} hydrated={responsesLoaded} save={save} draft={draft} targets={exp?.calibration} glossary={glossary} trackBadges={staffView} selfRatingHold={selfRatingHold} />
                // S-4 · help drawer: open by default unless the student already rates Almost / Got it on the section's target.
                const t = sectionTarget(page)
                const level = t ? exp?.mastery[t] : undefined
                const openDefault = !(typeof level === 'number' && level >= 2)
                return (
                  <details key={ri} open={openDefault} className="my-3 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'color-mix(in oklch, var(--primary) 5%, var(--card))' }}>
                    <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                      <Lightbulb size={15} /> {openDefault ? 'Help & worked example' : 'Need a refresher? Help & worked example'}
                      <span className="text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}>{openDefault ? '' : `· you’re rated ${level === 3 ? 'Got it' : 'Almost'} on this target`}</span>
                    </summary>
                    <div className="px-4 pb-3"><BlockRenderer blocks={run.blocks} lessonId={lesson.id} responses={responses} hydrated={responsesLoaded} save={save} draft={draft} targets={exp?.calibration} glossary={glossary} trackBadges={staffView} selfRatingHold={selfRatingHold} /></div>
                  </details>
                )
              })
            ) : page ? (
              <BlockRenderer blocks={page.blocks} lessonId={lesson.id} responses={responses} hydrated={responsesLoaded} save={save} draft={draft} targets={exp?.calibration} glossary={glossary} trackBadges={staffView} selfRatingHold={selfRatingHold} />
            ) : (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>This lesson does not have content yet.</p>
            )}
          </div>

          {/* soft nudge: unsaved save-blocks on this page (never blocks Next) */}
          {pageUnsaved.length > 0 && (
            <div
              className="mt-4 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2"
              style={{ background: 'color-mix(in oklch, var(--reward) 14%, var(--card))', border: '1px solid color-mix(in oklch, var(--reward) 45%, var(--border))', color: 'var(--foreground)' }}
            >
              <Pencil size={15} style={{ color: 'var(--reward-foreground)' }} />
              <span>
                {pageUnsaved.length === 1 ? 'There’s a task here to save' : `${pageUnsaved.length} tasks here to save`} so it’s logged for your teacher. You can keep going either way.
              </span>
            </div>
          )}

          {/* per-section "Got it" checkpoint — advances the honest progress thread */}
          {page && (
            <div className="mt-5 flex justify-center">
              {isComplete(pageIdx) ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
                  style={{ color: 'var(--success)', background: 'color-mix(in oklch, var(--success) 12%, transparent)', border: '1px solid color-mix(in oklch, var(--success) 40%, var(--border))' }}
                >
                  <CheckCircle2 size={16} /> Section complete
                </span>
              ) : (
                <button
                  onClick={() => { markComplete(pageIdx); if (!isLast) breakAway(pageIdx + 1) }}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
                  style={{ color: 'var(--success)', background: 'transparent', border: '1.5px solid color-mix(in oklch, var(--success) 55%, var(--border))', cursor: 'pointer' }}
                >
                  <CheckCircle2 size={16} /> Got it{!isLast ? ' — next section' : ''}
                </button>
              )}
            </div>
          )}

          {/* submit appears on the last page only */}
          {isLast && blocks.length > 0 && (
            <div
              className="mt-6 p-5 rounded-2xl flex items-center justify-between gap-4 flex-wrap"
              style={{
                border: allTasksDone ? '2px solid color-mix(in oklch, var(--success) 55%, var(--border))' : '1px solid var(--border)',
                background: allTasksDone ? 'color-mix(in oklch, var(--success) 8%, var(--card))' : 'var(--card)',
              }}
            >
              <div className="text-sm max-w-sm" style={{ color: 'var(--muted-foreground)' }}>
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Saving keeps a draft.</span>{' '}
                When you&apos;re done, submit so your teacher can review and rate your work.
              </div>
              <SubmitLessonButton lessonId={lesson.id} complete={allTasksDone} onChange={(st) => setSubmitted(Boolean(st.submittedAt))} />
            </div>
          )}

          {/* S-6 · Done screen: what was auto-checked, what awaits rating, XP earned + pending, calibration read-back */}
          {isLast && stepped && submitted && (() => {
            const t = doneTallies(blocks, committed)
            const xpTotal = (exp?.xpEarned ?? 0) + xpSession
            const rated = (exp?.calibration ?? []).filter((c) => c.teacher !== null)
            return (
              <div className="mt-4 rounded-2xl border p-5" style={{ borderColor: 'color-mix(in oklch, var(--success) 45%, var(--border))', background: 'color-mix(in oklch, var(--success) 8%, var(--card))' }}>
                <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--success)' }}>Submitted</div>
                <h2 className="lesson-headline mt-0.5" style={{ fontSize: 22, color: 'var(--foreground)' }}>{lesson.title} is in.</h2>
                <div className="mt-3 grid gap-2 text-sm" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}><div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Auto-checked</div><div className="text-lg font-bold">{t.autoChecked > 0 ? `${t.autoRight} of ${t.autoChecked} right` : '—'}</div></div>
                  <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}><div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Awaiting your teacher’s rating</div><div className="text-lg font-bold">{t.awaiting}</div></div>
                  <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}><div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>XP</div><div className="text-lg font-bold" style={{ color: 'var(--reward-foreground)' }}>+{xpTotal} earned{t.xpPending > 0 ? <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}> · +{t.xpPending} pending</span> : null}</div></div>
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
                {rated.length === 0 && <p className="text-sm mt-3" style={{ color: 'var(--muted-foreground)' }}>Your teacher’s rating usually lands within a day. When it does, this screen shows how your self-rating compared.</p>}
              </div>
            )
          })()}

          {/* page nav — S-5: pinned in the stepped reader, with the gate note naming the missing thing */}
          <div className={stepped ? 'mt-6 pt-3 pb-3 flex items-center justify-between gap-3 sticky bottom-0 z-20 -mx-4 px-4' : 'mt-6 pt-5 flex items-center justify-between gap-3'}
            style={stepped ? { borderTop: '1px solid var(--border)', background: 'color-mix(in oklch, var(--background) 94%, transparent)', backdropFilter: 'blur(8px)' } : { borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => breakAway(pageIdx - 1)}
              disabled={pageIdx === 0}
              className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--card)', cursor: pageIdx === 0 ? 'default' : 'pointer' }}
            >
              <ChevronLeft size={16} /> Back
            </button>

            {/* page dots (mobile-friendly section jump; the rail covers desktop) */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center lg:hidden" style={{ maxWidth: 220 }}>
              {pages.map((p, i) => {
                const active = i === pageIdx
                const pageDone = sectionDone(i)
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to section ${i + 1}`}
                    style={{
                      width: active ? 22 : 8, height: 8, borderRadius: 999, border: 'none', cursor: 'pointer', padding: 0,
                      background: active ? 'var(--reward)' : pageDone ? 'var(--primary)' : 'var(--border)',
                      transition: 'all .15s',
                    }}
                  />
                )
              })}
            </div>

            {isLast ? (
              nav?.next ? (
                <Link href={`/lessons/${nav.next.slug}`} className="inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-bold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: '0 8px 22px -8px color-mix(in oklch, var(--primary) 70%, transparent)' }}>
                  Next: {trim(nav.next.title)} <ChevronRight size={16} />
                </Link>
              ) : (
                <Link href="/home" className="inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-bold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: '0 8px 22px -8px color-mix(in oklch, var(--primary) 70%, transparent)' }}>
                  Finish <ChevronRight size={16} />
                </Link>
              )
            ) : (
              <div className="flex items-center gap-3">
                {stepped && page && gateNote(pageBlockedBy(page, committed)) && gating && (
                  <span className="text-xs inline-flex items-center gap-1" style={{ color: 'var(--reward-foreground)' }}><Lock size={12} /> {gateNote(pageBlockedBy(page, committed))}</span>
                )}
                <button
                  onClick={() => breakAway(pageIdx + 1)}
                  disabled={isLocked(pageIdx + 1)}
                  className="inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-bold disabled:opacity-40"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: '0 8px 22px -8px color-mix(in oklch, var(--primary) 70%, transparent)', border: 'none', cursor: isLocked(pageIdx + 1) ? 'not-allowed' : 'pointer' }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* quiet home link */}
          <div className="mt-4 text-center">
            <Link href="/home" className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <Home size={13} /> Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
