'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, BookOpen, Bookmark, ChevronDown, ChevronRight, List, PanelLeftClose, PanelLeftOpen, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import TextbookNavigation, { TextbookChapterNavigation, TextbookPdfLink } from '@/components/readings/TextbookNavigation'
import { OPENSTAX_PDF, OPENSTAX_PHYSICS, honorsPdfPage } from '@/lib/openstax-physics'
import { HONORS_CHAPTERS, HONORS_LAST_PAGE, HONORS_PARTS, HONORS_READER_KEY, honorsChapterAt, honorsPageTitle, honorsPrintedPage, honorsSectionAt, readHonorsPosition } from '@/lib/honors-textbook'
import styles from './reader.module.css'

const BookPreview = dynamic(() => import('@/components/readings/ReadingBookPreview'), { ssr: false, loading: () => <div className={styles.loading}><Spinner /><span>Opening your textbook…</span></div> })

function Reader() {
  const params = useSearchParams(), router = useRouter()
  const requested = honorsPrintedPage(params.get('page'))
  const [page, setPage] = useState(requested ?? OPENSTAX_PHYSICS.defaultPage)
  const [ready, setReady] = useState(false)
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [expanded, setExpanded] = useState<number | null>(honorsChapterAt(page)?.number ?? 1)
  const [query, setQuery] = useState('')
  const [mobileContents, setMobileContents] = useState(false)
  const contentsSearch = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    let saved = readHonorsPosition(null)
    try { saved = readHonorsPosition(localStorage.getItem(HONORS_READER_KEY)) } catch {}
    const next = requested ?? saved.page
    setPage(next); setExpanded(honorsChapterAt(next)?.number ?? null); setBookmarks(saved.bookmarks); setReady(true)
    // Only restore device memory on first visit. Later URL changes take precedence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (requested === null) return
    setPage(requested); setExpanded(honorsChapterAt(requested)?.number ?? null)
  }, [requested])
  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(HONORS_READER_KEY, JSON.stringify({ page, bookmarks })) } catch {}
  }, [ready, page, bookmarks])

  useEffect(() => {
    if (mobileContents) contentsSearch.current?.focus()
  }, [mobileContents])

  function navigatePage(next: number, history: 'push' | 'replace' = 'replace') {
    const valid = honorsPrintedPage(next)
    if (valid === null) return
    setPage(valid); setExpanded(honorsChapterAt(valid)?.number ?? null); setMobileContents(false)
    router[history](`/textbook/honors?page=${valid}`, { scroll: false })
  }
  const chapter = honorsChapterAt(page), section = honorsSectionAt(page)
  const chapterIndex = HONORS_CHAPTERS.findIndex(c => c.number === chapter?.number)
  const previousChapter = HONORS_CHAPTERS[chapterIndex - 1]
  const nextChapter = chapterIndex >= 0 ? HONORS_CHAPTERS[chapterIndex + 1] : undefined
  const part = HONORS_PARTS.find(part => chapter && chapter.number >= part.first && chapter.number <= part.last)
  const preceding = OPENSTAX_PHYSICS.sections.filter(s => s.printedPage < (section?.printedPage ?? page)).at(-1)
  const following = OPENSTAX_PHYSICS.sections.find(s => s.printedPage > page)
  const saved = bookmarks.includes(page), search = query.trim().toLowerCase()
  const matches = HONORS_CHAPTERS.filter(c => `${c.number} ${c.title}`.toLowerCase().includes(search) || c.sections.some(s => `${s.id} ${s.title}`.toLowerCase().includes(search)))

  return <div className={styles.shell} data-focused={focused}>
    <TextbookNavigation activeBook="honors" />
    <header className={styles.hero}>
      <div className={styles.bookMark} aria-hidden="true"><BookOpen size={30} /><span className="text-overline">PHYSICS</span><span className="text-caption">AP · 2e</span></div>
      <div className={styles.identity}><p className="text-overline text-primary">Honors course library · OpenStax</p><h1 className="text-display">College Physics</h1><p className="text-title-3 text-muted-foreground">for AP® Courses · Second edition</p><p className="text-caption text-muted-foreground">34 chapters · 244 sections · Your place is saved on this device</p></div>
    </header>

    <div className={styles.workspace}>
      <Card className={styles.sidebar} data-mobile-open={mobileContents}>
        <nav id="honors-contents" aria-label="Textbook contents">
          <div className={styles.contentsHeading}><div><h2 className="text-title-3">Contents</h2><p className="text-caption text-muted-foreground">Find your next idea.</p></div><Button className={styles.mobileOnly} variant="ghost" size="icon" aria-label="Close contents" onClick={() => setMobileContents(false)}><X size={18} /></Button></div>
          <div className={styles.search}><Search size={17} aria-hidden="true" /><Input ref={contentsSearch} aria-label="Search textbook contents" placeholder="Find a chapter or topic…" value={query} onChange={e => setQuery(e.target.value)} />{query && <Button variant="ghost" size="icon" aria-label="Clear contents search" onClick={() => setQuery('')}><X size={16} /></Button>}</div>
          <div className={styles.contentsList}>
            {bookmarks.length > 0 && !search && <div className={styles.bookmarks}><p className="text-overline"><Bookmark size={13} />Your bookmarks</p>{bookmarks.map(p => <Button key={p} variant="ghost" className={styles.bookmarkLink} onClick={() => navigatePage(p, 'push')}><span>{honorsPageTitle(p)}</span><span className="text-caption">{p}</span></Button>)}</div>}
            {matches.length === 0 && <p className={styles.empty} role="status">No matching topics. Try a chapter number or a different word.</p>}
            {HONORS_PARTS.map(group => {
              const chapters = matches.filter(c => c.number >= group.first && c.number <= group.last)
              return chapters.length > 0 && <div className={styles.part} key={group.title}><p className="text-overline text-muted-foreground">{group.title}</p>{chapters.map(c => {
                const open = Boolean(search) || expanded === c.number
                const sections = search && !`${c.number} ${c.title}`.toLowerCase().includes(search) ? c.sections.filter(s => `${s.id} ${s.title}`.toLowerCase().includes(search)) : c.sections
                return <div key={c.number} className={styles.chapter} data-current={c.number === chapter?.number}><Button variant="ghost" className={styles.chapterButton} aria-expanded={open} aria-controls={`honors-chapter-${c.number}`} onClick={() => { if (search) { setQuery(''); setExpanded(c.number) } else setExpanded(open ? null : c.number) }}><span className={styles.chapterNumber}>{c.number}</span><span>{c.title}</span>{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</Button>{open && <div id={`honors-chapter-${c.number}`} className={styles.sections}>
                  {!search && <Button variant="ghost" className={styles.sectionButton} aria-current={page === c.from ? 'page' : undefined} onClick={() => navigatePage(c.from, 'push')}><span>Chapter overview</span><span>{c.from}</span></Button>}
                  {sections.map(s => <Button key={s.id} variant="ghost" aria-label={`Read section ${s.id}: ${s.title}`} className={styles.sectionButton} aria-current={s.id === section?.id ? 'page' : undefined} onClick={() => navigatePage(s.printedPage, 'push')}><span><span className={styles.sectionNumber}>{s.id}</span>{s.title}</span><span>{s.printedPage}</span></Button>)}
                </div>}</div>
              })}</div>
            })}
            {!search && <div className={styles.part}><p className="text-overline text-muted-foreground">Reference</p><Button variant="ghost" className={styles.sectionButton} onClick={() => navigatePage(1641, 'push')}><span>Appendices</span><span>1641</span></Button><Button variant="ghost" className={styles.sectionButton} onClick={() => navigatePage(1749, 'push')}><span>Index</span><span>1749</span></Button></div>}
          </div>
        </nav>
      </Card>

      <section className={styles.readingColumn} aria-label="Honors textbook reader">
        <Card className={styles.readerCard}>
          <div className={styles.readerHeading}><div><p className="text-overline text-primary">{part?.title ?? 'Book reference'}{chapter && ` · Chapter ${chapter.number}`}</p><h2 className="text-title-2">{chapter?.title ?? honorsPageTitle(page)}</h2></div><div className={styles.readerActions}>
            <Button className={styles.mobileOnly} variant="outline" onClick={() => { setFocused(false); setMobileContents(!mobileContents) }} aria-expanded={mobileContents} aria-controls="honors-contents"><List size={17} />Contents</Button>
            <Button variant="ghost" onClick={() => setFocused(!focused)} aria-pressed={focused} aria-label={focused ? 'Exit focus' : 'Focus view'} className={styles.focusButton}>{focused ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}<span className={styles.focusLabel}>{focused ? 'Exit focus' : 'Focus view'}</span></Button>
            <Button variant={saved ? 'secondary' : 'outline'} aria-label={saved ? 'Remove page bookmark' : 'Bookmark this page'} aria-pressed={saved} size="icon" onClick={() => setBookmarks(pages => saved ? pages.filter(p => p !== page) : [...pages, page].sort((a, b) => a - b))}><Bookmark size={18} fill={saved ? 'currentColor' : 'none'} /></Button>
          </div></div>
          <div className={styles.sectionHeading}><span className={styles.sectionBadge}>{section?.id ?? (chapter ? chapter.number : 'REF')}</span><div><p className="text-callout">{section?.title ?? (chapter ? page < chapter.sections[0].printedPage ? 'Chapter overview' : 'Chapter review & problems' : honorsPageTitle(page))}</p><p className="text-caption text-muted-foreground">{section ? `Section pages ${section.printedPage}–${section.lastPrintedPage}` : chapter ? `Chapter pages ${chapter.from}–${chapter.to}` : `Printed page ${page}`} · {saved ? 'Bookmarked on this device' : 'Read at your own pace'}</p></div></div>
          <TextbookChapterNavigation previous={previousChapter ? () => navigatePage(previousChapter.from, 'push') : undefined} next={nextChapter ? () => navigatePage(nextChapter.from, 'push') : undefined} />
          {ready ? <BookPreview chapter={0} page={honorsPdfPage(page)} offset={-OPENSTAX_PHYSICS.offset} onPage={pdfPage => navigatePage(pdfPage - OPENSTAX_PHYSICS.offset)} language="en" sourceUrl={OPENSTAX_PDF} sourceTitle={OPENSTAX_PHYSICS.title} fullReader workspace showPageJump /> : <div className={styles.loading}><Spinner /></div>}
          <div className={styles.sectionNavigation}><Button variant="ghost" disabled={!preceding} onClick={() => preceding && navigatePage(preceding.printedPage, 'push')}><ArrowLeft size={17} /><span><small className="text-caption">Previous section</small><strong>{preceding ? `${preceding.id} ${preceding.title}` : 'Beginning of book'}</strong></span></Button><span className={styles.pagePosition}>p. {page} / {HONORS_LAST_PAGE.toLocaleString()}</span><Button variant="ghost" disabled={!following} onClick={() => following && navigatePage(following.printedPage, 'push')}><span><small className="text-caption">Next section</small><strong>{following ? `${following.id} ${following.title}` : 'End of sections'}</strong></span><ArrowRight size={17} /></Button></div>
        </Card>
      </section>
    </div>
    <footer className={styles.attribution}><TextbookPdfLink href={`${OPENSTAX_PDF}#page=${honorsPdfPage(page)}`} /><details><summary className="text-caption">About this textbook & attribution</summary><p>{OPENSTAX_PHYSICS.authors}. {OPENSTAX_PHYSICS.copyright} <a href={OPENSTAX_PHYSICS.licenseUrl} target="_blank" rel="noreferrer">{OPENSTAX_PHYSICS.license}</a>. Original PDF, unchanged. <a href={OPENSTAX_PHYSICS.sourceUrl} target="_blank" rel="noreferrer">Access for free at openstax.org.</a></p></details></footer>
  </div>
}
export default function Page() { return <Suspense fallback={<Spinner />}><Reader /></Suspense> }
