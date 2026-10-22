'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Expand, Minimize2, List, X, ZoomIn, ZoomOut, ScanLine, AlignLeft, PanelLeftClose, Sun, Moon } from 'lucide-react'
import { comicHref, comicProgressKey, parseComicPage, readComicProgress, type ComicBook, type ComicPage } from '@/lib/comics'
import styles from './comics.module.css'

type Mode = 'page' | 'spread' | 'scroll'
type ReaderDialog = 'contents' | 'text' | null

function Art({ page, priority = false, retry = true }: { page: ComicPage; priority?: boolean; retry?: boolean }) {
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  if (failed) return <div className={styles.artError} role="alert"><p>This page couldn’t load.</p>{retry && <button onClick={() => { setFailed(false); setAttempt(value => value + 1) }}>Try again</button>}</div>
  // The original resolution is intentional: readers can enlarge lettering without
  // getting an image optimized for the smaller fit-to-page viewport.
  // eslint-disable-next-line @next/next/no-img-element
  return <img key={attempt} src={page.src} alt={page.description} width={1024} height={1536} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" draggable={false} onError={() => setFailed(true)} />
}

function ReaderOverlay({ title, book, children, close }: { title: string; book: ComicBook; children: ReactNode; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { dialog.current?.showModal() }, [])
  return <dialog ref={dialog} className={styles.dialog} aria-label={title} onClose={close} onCancel={close} onClick={event => { if (event.target === event.currentTarget) close() }}>
    <div className={styles.dialogInner}><header><div><span className={styles.eyebrow}>{book.series} · Book {book.number}</span><h2>{title}</h2></div><button className={styles.iconButton} aria-label={`Close ${title.toLowerCase()}`} onClick={close} autoFocus><X size={20} /></button></header>{children}</div>
  </dialog>
}

