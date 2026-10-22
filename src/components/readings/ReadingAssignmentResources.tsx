'use client'
import { interactiveChapterForAssignment } from './interactive/registry'
import OpenStaxReading from './OpenStaxReading'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { BookOpen, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TEXTBOOK_SECTIONS } from '@/data/textbook-sections'
import { readingBookUrl, readingQuestionPage, readingSectionPage, readingStartPage } from '@/lib/reading-book-pages'
import type { ReadingAssignment, ReadingQuestion } from '@/lib/textbook-assignments'
import styles from './readings.module.css'
import { useTextbookLanguage } from './TextbookLanguageToggle'

const BookPreview = dynamic(() => import('./ReadingBookPreview'), {
  ssr: false, loading: () => <p role="status">Opening your assigned textbook pages…</p>,
})

export function ReadingQuestionText({ chapter, question }: { chapter: number; question: ReadingQuestion }) {
  const [language] = useTextbookLanguage()
  const page = readingQuestionPage(chapter, question)
  if (question.prompt) return <p className="whitespace-pre-wrap">{question.prompt}</p>
  return <div className={styles.stack}>
    <p className={styles.muted}>Read {question.reference} {page ? `on printed page ${page.printedPage}` : `in Chapter ${chapter}`}. Use the textbook link to see the full question and any diagrams.</p>
    <a className="text-primary underline" href={readingBookUrl(chapter, page, language)} target="_blank" rel="noopener noreferrer">Open question in textbook{page ? ` · p. ${page.printedPage}` : ''}<ExternalLink className="inline ml-2" size={15} /></a>
  </div>
}

/** The same assigned pages and question sources appear before and after publishing. */
export default function ReadingAssignmentResources({ assignment, showQuestions = false, showInteractiveLink = true }: { assignment: ReadingAssignment; showQuestions?: boolean; showInteractiveLink?: boolean }) {
  const [language] = useTextbookLanguage()
  const start = readingStartPage(assignment)
  const [page, setPage] = useState(start?.pdfPage ?? 1)
  const offset = start ? start.printedPage - start.pdfPage : 0
  const sections = TEXTBOOK_SECTIONS[assignment.chapter]?.sections.filter(s => assignment.section_ids.includes(s.id)) ?? []
  const questions = assignment.questions.flatMap(q => {
    const source = readingQuestionPage(assignment.chapter, q)
    return source ? [{ question: q, source }] : []
  })
  if (assignment.honors_reading) return <div className={styles.stack}><OpenStaxReading key={`${assignment.honors_reading.from}:${assignment.honors_reading.to}`} reading={assignment.honors_reading} /><details className={styles.question}><summary className="cursor-pointer font-semibold py-3">Shared foundation · {assignment.passage ? "Course reading" : "Hewitt support"}</summary><ReadingAssignmentResources assignment={{...assignment,honors_reading:null}} showInteractiveLink={false} /></details>{showQuestions && assignment.questions.map((q,i)=><div key={q.id} className={styles.question}><h3 className="font-semibold">{i+1}. {q.reference}</h3><ReadingQuestionText chapter={assignment.chapter} question={q}/></div>)}</div>
  if (assignment.passage) return <section className={styles.question} aria-label="Assigned course reading"><h2 className="text-title-3">{assignment.title}</h2><p className={styles.muted}>Course reading</p><div className="whitespace-pre-wrap leading-relaxed">{assignment.passage}</div>{showQuestions && assignment.questions.map((q, i) => <div key={q.id} className={styles.question}><h3 className="font-semibold">{i + 1}. {q.reference}</h3><ReadingQuestionText chapter={assignment.chapter} question={q} /></div>)}</section>
  return <section className={styles.question} aria-label="Assigned textbook pages and questions">
    <div className={`${styles.row} ${styles.spread}`}><h2 className="text-title-3"><BookOpen className="inline mr-2" size={20} />Assigned pages & questions</h2><a className="text-primary underline text-sm" href={readingBookUrl(assignment.chapter, { pdfPage: page, printedPage: page + offset }, language)} target="_blank" rel="noopener noreferrer">Open current page in new tab<ExternalLink className="inline ml-2" size={15} /></a></div>
    <p>{assignment.reading}</p>
    {showInteractiveLink && assignment.status !== 'draft' && assignment.id && interactiveChapterForAssignment(assignment, language) ? <a className="text-primary underline" href={`/readings/${assignment.id}?reader=interactive`} target="_blank" rel="noopener noreferrer">Open saved assignment in the interactive chapter<ExternalLink className="inline ml-2" size={15} /></a> : null}
    <nav className={styles.actions} aria-label="Assigned reading pages">
      {sections.length ? sections.map(section => {
        const source = readingSectionPage(assignment.chapter, section.id)!
        return <Button type="button" key={section.id} variant={page === source.pdfPage ? 'default' : 'outline'} aria-pressed={page === source.pdfPage} onClick={() => setPage(source.pdfPage)}>Read {section.id} · p. {source.printedPage}</Button>
      }) : <Button type="button" variant="outline" onClick={() => setPage(start?.pdfPage ?? 1)}>Chapter {assignment.chapter} · Start reading</Button>}
    </nav>
    {!!questions.length && <nav className={styles.actions} aria-label="Assigned question pages">{questions.map(({ question, source }) => <Button type="button" key={question.id} variant={page === source.pdfPage ? 'default' : 'outline'} aria-pressed={page === source.pdfPage} onClick={() => setPage(source.pdfPage)}>{question.reference} · p. {source.printedPage}</Button>)}</nav>}
    <p className={styles.muted}>Read the assigned sections.{questions.length ? ' Choose a question above to see its textbook page.' : ''} Answer only the assigned questions below.</p>
    <div className={styles.assignmentBook}><BookPreview key={assignment.chapter} chapter={assignment.chapter} page={page} offset={offset} onPage={setPage} /></div>
    {showQuestions && <div className={styles.stack}><h3 className="text-title-3">Assigned questions ({assignment.questions.length})</h3>{assignment.questions.map((question, i) => <div key={question.id} className={styles.question}><h4 className="font-semibold">{i + 1}. {question.reference || 'Question'}</h4><ReadingQuestionText chapter={assignment.chapter} question={question} /></div>)}</div>}
  </section>
}
