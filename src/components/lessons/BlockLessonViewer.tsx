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
import { BlockDocument, isCaptureBlock, isBlockComplete, paginateBlocks, pageHasVisual } from '@/data/content-blocks'
import { Home, ChevronLeft, ChevronRight, Clock, Sparkles, FlaskConical, BookOpen, Wrench, Rocket, Layers, Check, CheckCircle2, Pencil, PencilRuler, Eye, Compass, Sigma, type LucideIcon } from 'lucide-react'

interface NavLink { slug: string; title: string }

interface BlockLessonViewerProps {
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

export default function BlockLessonViewer({ lesson, nav }: BlockLessonViewerProps) {
  const blocks = useMemo(() => lesson.content_blocks?.blocks ?? [], [lesson.content_blocks])
  const dayType = lesson.content_blocks?.dayType
  const day = dayType ? DAY_META[dayType] : undefined
  const trim = (s: string) => (s.length > 28 ? s.slice(0, 27) + '…' : s)

  // Key terms feed the hover-def popovers in prose. Guard the shape so a
  // malformed JSON column can never break the reader.
  const glossary = useMemo<GlossaryEntry[]>(
    () => (Array.isArray(lesson.key_terms) ? lesson.key_terms.filter((t) => t && t.term && t.definition) : []),
    [lesson.key_terms],
  )

  // One source of truth for responses, shared with the renderer so progress
  // fills as the student saves interactive blocks.
  const { responses, save } = useBlockResponses(lesson.id)

  // Split the lesson into pages: each save-required block rides with the
  // reference blocks that set it up. Each page is one "section".
  const pages = useMemo(() => paginateBlocks(blocks), [blocks])
  const pageCount = pages.length
  const sections = useMemo(() => buildSections(pages, lesson.estimated_time), [pages, lesson.estimated_time])

  // Current page, restored from localStorage so a reload returns to the spot.
  const storageKey = `lesson-page:${lesson.id}`
  const [pageIdx, setPageIdx] = useState(0)
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(storageKey))
      if (Number.isInteger(saved) && saved >= 0 && saved < pageCount) setPageIdx(saved)
    } catch { /* private mode — start at 0 */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, pageCount])
  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(pageCount - 1, i))
    setPageIdx(clamped)
    try { localStorage.setItem(storageKey, String(clamped)) } catch { /* ignore */ }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Per-section completion (the honest progress thread): explicit "Got it"
  // checkpoints, persisted per lesson. A section also reads done once passed.
  const { markComplete, isComplete } = useSectionProgress(lesson.id, pageCount)
  const sectionDone = (i: number) => isComplete(i) || i < pageIdx

  // Whole-lesson task progress (the "tasks saved" bar).
  const interactive = useMemo(() => blocks.filter(isCaptureBlock), [blocks])
  const totalTasks = interactive.length
  const doneTasks = interactive.filter((b) => isBlockComplete(b, responses[b.id]?.response)).length
  const allTasksDone = totalTasks > 0 && doneTasks === totalTasks

  const page = pages[pageIdx]
  const isLast = pageIdx === pageCount - 1
  // Every page leads with a visual. If the page's own blocks already include a
  // figure/diagram/sketch, we let those carry it; otherwise we render an
  // illustrated step banner so no page is a wall of text.
  const ownVisual = page ? pageHasVisual(page) : false
  const StepIcon: LucideIcon = page?.hasCapture ? PencilRuler : isLast ? Rocket : pageIdx === 0 ? Compass : Eye
  const stepKind = page?.hasCapture ? 'Your task' : pageIdx === 0 ? 'Get oriented' : isLast ? 'Wrap up' : 'Read & think'
  // Soft-gate: an unsaved save-block on this page shows a nudge but never blocks Next.
  const pageUnsaved = page ? page.captureBlocks.filter((b) => !isBlockComplete(b, responses[b.id]?.response)) : []

  // Tasks bar fills by saved work.
  const taskPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0
  const minsLeft = minutesLeft(sections, pageIdx)

  return (
    <div className="mx-auto px-4 pb-28" style={{ maxWidth: 1120, color: 'var(--foreground)' }}>
      <div className="lg:grid lg:gap-8" style={{ gridTemplateColumns: '216px minmax(0, 1fr)' }}>
        {/* sticky section rail — the lesson's wayfinding spine (desktop only) */}
        <aside className="hidden lg:block">
          <div className="sticky" style={{ top: 96 }}>
            <SectionRail sections={sections} currentIndex={pageIdx} isComplete={sectionDone} onJump={goTo} />
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
              </div>
            </div>

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
          <div className="mt-4 lesson-reading">
            {page ? (
              <BlockRenderer blocks={page.blocks} lessonId={lesson.id} responses={responses} save={save} glossary={glossary} />
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
                  onClick={() => { markComplete(pageIdx); if (!isLast) goTo(pageIdx + 1) }}
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
              <SubmitLessonButton lessonId={lesson.id} complete={allTasksDone} />
            </div>
          )}

          {/* page nav */}
          <div className="mt-6 pt-5 flex items-center justify-between gap-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => goTo(pageIdx - 1)}
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
              <button
                onClick={() => goTo(pageIdx + 1)}
                className="inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-bold"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: '0 8px 22px -8px color-mix(in oklch, var(--primary) 70%, transparent)', border: 'none', cursor: 'pointer' }}
              >
                Next <ChevronRight size={16} />
              </button>
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
