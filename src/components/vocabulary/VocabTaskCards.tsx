'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import PracticeCompletionBadge from '@/components/PracticeCompletionBadge'
import type { quizSummary } from '@/lib/vocab-quiz'
import type { VocabTask } from '@/lib/vocab-learning'

type CardTask = VocabTask & { progress: { quiz?: ReturnType<typeof quizSummary>; covered: number; ready: number; total: number; complete: boolean; reviewDue: boolean }[] }
export interface VocabPracticeStatus {
  state: 'loading' | 'ready' | 'error'
  total: number
  completed: number
}

export default function VocabTaskCards({ onStatus, compact = false }: { onStatus?: (status: VocabPracticeStatus) => void; compact?: boolean } = {}) {
  const [tasks, setTasks] = useState<CardTask[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const onStatusRef = useRef(onStatus)
  useEffect(() => { onStatusRef.current = onStatus }, [onStatus])
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    onStatusRef.current?.({ state: 'loading', total: 0, completed: 0 })
    fetch('/api/vocab/tasks', { signal: controller.signal })
      .then(async r => {
        if (!r.ok) throw new Error('Vocabulary assignments could not load.')
        const data = await r.json()
        if (!Array.isArray(data.tasks)) throw new Error('Vocabulary assignments could not load.')
        return data.tasks as CardTask[]
      })
      .then(tasks => {
        if (!active) return
        setTasks(tasks)
        onStatusRef.current?.({ state: 'ready', total: tasks.length, completed: tasks.filter(t => (t.task_kind==='quiz'?t.progress[0]?.quiz?.submitted:t.progress[0]?.complete && !t.progress[0]?.reviewDue)).length })
      })
      .catch(() => {
        if (!active) return
        setError('Vocabulary assignments could not load.')
        onStatusRef.current?.({ state: 'error', total: 0, completed: 0 })
      })
      .finally(() => { clearTimeout(timeout); if (active) setLoading(false) })
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [])

  if (compact) return <Card density="compact">
    <h4 className="text-sm font-semibold">Vocabulary</h4>
    {loading ? <p role="status" className="text-sm text-muted-foreground">Checking assigned vocabulary…</p>
      : error ? <p role="alert" className="text-sm">{error} <Link className="inline-flex min-h-11 items-center text-primary underline" href="/vocabulary/work">Open vocabulary</Link></p>
      : !tasks.length ? <><p className="text-sm text-muted-foreground">No vocabulary assigned.</p><Link href="/vocabulary/work" className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium text-primary">Browse vocabulary<ArrowRight size={16} aria-hidden="true" /></Link></>
      : <ul className="divide-y divide-border">{tasks.map(t => {
        const p = t.progress[0]
        const done = t.task_kind === 'quiz' ? p?.quiz?.submitted : p?.complete && !p?.reviewDue
        const label = done ? 'Done' : p?.reviewDue ? 'Review due' : 'To do'
        const action = t.task_kind === 'quiz' ? done ? 'View quiz results' : 'Open quiz' : done ? 'Review words' : p?.reviewDue ? 'Review words' : 'Practice words'
        return <li key={t.id} className="py-2 first:pt-0 last:pb-0"><Link href={`/vocabulary/work?task_id=${t.id}`} className="block min-h-11 rounded-md py-1 hover:bg-secondary/50">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="min-w-0 break-words text-sm font-medium">{t.title}</span><PracticeCompletionBadge state={done ? 'done' : 'todo'} label={label} /></div>
          <p className="mt-1 text-xs text-muted-foreground">{t.task_kind === 'quiz' ? p?.quiz?.needsReview ? 'Awaiting teacher review' : p?.quiz?.submitted ? `Score: ${p.quiz.score}%` : 'One submission' : `${p?.ready ?? 0} of ${p?.total ?? t.term_ids.length} words ready`}{t.due_on ? ` · due ${t.due_on}` : ''}</p>
          <span className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary">{action}<ArrowRight size={16} aria-hidden="true" /></span>
        </Link></li>
      })}</ul>}
  </Card>

  if (error) return <p role="alert" className="text-sm text-destructive">{error} <Link className="inline-flex min-h-11 items-center underline" href="/vocabulary/work">Open vocabulary</Link></p>
  if (loading) return <p role="status" className="text-sm text-muted-foreground">Checking assigned vocabulary…</p>
  if (!tasks.length) return null
  const allDone = tasks.every(t => (t.task_kind==='quiz'?t.progress[0]?.quiz?.submitted:t.progress[0]?.complete && !t.progress[0]?.reviewDue))
  const reviewDue = tasks.some(t => t.progress[0]?.reviewDue)
  return <section className="rounded-xl border border-border p-4 space-y-3">
    <div className="flex items-start justify-between gap-3">
      <h2 className="min-w-0 font-bold">Assigned vocabulary</h2>
      <PracticeCompletionBadge state={allDone ? 'done' : 'todo'} label={allDone ? 'Done' : reviewDue ? 'Review due' : 'To do'} />
    </div>
    {tasks.map(t => {
      const p = t.progress[0]
      const done = t.task_kind==='quiz'?p?.quiz?.submitted:p?.complete && !p?.reviewDue
      return <Link key={t.id} href={`/vocabulary/work?task_id=${t.id}`} className="block rounded-lg border border-border p-3 min-h-11 hover:bg-muted">
        <div className="flex items-start justify-between gap-3"><strong className="min-w-0">{t.title}</strong>{tasks.length > 1 && <PracticeCompletionBadge state={done ? 'done' : 'todo'} label={done ? 'Done' : p?.reviewDue ? 'Review due' : 'To do'} />}</div>
        {t.task_kind==='quiz'?<p className="mt-2 text-sm">QUIZ · {p?.quiz?.needsReview?'Awaiting teacher review':p?.quiz?.submitted?`Score: ${p.quiz.score}%`:'One submission'}{t.due_on?` · due ${t.due_on}`:''}</p>:<p className="mt-2 text-sm text-muted-foreground">{p?.ready ?? 0}/{p?.total ?? t.term_ids.length} words ready · {p?.covered ?? 0} checked{t.due_on ? ` · due ${t.due_on}` : ''}</p>}
        <span className="text-sm">{t.task_kind==='quiz'?(done?'View quiz results':'Open quiz'):p?.reviewDue ? 'Time for a review' : p?.complete ? 'Requirement met · review again' : 'Practice and check words'}</span>
      </Link>
    })}
  </section>
}
