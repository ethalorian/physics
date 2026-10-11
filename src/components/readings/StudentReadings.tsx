'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { readingOverdue, type ReadingList } from '@/lib/textbook-assignments'
import { dueLabel, readingFetch, ReadingStatus } from './ReadingShared'
import styles from './readings.module.css'
import StudentReadingSequence from './StudentReadingSequence'

export default function StudentReadings({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<ReadingList | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true)
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError('')
    try { const d = await readingFetch<ReadingList>('/api/readings', { signal }); setData(d) } catch (e) { if (!signal?.aborted) setError((e as Error).message) } finally { if (!signal?.aborted) setLoading(false) }
  }, [])
  useEffect(() => { const c = new AbortController(); void load(c.signal); return () => c.abort() }, [load])
  const assignments = (data?.assignments ?? []).filter(a => !compact || a.status === 'published').sort((a, b) => {
    const rank = (id: string) => { const w = data?.work.find(x => x.assignment_id === id); return w?.state === 'returned' ? 0 : !w || w.state === 'in_progress' ? 1 : w.state === 'submitted' ? 2 : 3 }
    return rank(a.id) - rank(b.id) || (a.due_at ?? '9999').localeCompare(b.due_at ?? '9999')
  })
  if (compact && !loading && !error && !assignments.length) return null
  if (data?.staff) return compact ? null : <div className={styles.page}><Button asChild><Link href="/admin/readings">Open teacher reading workspace</Link></Button></div>
  return <section className={compact ? styles.stack : styles.page} aria-label="Assigned textbook readings">
    <header className={compact ? `${styles.row} ${styles.spread}` : styles.hero}><div><p className="text-overline text-primary">Read · Respond · Demonstrate</p>{compact ? <h2 className="text-title-2 mt-1">Textbook readings</h2> : <h1 className="text-display mt-2">Your textbook readings</h1>}</div>{compact && <Button asChild variant="ghost"><Link href="/readings">All readings<ArrowRight size={16} /></Link></Button>}</header>
    {!compact && !data?.staff && <StudentReadingSequence/>}
    {loading ? <Spinner /> : error ? <div role="alert" className={styles.error}>{error}<Button variant="outline" onClick={() => void load()} className="ml-3">Retry readings</Button></div> : <div className={compact ? styles.stack : styles.grid}>
      {(compact ? assignments.slice(0, 3) : assignments).map(a => { const w = data?.work.find(x => x.assignment_id === a.id); return <Card key={a.id} className="p-5 gap-3 border-l-4 border-l-primary"><div className={`${styles.row} ${styles.spread}`}><span className="text-sm font-medium text-primary"><BookOpen size={16} className="mr-2 inline" />{a.honors_reading?'OpenStax AP Physics 2e':a.passage?'Course reading':`Chapter ${a.chapter}`}</span><ReadingStatus work={w} /></div><h3 className="text-title-3">{a.title}</h3><p className={styles.muted}>{a.reading} · {a.questions.length} questions</p><p className={readingOverdue(a, w) ? 'text-sm font-medium text-destructive' : styles.muted}>{readingOverdue(a, w) ? 'Overdue · ' : ''}{dueLabel(a.due_at)}{a.status === 'archived' ? ' · Archived' : ''}</p><Button asChild className="self-start"><Link href={`/readings/${a.id}`}>{w?.state === 'returned' ? 'Revise answers' : w?.state === 'rated' ? 'View mastery & feedback' : w?.state === 'submitted' ? 'View submission' : w ? 'Continue reading' : 'Start reading'}<ArrowRight size={16} /></Link></Button></Card> })}
      {!assignments.length && <Card className="p-6"><h2 className="text-title-3">No readings assigned yet</h2><p className={styles.muted}>Your teacher’s reading assignments will appear here.</p><Button asChild variant="outline"><Link href="/textbook">Browse textbook</Link></Button></Card>}
    </div>}
  </section>
}
