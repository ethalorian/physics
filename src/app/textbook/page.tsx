"use client"

import { Suspense, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { TEXTBOOK_PARTS, TEXTBOOK_CHAPTERS, textbookChapter } from '@/data/textbook'
import pageMap from '@/data/textbook-page-map.json'
import { textbookChapterTitle, textbookPartTitle, textbookPdfUrl, textbookReaderCopy, textbookLanguageTag } from '@/lib/textbook-language'
import TextbookNavigation, { TextbookChapterNavigation, TextbookPdfLink } from '@/components/readings/TextbookNavigation'
import TextbookLanguageToggle, { useTextbookLanguage } from '@/components/readings/TextbookLanguageToggle'

const BookPreview = dynamic(() => import('@/components/readings/ReadingBookPreview'), { ssr: false })
const pages = pageMap as Record<string, { offset: number; pages: number }>

// /textbook — the class copy of Conceptual Physics, readable in place.
// Left: the book's table of contents (grouped by part). Right: the chosen
// chapter in the page-aligned PDF reader, streamed from the session-gated
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
  const fromPage = Number(params.get('page'))
  const [current, setCurrent] = useState<number | null>(textbookChapter(fromUrl) ? fromUrl : null)
  const [page, setPage] = useState(Number.isInteger(fromPage) && fromPage > 0 ? fromPage : 1)
  const [language, changeLanguage] = useTextbookLanguage(params.get('lang'))
  const copy = textbookReaderCopy(language)

  useEffect(() => {
    if (textbookChapter(fromUrl)) setCurrent(fromUrl)
    if (textbookChapter(fromUrl)) setPage(Number.isInteger(fromPage) && fromPage > 0 ? Math.min(fromPage, pages[fromUrl]?.pages ?? 1) : 1)
  }, [fromUrl, fromPage])

  // Hydrate from the last-read chapter when the URL doesn't name one.
  useEffect(() => {
    if (current !== null) return
    const last = readLast() ?? TEXTBOOK_CHAPTERS[0].n
    setCurrent(last)
    try { const saved = Number(localStorage.getItem(`textbook:page:${last}`)); if (saved > 0) setPage(Math.min(saved, pages[last]?.pages ?? 1)) } catch {}
  }, [current])

  // Keep the URL and the remembered chapter in step with the selection.
  useEffect(() => {
    if (current === null) return
    try { localStorage.setItem(LAST_KEY, String(current)); localStorage.setItem(`textbook:page:${current}`, String(page)) } catch {}
  }, [current, page])

  function navigateChapter(n: number) {
    setCurrent(n); setPage(1)
    router.push(`/textbook?ch=${n}&lang=${language}&page=1`, { scroll: false })
  }
  function navigatePage(n: number) {
    setPage(n)
    router.replace(`/textbook?ch=${current}&lang=${language}&page=${n}`, { scroll: false })
  }

  const idx = useMemo(() => TEXTBOOK_CHAPTERS.findIndex((c) => c.n === current), [current])
  const chapter = idx >= 0 ? TEXTBOOK_CHAPTERS[idx] : null
  const prev = idx > 0 ? TEXTBOOK_CHAPTERS[idx - 1] : null
  const next = idx >= 0 && idx < TEXTBOOK_CHAPTERS.length - 1 ? TEXTBOOK_CHAPTERS[idx + 1] : null

  return (
    <div className="max-w-[1440px] mx-auto min-w-0" lang={textbookLanguageTag(language)}>
      <TextbookNavigation activeBook="hewitt" language={language} />
      {/* header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>{copy.textbook}</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <BookOpen className="h-6 w-6" style={{ color: 'var(--primary)' }} />
            {copy.title}
          </h1>
        </div>
      </div>

      {language === 'pt' && (
        <p className="mb-4 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Notação numérica: os valores seguem o original em inglês, com ponto decimal (0.5) e vírgula para separar milhares (1,000).
        </p>
      )}

      {/* phone / narrow: a select stands in for the sidebar */}
      <div className="lg:hidden mb-3">
        <label className="sr-only" htmlFor="chapter-select">{copy.chapter}</label>
        <select id="chapter-select" value={current ?? ''} onChange={(e) => navigateChapter(Number(e.target.value))}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
          {TEXTBOOK_PARTS.map((p) => (
            <optgroup key={p.part} label={textbookPartTitle(p.part, language)}>
              {p.chapters.map((c) => <option key={c.n} value={c.n}>{c.n}. {textbookChapterTitle(c, language)}</option>)}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* LEFT — table of contents */}
        <nav aria-label={copy.chapters} className="hidden lg:block rounded-xl border overflow-y-auto"
          style={{ borderColor: 'var(--border)', background: 'var(--card)', maxHeight: 'calc(100vh - 170px)', position: 'sticky', top: 88 }}>
          {TEXTBOOK_PARTS.map((p) => (
            <div key={p.part} className="py-2">
              <div className="px-3 pt-2 pb-1 text-overline font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>{textbookPartTitle(p.part, language)}</div>
              {p.chapters.map((c) => {
                const active = c.n === current
                return (
                  <button key={c.n} onClick={() => navigateChapter(c.n)} aria-current={active ? 'page' : undefined}
                    className="w-full text-left flex items-baseline gap-2 px-3 py-1.5 text-sm transition-colors"
                    style={active
                      ? { background: 'var(--primary)', color: 'var(--primary-foreground)' }
                      : { color: 'var(--foreground)' }}>
                    <span className="w-6 shrink-0 tabular-nums font-semibold" style={{ opacity: active ? 1 : 0.55 }}>{c.n}</span>
                    <span className="leading-snug">{textbookChapterTitle(c, language)}</span>
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
                {copy.chapter} {chapter.n}: {textbookChapterTitle(chapter, language)}
              </div>
              <TextbookChapterNavigation language={language} previous={prev ? () => navigateChapter(prev.n) : undefined} next={next ? () => navigateChapter(next.n) : undefined}>
                <TextbookLanguageToggle language={language} onChange={nextLanguage => {
                  changeLanguage(nextLanguage)
                  router.replace(`/textbook?ch=${current}&lang=${nextLanguage}&page=${page}`, { scroll: false })
                }} />
              </TextbookChapterNavigation>
              <BookPreview chapter={chapter.n} page={page} offset={pages[chapter.n]?.offset ?? 0} onPage={navigatePage} language={language} fullReader workspace showPageJump />
            </>
          ) : (
            <div className="p-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>{copy.chooseChapter}</div>
          )}
        </div>
      </div>
      {chapter && <TextbookPdfLink href={textbookPdfUrl(chapter.n, language, page)} language={language} />}
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
