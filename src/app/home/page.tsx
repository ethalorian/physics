'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, ChevronDown } from 'lucide-react'
import EnrollmentGate from '@/components/EnrollmentGate'
import VocabTaskCards, { type VocabPracticeStatus } from '@/components/vocabulary/VocabTaskCards'
import DailyMathTask, { type DailyMathStatus } from '@/components/math-spine/DailyMathTask'
import PracticeCompletionBadge from '@/components/PracticeCompletionBadge'
import XpGoalRing from '@/components/gamification/XpGoalRing'
import ChallengeCard from '@/components/gamification/ChallengeCard'
import TeacherFeedbackCard from '@/components/feedback/TeacherFeedbackCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import StudentCheckIn from './StudentCheckIn'
import AvatarSpotlight from './AvatarSpotlight'
import XpRequirements from './XpRequirements'
import styles from './home.module.css'

interface HomeData {
  student: { name: string }
  streak: { current: number }
  continue: {
    unitName: string | null
    lesson: { slug: string; title: string; progress: number }
    completed: number
    total: number
  } | null
  retry: { targetId: string; statement: string; level: 1 | 2 }[]
}

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [mathStatus, setMathStatus] = useState<DailyMathStatus | null>(null)
  const [vocabStatus, setVocabStatus] = useState<VocabPracticeStatus | null>(null)
  const [extrasOpen, setExtrasOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timeout = setTimeout(() => controller.abort(), 15000)
    setLoading(true)
    setLoadError(false)
    fetch('/api/home', { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('home'); return r.json() })
      .then((d: HomeData) => { if (active) setData(d) })
      .catch(() => { if (active) setLoadError(true) })
      .finally(() => { clearTimeout(timeout); if (active) setLoading(false) })
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [retry])

  const current = data?.continue
  const nextSkill = !loading && !loadError ? data?.retry[0] : undefined
  const practiceLoading = !mathStatus || mathStatus.loading || !vocabStatus || vocabStatus.state === 'loading'
  const practiceError = mathStatus?.error || vocabStatus?.state === 'error'
  const practiceTotal = (mathStatus?.hasItem || mathStatus?.submitted ? 1 : 0) + (vocabStatus?.total ?? 0)
  const practiceCompleted = (mathStatus?.submitted ? 1 : 0) + (vocabStatus?.completed ?? 0)
  const practiceState = practiceError ? 'error' : practiceLoading ? 'loading' : practiceTotal === 0 ? 'empty' : practiceCompleted === practiceTotal ? 'done' : 'todo'
  const practiceLabel = practiceError ? 'Status unavailable' : practiceLoading ? 'Checking practice…' : practiceTotal === 0 ? 'Nothing assigned' : practiceCompleted === practiceTotal ? 'Practice complete' : `${practiceCompleted} of ${practiceTotal} done`

  return (
    <EnrollmentGate>
      <div className="mx-auto max-w-5xl space-y-7 pb-12 text-foreground">
        <StudentCheckIn name={data?.student.name} streak={!loadError ? data?.streak.current : undefined} />

        <section id="daily-work" aria-labelledby="daily-work-heading" className="space-y-4">
          <header>
            <h2 id="daily-work-heading" className="text-title-2">Your work</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pick up where you left off, or follow your teacher’s directions.</p>
          </header>
          <div className={styles.workGrid}>
            <Card className={`${styles.lesson} gap-4 p-5 sm:p-6`}>
              <p className="flex items-center gap-2 text-sm font-semibold text-primary"><BookOpen size={18} aria-hidden="true" />Your lesson</p>
              {loading ? <div role="status"><h3 className="text-title-3">Finding your next lesson…</h3></div>
                : loadError ? <div role="alert" className="space-y-3"><h3 className="text-title-3">Your lesson could not load</h3><p className="text-sm text-muted-foreground">Try again, or browse your lessons below.</p><Button onClick={() => setRetry(n => n + 1)} className="min-h-11">Try again</Button></div>
                : current ? <>
                  <div><h3 className="text-title-2">{current.lesson.title}</h3>{current.unitName && <p className="mt-2 text-sm text-muted-foreground">{current.unitName}</p>}</div>
                  <Button asChild className="min-h-11 self-start"><Link href={`/lessons/${current.lesson.slug}`}>{current.lesson.progress > 0 ? 'Resume lesson' : 'Start lesson'}<ArrowRight aria-hidden="true" /></Link></Button>
                  <div className="mt-auto pt-2"><p className="text-xs text-muted-foreground">{current.completed} of {current.total} lessons completed</p><progress className={styles.unitProgress} value={current.completed} max={Math.max(1, current.total)} aria-label="Lessons completed in this unit" /></div>
                </> : <>
                  <h3 className="text-title-3">No next lesson to show</h3>
                  <p className="text-sm text-muted-foreground">Browse your lessons or ask your teacher what to open next.</p>
                </>}
              <Link href="/lessons" className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium text-primary underline underline-offset-4">All lessons<ArrowRight size={16} aria-hidden="true" /></Link>
            </Card>
            <section aria-labelledby="practice-heading" className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 id="practice-heading" className="text-sm font-semibold">Daily practice</h3><span role="status" aria-label="Daily practice completion"><PracticeCompletionBadge state={practiceState} label={practiceLabel} /></span></div>
              <DailyMathTask compact onStatus={setMathStatus} />
              <VocabTaskCards compact onStatus={setVocabStatus} />
            </section>
          </div>
        </section>

        <section id="teacher-feedback" aria-labelledby="feedback-heading" className="overflow-hidden rounded-lg border border-border bg-card">
          <header className="flex flex-wrap items-center justify-between gap-x-4 border-b px-5 py-3"><h2 id="feedback-heading" className="text-title-3">Teacher feedback</h2><Link href="/dashboard/growth" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary underline underline-offset-4">All feedback & progress<ArrowRight size={16} aria-hidden="true" /></Link></header>
          <TeacherFeedbackCard initialCount={1} featured />
          {nextSkill && <div className="flex flex-wrap items-center justify-between gap-4 border-t bg-secondary/40 p-5"><div className="min-w-0 flex-1 basis-56"><p className="text-xs font-semibold text-muted-foreground">A skill to revisit · {nextSkill.level === 1 ? 'Not yet' : 'Almost'}</p><h3 className="mt-1 text-sm font-medium">{nextSkill.statement}</h3></div><Button asChild variant="outline" className="min-h-11"><Link href={`/review/${nextSkill.targetId}`} aria-label={`Practice: ${nextSkill.statement}`}>Practice this skill<ArrowRight aria-hidden="true" /></Link></Button></div>}
        </section>

        <XpRequirements />

        <details className="group rounded-lg border border-border bg-card" onToggle={event => setExtrasOpen(event.currentTarget.open)}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 p-5 text-sm font-semibold">Goals & classroom extras<ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 group-open:rotate-180" /></summary>
          {extrasOpen && <div className={styles.extrasGrid}>
            <section aria-label="Daily goals and challenges" className="space-y-3"><XpGoalRing compact /><ChallengeCard compact /><p className="text-sm text-muted-foreground">Find games, rankings, and rewards in the main menu.</p></section>
            <AvatarSpotlight />
          </div>}
        </details>
      </div>
    </EnrollmentGate>
  )
}
