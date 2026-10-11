'use client'
import { useCallback, useEffect, useState } from 'react'
import type { ReadingList } from '@/lib/textbook-assignments'
import type { QuizList } from '@/lib/quizzes/types'
import type { VocabPracticeStatus } from '@/components/vocabulary/VocabTaskCards'
import type { MathCompetencyFocus, MathCompetencyRecord } from '@/data/curriculum-types'
import type { SpineCompetency } from '@/components/math-spine/MathSpineGrowth'
import type { LearningPace, LearningPlans } from '@/lib/learning-week'
import type { VideoHomework } from './AssignedWork'
import type { StudentAssignment } from '@/lib/student-dashboard'

export interface HomeData {
 student: { name: string }; program?: string; points: { xp: number; balance: number }; streak: { current: number }; homework?: VideoHomework[]
 continue: { unitId?: string; unitName: string | null; lesson: { slug: string; title: string; progress: number; lessonNumber?: number | null }; completed: number; total: number } | null
 retry: { targetId: string; statement: string; level: 1 | 2 }[]
}
export interface DailyData { item: { competencyId: string; competencyCode: string; competencyStatement: string } | null; alreadySubmitted?: boolean; snapshot?: { fluentCount: number; total: number }; dayCount?: number }
export interface GrowthData { competencies: SpineCompetency[]; records: MathCompetencyRecord[]; focus: MathCompetencyFocus[] }
interface VocabData { tasks: { id: string; title: string; created_at?: string; due_on?: string; task_kind?: string; progress: { complete?: boolean; quiz?: { submitted?: boolean } }[] }[] }

