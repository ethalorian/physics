'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { teachingHref } from '@/lib/teaching-navigation'
import styles from '@/app/admin/students/students.module.css'

type Student = { id: string; name: string; lastActive: string | null; idleDays: number | null; lessonsDone: number; xpWeek: number; pending: number }
type Report = { students: Student[]; summary: { total: number; activeThisWeek: number } }
export default function TeacherActivity({ classId, initialStudentId = '' }: { classId: string; initialStudentId?: string }) {
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(initialStudentId)
  useEffect(() => {
    const controller = new AbortController()
    setError(''); setReport(null)
    fetch('/api/teacher/cockpit/roster?class=' + encodeURIComponent(classId), { signal: controller.signal }).then(async response => {
      const data = await response.json()
      if (!response.ok) throw Error(data.error || 'Student activity could not load.')
      setReport(data)
    }).catch(e => { if (!controller.signal.aborted) setError(e.message) })
    return () => controller.abort()
  }, [classId, revision])
  if (error) return <p role="alert">{error} <button className="underline" onClick={() => setRevision(n => n + 1)}>Retry activity</button></p>
  if (!report) return <p role="status">Loading student activity…</p>
  const students = report.students.filter(student => (!selectedStudent || student.id === selectedStudent) && student.name.toLowerCase().includes(search.toLowerCase()))
  return <section aria-label="Student participation">
    <div className={styles.summary}><span><strong>{report.summary.total}</strong> students</span><span><strong>{report.summary.activeThisWeek}</strong> active this week</span><Link className="text-primary" href={teachingHref('results', classId)}>Review student work →</Link></div>
    {selectedStudent && <p className="mb-4">Showing the selected student. <button className="text-primary underline" onClick={() => setSelectedStudent('')}>Show the class</button></p>}
    <label className="mb-5 block text-sm">Find a student<input type="search" value={search} onChange={e => setSearch(e.target.value)} className="mt-2 block w-full max-w-sm rounded-lg border bg-background p-3" placeholder="Search names…" /></label>
    <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th scope="col">Student</th><th scope="col">Last active</th><th scope="col">Lessons visited</th><th scope="col">Math XP this week</th><th scope="col">Math reviews waiting</th><th scope="col">Student work</th></tr></thead><tbody>{students.map(student => <tr key={student.id}><td>{student.name}</td><td>{student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'No activity yet'}</td><td>{student.lessonsDone}</td><td>{student.xpWeek}</td><td>{student.pending}</td><td><Link aria-label={`Review work for ${student.name}`} href={teachingHref('results', classId) + '&resultStudent=' + encodeURIComponent(student.id)}>Review work →</Link></td></tr>)}</tbody></table></div>
    {!students.length && <p className="py-6 text-muted-foreground">{search ? 'No students match this search.' : 'No active students in this class yet.'}</p>}
  </section>
}
