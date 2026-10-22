/* eslint-disable @next/next/no-img-element -- Full-resolution approved comic images are pre-optimized and preserved for reading. */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, ArrowRight, BookOpen, Bookmark, MoveUpRight } from 'lucide-react'
import { COMIC_BOOKS, comicHref, comicProgressKey, readComicProgress } from '@/lib/comics'
import styles from './comics.module.css'

export default function ComicLibrary() {
  const { data: session, status } = useSession()
  const user = session?.user?.id ?? session?.user?.email ?? 'guest'
  const book = COMIC_BOOKS[0]
  const [saved, setSaved] = useState({ user: '', page: 0 })
  useEffect(() => {
    if (status === 'loading') return
    setSaved({ user, page: readComicProgress(comicProgressKey(user, book.slug), book.pages.length) })
  }, [user, status, book])
  const lastPage = saved.user === user ? saved.page : 0
  const chapter = book.chapters.find(day => lastPage >= day.start && lastPage <= day.end)

  return <div className={styles.world}>
    <header className={styles.libraryHeader}>
      <Link href="/home" className={styles.backLink}><ArrowLeft size={17} />Back to classroom</Link>
      <span className={styles.wordmark}><BookOpen size={18} />The Reading Room</span>
      <span className={styles.headerNote}>Antocci Physics</span>
    </header>
    <div className={styles.libraryBody}>
      <div className={styles.libraryIntro}><span className={styles.eyebrow}>A different way into physics</span><p>Big questions.<br /><em>One page at a time.</em></p></div>
      <section className={styles.bookFeature} aria-labelledby="book-title">
        <div className={styles.bookObject}>
          <span className={styles.spineLabel}>2026-XJ / BOOK ONE</span>
          <Link href={comicHref(book)} aria-label="Open The First Prediction" className={styles.coverLink}>
            <img src={book.pages[0].src} width={1024} height={1536} alt="2026-XJ. Book One: The First Prediction. Maz and her classmates investigate alongside Mr. Antocci." fetchPriority="high" />
            <span className={styles.coverOpen}>Open book <MoveUpRight size={18} /></span>
          </Link>
        </div>
        <div className={styles.bookDetails}>
          <div className={styles.bookNumber}><span>01</span><div className={styles.eyebrow}>2026-XJ<br /><b>The graphic novel series</b></div></div>
          <h1 id="book-title">The First<br /><em>Prediction.</em></h1>
          <p className={styles.synopsis}>{book.description}</p>
          <div className={styles.bookMeta}><span>Unit 1 · {book.unit}</span><span>Full color</span><span>{book.chapters.length} installments</span></div>
          <Link href={comicHref(book)} className={styles.primaryButton}>{lastPage > 0 ? 'Continue reading' : 'Open book'}<ArrowRight size={19} /></Link>
          {chapter ? <p className={styles.resumeNote}><Bookmark size={14} />Day {chapter.day} · {book.pages[lastPage].label}<span>Saved on this device</span></p> : <p className={styles.resumeNote}>A grounded science thriller. With a little homework—and humor.</p>}
          <div className={styles.installments}>
            <div className={styles.sectionLabel}><h2>Inside this book</h2><span>One school day. One new chapter.</span></div>
            {book.chapters.map(day => <Link className={styles.chapterRow} href={comicHref(book, day.start)} key={day.day}>
              <span className={styles.chapterNumber}>{String(day.day).padStart(2, '0')}</span><div><span className={styles.eyebrow}>Day {day.day}</span><h3>{day.title}</h3><p>{day.topic}</p></div><ArrowRight size={20} />
            </Link>)}
            <p className={styles.upNext}>The story continues as new installments arrive.</p>
          </div>
        </div>
      </section>
      {COMIC_BOOKS.length > 1 && <section className={styles.moreBooks} aria-label="More books in the series"><h2>Continue the series</h2><div>{COMIC_BOOKS.slice(1).map(volume => <Link key={volume.slug} href={comicHref(volume)}><img src={volume.pages[0].src} width={1024} height={1536} alt={volume.pages[0].description} loading="lazy" /><span className={styles.eyebrow}>Book {volume.number} · {volume.unit}</span><h3>{volume.title}</h3><p>{volume.chapters.length} installments <ArrowRight size={16} /></p></Link>)}</div></section>}
      <footer className={styles.libraryFooter}><span>Fictional students. Real physics.</span><span>Each unit, a new book. Each day, the next page.</span><span>2026-XJ</span></footer>
    </div>
  </div>
}
