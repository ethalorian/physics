'use client'
import {assignmentMetadata} from '@/lib/interactive-assignments/metadata'
import { useCallback, useEffect, useRef, useState } from 'react'
import { subscribePageReturn } from '@/lib/page-return'
import type { ReadingList } from '@/lib/textbook-assignments'
import type { QuizList } from '@/lib/quizzes/types'
import { PAPER_LABELS, type WorksheetList } from '@/lib/worksheet-assignments'
import type { VocabPracticeStatus } from '@/components/vocabulary/VocabTaskCards'
import type { MathCompetencyFocus, MathCompetencyRecord } from '@/data/curriculum-types'
import type { SpineCompetency } from '@/components/math-spine/MathSpineGrowth'
import type { LearningPace } from '@/lib/learning-week'
import type { VideoHomework } from './AssignedWork'
import { assignmentCalendarDate, assignmentDeadline, type StudentAssignment } from '@/lib/student-dashboard'

export interface HomeData {
 student: { name: string }; program?: string; points: { xp: number; balance: number }; streak: { current: number }; homework?: VideoHomework[]; lessonAssignments?: StudentAssignment[]
 continue: { unitId?: string; unitName: string | null; lesson: { slug: string; title: string; progress: number; lessonNumber?: number | null }; completed: number; total: number } | null
 retry: { targetId: string; statement: string; level: 1 | 2 }[]
}
export interface DailyData { item: { competencyId: string; competencyCode: string; competencyStatement: string } | null; warmupScheduled?: boolean; scheduledDays?: string[]; alreadySubmitted?: boolean; snapshot?: { fluentCount: number; total: number }; dayCount?: number }
export interface GrowthData { competencies: SpineCompetency[]; records: MathCompetencyRecord[]; focus: MathCompetencyFocus[] }
interface VocabData { tasks: { id: string; title: string; created_at?: string; due_on?: string; task_kind?: string; progress: { complete?: boolean; quiz?: { submitted?: boolean } }[] }[] }

