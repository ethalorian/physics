'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import VocabRatingFeedback, { type VocabularyRating } from './VocabRatingFeedback'
import PracticeCompletionBadge from '@/components/PracticeCompletionBadge'
import type { quizSummary } from '@/lib/vocab-quiz'
import type { VocabTask } from '@/lib/vocab-learning'
import { assignmentDueLabel, type StudentAssignment } from '@/lib/student-dashboard'

type CardTask = VocabTask & { progress: { masteryRating?: VocabularyRating | null; quiz?: ReturnType<typeof quizSummary>; completedChecks: number; covered: number; ready: number; total: number; complete: boolean; reviewDue: boolean }[] }
export interface VocabPracticeStatus {
  state: 'loading' | 'ready' | 'error'
  total: number
  completed: number
  assignments?: StudentAssignment[]
}

export default function VocabTaskCards({ onStatus, compact = false }: { onStatus?: (status: VocabPracticeStatus) => void; compact?: boolean } = {}) {
  const [tasks, setTasks] = useState<CardTask[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const onStatusRef = useRef(onStatus)
  useEffect(() => { onStatusRef.current = onStatus }, [onStatus])
  useEffect(() => {
    let active = true
    let controller: AbortController | undefined
    let timeout: ReturnType<typeof setTimeout> | undefined
    onStatusRef.current?.({ state: 'loading', total: 0, completed: 0 })
    const refresh = () => {
    controller?.abort()
    clearTimeout(timeout)
    const current = new AbortController()
    controller = current
    timeout = setTimeout(() => current.abort(), 15000)
    fetch('/api/vocab/tasks', { signal: current.signal, cache: 'no-store' })
      .then(async r => {
        if (!r.ok) throw new Error('Vocabulary assignments could not load.')
        const data = await r.json()
        if (!Array.isArray(data.tasks)) throw new Error('Vocabulary assignments could not load.')
        return (data.tasks as CardTask[]).filter(task => task.task_kind !== 'quiz')
      })
      .then(tasks => {
        if (!active || controller !== current) return
        setError('')
        setTasks(tasks)
        onStatusRef.current?.({ state: 'ready', total: tasks.length, completed: tasks.filter(t => (t.task_kind==='quiz'?t.progress[0]?.quiz?.submitted:t.progress[0]?.complete)).length, assignments: tasks.map(t => {
          const p = t.progress[0], complete = !!(t.task_kind === 'quiz' ? p?.quiz?.submitted : p?.complete)
          return { id: `vocabulary:${t.id}`, kind: 'vocabulary', title: t.title, href: `/vocabulary/work?task_id=${t.id}`, due: t.due_on ?? null, complete, status: complete ? t.task_kind === 'quiz' ? 'Submitted' : 'Done' : t.task_kind === 'quiz' ? 'Quiz · needs completion' : 'To do', action: t.task_kind === 'quiz' ? complete ? 'View quiz results' : 'Open quiz' : complete ? 'Review words' : 'Practice words' }
        }) })
      })
      .catch(() => {
        if (!active || controller !== current) return
        setError('Vocabulary assignments could not load.')
        onStatusRef.current?.({ state: 'error', total: 0, completed: 0 })
      })
      .finally(() => { if (active && controller === current) { clearTimeout(timeout); setLoading(false) } })
    }
    const visible = () => { if (document.visibilityState === 'visible') refresh() }
    refresh()
    window.addEventListener('focus', refresh)
    window.addEventListener('pageshow', refresh)
    document.addEventListener('visibilitychange', visible)
    return () => { active = false; clearTimeout(timeout); controller?.abort(); window.removeEventListener('focus', refresh); window.removeEventListener('pageshow', refresh); document.removeEventListener('visibilitychange', visible) }
  }, [])

  const pending = tasks.filter(t => !(t.task_kind === 'quiz' ? t.progress[0]?.quiz?.submitted : t.progress[0]?.complete))
  const nextTasks = [...(pending.length ? pending : tasks)].sort((a, b) => (a.due_on ?? '9999').localeCompare(b.due_on ?? '9999')).slice(0, 1)
  if (compact) return <Card density="compact">
    <h4 className="text-sm font-semibold">Vocabulary</h4>
    {loading ? <p role="status" className="text-sm text-muted-foreground">Checking assigned vocabulary…</p>
      : error ? <p role="alert" className="text-sm">{error} <Link className="inline-flex min-h-11 items-center text-primary underline" href="/vocabulary/work">Open vocabulary</Link></p>
      : !tasks.length ? <><p className="text-sm text-muted-foreground">No vocabulary assigned.</p><Link href="/vocabulary/work" className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium text-primary">Browse vocabulary<ArrowRight size={16} aria-hidden="true" /></Link></>
      : <><ul className="divide-y divide-border">{nextTasks.map(t => {
        const p = t.progress[0]
        const done = t.task_kind === 'quiz' ? p?.quiz?.submitted : p?.complete
        const label = done ? 'Done' : 'To do'
        const action = t.task_kind === 'quiz' ? done ? 'View quiz results' : 'Open quiz' : done ? 'Review words' : 'Practice words'
        return <li key={t.id} className="py-2 first:pt-0 last:pb-0"><Link href={`/vocabulary/work?task_id=${t.id}`} className="block min-h-11 rounded-md py-1 hover:bg-secondary/50">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="min-w-0 break-words text-sm font-medium">{t.title}</span><PracticeCompletionBadge state={done ? 'done' : 'todo'} label={label} /></div>
          <p className="mt-1 text-xs text-muted-foreground">{t.task_kind === 'quiz' ? p?.quiz?.needsReview ? 'Awaiting teacher review' : p?.quiz?.submitted ? `Score: ${p.quiz.score}%` : 'One submission' : `${p?.ready ?? 0} of ${p?.total ?? t.term_ids.length} words at goal`}{t.due_on ? ` · ${assignmentDueLabel(t.due_on)}` : ''}</p>
          <VocabRatingFeedback rating={p?.masteryRating}/><span className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary">{action}<ArrowRight size={16} aria-hidden="true" /></span>
        </Link></li>
      })}</ul>{pending.length > 1 && <p className="text-xs text-muted-foreground">{pending.length - 1} more vocabulary assignments to do</p>}<Link href="/vocabulary/work" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary">All vocabulary<ArrowRight size={16} aria-hidden="true" /></Link></>}
  </Card>

  if (error) return <p role="alert" className="text-sm text-destructive">{error} <Link className="inline-flex min-h-11 items-center underline" href="/vocabulary/work">Open vocabulary</Link></p>
  if (loading) return <p role="status" className="text-sm text-muted-foreground">Checking assigned vocabulary…</p>
  if (!tasks.length) return null
  const allDone = tasks.every(t => (t.task_kind==='quiz'?t.progress[0]?.quiz?.submitted:t.progress[0]?.complete))
  return <section className="rounded-xl border border-border p-4 space-y-3">
    <div className="flex items-start justify-between gap-3">
      <h2 className="min-w-0 font-bold">Assigned vocabulary</h2>
      <PracticeCompletionBadge state={allDone ? 'done' : 'todo'} label={allDone ? 'Done' : 'To do'} />
    </div>
    {tasks.map(t => {
      const p = t.progress[0]
      const done = t.task_kind==='quiz'?p?.quiz?.submitted:p?.complete
      return <Link key={t.id} href={`/vocabulary/work?task_id=${t.id}`} className="block rounded-lg border border-border p-3 min-h-11 hover:bg-muted">
        <div className="flex items-start justify-between gap-3"><strong className="min-w-0">{t.title}</strong>{tasks.length > 1 && <PracticeCompletionBadge state={done ? 'done' : 'todo'} label={done ? 'Done' : 'To do'} />}</div>
        {t.task_kind==='quiz'?<p className="mt-2 text-sm">QUIZ · {p?.quiz?.needsReview?'Awaiting teacher review':p?.quiz?.submitted?`Score: ${p.quiz.score}%`:'One submission'}{t.due_on?` · due ${t.due_on}`:''}</p>:<p className="mt-2 text-sm text-muted-foreground">{p?.completedChecks ?? 0} checks saved · {t.min_checks} required per word · {p?.ready ?? 0}/{p?.total ?? t.term_ids.length} words at goal{t.due_on ? ` · due ${t.due_on}` : ''}</p>}
        <VocabRatingFeedback rating={p?.masteryRating}/><span className="text-sm">{t.task_kind==='quiz'?(done?'View quiz results':'Open quiz'):p?.complete ? 'Requirement met · optional review' : 'Practice and check words'}</span>
      </Link>
    })}
  </section>
}
