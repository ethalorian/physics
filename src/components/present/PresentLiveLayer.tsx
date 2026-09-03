'use client'

/**
 * PresentLiveLayer — the teacher's projector controls (P-1…P-6, docs/LESSON_SYSTEM_RULES.md).
 *
 * Lives on the laptop next to the lesson preview; the deck lives in a second
 * window (P-2) that this component drives through src/lib/present-bridge.ts.
 * Everything a student device needs (current section, open poll, lock/reveal,
 * blackout, timer) is one present_sessions row, patched on change and polled
 * by PresentLiveProvider. Poll answers arrive as block_responses rows with
 * evidence_source 'live_poll' (P-5) — the Control Room shows them as quick-rate.
 *
 * Keys while the panel is open (and focus is not in a field):
 *   ← → slides · B blackout · L lock poll · R reveal · Esc close panel
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MonitorPlay, X, ChevronLeft, ChevronRight, Moon, Lock, Unlock, Eye, Timer, Radio, Square, BarChart3, StickyNote } from 'lucide-react'
import type { ContentBlock, LessonPage, DeckBlock, InlineQuestion } from '@/data/content-blocks'
import type { LessonSection } from '@/components/lessons/lesson-sections'
import { openPresenterWindow, fullscreenKeyHint } from '@/lib/present-deck'
import { watchDeck, deckNext, deckPrev, deckGo, deckBlackout, deckPresenting, sectionForSlideProportional, type DeckSnapshot } from '@/lib/present-bridge'
import { useTimerLeft, fmtTimer } from '@/components/lessons/PresentLiveProvider'

type Session = {
  id: string; course_id: string | null; current_slide: number; current_section: number
  poll_block_id: string | null; poll_locked: boolean; poll_revealed: boolean; blackout: boolean; timer_ends_at: string | null
}
type Tally = { block_id: string | null; enrolled: number; saved: number; tally: Record<string, number>; wrongSure: number }
type Course = { id: string; name: string; section: string | null }

const btn = (active = false): React.CSSProperties => ({
  border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
  background: active ? 'color-mix(in oklch, var(--primary) 16%, var(--card))' : 'var(--card)',
  color: 'var(--foreground)', borderRadius: 10, padding: '8px 10px', fontSize: 12, fontWeight: 600,
  display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', minHeight: 44,
})

export default function PresentLiveLayer({ lessonId, lessonTitle, pages, sections, deck, onSectionChange }: {
  lessonId: string
  lessonTitle: string
  pages: LessonPage[]
  sections: LessonSection[]
  deck: DeckBlock | null
  /** Move the teacher's own preview to the section the projector is on. */
  onSectionChange?: (section: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState<string>('')
  const [session, setSession] = useState<Session | null>(null)
  const [snap, setSnap] = useState<DeckSnapshot | null>(null)
  const [tally, setTally] = useState<Tally | null>(null)
  const [deckOpen, setDeckOpen] = useState(false)
  const [popupBlocked, setPopupBlocked] = useState(false)
  const deckWin = useRef<Window | null>(null)
  const timerLeft = useTimerLeft(session?.timer_ends_at)

  // Classes + any session already live for this lesson (a reload must not lose the projector).
  useEffect(() => {
    if (!open) return
    fetch('/api/teacher/courses').then((r) => (r.ok ? r.json() : { courses: [] })).then((d: { courses?: Course[] }) => {
      const cs = d.courses ?? []
      setCourses(cs)
      setCourseId((c) => c || cs[0]?.id || '')
    }).catch(() => {})
    fetch(`/api/present/sessions?lesson_id=${lessonId}`).then((r) => (r.ok ? r.json() : { session: null })).then((d: { session: Session | null }) => { if (d.session) setSession(d.session) }).catch(() => {})
  }, [open, lessonId])

  const patch = useCallback(async (body: Record<string, unknown>) => {
    if (!session) return
    const r = await fetch(`/api/present/sessions/${session.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (r.ok) { const d = (await r.json()) as { session: Session }; setSession(d.session) }
  }, [session])

  const start = async () => {
    const r = await fetch('/api/present/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lesson_id: lessonId, course_id: courseId || null }) })
    if (r.ok) { const d = (await r.json()) as { session: Session }; setSession(d.session) }
  }
  const end = async () => {
    await patch({ status: 'ended', poll_block_id: null, blackout: false, timer_seconds: null })
    deckBlackout(deckWin.current, false)
    setSession(null); setTally(null)
  }

  // P-2 · the deck window. Auto-generated deck when the lesson has no deck block (P-1).
  const deckSrc = deck?.src ?? `/embed/present/${lessonId}`
  const openDeck = async () => {
    deckWin.current = await openPresenterWindow(deckSrc)
    setDeckOpen(Boolean(deckWin.current))
    setPopupBlocked(!deckWin.current)
    window.setTimeout(() => deckPresenting(deckWin.current, true), 1500)
  }
  // Watch the deck; push slide → section to the session (P-4) and the preview.
  const sectionCount = sections.length
  const lastPushed = useRef<number>(-1)
  useEffect(() => {
    if (!deckOpen) return
    const stop = watchDeck(deckWin.current, (s) => {
      setSnap(s)
      const section = sectionForSlideProportional(s.index, s.total, sectionCount, deck?.slideMap)
      onSectionChange?.(section)
      if (lastPushed.current !== s.index) {
        lastPushed.current = s.index
        void patch({ current_slide: s.index, current_section: section })
      }
    })
    const closed = window.setInterval(() => { if (!deckWin.current || deckWin.current.closed) { setDeckOpen(false); setSnap(null) } }, 1000)
    return () => { stop(); window.clearInterval(closed) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckOpen, sectionCount, deck?.slideMap, session?.id])

  // Live poll candidates: `question` blocks with options in the current section.
  const currentSection = session?.current_section ?? (snap ? sectionForSlideProportional(snap.index, snap.total, sectionCount, deck?.slideMap) : 0)
  const pollable = useMemo(() => {
    const page = pages[currentSection]
    return (page?.blocks ?? []).filter((b): b is Extract<ContentBlock, { type: 'question' }> => b.type === 'question' && Boolean((b as { question?: InlineQuestion }).question?.options?.length))
  }, [pages, currentSection])
  const pollBlock = useMemo(() => pages.flatMap((p) => p.blocks).find((b) => b.id === session?.poll_block_id) as Extract<ContentBlock, { type: 'question' }> | undefined, [pages, session?.poll_block_id])
  const pollQ = pollBlock?.question as InlineQuestion | undefined

  // Tallies while a poll is open (P-3 response bars, "N of M saved").
  useEffect(() => {
    if (!session?.poll_block_id) { setTally(null); return }
    let active = true
    const tick = () => fetch(`/api/present/sessions/${session.id}?block_id=${encodeURIComponent(session.poll_block_id!)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null)).then((d: Tally | null) => { if (active && d) setTally(d) }).catch(() => {})
    tick()
    const id = window.setInterval(tick, 2000)
    return () => { active = false; window.clearInterval(id) }
  }, [session?.id, session?.poll_block_id])

  const toggleBlackout = useCallback(() => {
    const on = !(session?.blackout ?? false)
    deckBlackout(deckWin.current, on)
    void patch({ blackout: on })
  }, [session?.blackout, patch])

  // Keyboard controls while the panel is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowRight') { deckNext(deckWin.current); e.preventDefault() }
      else if (e.key === 'ArrowLeft') { deckPrev(deckWin.current); e.preventDefault() }
      else if (e.key === 'b' || e.key === 'B') { toggleBlackout(); e.preventDefault() }
      else if ((e.key === 'l' || e.key === 'L') && session?.poll_block_id) { void patch({ poll_locked: !session.poll_locked }); e.preventDefault() }
      else if ((e.key === 'r' || e.key === 'R') && session?.poll_block_id) { void patch({ poll_revealed: !session.poll_revealed }); e.preventDefault() }
      else if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, session, patch, toggleBlackout])

  const live = Boolean(session)
  const total = tally?.enrolled ?? 0
  const maxCount = Math.max(1, ...Object.values(tally?.tally ?? {}))

  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)} title="Present (projector controls)"
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{ border: `1px solid ${live ? 'var(--reward)' : 'var(--border)'}`, background: live ? 'color-mix(in oklch, var(--reward) 18%, var(--card))' : 'var(--card)', color: live ? 'var(--reward-foreground)' : 'var(--primary)', minHeight: 28 }}>
        <MonitorPlay size={12} /> {live ? 'Live' : 'Present'}
      </button>

      {/* Portaled to <body>: the lesson header's backdrop-filter would otherwise become the
          containing block for this fixed panel and clip it against the header. */}
      {open && typeof document !== 'undefined' && createPortal(
        <div role="dialog" aria-label="Present controls"
          className="fixed z-40 flex flex-col"
          style={{ right: 12, bottom: 12, width: 380, maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100vh - 24px)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, boxShadow: '0 24px 60px -24px rgba(0,0,0,.5)', overflow: 'hidden' }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'color-mix(in oklch, var(--primary) 10%, var(--card))' }}>
            <MonitorPlay size={16} style={{ color: 'var(--primary)' }} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{lessonTitle}</div>
              <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{live ? 'Students can follow · polls live' : 'Not live yet'}</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ ...btn(), padding: 8 }}><X size={14} /></button>
          </div>

          <div className="overflow-y-auto p-4 space-y-4">
            {/* Start / end */}
            {!live ? (
              <div className="flex items-center gap-2">
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="flex-1 text-sm rounded-lg px-2" style={{ border: '1px solid var(--border)', background: 'var(--background)', minHeight: 44 }}>
                  <option value="">No class (preview)</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? ` · ${c.section}` : ''}</option>)}
                </select>
                <button type="button" onClick={start} style={{ ...btn(true), background: 'var(--primary)', color: 'var(--primary-foreground)', borderColor: 'var(--primary)' }}><Radio size={14} /> Go live</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={openDeck} style={btn(deckOpen)}><MonitorPlay size={14} /> {deckOpen ? 'Deck open' : deck ? 'Open deck' : 'Open slides'}</button>
                <button type="button" onClick={toggleBlackout} style={btn(session?.blackout)} title="B"><Moon size={14} /> Blackout</button>
                <button type="button" onClick={end} style={{ ...btn(), marginLeft: 'auto', color: 'var(--destructive)' }}><Square size={14} /> End</button>
              </div>
            )}
            {live && popupBlocked && (
              <div className="text-[11px]" style={{ color: 'var(--destructive)' }}>The browser blocked the slides window. Allow pop-ups for this site, then click Open slides again.</div>
            )}
            {live && deckOpen && (
              <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                If the deck opened on this screen: drag it to the projector, then <strong>{fullscreenKeyHint()}</strong>. Display mode must be Extend.
              </div>
            )}

            {/* Slide + section */}
            {live && (
              <div className="rounded-xl p-3" style={{ border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => deckPrev(deckWin.current)} disabled={!deckOpen} style={btn()} aria-label="Previous slide"><ChevronLeft size={16} /></button>
                  <div className="flex-1 min-w-0 text-center">
                    <div className="text-sm font-semibold truncate">{snap ? `Slide ${snap.index + 1} of ${snap.total}` : deckOpen ? 'Loading slides…' : 'Slides not open'}</div>
                    <div className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>{snap?.slides[snap.index]?.label || (sections[currentSection]?.title ?? '')}</div>
                  </div>
                  <button type="button" onClick={() => deckNext(deckWin.current)} disabled={!deckOpen} style={btn()} aria-label="Next slide"><ChevronRight size={16} /></button>
                </div>
                <div className="mt-2 text-[11px] flex items-center justify-between" style={{ color: 'var(--muted-foreground)' }}>
                  <span>Students follow → <strong style={{ color: 'var(--foreground)' }}>Section {currentSection + 1}</strong> · {sections[currentSection]?.title}</span>
                  {snap && snap.total > 1 && (
                    <select value={snap.index} onChange={(e) => deckGo(deckWin.current, Number(e.target.value))} className="text-[11px] rounded px-1" style={{ border: '1px solid var(--border)', background: 'var(--background)' }} aria-label="Jump to slide">
                      {snap.slides.map((s, i) => <option key={i} value={i}>{i + 1}. {s.label || `Slide ${i + 1}`}</option>)}
                    </select>
                  )}
                </div>
                {snap?.slides[snap.index]?.notes && (
                  <div className="mt-2 rounded-lg p-2 text-xs" style={{ background: 'color-mix(in oklch, var(--reward) 12%, var(--card))', color: 'var(--foreground)' }}>
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}><StickyNote size={11} /> Speaker notes</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{snap.slides[snap.index].notes}</div>
                  </div>
                )}
              </div>
            )}

            {/* Timer */}
            {live && (
              <div className="flex items-center gap-2 flex-wrap">
                <Timer size={14} style={{ color: 'var(--muted-foreground)' }} />
                {[1, 3, 5, 10].map((m) => <button key={m} type="button" onClick={() => patch({ timer_seconds: m * 60 })} style={btn()}>{m} min</button>)}
                {timerLeft !== null && (
                  <span className="ml-auto inline-flex items-center gap-2 text-sm font-bold tabular-nums" style={{ color: timerLeft === 0 ? 'var(--destructive)' : 'var(--foreground)' }}>
                    {fmtTimer(timerLeft)}
                    <button type="button" onClick={() => patch({ timer_seconds: null })} style={{ ...btn(), padding: 6, minHeight: 32 }} aria-label="Clear timer"><X size={12} /></button>
                  </span>
                )}
              </div>
            )}

            {/* Live poll */}
            {live && (
              <div className="rounded-xl p-3 space-y-2" style={{ border: '1px solid var(--border)' }}>
                <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}><BarChart3 size={11} /> Live poll · quick rate</div>
                {!session?.poll_block_id ? (
                  pollable.length === 0
                    ? <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No checkpoint with choices in this section.</p>
                    : pollable.map((b) => (
                      <button key={b.id} type="button" onClick={() => patch({ poll_block_id: b.id })} className="w-full text-left" style={btn()}>
                        <Radio size={13} style={{ color: 'var(--primary)' }} /> <span className="truncate">{(b.question as InlineQuestion).prompt}</span>
                      </button>
                    ))
                ) : (
                  <>
                    <div className="text-sm font-semibold">{pollQ?.prompt}</div>
                    <div className="space-y-1.5">
                      {(pollQ?.options ?? []).map((o) => {
                        const n = tally?.tally[o.id] ?? 0
                        const correct = session.poll_revealed && pollQ?.correctOptionId === o.id
                        return (
                          <div key={o.id}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="truncate" style={{ fontWeight: correct ? 700 : 500, color: correct ? 'var(--success)' : 'var(--foreground)' }}>{o.icon ? `${o.icon} ` : ''}{o.text}</span>
                              <span className="tabular-nums" style={{ color: 'var(--muted-foreground)' }}>{n}</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                              <div className="h-full rounded-full" style={{ width: `${(n / maxCount) * 100}%`, background: correct ? 'var(--success)' : 'var(--primary)', transition: 'width .3s' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                      <span><strong style={{ color: 'var(--foreground)' }}>{tally?.saved ?? 0}</strong>{total ? ` of ${total}` : ''} saved</span>
                      {(tally?.wrongSure ?? 0) > 0 && <span style={{ color: 'var(--destructive)' }}>{tally?.wrongSure} wrong + sure</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button type="button" onClick={() => patch({ poll_locked: !session.poll_locked })} style={btn(session.poll_locked)} title="L">{session.poll_locked ? <Lock size={13} /> : <Unlock size={13} />} {session.poll_locked ? 'Locked' : 'Lock'}</button>
                      <button type="button" onClick={() => patch({ poll_revealed: !session.poll_revealed })} style={btn(session.poll_revealed)} title="R" disabled={!pollQ?.correctOptionId}><Eye size={13} /> Reveal</button>
                      <button type="button" onClick={() => patch({ poll_block_id: null })} style={{ ...btn(), marginLeft: 'auto' }}>Close poll</button>
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>← → slides · B blackout · L lock · R reveal · Esc</div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
