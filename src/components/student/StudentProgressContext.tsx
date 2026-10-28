'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLearningResource } from '@/app/home/useLearningWeek'
import { currentGradingTerm } from '@/lib/grading-terms'
import { currentStudentRows, type StudentProgressData } from '@/lib/student-gradebook'

type ProgressContext = {
  data: StudentProgressData | null
  loading: boolean
  error: boolean
  refresh: () => void
  classId: string
  studentId: string
  termId: string
  now: number
  onClass: (id: string) => void
  onStudent: (id: string) => void
  onTerm: (id: string) => void
}

export const StudentProgressContext = createContext<ProgressContext | null>(null)

/** The banner and assignment record share one request and one grading scope. */
export function StudentProgressProvider({ children, classId, studentId, initialTerm }: {
  children: ReactNode
  classId?: string | null
  studentId?: string
  initialTerm?: string
}) {
  const [course, setCourse] = useState(classId ?? '')
  const [student, setStudent] = useState(studentId ?? '')
  const [termChoice, setTerm] = useState<string | null>(initialTerm ?? null)
  const [now, setNow] = useState(Date.now)
  const params = new URLSearchParams()
  if (course) params.set('class', course)
  if (student) params.set('student', student)
  const url = '/api/student-progress?' + params
  const resource = useLearningResource<StudentProgressData>(url)
  // A class/student switch must never display the previous learner's totals.
  const loaded = resource.dataUrl === url ? resource.data : null
  const data = loaded ? { ...loaded, rows: currentStudentRows(loaded.rows, new Date(now)) } : null
  const terms = data?.settings.terms ?? []
  const termId = termChoice === 'all' || termChoice === 'unassigned' || terms.some(term => term.id === termChoice)
    ? termChoice! : currentGradingTerm(terms)
  useEffect(() => {
    const update = () => setNow(Date.now())
    const timer = setInterval(update, 30000)
    window.addEventListener('focus', update)
    return () => { clearInterval(timer); window.removeEventListener('focus', update) }
  }, [])
  return <StudentProgressContext.Provider value={{
    data, loading: resource.loading || (!data && !resource.error), error: resource.error,
    refresh: resource.refresh, classId: course, studentId: student, termId, now,
    onClass: id => { setCourse(id); setStudent(''); setTerm(initialTerm ?? null) },
    onStudent: id => { setStudent(id); setTerm(initialTerm ?? null) },
    onTerm: setTerm,
  }}>{children}</StudentProgressContext.Provider>
}

export function useStudentProgress() {
  const context = useContext(StudentProgressContext)
  if (!context) throw new Error('Student progress requires its shared provider.')
  return context
}
