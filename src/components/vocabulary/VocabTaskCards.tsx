'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import PracticeCompletionBadge from '@/components/PracticeCompletionBadge'
import type { VocabTask } from '@/lib/vocab-learning'

type CardTask = VocabTask & { progress: { covered: number; ready: number; total: number; complete: boolean; reviewDue: boolean }[] }
export interface VocabPracticeStatus {
  state: 'loading' | 'ready' | 'error'
  total: number
  completed: number
}

export default function VocabTaskCards({ onStatus }: { onStatus?: (status: VocabPracticeStatus) => void } = {}) {
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
        onStatusRef.current?.({ state: 'ready', total: tasks.length, completed: tasks.filter(t => t.progress[0]?.complete && !t.progress[0]?.reviewDue).length })
      })
      .catch(() => {
        if (!active) return
        setError('Vocabulary assignments could not load.')
        onStatusRef.current?.({ state: 'error', total: 0, completed: 0 })
      })
      .finally(() => { clearTimeout(timeout); if (active) setLoading(false) })
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [])

  if (error) return <p role="alert" className="text-sm text-destructive">{error} <Link className="inline-flex min-h-11 items-center underline" href="/vocabulary/work">Open vocabulary</Link></p>
  if (loading) return <p role="status" className="text-sm text-muted-foreground">Checking assigned vocabulary…</p>
  if (!tasks.length) return null
  const allDone = tasks.every(t => t.progress[0]?.complete && !t.progress[0]?.reviewDue)
  const reviewDue = tasks.some(t => t.progress[0]?.reviewDue)
  return <section className="rounded-xl border border-border p-4 space-y-3">
    <div className="flex items-start justify-between gap-3">
      <h2 className="min-w-0 font-bold">Assigned vocabulary</h2>
      <PracticeCompletionBadge state={allDone ? 'done' : 'todo'} label={allDone ? 'Done' : reviewDue ? 'Review due' : 'To do'} />
    </div>
    {tasks.map(t => {
      const p = t.progress[0]
      const done = p?.complete && !p?.reviewDue
      return <Link key={t.id} href={`/vocabulary/work?task_id=${t.id}`} className="block rounded-lg border border-border p-3 min-h-11 hover:bg-muted">
        <div className="flex items-start justify-between gap-3"><strong className="min-w-0">{t.title}</strong>{tasks.length > 1 && <PracticeCompletionBadge state={done ? 'done' : 'todo'} label={done ? 'Done' : p?.reviewDue ? 'Review due' : 'To do'} />}</div>
        <p className="mt-2 text-sm text-muted-foreground">{p?.ready ?? 0}/{p?.total ?? t.term_ids.length} words ready · {p?.covered ?? 0} checked{t.due_on ? ` · due ${t.due_on}` : ''}</p>
        <span className="text-sm">{p?.reviewDue ? 'Time for a review' : p?.complete ? 'Requirement met · review again' : 'Practice and check words'}</span>
      </Link>
    })}
  </section>
}
