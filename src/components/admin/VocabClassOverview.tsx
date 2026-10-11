'use client'

import { useState } from 'react'
import type { VocabMasteryData } from '@/lib/vocab-mastery'
import { matchesVocabOverviewFilter, vocabularyAssignmentCell, vocabularyOverviewRows, vocabularyWordCell, type VocabOverviewFilter } from '@/lib/vocab-overview'
import styles from './VocabClassOverview.module.css'

interface Props {
  data: VocabMasteryData
  nameFilter: string
  taskId: string
  disabled: boolean
  onTaskChange: (taskId: string) => void
  onOpen: (taskId: string, studentId: string) => void
}

export default function VocabClassOverview({ data, nameFilter, taskId, disabled, onTaskChange, onOpen }: Props) {
  const [view, setView] = useState<'assignments' | 'words'>('assignments')
  const [filter, setFilter] = useState<VocabOverviewFilter>('all')
  const [sort, setSort] = useState('name')
  const task = data.tasks.find(t => t.id === taskId) ?? data.tasks[0]
  const tasks = view === 'words' && task ? [task] : data.tasks
  const allRows = vocabularyOverviewRows(data, tasks).filter(s => s.name.toLowerCase().includes(nameFilter.trim().toLowerCase()))
  const rows = allRows.filter(s => matchesVocabOverviewFilter(s, filter)).sort((a, b) =>
    (sort === 'review' ? b.toReview - a.toReview || b.needPractice - a.needPractice :
      sort === 'practice' ? b.needPractice - a.needPractice : 0) || a.name.localeCompare(b.name))
  const stats: { label: string; filter: VocabOverviewFilter; value: number }[] = [
    { label: 'Students', filter: 'all', value: allRows.length },
    { label: 'Awaiting your review', filter: 'review', value: allRows.filter(s => s.toReview > 0).length },
    { label: 'Need practice', filter: 'practice', value: allRows.filter(s => s.needPractice > 0).length },
    { label: 'Fully rated', filter: 'rated', value: allRows.filter(s => s.fullyRated).length },
  ]

  return <section className={styles.overview} aria-label="Vocabulary class overview">
    <div className={styles.stats}>{stats.map(stat => <button key={stat.filter} className={styles.stat} disabled={disabled} aria-pressed={filter === stat.filter} onClick={() => setFilter(stat.filter)}><strong>{stat.value}</strong><span>{stat.label}</span></button>)}</div>
    <div className={styles.controls}>
      <div className={styles.switcher} role="group" aria-label="Vocabulary grid view">{(['assignments', 'words'] as const).map(v => <button key={v} disabled={disabled} aria-pressed={view === v} onClick={() => setView(v)}>{v === 'assignments' ? 'By assignment' : 'By word'}</button>)}</div>
      {view === 'words' && <label className={styles.assignment}>Assignment<select aria-label="Word grid assignment" disabled={disabled} value={task?.id ?? ''} onChange={e => onTaskChange(e.target.value)}>{data.tasks.map(t => <option key={t.id} value={t.id}>{t.title} · {t.courseLabel}{!t.active ? ' · Archived' : ''}</option>)}</select></label>}
      <label>Show<select aria-label="Vocabulary overview filter" disabled={disabled} value={filter} onChange={e => setFilter(e.target.value as VocabOverviewFilter)}><option value="all">Everyone</option><option value="review">Awaiting your review</option><option value="practice">Need practice</option><option value="no-checks">No completed checks</option><option value="rated">Fully rated</option><option value="unassigned">Not assigned</option></select></label>
      <label>Sort<select aria-label="Vocabulary overview sort" disabled={disabled} value={sort} onChange={e => setSort(e.target.value)}><option value="name">Student name</option><option value="review">Review first</option><option value="practice">Practice first</option></select></label>
    </div>
    <div className={styles.gridHeading}><div><h3>{view === 'assignments' ? 'Class vocabulary progress' : 'Word-by-word progress'}</h3><p>{view === 'assignments' ? 'Your latest 1–3 rating on each assignment, alongside practice progress. Select a cell to review & rate.' : `Practice evidence for ${task?.title ?? 'this assignment'}. Goal: ${task?.threshold ?? 80}% across ${task?.min_checks ?? 2} checks per word. Select a cell to open the student’s evidence.`}</p></div><span>{rows.length} / {allRows.length} students</span></div>
    <p className={styles.key}>{view === 'assignments' ? '1 · Not yet   /   2 · Almost   /   3 · Got it. “Ready to rate” means evidence is waiting for your judgment.' : 'Percentages show check accuracy, not a Knowledge grade. “Not checked” means there is no scored evidence.'} Counts can overlap: a student may need both review and more practice.</p>
    {!!rows.length ? <div className={styles.scroll} role="region" aria-label="Scrollable vocabulary progress grid" tabIndex={0}><table className={styles.table}>
      <caption className="sr-only">{view === 'assignments' ? 'Students by vocabulary assignment: teacher rating and practice progress' : 'Students by vocabulary word: check accuracy and practice goal'}</caption>
      <thead><tr><th scope="col" className={styles.name}>Student</th>{view === 'assignments' ? tasks.map(t => <th scope="col" key={t.id}><strong>{t.title}</strong><span>{t.courseLabel}{!t.active ? ' · Archived' : ''}</span><small>{t.progress.filter(s => s.status === 'rated').length}/{t.progress.length} rated{!t.target_id ? ' · Link target' : ''}</small></th>) : task?.words.map(w => <th scope="col" key={w.id}><strong>{w.term}</strong><small>{task.progress.filter(s => s.words.some(x => x.id === w.id && x.ready && !x.reviewDue)).length}/{task.progress.length} at goal</small></th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.studentId}><th scope="row" className={styles.name}><strong>{row.name}</strong><small>{row.assigned ? `${row.rated}/${row.assigned} assignments rated` : 'No assignment in this view'}</small></th>{view === 'assignments' ? row.cells.map(({ task: t, progress }) => {
        if (!progress) return <td key={t.id}><span className={styles.unassigned} aria-label={`${row.name} · ${t.title} · Not assigned`}>—<small>Not assigned</small></span></td>
        const cell = vocabularyAssignmentCell(progress)
        return <td key={t.id}><button className={styles.cell} data-tone={cell.tone} disabled={disabled} aria-label={`${row.name} · ${t.title} · ${cell.label} · ${cell.detail}`} onClick={() => onOpen(t.id, row.studentId)}><strong>{cell.label}</strong><span>{cell.detail}</span>{!t.target_id && <small>Link Knowledge target</small>}</button></td>
      }) : task?.words.map(word => {
        const progress = row.cells[0]?.progress
        if (!progress) return <td key={word.id}><span className={styles.unassigned}>—<small>Not assigned</small></span></td>
        const cell = vocabularyWordCell(progress, word.id)
        return <td key={word.id}><button className={styles.cell} data-tone={cell.tone} disabled={disabled} aria-label={`${row.name} · ${word.term} · ${cell.label} · ${cell.detail}`} onClick={() => onOpen(task.id, row.studentId)}><strong>{cell.label}</strong><span>{cell.detail}</span></button></td>
      })}</tr>)}</tbody>
    </table></div> : <p className={styles.empty} role="status">No students match this view. Change the student search or choose Everyone.</p>}
  </section>
}
