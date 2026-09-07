'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { VocabTask, summarizeWords } from '@/lib/vocab-learning'

type Progress = ReturnType<typeof summarizeWords> & { studentId: string; name: string }
interface Props {
  tasks: (VocabTask & { progress: Progress[] })[]
  courses: { id: string; name: string; section: string | null }[]
  targets: { id: string; slug: string; statement: string }[]
  onOpen: (id: string) => void
  onAssign: () => void
}

export default function VocabProgressGrid({ tasks, courses, targets, onOpen, onAssign }: Props) {
  const [courseId, setCourseId] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const visible = tasks.filter(t => (!courseId || t.course_id === courseId) && (includeArchived || t.active))
  const students = [...new Map(visible.flatMap(t => t.progress.map(p => [p.studentId, p] as const))).values()]
    .sort((a, b) => a.name.localeCompare(b.name))

  return <Card>
    <CardHeader><CardTitle>Class vocabulary tracker</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">Students down the side, assigned tasks across the top. Open a task to see accuracy and evidence for each word, or assign follow-up practice.</p>
      <div className="flex flex-wrap items-center gap-4">
        <label>Class <select aria-label="Tracker class" className="min-h-11 rounded-lg border border-border bg-background px-3" value={courseId} onChange={e => setCourseId(e.target.value)}>
          <option value="">All my classes</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
        </select></label>
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={includeArchived} onChange={e => setIncludeArchived(e.target.checked)} />Include archived tasks</label>
      </div>
      {!visible.length ? <div className="space-y-3 rounded-lg bg-muted p-5">
        <p className="font-semibold">No vocabulary tasks assigned{courseId ? ' to this class' : ''} yet.</p>
        <p className="text-sm">Choose your word set, select students, and assign a word check. Their results will appear here automatically.</p>
        <Button className="min-h-11" onClick={onAssign}>Assign vocabulary</Button>
      </div> : <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Vocabulary task progress by student. A dash means the task was not assigned to that student.</caption>
          <thead><tr><th scope="col" className="p-3">Student</th>{visible.map(t => {
            const target = targets.find(target => target.id === t.target_id)
            const course = courses.find(c => c.id === t.course_id)
            return <th scope="col" key={t.id} className="min-w-48 p-3 align-top">
              <Button variant="link" className="min-h-11 h-auto whitespace-normal p-0 text-left" onClick={() => onOpen(t.id)}>{t.title}</Button>
              <p className="font-normal text-muted-foreground">{course?.name} {course?.section}{!t.active ? ' · Archived' : ''}</p>
              <p className="font-normal text-muted-foreground">{target ? `${target.slug} · ${target.statement}` : 'Vocabulary goal'}</p>
              <p className="font-normal">{t.progress.filter(p => p.complete).length}/{t.progress.length} students met goal{t.due_on ? ` · Due ${t.due_on}` : ''}</p>
            </th>
          })}</tr></thead>
          <tbody>{students.map(student => <tr key={student.studentId} className="border-t border-border">
            <th scope="row" className="p-3 font-medium">{student.name}</th>
            {visible.map(t => {
              const p = t.progress.find(p => p.studentId === student.studentId)
              if (!p) return <td key={t.id} className="p-3 text-muted-foreground"><span aria-label="Not assigned">—</span></td>
              const status = p.reviewDue ? 'Review due' : p.complete ? 'Goal met' : p.covered ? 'In progress' : 'Not started'
              return <td key={t.id} className="p-3">
                <Button variant="ghost" className="h-auto min-h-11 flex-col items-start whitespace-normal text-left" onClick={() => onOpen(t.id)} aria-label={`${student.name}, ${t.title}: ${status}. Open report`}>
                  <span className={p.complete && !p.reviewDue ? 'text-success' : ''}>{status}</span>
                  <span className="font-normal">{p.ready}/{p.total} words ready · {p.accuracy === null ? 'No checks yet' : `${p.accuracy}% accuracy`}</span>
                </Button>
              </td>
            })}
          </tr>)}</tbody>
        </table>
      </div>}
      <p className="text-sm text-muted-foreground">Goal met means every word meets the task’s accuracy and check requirements. Physics mastery stays teacher-rated.</p>
    </CardContent>
  </Card>
}
