'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy, type RenderTask } from 'pdfjs-dist'
import { ChevronLeft, ChevronRight, ExternalLink, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { TextbookLanguage } from '@/data/textbook'
import { textbookPdfUrl, textbookReaderCopy, textbookLanguageTag, textbookPreviewLabel } from '@/lib/textbook-language'
import TextbookLanguageToggle, { useTextbookLanguage } from './TextbookLanguageToggle'
import styles from './ReadingComposer.module.css'

// Import the renderer and worker from the same package so their versions match.
GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

// Client-only, loaded on demand. Textbook content stays behind the existing
// authenticated endpoint; only one page is rendered at a time.
export default function ReadingBookPreview({ chapter, page, offset, onPage, language: controlledLanguage, fullReader = false, sourceUrl, sourceTitle, workspace = false, showPageJump = false }: { workspace?: boolean; showPageJump?: boolean; sourceUrl?: string; sourceTitle?: string; chapter: number; page: number; offset: number; onPage: (page: number) => void; language?: TextbookLanguage; fullReader?: boolean }) {
  const [savedLanguage, changeLanguage] = useTextbookLanguage()
  const pageInputId = useId()
  const language = controlledLanguage ?? savedLanguage
  const copy = textbookReaderCopy(language), src = sourceUrl ?? textbookPdfUrl(chapter, language)
  const container = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null)
  const [width, setWidth] = useState(400), [loaded, setLoaded] = useState<{ src: string; pdf: PDFDocumentProxy } | null>(null)
  // Returning to a language can match the previous URL after its PDF worker
  // has already been destroyed. Wait for the newly loaded document instead.
  const document = loaded?.src === src && !loaded.pdf.loadingTask.destroyed ? loaded.pdf : null
  const [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0), [rendered, setRendered] = useState(''), [zoom, setZoom] = useState(1)
  useEffect(() => {
    const element = container.current
    if (!element) return
    const observer = new ResizeObserver(() => {
      const computed = window.getComputedStyle(element)
      setWidth(Math.max(160, Math.floor(element.clientWidth - parseFloat(computed.paddingLeft) - parseFloat(computed.paddingRight))))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    let active = true
    setLoaded(null)
    setFailed(false)
    setRendered('')
    const loading = getDocument(sourceUrl ? { url: src, disableAutoFetch: true, disableStream: true } : src)
    loading.promise.then(pdf => { if (active) setLoaded({ src, pdf }) }).catch(() => { if (active) setFailed(true) })
    return () => {
      active = false
      // PDF.js can emit an uncaught worker error if destroyed while parsing.
      // Ignore the obsolete result and release it as soon as loading settles.
      void loading.promise.catch(() => undefined).then(() => loading.destroy()).catch(() => {})
    }
  }, [src, attempt, sourceUrl])
  const firstPage = showPageJump ? Math.max(1, 1 - offset) : 1
  const safePage = document ? Math.min(Math.max(firstPage, page), document.numPages) : Math.max(firstPage, page)
  const renderKey = `${src}:${safePage}:${width}:${zoom}:${attempt}`
  useEffect(() => {
    if (!document || !canvas.current) return
    let active = true, task: RenderTask | undefined
    const surface = canvas.current
    setRendered('')
    if (container.current) container.current.scrollTop = 0
    void Promise.resolve().then(() => document.getPage(safePage)).then(async pdfPage => {
      if (!active) return
      const viewport = pdfPage.getViewport({ scale: width * zoom / pdfPage.getViewport({ scale: 1 }).width })
      // Long pages can include translated diagram keys. Bound the canvas memory
      // at high zoom so the reader remains usable on student tablets.
      const scale = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(14_000_000 / (viewport.width * viewport.height)))
      surface.width = Math.floor(viewport.width * scale); surface.height = Math.floor(viewport.height * scale)
      const context = surface.getContext('2d')
      if (!context) throw new Error('Canvas unavailable')
      task = pdfPage.render({ canvasContext: context, viewport, transform: [scale, 0, 0, scale, 0, 0] })
      await task.promise
      if (active) setRendered(renderKey)
    }).catch(() => { if (active) setFailed(true) })
    return () => { active = false; task?.cancel() }
  }, [document, safePage, width, zoom, renderKey])
  return <div className={`${styles.bookReader} ${workspace ? styles.workspaceReader : ''}`} lang={textbookLanguageTag(language)}>
    {!controlledLanguage && !sourceUrl && <div className="flex justify-end p-2 border-b border-border"><TextbookLanguageToggle language={language} onChange={changeLanguage} /></div>}
    <div className={styles.bookToolbar}>
      <Button type="button" variant="ghost" size="icon" aria-label={copy.previousPage} disabled={safePage <= firstPage} onClick={() => onPage(safePage - 1)}><ChevronLeft /></Button>
      {showPageJump ? <form className={styles.pageJump} onSubmit={event => {
        event.preventDefault()
        const printed = Number(new FormData(event.currentTarget).get('printedPage'))
        if (Number.isInteger(printed) && printed >= firstPage + offset && (!document || printed <= document.numPages + offset)) onPage(printed - offset)
      }}><label htmlFor={pageInputId}>{copy.pageLabel}</label><Input key={`${src}:${safePage}:${offset}`} id={pageInputId} aria-label={copy.printedPage} name="printedPage" type="number" min={firstPage + offset} max={document ? document.numPages + offset : undefined} step={1} defaultValue={safePage + offset} required /><Button type="submit" variant="ghost">{copy.goToPage}</Button></form> : <span>{copy.bookPage} <strong>{safePage + offset}</strong></span>}
      <Button type="button" variant="ghost" size="icon" aria-label={copy.nextPage} disabled={!document || safePage >= document.numPages} onClick={() => onPage(safePage + 1)}><ChevronRight /></Button>
      {fullReader && <><Button type="button" variant="ghost" size="icon" aria-label={copy.zoomOut} disabled={zoom <= 1} onClick={() => setZoom(z => Math.max(1, z - 0.25))}><ZoomOut /></Button><Button type="button" variant="ghost" size="icon" aria-label={copy.zoomIn} disabled={zoom >= 2} onClick={() => setZoom(z => Math.min(2, z + 0.25))}><ZoomIn /></Button></>}
      <Button asChild variant="ghost" size="icon"><a href={sourceUrl ? `${sourceUrl}#page=${safePage}` : textbookPdfUrl(chapter, language, safePage)} target="_blank" rel="noreferrer" aria-label={copy.bookNewTab}><ExternalLink /></a></Button>
    </div>
    <div ref={container} className={`${styles.paper} ${workspace ? styles.workspacePaper : ''}`} style={fullReader && !workspace ? { maxHeight: 'calc(100vh - 280px)', minHeight: 480 } : undefined}>
      {failed ? <div className={styles.previewMessage} role="alert"><p>{copy.previewError}</p><Button type="button" variant="outline" onClick={() => { setLoaded(null); setFailed(false); setRendered(''); setAttempt(a => a + 1) }}><RotateCcw />{copy.retry}</Button><a href={sourceUrl ? `${sourceUrl}#page=${safePage}` : textbookPdfUrl(chapter, language, safePage)} target="_blank" rel="noreferrer">{sourceTitle ? `Open ${sourceTitle}` : copy.chapterNewTab}</a></div> : <div data-pdf-page={rendered === renderKey ? safePage : undefined} data-pdf-language={language}>
        {rendered !== renderKey && <p className={styles.previewMessage} role="status">{document ? copy.loading : copy.opening}</p>}
        <canvas key={renderKey} ref={canvas} role="img" aria-label={sourceTitle ? `${sourceTitle}, printed page ${safePage + offset}` : textbookPreviewLabel(language, safePage + offset)} hidden={rendered !== renderKey} style={zoom > 1 ? { maxWidth: 'none', width: width * zoom } : undefined} />
      </div>}
    </div>
  </div>
}
