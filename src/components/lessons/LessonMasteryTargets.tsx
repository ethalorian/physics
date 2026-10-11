'use client'

import Link from 'next/link'
import { levelWord } from '@/components/mastery/mastery-display'

interface Target { slug: string; statement: string; teacher: number | null }

/** Teacher ratings are read-only here. Activity completion is never a rating. */
export default function LessonMasteryTargets({ targets, preview, snapshot=false }: { targets?: Target[]; preview: boolean; snapshot?: boolean }) {
  return <section className="mb-6 rounded-xl border bg-card p-4" aria-label="Learning targets and mastery">
    <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-semibold">Your learning targets</h2>{!preview && <Link href="/dashboard/growth" className="text-sm text-primary underline">View mastery</Link>}</div>
    <p className="mt-2 text-sm text-muted-foreground">Your teacher uses your explanations and work to rate each target. Practice feedback helps you improve; completing a lesson does not change a rating.</p>
    {!targets ? <p role="status" className="mt-3 text-sm">{preview ? 'Ratings are shown to students for their own learning targets.' : 'Your current ratings are unavailable. You can still work on the lesson and view your mastery page.'}</p> : <ul className="mt-3 space-y-3">{targets.map(target => <li key={target.slug} className="flex flex-wrap items-start justify-between gap-3 border-t pt-3 text-sm"><span className="max-w-2xl">{target.statement}</span><span className="shrink-0 rounded-md bg-secondary px-3 py-1">{preview&&!snapshot ? 'Preview · ' : 'Latest teacher rating · '}{target.teacher === null ? 'Not yet rated' : `${target.teacher} · ${levelWord(target.teacher)}`}</span></li>)}</ul>}
  </section>
}
