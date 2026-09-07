'use client'

/**
 * Auto-generated deck — P-1 / P-6 of docs/LESSON_SYSTEM_RULES.md.
 *
 * When a lesson has no `deck` block, Present opens THIS page (/embed/present/[lessonId]) in the projector
 * window: one slide per reader section, generated from the BlockDocument. It
 * speaks the same surface as the authored decks' <deck-stage> (index, length,
 * goTo/next/prev, a `slidechange` event, #N in the hash, data-label +
 * data-speaker-notes on each slide) so src/lib/present-bridge.ts cannot tell
 * the two apart. Under /embed so the app chrome stays off the projector.
 *
 * Typography scales with a fixed 1920×1080 stage scaled by transform (P-6).
 */
import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { type BlockDocument } from '@/data/content-blocks'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import { buildSlides } from '@/lib/present-auto-slides'

const W = 1920, H = 1080


export default function AutoDeckPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const sessionId = useSearchParams().get('session_id')
  const [error, setError] = useState<string | null>(null)
  const [lesson, setLesson] = useState<{ title: string; content_blocks: BlockDocument | null } | null>(null)
  const [index, setIndexState] = useState(0)
  const [scale, setScale] = useState(1)
  const stageRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // /api/lessons/[id] answers { lesson: row }.
    fetch(`/api/present/document?lesson_id=${lessonId}&session_id=${sessionId ?? ''}`).then((r) => (r.ok ? r.json() : null)).then((d: { lesson?: { title?: string; content_blocks?: BlockDocument | null } } | null) => {
      const l = d?.lesson
      if (!l) setError('Presentation unavailable. Start a class presentation and reopen slides.')
      if (l) setLesson({ title: l.title ?? 'Lesson', content_blocks: l.content_blocks ?? null })
    }).catch(() => setError('Slides could not load. Reopen the presentation to retry.'))
  }, [lessonId, sessionId])
  const slides = useMemo(() => (lesson ? buildSlides(lesson.title, lesson.content_blocks) : []), [lesson])
  const total = slides.length

  const go = useCallback((i: number) => {
    setIndexState((cur) => {
      const n = Math.max(0, Math.min(Math.max(0, total - 1), i))
      if (n === cur) return cur
      try { history.replaceState(null, '', `#${n + 1}`) } catch { /* ignore */ }
      window.setTimeout(() => {
        const el = stageRef.current
        el?.dispatchEvent(new CustomEvent('slidechange', { detail: { index: n, total }, bubbles: true, composed: true }))
        try { window.postMessage({ slideIndexChanged: n, deckTotal: total }, '*') } catch { /* ignore */ }
      }, 0)
      return n
    })
  }, [total])

  // Restore #N on load; expose the deck-stage surface on the element.
  useEffect(() => {
    if (!total) return
    const h = (location.hash || '').match(/^#(\d+)$/)
    if (h) go(parseInt(h[1], 10) - 1)
  }, [total, go])
  useEffect(() => {
    const el = stageRef.current as (HTMLElement & Record<string, unknown>) | null
    if (!el) return
    Object.defineProperty(el, 'index', { configurable: true, get: () => index })
    Object.defineProperty(el, 'length', { configurable: true, get: () => total })
    el.goTo = (i: number) => go(i)
    el.next = () => go(index + 1)
    el.prev = () => go(index - 1)
  }, [index, total, go])

  // P-6 · scale the fixed stage to the window.
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / W, window.innerHeight / H))
    fit(); window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key
      if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') go(index + 1)
      else if (k === 'ArrowLeft' || k === 'PageUp') go(index - 1)
      else if (k === 'Home' || k === 'r' || k === 'R') go(0)
      else if (k === 'End') go(total - 1)
      else if (/^[0-9]$/.test(k)) go(k === '0' ? 9 : parseInt(k, 10) - 1)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, total, go])

  const s = slides[index]
  const stageChildren = slides.map((sl, i) => (
    <section key={i} data-label={sl.label} data-section-anchor={sl.anchor ?? undefined} data-speaker-notes={sl.notes} style={{ display: i === index ? 'flex' : 'none', position: 'absolute', inset: 0, flexDirection: 'column', padding: '50px 100px', boxSizing: 'border-box' }}>
      <div className="text-muted-foreground" style={{ fontSize: 28 }}>{sl.kicker}</div>
      <h1 style={{ fontSize: i === 0 ? 100 : 48, lineHeight: 1.1, margin: '16px 0 24px' }}>{sl.title}</h1>
      <div className="overflow-y-auto flex-1 rounded-xl bg-background text-foreground" style={{ fontSize: 26, padding: 24 }}>
        <BlockRenderer blocks={sl.blocks} lessonId={lessonId} referenceBlocks={lesson?.content_blocks?.blocks} responses={{}} hydrated readOnly />
      </div>
      <div style={{ fontSize: 24, textAlign: 'right', marginTop: 12 }}>{i + 1} / {slides.length}</div>
    </section>
  ))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--background)', color: 'var(--foreground)', overflow: 'hidden', fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)' }}>
      {!lesson && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 24, opacity: 0.7 }}>{error ?? 'Loading slides…'}</div>}
      {createElement('deck-stage', {
        ref: stageRef, width: W, height: H,
        style: { position: 'absolute', left: '50%', top: '50%', width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center center', display: 'block' },
      }, stageChildren)}
      {s && <div aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{s.title}</div>}
    </div>
  )
}
