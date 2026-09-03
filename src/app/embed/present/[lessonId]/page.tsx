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
import { useParams } from 'next/navigation'
import { paginateBlocks, type ContentBlock, type BlockDocument, type InlineQuestion } from '@/data/content-blocks'
import { buildSections } from '@/components/lessons/lesson-sections'

const W = 1920, H = 1080

interface Slide { label: string; notes: string; kicker: string; title: string; target?: string; lines: string[]; choices?: string[] }

function textOf(b: ContentBlock): string | null {
  const x = b as unknown as Record<string, unknown>
  for (const k of ['prompt', 'statement', 'heading', 'title', 'text', 'content', 'markdown']) {
    const v = x[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  const q = x.question as InlineQuestion | undefined
  if (q && typeof q === 'object' && typeof q.prompt === 'string') return q.prompt
  return null
}
const firstSentence = (s: string, max = 160) => {
  const clean = s.replace(/[#*_`>]/g, '').replace(/\s+/g, ' ').trim()
  const m = clean.match(/^(.{20,}?[.!?])\s/)
  const out = m ? m[1] : clean
  return out.length > max ? out.slice(0, max - 1) + '…' : out
}

function buildSlides(title: string, doc: Pick<BlockDocument, 'blocks'> | null): Slide[] {
  const pages = paginateBlocks(doc?.blocks ?? [])
  const sections = buildSections(pages)
  const slides: Slide[] = [{ label: 'Title', notes: 'Title slide. Say the day’s job in one sentence before anything else.', kicker: 'Today', title, lines: [] }]
  pages.forEach((p, i) => {
    const target = p.blocks.find((b) => b.type === 'target')
    const targetText = target ? textOf(target) ?? undefined : undefined
    const lines: string[] = []
    let choices: string[] | undefined
    for (const b of p.blocks) {
      if (b.type === 'target' || b.type === 'deck' || lines.length >= 4) continue
      const t = textOf(b)
      if (!t) continue
      lines.push(firstSentence(t))
      const q = (b as { question?: InlineQuestion }).question
      if (b.type === 'question' && q?.options?.length && !choices) choices = q.options.map((o) => `${o.icon ? o.icon + ' ' : ''}${o.text}`)
    }
    const s = sections[i]
    slides.push({
      label: s?.title ?? `Section ${i + 1}`,
      notes: p.hasCapture ? `Section ${i + 1}: students save work here. Wait for "N of M saved" before moving on.` : `Section ${i + 1}: read-and-think. Keep it short; the doing is next.`,
      kicker: `Section ${i + 1} of ${pages.length}${s?.minutes ? ` · ~${s.minutes} min` : ''}`,
      title: s?.title ?? `Section ${i + 1}`,
      target: targetText, lines, choices,
    })
  })
  return slides
}

export default function AutoDeckPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const [lesson, setLesson] = useState<{ title: string; content_blocks: BlockDocument | null } | null>(null)
  const [index, setIndexState] = useState(0)
  const [scale, setScale] = useState(1)
  const stageRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // /api/lessons/[id] answers { lesson: row }.
    fetch(`/api/lessons/${lessonId}`).then((r) => (r.ok ? r.json() : null)).then((d: { lesson?: { title?: string; content_blocks?: BlockDocument | null } } | null) => {
      const l = d?.lesson
      if (l) setLesson({ title: l.title ?? 'Lesson', content_blocks: l.content_blocks ?? null })
    }).catch(() => {})
  }, [lessonId])
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
    <section key={i} data-label={sl.label} data-speaker-notes={sl.notes} style={{ display: i === index ? 'flex' : 'none', position: 'absolute', inset: 0, flexDirection: 'column', justifyContent: 'center', padding: '120px 160px', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7 }}>{sl.kicker}</div>
      <h1 style={{ fontSize: i === 0 ? 120 : 84, lineHeight: 1.05, margin: '24px 0 0', fontWeight: 800, letterSpacing: '-0.02em' }}>{sl.title}</h1>
      {sl.target && <p style={{ fontSize: 44, lineHeight: 1.3, margin: '40px 0 0', padding: '28px 36px', borderLeft: '14px solid #F5B942', background: 'rgba(255,255,255,0.06)', borderRadius: 12 }}>🎯 {sl.target}</p>}
      {sl.lines.length > 0 && (
        <ul style={{ fontSize: 40, lineHeight: 1.35, margin: '40px 0 0', paddingLeft: 48 }}>
          {sl.lines.map((l, j) => <li key={j} style={{ marginBottom: 14 }}>{l}</li>)}
        </ul>
      )}
      {sl.choices && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginTop: 40 }}>
          {sl.choices.map((c, j) => <div key={j} style={{ fontSize: 40, padding: '20px 28px', borderRadius: 16, border: '3px solid rgba(255,255,255,0.35)' }}>{c}</div>)}
        </div>
      )}
      <div style={{ position: 'absolute', right: 80, bottom: 56, fontSize: 28, opacity: 0.6, fontVariantNumeric: 'tabular-nums' }}>{i + 1} / {slides.length}</div>
    </section>
  ))

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0E0B20', color: '#FFFFFF', overflow: 'hidden', fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)' }}>
      {!lesson && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 24, opacity: 0.7 }}>Loading slides…</div>}
      {createElement('deck-stage', {
        ref: stageRef, width: W, height: H,
        style: { position: 'absolute', left: '50%', top: '50%', width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center center', display: 'block' },
      }, stageChildren)}
      {s && <div aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{s.title}</div>}
    </div>
  )
}
