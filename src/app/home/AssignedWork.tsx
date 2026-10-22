'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, ClipboardCheck, Play, SpellCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useQuizData } from '@/components/quizzes/shared'
import type { QuizList } from '@/lib/quizzes/types'
import type { ReadingList } from '@/lib/textbook-assignments'
import type { VocabPracticeStatus } from '@/components/vocabulary/VocabTaskCards'
import { ASSIGNMENT_LABELS, assignmentDeadline, assignmentDueLabel, assignmentInView, prioritizeAssignments, type AssignmentKind, type AssignmentView, type StudentAssignment } from '@/lib/student-dashboard'
import styles from './AssignedWork.module.css'

export interface VideoHomework {
  id: string; slug: string; title: string; sequence: number; due_at: string | null; complete: boolean
}
const ICONS = { review: ClipboardCheck, video: Play, reading: BookOpen, quiz: ClipboardCheck, vocabulary: SpellCheck }
const VIEWS: { id: AssignmentView; label: string }[] = [{ id: 'todo', label: 'To do' }, { id: 'overdue', label: 'Past due' }, { id: 'upcoming', label: 'Next 7 days' }, { id: 'submitted', label: 'Submitted / done' }]

function AssignmentRow({ item, now }: { item: StudentAssignment; now: number }) {
  const Icon = ICONS[item.kind]
  const overdue = !item.complete && assignmentDeadline(item.due) < now
  return <article className={styles.assignmentRow}>
    <span className={styles.icon}><Icon size={20} aria-hidden="true" /></span>
    <div className={styles.assignmentName}><p className={styles.muted}>{ASSIGNMENT_LABELS[item.kind]} · <span className={item.returned ? styles.attention : undefined}>{item.status}</span></p><h3>{item.title}</h3>{item.context && <p className={styles.muted}>{item.context}</p>}</div>
    <p className={overdue ? styles.overdue : styles.due}>{overdue && <strong>Past due<br /></strong>}{assignmentDueLabel(item.due)}</p>
    <Button asChild variant="outline" className="min-h-11"><Link href={item.href}>{item.action}<ArrowRight size={16} aria-hidden="true" /></Link></Button>
  </article>
}