/** Refresh on return from actual assignment screens, with cancellation and explicit partial errors. */
export function useLearningResource<T>(url: string) {
 const [data, setData] = useState<T | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(false), [revision, setRevision] = useState(0)
 const [dataUrl, setDataUrl] = useState<string | null>(null)
 const pending = useRef(false)
 const refresh = useCallback(() => setRevision(n => n + 1), [])
 useEffect(() => {
  const controller = new AbortController(); let active = true
  pending.current = true
  const timeout = setTimeout(() => controller.abort(), 20000)
  setLoading(true); setError(false)
  fetch(url, { signal: controller.signal, cache: 'no-store' }).then(async r => { if (!r.ok) throw Error('unavailable'); return r.json() as Promise<T> }).then(value => { if (active) { setData(value); setDataUrl(url) } }).catch(() => { if (active) setError(true) }).finally(() => { clearTimeout(timeout); if (active) { pending.current = false; setLoading(false) } })
  return () => { active = false; pending.current = false; clearTimeout(timeout); controller.abort() }
 }, [url, revision])
 useEffect(() => subscribePageReturn(() => { if (!pending.current) refresh() }), [refresh])
 return { data, dataUrl, loading, error, refresh, setData }
}
export function useLearningWeek() {
 const home = useLearningResource<HomeData>('/api/home')
 const reviews = useLearningResource<{staff:boolean;assignments:{slug:string;title:string;created_at:string;due_on:string|null;closes_at:string|null;status:string;unlocked:boolean}[]}>('/api/review-modules')
 const interactive = useLearningResource<{staff:boolean;assignments:{id:string;slug:string;created_at:string;due_on:string|null;prerequisites?:{id:string;title:string}[]}[];work:{assignment_id:string;status:string}[];submissions:{id:string;assignment_id:string}[];reviews:{submission_id:string}[]}>('/api/interactive-assignments')
 const readings = useLearningResource<ReadingList>('/api/readings')
 const quizzes = useLearningResource<QuizList>('/api/quizzes')
 const worksheets = useLearningResource<WorksheetList>('/api/worksheet-assignments')
 const vocab = useLearningResource<VocabData>('/api/vocab/tasks?view=summary')
 const math = useLearningResource<DailyData>('/api/math-spine/daily')
 const pace = useLearningResource<LearningPace>('/api/home/pace')
 const growth = useLearningResource<GrowthData>('/api/math-spine/dashboard')
 const loading = home.loading, error = home.error, homework = home.data?.homework ?? []
 const vocabulary: VocabPracticeStatus = { state: vocab.error ? 'error' : vocab.loading ? 'loading' : 'ready', total: vocab.data?.tasks?.length ?? 0, completed: 0, assignments: (vocab.data?.tasks ?? []).filter(t => t.task_kind !== 'quiz').map(t => {
  const p = t.progress[0], complete = !!(t.task_kind === 'quiz' ? p?.quiz?.submitted : p?.complete)
  return { id: 'vocabulary:' + t.id, kind: 'vocabulary' as const, quizSchedule: t.task_kind === 'quiz' ? 'vocabulary' as const : undefined, title: t.title, assignedAt: t.created_at, href: '/vocabulary/work?task_id=' + t.id, due: t.due_on ?? null, complete, status: complete ? t.task_kind === 'quiz' ? 'Submitted' : 'Done' : t.task_kind === 'quiz' ? 'Quiz · needs completion' : 'To do', action: t.task_kind === 'quiz' ? complete ? 'View quiz results' : 'Open quiz' : complete ? 'Review words' : 'Practice words' }
 }) }
  const readingWork = new Map(readings.data?.work.map(w => [w.assignment_id, w]))
  const quizWork = new Map(quizzes.data?.work.map(w => [w.quiz_id, w]))
  const items: StudentAssignment[] = [
    ...(!worksheets.loading&&!worksheets.error&&!worksheets.data?.staff?worksheets.data?.assignments??[]:[]).map(a=>{const r=worksheets.data?.receipts.find(r=>r.assignment_id===a.id);return {id:'worksheet:'+a.id,kind:'worksheet' as const,activityType:'worksheet' as const,courseDay:a.day,title:a.title,due:a.due_at,assignedAt:a.created_at,href:'/worksheet-assignments/'+a.id,complete:r?.state==='received'||r?.state==='excused',status:PAPER_LABELS[r?.state??'not_received'],action:'Open paper worksheet',context:'Paper hand-in · Linked online quiz has its own due date'}}),
    ...(!interactive.loading && !interactive.error && !interactive.data?.staff ? interactive.data?.assignments ?? [] : []).map(a=>{const w=interactive.data?.work.find(w=>w.assignment_id===a.id),sub=interactive.data?.submissions.find(x=>x.assignment_id===a.id),rated=interactive.data?.reviews.some(r=>r.submission_id===sub?.id),complete=w?.status==='submitted';return {id:'interactive:'+a.id,kind:'review' as const,activityType:assignmentMetadata(a.slug)?.activityType??'daily-review',courseDay:assignmentMetadata(a.slug)?.day,topicTitle:assignmentMetadata(a.slug)?.topicTitle,focusQuestion:assignmentMetadata(a.slug)?.focusQuestion,prerequisiteText:a.prerequisites?.length?'Submit '+a.prerequisites.map(p=>p.title).join(' and ')+' first.':undefined,title:(assignmentMetadata(a.slug)?.title??'Interactive assignment'),assignedAt:a.created_at,due:a.due_on??null,complete,href:'/interactive-assignments/'+a.id,returned:!!sub&&!complete,status:a.prerequisites?.length?'Locked · finish foundation':complete?rated?'Feedback ready':'Submitted':sub?'Revise & resubmit':w?'In progress':'To do',action:a.prerequisites?.length?'View prerequisite':complete?'View assignment':'Open assignment',context:a.prerequisites?.length?'Unlocks after: '+a.prerequisites[0].title:'Unit 1 · Course day '+(assignmentMetadata(a.slug)?.day??'')}}),
    ...(!reviews.loading && !reviews.error && !reviews.data?.staff ? reviews.data?.assignments ?? [] : []).map(a=>({id:'review:'+a.slug,kind:'review' as const,title:a.title,assignedAt:a.created_at,due:a.due_on,closesAt:a.closes_at,complete:a.status==='submitted',href:'/review/'+a.slug,status:a.status==='submitted'?'Submitted':a.unlocked?'In progress':'Teacher code required',action:a.status==='submitted'?'View review':a.unlocked?'Continue review':'Open review'})),
    ...(!loading && !error ? home.data?.lessonAssignments ?? [...homework].sort((a, b) => a.sequence - b.sequence).map(w => ({ id: `video:${w.id}`, kind: 'video' as const, title: w.title, due: w.due_at, complete: w.complete, href: `/lessons/${w.slug}`, status: w.complete ? 'Submitted' : 'To do', action: w.complete ? 'View work' : 'Open homework', context: `Video ${w.sequence}` })) : []),
    ...(!readings.loading && !readings.error && !readings.data?.staff ? readings.data?.assignments ?? [] : []).filter(a => a.status === 'published' || ['submitted', 'rated'].includes(readingWork.get(a.id)?.state ?? '')).map(a => {
      const w = readingWork.get(a.id), complete = ['submitted', 'rated'].includes(w?.state ?? ''), course = readings.data?.courses.find(c => c.id === a.course_id)
      return { id: `reading:${a.id}`, kind: 'reading' as const, title: a.title, assignedAt: a.created_at, due: a.due_at, complete, href: `/readings/${a.id}`, returned: w?.state === 'returned', status: w?.state === 'returned' ? 'Revise & resubmit' : complete ? w?.state === 'rated' ? 'Feedback ready' : 'Submitted' : w ? 'In progress' : 'To do', action: complete ? 'View reading' : w?.state === 'returned' ? 'Revise reading' : w ? 'Continue reading' : 'Start reading', context: course ? [course.name, course.section].filter(Boolean).join(' · ') : undefined }
    }),
    ...(!quizzes.loading && !quizzes.error && !quizzes.data?.staff ? quizzes.data?.quizzes ?? [] : []).filter(q => q.status === 'published' || ['submitted', 'graded'].includes(quizWork.get(q.id)?.state ?? '')).map(q => {
      const w = quizWork.get(q.id), complete = ['submitted', 'graded'].includes(w?.state ?? ''), course = quizzes.data?.courses.find(c => c.id === q.course_id)
      return { id: `quiz:${q.id}`, kind: 'quiz' as const, activityType: worksheets.data?.assignments.some(a=>a.quiz_id===q.id)?'worksheet-quiz' as const:undefined, quizSchedule: q.daily_sequence_key ? 'daily' as const : q.kind === 'vocabulary' ? 'vocabulary' as const : 'regular' as const, title: q.title, assignedAt: q.created_at, due: q.due_at, complete, href: `/quizzes/${q.id}`, returned: w?.state === 'returned', status: w?.state === 'returned' ? 'Revise & resubmit' : complete ? w?.state === 'graded' ? 'Grade ready' : 'Submitted' : 'Needs completion', action: complete ? 'View quiz' : w?.state === 'returned' ? 'Revise quiz' : w ? 'Continue quiz' : 'Start quiz', context: course ? [course.name, course.section].filter(Boolean).join(' · ') : undefined }
    }),
    ...(!quizzes.loading && !quizzes.error && !quizzes.data?.staff ? quizzes.data?.locked ?? [] : []).map(q => ({ id: 'quiz:' + q.id, kind: 'quiz' as const, quizSchedule: q.daily_sequence_key ? 'daily' as const : q.kind === 'vocabulary' ? 'vocabulary' as const : 'regular' as const, title: q.title, assignedAt: q.created_at, due: q.due_at, complete: false, prerequisiteText: q.prerequisites ? 'Submit '+q.prerequisites.map(p=>p.title).join(' and ')+' first.' : 'Complete '+q.reading_title+' first.', status: q.prerequisites ? 'Complete foundation and review first' : 'Complete reading first', action: q.prerequisites ? 'Open required assignment' : 'Open required reading', href: q.prerequisites ? '/interactive-assignments/' + q.prerequisites[0].id : '/readings/' + q.reading_id, context: 'Unlocks after: ' + (q.prerequisites ? q.prerequisites.map(p=>p.title).join(' and ') : q.reading_title) })),
    ...(vocabulary?.state === 'ready' ? vocabulary.assignments ?? [] : []),
  ]

 const sources = [{name:'worksheets',...worksheets},{ name: 'interactive assignments', ...interactive }, { name: 'reviews', ...reviews }, { name: 'lessons', ...home }, { name: 'readings', ...readings }, { name: 'quizzes', ...quizzes }, { name: 'vocabulary', ...vocab }]
 const refresh = () => { worksheets.refresh(); home.refresh(); interactive.refresh(); reviews.refresh(); readings.refresh(); quizzes.refresh(); vocab.refresh(); math.refresh(); pace.refresh(); growth.refresh() }
 return { home, readings, quizzes, vocab, math, pace, growth, items: items.filter(item => Number.isFinite(assignmentDeadline(assignmentCalendarDate(item)))), sources, refresh }
}