export default function ComicReader({ book }: { book: ComicBook }) {
  const params = useSearchParams()
  const rawPage = params.get('page')
  const { data: session, status } = useSession()
  const user = session?.user?.id ?? session?.user?.email ?? 'guest'
  const scope = comicProgressKey(user, book.slug)
  const [position, setPosition] = useState({ scope: '', page: 0 })
  const [mode, setMode] = useState<Mode>('page')
  const [wide, setWide] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [paper, setPaper] = useState(false)
  const [focus, setFocus] = useState(false)
  const [overlay, setOverlay] = useState<ReaderDialog>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [canFullscreen, setCanFullscreen] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [notice, setNotice] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLElement | null)[]>([])
  const gesture = useRef<{ x: number; y: number } | null>(null)
  const scrollFrame = useRef<number | null>(null)
  const initialScroll = useRef(true)
  const ready = status !== 'loading' && position.scope === scope
  const page = ready ? position.page : 0
  const current = book.pages[page]
  const effectiveMode = mode === 'spread' && !wide ? 'page' : mode
  const chapter = book.chapters.find(day => page >= day.start && page <= day.end)
  const spreadStart = page === 0 ? 0 : page % 2 === 0 ? page - 1 : page
  const shown = effectiveMode === 'spread' && page > 0 ? [spreadStart, spreadStart + 1].filter(index => index < book.pages.length) : [page]
  const atEnd = shown[shown.length - 1] === book.pages.length - 1

  useEffect(() => {
    if (status === 'loading') return
    const next = parseComicPage(rawPage, book.pages.length) ?? readComicProgress(scope, book.pages.length)
    setPosition(old => {
      if (old.scope === scope && old.page === next) return old
      initialScroll.current = true
      return { scope, page: next }
    })
  }, [scope, status, rawPage, book.pages.length])

  useEffect(() => {
    const query = window.matchMedia('(min-width: 960px)')
    const measure = () => setWide(query.matches)
    measure(); query.addEventListener('change', measure)
    setCanFullscreen(Boolean(document.fullscreenEnabled && root.current?.requestFullscreen))
    const onFull = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFull)
    try {
      const settings = JSON.parse(localStorage.getItem('physics:comic-settings:v1') ?? 'null')
      if (['page', 'spread', 'scroll'].includes(settings?.mode)) setMode(settings.mode)
      if (typeof settings?.paper === 'boolean') setPaper(settings.paper)
    } catch { /* The reader is usable with private or disabled storage. */ }
    return () => { query.removeEventListener('change', measure); document.removeEventListener('fullscreenchange', onFull) }
  }, [])

  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(scope, JSON.stringify({ page, updated: Date.now() })); setSaveFailed(false) } catch { setSaveFailed(true) }
  }, [scope, page, ready])

  useEffect(() => {
    if (!ready) return
    // Use the native history API so page turns do not refetch the book or add
    // dozens of entries to the browser's Back stack.
    const url = new URL(window.location.href)
    if (url.searchParams.get('page') !== String(page)) {
      url.searchParams.set('page', String(page))
      window.history.replaceState(null, '', url.pathname + url.search + url.hash)
    }
  }, [page, ready])

  const scrollToPage = useCallback((index: number) => {
    const target = pageRefs.current[index], viewport = stage.current
    if (!target || !viewport) return
    viewport.scrollTo({ top: target.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop - 24, behavior: 'instant' })
  }, [])

  useEffect(() => {
    if (ready && effectiveMode === 'scroll' && initialScroll.current) {
      const frame = requestAnimationFrame(() => { scrollToPage(page); initialScroll.current = false })
      return () => cancelAnimationFrame(frame)
    }
  }, [ready, effectiveMode, page, scrollToPage])

  const go = useCallback((index: number) => {
    const next = Math.max(0, Math.min(book.pages.length - 1, index))
    setPosition({ scope, page: next }); setZoom(1); setOverlay(null)
    if (effectiveMode === 'scroll') requestAnimationFrame(() => scrollToPage(next))
    else stage.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [book.pages.length, scope, effectiveMode, scrollToPage])

  const turn = useCallback((direction: number) => {
    if (effectiveMode === 'spread') go(direction > 0 ? (page === 0 ? 1 : spreadStart + 2) : Math.max(0, spreadStart - 2))
    else go(page + direction)
  }, [effectiveMode, go, page, spreadStart])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!ready || overlay || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement
      if (target.closest('input, select, textarea, [contenteditable="true"]')) return
      if (event.key === 'ArrowRight' || (effectiveMode !== 'scroll' && event.key === 'PageDown')) { event.preventDefault(); turn(1) }
      if (event.key === 'ArrowLeft' || (effectiveMode !== 'scroll' && event.key === 'PageUp')) { event.preventDefault(); turn(-1) }
      if (event.key === 'Home') { event.preventDefault(); go(0) }
      if (event.key === 'End') { event.preventDefault(); go(book.pages.length - 1) }
      if (event.key === 'Escape') { setFocus(false); setZoom(1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ready, overlay, effectiveMode, turn, go, book.pages.length])

  useEffect(() => {
    const next = new Image(); next.src = book.pages[Math.min(page + (effectiveMode === 'spread' ? 2 : 1), book.pages.length - 1)].src
  }, [book.pages, page, effectiveMode])

  useEffect(() => () => { if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current) }, [])

  const saveSettings = (nextMode: Mode, nextPaper: boolean) => {
    try { localStorage.setItem('physics:comic-settings:v1', JSON.stringify({ mode: nextMode, paper: nextPaper })) } catch { /* Optional preference. */ }
  }
  function changeMode(next: Mode) { setMode(next); setZoom(1); initialScroll.current = true; saveSettings(next, paper); stage.current?.scrollTo({ top: 0, left: 0 }) }
  async function toggleFullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await root.current?.requestFullscreen(); setNotice('') }
    catch { setNotice('Full screen is unavailable here. Focus mode gives the artwork more room.'); setFocus(true) }
  }
  function trackScroll() {
    if (effectiveMode !== 'scroll' || !ready || initialScroll.current || scrollFrame.current !== null) return
    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = null
      const viewport = stage.current
      if (!viewport) return
      const readingLine = viewport.getBoundingClientRect().top + viewport.clientHeight * .4
      let nearest = 0
      pageRefs.current.forEach((element, index) => { if (element && element.getBoundingClientRect().top <= readingLine) nearest = index })
      setPosition(old => old.page === nearest ? old : { scope, page: nearest })
    })
  }

  return <div ref={root} className={`${styles.world} ${styles.reader} ${paper ? styles.paper : ''} ${focus ? styles.focus : ''}`} style={{ '--comic-zoom': zoom } as CSSProperties}>
    <header className={styles.readerHeader}>
      <Link href="/comics" className={styles.backLink}><ArrowLeft size={18} /><span>Library</span></Link>
      <div className={styles.readerTitle}><span className={styles.eyebrow}>{book.series} · Book {book.number}</span><h1>{book.title}</h1></div>
      <div className={styles.headerActions}><button className={styles.iconButton} onClick={() => setOverlay('contents')} aria-label="Open contents" title="Contents"><List size={20} /></button><button className={styles.iconButton} onClick={() => setOverlay('text')} aria-label="Read page description" title="Page description"><AlignLeft size={19} /></button><button className={styles.iconButton} onClick={() => setFocus(true)} aria-label="Enter focus mode" title="Focus mode"><PanelLeftClose size={19} /></button>{canFullscreen && <button className={`${styles.iconButton} ${styles.fullscreenControl}`} onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit full screen' : 'Enter full screen'} title="Full screen">{fullscreen ? <Minimize2 size={18} /> : <Expand size={18} />}</button>}</div>
    </header>
    <div className={styles.readerTools}>
      <span className={styles.chapterStatus}>{chapter ? `Day ${chapter.day} / ${chapter.title}` : `${book.title} / Cover`}</span>
      <div className={styles.modeSwitch} role="group" aria-label="Reading layout">{(['page', 'spread', 'scroll'] as const).map(value => <button key={value} className={value === 'spread' ? styles.spreadControl : ''} onClick={() => changeMode(value)} aria-pressed={effectiveMode === value}>{value === 'page' ? 'Page' : value === 'spread' ? 'Spread' : 'Scroll'}</button>)}</div>
      <div className={styles.viewTools}><button className={styles.iconButton} disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - .25))} aria-label="Zoom out"><ZoomOut size={17} /></button><button className={styles.zoomLabel} onClick={() => setZoom(1)} title="Fit page" aria-label="Fit page">{zoom === 1 ? 'Fit' : `${Math.round(zoom * 100)}%`}</button><button className={styles.iconButton} disabled={zoom >= 2.5} onClick={() => setZoom(value => Math.min(2.5, value + .25))} aria-label="Zoom in"><ZoomIn size={17} /></button><span className={styles.toolDivider} /><button className={styles.iconButton} onClick={() => { setPaper(!paper); saveSettings(mode, !paper) }} aria-label={paper ? 'Use dark reading background' : 'Use paper reading background'} title={paper ? 'Dark background' : 'Paper background'}>{paper ? <Moon size={17} /> : <Sun size={17} />}</button></div>
    </div>
    {focus && <button className={styles.restoreControls} onClick={() => setFocus(false)}><ScanLine size={16} />Show controls</button>}
    <div ref={stage} className={`${styles.stage} ${effectiveMode === 'scroll' ? styles.scrollStage : ''} ${zoom > 1 ? styles.zoomed : ''}`} tabIndex={0} aria-label="Comic pages. Use left and right arrow keys to turn pages." onScroll={trackScroll}
      onTouchStart={event => { gesture.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null }}
      onTouchMove={event => { if (event.touches.length > 1) gesture.current = null }}
      onTouchEnd={event => { const start = gesture.current; gesture.current = null; if (!start || effectiveMode === 'scroll' || zoom > 1 || !ready) return; const end = event.changedTouches[0]; const dx = end.clientX - start.x, dy = end.clientY - start.y; if (Math.abs(dx) > 65 && Math.abs(dy) < 40) turn(dx < 0 ? 1 : -1) }}>
      {!ready ? <div className={styles.loading} role="status">Opening your book…</div> : effectiveMode === 'scroll' ? <div className={styles.scrollPages}>{book.pages.map((item, index) => <figure key={item.src} ref={element => { pageRefs.current[index] = element }} className={styles.scrollPage}><figcaption>{index === 0 ? 'Cover' : `${item.day !== book.pages[index - 1]?.day ? `Day ${item.day} · ${book.chapters.find(day => day.day === item.day)?.title} / ` : ''}${item.label}`}</figcaption><Art page={item} priority={Math.abs(index - page) <= 1} /></figure>)}<EndNote book={book} go={go} /></div> : <div className={`${styles.pageCanvas} ${effectiveMode === 'spread' && page > 0 ? styles.spreadCanvas : ''}`} key={`${effectiveMode}-${shown[0]}`}>
        {shown.map(index => <figure key={book.pages[index].src} className={styles.pageArt} onDoubleClick={() => setZoom(value => value === 1 ? 2 : 1)}><Art page={book.pages[index]} priority /><figcaption className={styles.srOnly}>{book.pages[index].label}</figcaption></figure>)}
      </div>}
    </div>
    <footer className={styles.readerFooter}>
      <button className={styles.pageTurn} onClick={() => turn(-1)} disabled={!ready || page === 0} aria-label="Previous page"><ChevronLeft size={21} /><span>Previous</span></button>
      <div className={styles.progressArea}><div className={styles.progressLabels}><span aria-live="polite" aria-atomic="true">{page === 0 ? 'Cover' : effectiveMode === 'spread' ? `Pages ${shown[0]}–${shown[shown.length - 1]}` : `Page ${page}`}<b> / {book.pages.length - 1}</b></span><span>{saveFailed ? 'Progress won’t save on this device' : atEnd ? 'You’re caught up' : chapter ? `Day ${chapter.day} of ${book.chapters.length}` : 'The story begins here'}</span></div><input aria-label="Jump to page" type="range" min={0} max={book.pages.length - 1} value={page} onChange={event => go(Number(event.target.value))} disabled={!ready} style={{ '--comic-progress': `${page / (book.pages.length - 1) * 100}%` } as CSSProperties} /><p className={styles.readingHint}>{atEnd ? 'More of the story is on its way.' : 'Read left to right · Swipe or use the arrow keys'}</p></div>
      {atEnd ? <Link href="/comics" className={styles.pageTurn} aria-label="Back to library"><span>Library</span><BookOpen size={19} /></Link> : <button className={styles.pageTurn} onClick={() => turn(1)} disabled={!ready} aria-label="Next page"><span>Next</span><ChevronRight size={21} /></button>}
    </footer>
    {notice && <p role="status" className={styles.notice}>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notice"><X size={15} /></button></p>}
    {overlay === 'contents' && <ReaderOverlay book={book} title="Inside this book" close={() => setOverlay(null)}><button className={styles.coverRow} onClick={() => go(0)}><BookOpen size={20} />Cover<span>The First Prediction</span><ArrowRight size={18} /></button>{book.chapters.map(day => <section className={styles.contentsChapter} key={day.day}><button className={styles.contentsHeading} onClick={() => go(day.start)}><span className={styles.chapterNumber}>{String(day.day).padStart(2, '0')}</span><div><span className={styles.eyebrow}>Day {day.day}</span><h3>{day.title}</h3><p>{day.description}</p></div><ArrowRight size={18} /></button><div className={styles.thumbnailGrid}>{book.pages.slice(day.start, day.end + 1).map((item, index) => <button className={styles.thumbnail} key={item.src} onClick={() => go(day.start + index)} aria-label={`Go to ${item.label.toLowerCase()}`} aria-current={page === day.start + index ? 'page' : undefined}><Art page={item} retry={false} /><span>{item.label}</span></button>)}</div></section>)}<p className={styles.dialogNote}>Your place is remembered on this device. New installments will appear here as the story grows.</p></ReaderOverlay>}
    {overlay === 'text' && <ReaderOverlay book={book} title={`${current.label} · Scene description`} close={() => setOverlay(null)}><div className={styles.pageText}><p className={styles.dialogNote}>A text companion to the artwork.</p>{current.text.map((paragraph, index) => <p key={index}>{paragraph}</p>)}<button className={styles.primaryButton} onClick={() => setOverlay(null)}>Return to the artwork<ArrowRight size={18} /></button></div></ReaderOverlay>}
  </div>
}

function EndNote({ book, go }: { book: ComicBook; go: (page: number) => void }) {
  const latest = book.chapters[book.chapters.length - 1]
  return <div className={styles.endNote}><span className={styles.eyebrow}>To be continued</span><h2>{latest.closing?.lead ?? book.title}<br /><em>{latest.closing?.thought ?? 'The story continues.'}</em></h2><p>You’re caught up with Book {book.number}. The next installment will appear in the library when it’s ready.</p><div><Link href="/comics" className={styles.primaryButton}>Back to the library<ArrowRight size={18} /></Link><button className={styles.textButton} onClick={() => go(0)}>Read again</button></div><Link className={styles.backLink} href={comicHref(book, book.chapters[book.chapters.length - 1].start)}>Revisit Day {book.chapters[book.chapters.length - 1].day}</Link></div>
}