/** Refresh on return from actual assignment screens, with cancellation and explicit partial errors. */
export function useLearningResource<T>(url: string) {
 const [data, setData] = useState<T | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(false), [revision, setRevision] = useState(0)
 const refresh = useCallback(() => setRevision(n => n + 1), [])
 useEffect(() => {
  const controller = new AbortController(); let active = true
  const timeout = setTimeout(() => controller.abort(), 20000)
  setLoading(true); setError(false)
  fetch(url, { signal: controller.signal, cache: 'no-store' }).then(async r => { if (!r.ok) throw Error('unavailable'); return r.json() as Promise<T> }).then(value => { if (active) setData(value) }).catch(() => { if (active) setError(true) }).finally(() => { clearTimeout(timeout); if (active) setLoading(false) })
  return () => { active = false; clearTimeout(timeout); controller.abort() }
 }, [url, revision])
 useEffect(() => { const visible = () => { if (document.visibilityState === 'visible') refresh() }; window.addEventListener('focus', visible); window.addEventListener('pageshow', visible); document.addEventListener('visibilitychange', visible); return () => { window.removeEventListener('focus', visible); window.removeEventListener('pageshow', visible); document.removeEventListener('visibilitychange', visible) } }, [refresh])
 return { data, loading, error, refresh, setData }
}
export function useLearningWeek() {
 const home = useLearningResource<HomeData>('/api/home')
 const readings = useLearningResource<ReadingList>('/api/readings')
 const quizzes = useLearningResource<QuizList>('/api/quizzes')
 const vocab = useLearningResource<VocabData>('/api/vocab/tasks')
 const math = useLearningResource<DailyData>('/api/math-spine/daily')
 const pace = useLearningResource<LearningPace>('/api/home/pace')
 const plan = useLearningResource<{ plans: LearningPlans }>('/api/home/plan')
 const growth = useLearningResource<GrowthData>('/api/math-spine/dashboard')
 const loading = home.loading, error = home.error, homework = home.data?.homework ?? []
 const vocabulary: VocabPracticeStatus = { state: vocab.error ? 'error' : vocab.loading ? 'loading' : 'ready', total: vocab.data?.tasks?.length ?? 0, completed: 0, assignments: (vocab.data?.tasks ?? []).map(t => {
  const p = t.progress[0], complete = !!(t.task_kind === 'quiz' ? p?.quiz?.submitted : p?.complete)
  return { id: 'vocabulary:' + t.id, kind: 'vocabulary' as const, title: t.title, assignedAt: t.created_at, href: '/vocabulary/work?task_id=' + t.id, due: t.due_on ?? null, complete, status: complete ? t.task_kind === 'quiz' ? 'Submitted' : 'Done' : t.task_kind === 'quiz' ? 'Quiz · needs completion' : 'To do', action: t.task_kind === 'quiz' ? complete ? 'View quiz results' : 'Open quiz' : complete ? 'Review words' : 'Practice words' }
 }) }
  const readingWork = new Map(readings.data?.work.map(w => [w.assignment_id, w]))
  const quizWork = new Map(quizzes.data?.work.map(w => [w.quiz_id, w]))
  const items: StudentAssignment[] = [
    ...(!loading && !error ? [...homework].sort((a, b) => a.sequence - b.sequence).map(w => ({ id: `video:${w.id}`, kind: 'video' as const, title: w.title, due: w.due_at, complete: w.complete, href: `/lessons/${w.slug}`, status: w.complete ? 'Submitted' : 'To do', action: w.complete ? 'View work' : 'Open homework', context: `Video ${w.sequence}` })) : []),
    ...(!readings.loading && !readings.error && !readings.data?.staff ? readings.data?.assignments ?? [] : []).filter(a => a.status === 'published' || ['submitted', 'rated'].includes(readingWork.get(a.id)?.state ?? '')).map(a => {
      const w = readingWork.get(a.id), complete = ['submitted', 'rated'].includes(w?.state ?? ''), course = readings.data?.courses.find(c => c.id === a.course_id)
      return { id: `reading:${a.id}`, kind: 'reading' as const, title: a.title, assignedAt: a.created_at, due: a.due_at, complete, href: `/readings/${a.id}`, returned: w?.state === 'returned', status: w?.state === 'returned' ? 'Revise & resubmit' : complete ? w?.state === 'rated' ? 'Feedback ready' : 'Submitted' : w ? 'In progress' : 'To do', action: complete ? 'View reading' : w?.state === 'returned' ? 'Revise reading' : w ? 'Continue reading' : 'Start reading', context: course ? [course.name, course.section].filter(Boolean).join(' · ') : undefined }
    }),
    ...(!quizzes.loading && !quizzes.error && !quizzes.data?.staff ? quizzes.data?.quizzes ?? [] : []).filter(q => q.status === 'published' || ['submitted', 'graded'].includes(quizWork.get(q.id)?.state ?? '')).map(q => {
      const w = quizWork.get(q.id), complete = ['submitted', 'graded'].includes(w?.state ?? ''), course = quizzes.data?.courses.find(c => c.id === q.course_id)
      return { id: `quiz:${q.id}`, kind: 'quiz' as const, title: q.title, assignedAt: q.created_at, due: q.due_at, complete, href: `/quizzes/${q.id}`, returned: w?.state === 'returned', status: w?.state === 'returned' ? 'Revise & resubmit' : complete ? w?.state === 'graded' ? 'Grade ready' : 'Submitted' : 'Needs completion', action: complete ? 'View quiz' : w?.state === 'returned' ? 'Revise quiz' : w ? 'Continue quiz' : 'Start quiz', context: course ? [course.name, course.section].filter(Boolean).join(' · ') : undefined }
    }),
    ...(!quizzes.loading && !quizzes.error && !quizzes.data?.staff ? quizzes.data?.locked ?? [] : []).map(q => ({ id: 'quiz:' + q.id, kind: 'quiz' as const, title: q.title, assignedAt: q.created_at, due: q.due_at, complete: false, status: 'Complete reading first', action: 'Open required reading', href: '/readings/' + q.reading_id, context: 'Unlocks after: ' + q.reading_title })),
    ...(vocabulary?.state === 'ready' ? vocabulary.assignments ?? [] : []),
  ]

 const sources = [{ name: 'lessons', ...home }, { name: 'readings', ...readings }, { name: 'quizzes', ...quizzes }, { name: 'vocabulary', ...vocab }]
 const refresh = () => { home.refresh(); readings.refresh(); quizzes.refresh(); vocab.refresh(); math.refresh(); pace.refresh(); plan.refresh(); growth.refresh() }
 return { home, readings, quizzes, vocab, math, pace, plan, growth, items, sources, refresh }
}
