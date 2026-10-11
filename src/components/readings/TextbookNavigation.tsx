'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { BookMarked, BookOpen, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TextbookLanguage } from '@/data/textbook'
import { usePermissions } from '@/hooks/usePermissions'
import { textbookReaderCopy } from '@/lib/textbook-language'
import styles from './TextbookNavigation.module.css'

interface TextbookNavigationProps {
  activeBook: 'hewitt' | 'honors'
  language?: TextbookLanguage
}

// Both readers use the same labels, destinations, order, and active-book cue.
export default function TextbookNavigation({ activeBook, language = 'en' }: TextbookNavigationProps) {
  const { userRole } = usePermissions()
  const staff = userRole === 'teacher' || userRole === 'admin'
  const copy = textbookReaderCopy(language)

  return <nav className={styles.navigation} aria-label={copy.libraryNavigation}>
    <div className={styles.bar}>
      <div className={styles.books}>
        <Button asChild variant={activeBook === 'hewitt' ? 'secondary' : 'ghost'}>
          <Link href="/textbook" aria-current={activeBook === 'hewitt' ? 'page' : undefined}>
            <BookOpen size={18} aria-hidden="true" />{copy.hewittTextbook}
          </Link>
        </Button>
        <Button asChild variant={activeBook === 'honors' ? 'secondary' : 'ghost'}>
          <Link href="/textbook/honors" aria-current={activeBook === 'honors' ? 'page' : undefined}>
            <BookOpen size={18} aria-hidden="true" />{copy.honorsTextbook}
          </Link>
        </Button>
      </div>
      <div className={styles.actions}>
        <Button asChild>
          <Link href={staff ? '/admin/readings/syllabus' : '/readings'}>
            <BookMarked size={18} aria-hidden="true" />{staff ? copy.readingSyllabus : copy.studentReadings}
          </Link>
        </Button>
        {staff && <Button asChild variant="outline">
          <Link href="/admin/readings"><ClipboardList size={18} aria-hidden="true" />{copy.readingAssignments}</Link>
        </Button>}
      </div>
    </div>
    <p className="text-caption text-muted-foreground">{staff ? copy.syllabusDescription : copy.studentDescription}</p>
  </nav>
}

interface TextbookChapterNavigationProps {
  previous?: () => void
  next?: () => void
  language?: TextbookLanguage
  children?: ReactNode
}

export function TextbookChapterNavigation({ previous, next, language = 'en', children }: TextbookChapterNavigationProps) {
  const copy = textbookReaderCopy(language)
  return <div className={styles.chapterBar}>
    <div role="group" aria-label={copy.chapterNavigation} className={styles.chapterControls}>
      <Button variant="outline" disabled={!previous} onClick={previous}>
        <ChevronLeft size={17} aria-hidden="true" />{copy.previousChapter}
      </Button>
      <Button variant="outline" disabled={!next} onClick={next}>
        {copy.nextChapter}<ChevronRight size={17} aria-hidden="true" />
      </Button>
    </div>
    {children}
  </div>
}

export function TextbookPdfLink({ href, language = 'en' }: { href: string; language?: TextbookLanguage }) {
  return <a className={styles.pdfLink} href={href} target="_blank" rel="noreferrer">{textbookReaderCopy(language).bookNewTab}</a>
}
