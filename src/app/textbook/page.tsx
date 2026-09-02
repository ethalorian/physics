"use client"

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { TEXTBOOK_PARTS, TEXTBOOK_CHAPTERS, TEXTBOOK_TITLE, textbookChapter } from '@/data/textbook'

// /textbook — the class copy of Conceptual Physics, readable in place.
// Left: the book's table of contents (grouped by part). Right: the chosen
// chapter in the browser's native PDF viewer, streamed from the session-gated
// /api/textbook/[chapter] route — no storage URL is ever exposed.
//
// Deep links: /textbook?ch=9 opens Chapter 9 (lessons and the pacing guide can
// link straight to a reading). Without ?ch, the last chapter the student
// opened on this device is restored; first-ever visit lands on Chapter 2.

const LAST_KEY = 'textbook:last-chapter'

function readLast(): number | null {
  try {
    const v = Number(localStorage.getItem(LAST_KEY))
    return textbookChapter(v) ? v : null
  } catch { return null }
}

function TextbookReader() {
  const router = useRouter()
  const params = useSearchParams()
  const fromUrl = Number(params.get('ch'))
  const [current, setCurrent] = useState<number | null>(textbookChapter(fromUrl) ? fromUrl : null)

  // Hydrate from the last-read chapter when the URL doesn't name one.
  useEffect(() => {
    if (current !== null) return
    setCurrent(readLast() ?? TEXTBOOK_CHAPTERS[0].n)
  }, [current])

  // Keep the URL and the remembered chapter in step with the selection.
  useEffect(() => {
    if (current === null) return
    try { localStorage.setItem(LAST_KEY, String(current)) } catch {}
    if (fromUrl !== current) router.replace(`/textbook?ch=${current}`, { scroll: false })
  }, [current, fromUrl, router])

  const idx = useMemo(() => TEXTBOOK_CHAPTERS.findIndex((c) => c.n === current), [current])
  const chapter = idx >= 0 ? TEXTBOOK_CHAPTERS[idx] : null
  const prev = idx > 0 ? TEXTBOOK_CHAPTERS[idx - 1] : null
  const next = idx >= 0 && idx < TEXTBOOK_CHAPTERS.length - 1 ? TEXTBOOK_CHAPTERS[idx + 1] : null
  const src = chapter ? `/api/textbook/${chapter.n}` : undefined

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Textbook</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <BookOpen className="h-6 w-6" style={{ color: 'var(--primary)' }} />
            {TEXTBOOK_TITLE}
          </h1>
        </div>
        {chapter && (
          <div className="flex items-center gap-2">
            <button onClick={() => prev && setCurrent(prev.n)} disabled={!prev}
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm font-medium disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }} aria-label="Previous chapter">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button onClick={() => next && setCurrent(next.n)} disabled={!next}
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm font-medium disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }} aria-label="Next chapter">
              Next <ChevronRight className="h-4 w-4" />
            </button>
            <a href={src} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              <ExternalLink className="h-4 w-4" /> Open in new tab
            </a>
          </div>
        )}
      </div>

      {/* phone / narrow: a select stands in for the sidebar */}
      <div className="lg:hidden mb-3">
        <label className="sr-only" htmlFor="chapter-select">Chapter</label>
        <select id="chapter-select" value={current ?? ''} onChange={(e) => setCurrent(Number(e.target.value))}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
          {TEXTBOOK_PARTS.map((p) => (
            <optgroup key={p.part} label={p.part}>
              {p.chapters.map((c) => <option key={c.n} value={c.n}>{c.n}. {c.title}</option>)}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* LEFT — table of contents */}
        <nav aria-label="Chapters" className="hidden lg:block rounded-xl border overflow-y-auto"
          style={{ borderColor: 'var(--border)', background: 'var(--card)', maxHeight: 'calc(100vh - 170px)', position: 'sticky', top: 88 }}>
          {TEXTBOOK_PARTS.map((p) => (
            <div key={p.part} className="py-2">
              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>{p.part}</div>
              {p.chapters.map((c) => {
                const active = c.n === current
                return (
                  <button key={c.n} onClick={() => setCurrent(c.n)} aria-current={active ? 'page' : undefined}
                    className="w-full text-left flex items-baseline gap-2 px-3 py-1.5 text-sm transition-colors"
                    style={active
                      ? { background: 'var(--primary)', color: 'var(--primary-foreground)' }
                      : { color: 'var(--foreground)' }}>
                    <span className="w-6 shrink-0 tabular-nums font-semibold" style={{ opacity: active ? 1 : 0.55 }}>{c.n}</span>
                    <span className="leading-snug">{c.title}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* RIGHT — the chapter */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          {chapter ? (
            <>
              <div className="px-4 py-2 text-sm font-semibold border-b" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                Chapter {chapter.n}: {chapter.title}
              </div>
              <iframe key={chapter.n} src={src} title={`Chapter ${chapter.n}: ${chapter.title}`}
                style={{ width: '100%', height: 'calc(100vh - 215px)', minHeight: 480, border: 0, background: 'var(--card)' }} />
            </>
          ) : (
            <div className="p-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>Choose a chapter.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TextbookPage() {
  // useSearchParams needs a Suspense boundary for static prerendering.
  return (
    <Suspense fallback={null}>
      <TextbookReader />
    </Suspense>
  )
}