export default function AssignedWork({ homework, loading, error, onRetry, vocabulary }: {
  homework: VideoHomework[]; loading: boolean; error: boolean; onRetry: () => void; vocabulary: VocabPracticeStatus | null
}) {
  const readings = useQuizData<ReadingList>('/api/readings')
  const quizzes = useQuizData<QuizList>('/api/quizzes')
  const [view, setView] = useState<AssignmentView>('todo')
  const [open, setOpen] = useState(false)
  const [managerView, setManagerView] = useState<AssignmentView>('todo')
  const [kind, setKind] = useState<AssignmentKind | 'all'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const returnFocus = useRef<HTMLElement | null>(null)
  const now = Date.now()
  const readingWork = new Map(readings.data?.work.map(w => [w.assignment_id, w]))
  const quizWork = new Map(quizzes.data?.work.map(w => [w.quiz_id, w]))
  const items: StudentAssignment[] = [
    ...(!loading && !error ? [...homework].sort((a, b) => a.sequence - b.sequence).map(w => ({ id: `video:${w.id}`, kind: 'video' as const, title: w.title, due: w.due_at, complete: w.complete, href: `/lessons/${w.slug}`, status: w.complete ? 'Submitted' : 'To do', action: w.complete ? 'View work' : 'Open homework', context: `Video ${w.sequence}` })) : []),
    ...(!readings.loading && !readings.error && !readings.data?.staff ? readings.data?.assignments ?? [] : []).filter(a => a.status === 'published' || ['submitted', 'rated'].includes(readingWork.get(a.id)?.state ?? '')).map(a => {
      const w = readingWork.get(a.id), complete = ['submitted', 'rated'].includes(w?.state ?? ''), course = readings.data?.courses.find(c => c.id === a.course_id)
      return { id: `reading:${a.id}`, kind: 'reading' as const, title: a.title, due: a.due_at, complete, href: `/readings/${a.id}`, returned: w?.state === 'returned', status: w?.state === 'returned' ? 'Revise & resubmit' : complete ? w?.state === 'rated' ? 'Feedback ready' : 'Submitted' : w ? 'In progress' : 'To do', action: complete ? 'View reading' : w?.state === 'returned' ? 'Revise reading' : w ? 'Continue reading' : 'Start reading', context: course ? [course.name, course.section].filter(Boolean).join(' · ') : undefined }
    }),
    ...(!quizzes.loading && !quizzes.error && !quizzes.data?.staff ? quizzes.data?.quizzes ?? [] : []).filter(q => q.status === 'published' || ['submitted', 'graded'].includes(quizWork.get(q.id)?.state ?? '')).map(q => {
      const w = quizWork.get(q.id), complete = ['submitted', 'graded'].includes(w?.state ?? ''), course = quizzes.data?.courses.find(c => c.id === q.course_id)
      return { id: `quiz:${q.id}`, kind: 'quiz' as const, title: q.title, due: q.due_at, complete, href: `/quizzes/${q.id}`, returned: w?.state === 'returned', status: w?.state === 'returned' ? 'Revise & resubmit' : complete ? w?.state === 'graded' ? 'Grade ready' : 'Submitted' : 'Needs completion', action: complete ? 'View quiz' : w?.state === 'returned' ? 'Revise quiz' : w ? 'Continue quiz' : 'Start quiz', context: course ? [course.name, course.section].filter(Boolean).join(' · ') : undefined }
    }),
    ...(vocabulary?.state === 'ready' ? vocabulary.assignments ?? [] : []),
  ]
  const ordered = prioritizeAssignments(items, now)
  const shown = ordered.filter(i => assignmentInView(i, view, now))
  const matches = ordered.filter(i => assignmentInView(i, managerView, now) && (kind === 'all' || kind === i.kind) && `${i.title} ${i.context ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()))
  const pages = Math.max(1, Math.ceil(matches.length / 5)), currentPage = Math.min(page, pages - 1)
  const checking = loading || readings.loading || quizzes.loading || !vocabulary || vocabulary.state === 'loading'
  const incomplete = error || !!readings.error || !!quizzes.error || vocabulary?.state === 'error'
  const manage = (nextView: AssignmentView = view) => { returnFocus.current = document.activeElement as HTMLElement | null; setManagerView(nextView); setKind('all'); setSearch(''); setPage(0); setOpen(true) }
  return <section className={styles.assignments} aria-labelledby="assigned-work-heading">
    <header className={styles.heading}><div><h2 id="assigned-work-heading" className="text-title-2">Your assignment dashboard</h2><p className={styles.muted}>See what needs your attention, then take it one assignment at a time.</p></div><Button onClick={() => manage()} className="min-h-11">Manage assignments<ArrowRight size={16} aria-hidden="true" /></Button></header>
    <div className={styles.summary} role="group" aria-label="Assignment views">{VIEWS.map(v => <button key={v.id} className={styles.metric} aria-pressed={v.id === view && v.id !== 'submitted'} onClick={() => v.id === 'submitted' ? manage('submitted') : setView(v.id)}><strong>{checking ? '—' : items.filter(i => assignmentInView(i, v.id, now)).length}</strong><span>{v.label}{incomplete && !checking ? ' · loaded work' : ''}</span></button>)}</div>
    {checking && <p className={styles.muted} role="status">Checking your assignments…</p>}
    {incomplete && <div className={styles.loadError} role="alert"><p>Some assignments couldn’t load. The list and counts may be incomplete.</p>{error && <Button variant="outline" onClick={onRetry}>Retry videos</Button>}{readings.error && <Button variant="outline" onClick={() => void readings.load()}>Retry readings</Button>}{quizzes.error && <Button variant="outline" onClick={() => void quizzes.load()}>Retry quizzes</Button>}{vocabulary?.state === 'error' && <Button asChild variant="outline"><Link href="/vocabulary/work">Check vocabulary assignments</Link></Button>}</div>}
    <div className={styles.queue}>
      <div className={styles.queueHeading}><h3>{view === 'overdue' ? 'Past-due assignments' : view === 'upcoming' ? 'Coming up in the next 7 days' : 'Next to do'}</h3><span className={styles.muted}>Past due first · then revisions and due dates</span></div>
      {shown.slice(0, 3).map(item => <AssignmentRow key={item.id} item={item} now={now} />)}
      {!shown.length && !checking && <p className={styles.empty}>{incomplete ? 'No matching work in the assignments that loaded.' : view === 'todo' ? 'You’re caught up on assigned work. Keep learning below or explore your growth.' : view === 'overdue' ? 'No past-due assignments.' : 'No assignments due in the next 7 days.'}</p>}
      <footer className={styles.footer}><span className={styles.muted}>{shown.length > 3 ? `${shown.length - 3} more in this view` : 'Submitted work is saved in Manage assignments.'}</span><Button variant="ghost" onClick={() => manage()} className="min-h-11">View all assignments<ArrowRight size={16} aria-hidden="true" /></Button></footer>
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className={styles.library} onCloseAutoFocus={event => { event.preventDefault(); returnFocus.current?.focus() }}>
      <DialogHeader><DialogTitle>Manage your assignments</DialogTitle><DialogDescription>Filter by type or status, check due dates, and open your work.</DialogDescription></DialogHeader>
      <div className={styles.filters}>
        <label>Status<select aria-label="Status" value={managerView} onChange={e => { setManagerView(e.target.value as AssignmentView); setPage(0) }}>{VIEWS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}</select></label>
        <label>Assignment type<select aria-label="Assignment type" value={kind} onChange={e => { setKind(e.target.value as AssignmentKind | 'all'); setPage(0) }}><option value="all">All types</option>{Object.entries(ASSIGNMENT_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label className={styles.search}>Search assignments<Input type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} placeholder="Title, class, or video number" /></label>
      </div>
      {(checking || incomplete) && <p role="status" className={styles.muted}>{checking ? 'Assignments are still loading.' : 'Some assignments are unavailable. Close this window to retry.'}</p>}
      <div className={styles.managerList}>{matches.slice(currentPage * 5, currentPage * 5 + 5).map(item => <AssignmentRow key={item.id} item={item} now={now} />)}{!matches.length && <p className={styles.empty}>{checking ? 'Checking for matching assignments…' : 'No assignments match these filters.'}</p>}</div>
      <div className={styles.pagination}><p role="status" className={styles.muted}>{matches.length ? `${currentPage * 5 + 1}–${Math.min(matches.length, currentPage * 5 + 5)} of ${matches.length}` : '0 assignments'}</p><div><Button variant="outline" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</Button><Button variant="outline" disabled={currentPage >= pages - 1} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div>
      <nav className={styles.destinations} aria-label="Assignment workspaces"><Link href="/lessons">All lessons</Link><Link href="/readings">All readings</Link><Link href="/quizzes">All quizzes & grades</Link><Link href="/vocabulary/work">All vocabulary</Link></nav>
    </DialogContent></Dialog>
  </section>
}
