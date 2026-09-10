"use client"
import XpRequirements from './XpRequirements'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, ArrowRight, BookOpen, BookText, ChevronDown, Gift, Joystick, Sigma, Target, Trophy, Users, UserRound } from 'lucide-react'
import EnrollmentGate from '@/components/EnrollmentGate'
import VocabTaskCards, { type VocabPracticeStatus } from '@/components/vocabulary/VocabTaskCards'
import DailyMathTask, { type DailyMathStatus } from '@/components/math-spine/DailyMathTask'
import PracticeCompletionBadge from '@/components/PracticeCompletionBadge'
import XpGoalRing from '@/components/gamification/XpGoalRing'
import ChallengeCard from '@/components/gamification/ChallengeCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { decayingAverage } from '@/data/curriculum-types'
import styles from './home.module.css'
import StudentCheckIn from './StudentCheckIn'
import StudentClasses from './StudentClasses'
import AvatarSpotlight from './AvatarSpotlight'
import HomeSectionHeader from './HomeSectionHeader'
import TeacherFeedbackCard from '@/components/feedback/TeacherFeedbackCard'

type Domain = 'knowledge' | 'reasoning' | 'skill' | 'product'

interface SequenceItem { lessonNumber: number; title: string; slug: string; status: 'done' | 'current' | 'todo' }
interface ContinueData {
  unitId: string | null
  unitName: string | null
  lesson: { slug: string; title: string; lessonNumber: number; progress: number }
  sequence: SequenceItem[]
  completed: number
  total: number
}
interface RetryItem { targetId: string; statement: string; domain: Domain; level: 1 | 2; lastObservedAt: string }
interface ClimbPoint { observedAt: string; level: number; domain: Domain }
interface HomeData {
  student: { name: string }
  program?: 'physics' | 'trades' | 'projects'
  points: { xp: number; balance: number }
  streak: { current: number }
  continue: ContinueData | null
  retry: RetryItem[]
  climb: ClimbPoint[]
  sideQuest: { sim: { slug: string; title: string } | null }
}

const DOMAINS: { key: Domain; label: string }[] = [
  { key: 'knowledge', label: 'Knowledge' },
  { key: 'reasoning', label: 'Reasoning' },
  { key: 'skill', label: 'Skill' },
  { key: 'product', label: 'Product' },
]

function ClimbChart({ points }: { points: ClimbPoint[] }) {
  const W = 720, L = 60, R = 700, T = 18, B = 210
  const sorted = [...points].sort((a, b) => a.observedAt.localeCompare(b.observedAt))
  const n = sorted.length
  if (n === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Your progress will appear after your teacher reviews your work.
      </p>
    )
  }
  const sx = (i: number) => (n === 1 ? (L + R) / 2 : L + (i / (n - 1)) * (R - L))
  const sy = (v: number) => B - ((v - 1) / 2) * (B - T) // level 1..3 -> bottom..top
  const running = decayingAverage // shared util
  // weighted trajectory: running decaying average up to each index
  const line: { x: number; y: number }[] = sorted.map((_, i) => {
    const v = running(sorted.slice(0, i + 1).map((p) => p.level)) ?? sorted[i].level
    return { x: sx(i), y: sy(v) }
  })
  const linePts = line.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const fmt = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
  return (
    <svg viewBox={`0 0 ${W} 240`} role="img" aria-label="Mastery over time" style={{ width: '100%', height: 'auto' }}>
      <rect x={L} y={15} width={R - L} height={70} style={{ fill: 'var(--success)', opacity: 0.1 }} />
      <rect x={L} y={85} width={R - L} height={70} style={{ fill: 'var(--primary)', opacity: 0.12 }} />
      <rect x={L} y={155} width={R - L} height={70} style={{ fill: 'var(--destructive)', opacity: 0.09 }} />
      <text x={8} y={54} style={{ fill: 'var(--success)', fontWeight: 700 }} fontSize="11">Got it</text>
      <text x={8} y={124} style={{ fill: 'var(--muted-foreground)' }} fontSize="11">Almost</text>
      <text x={8} y={194} style={{ fill: 'var(--muted-foreground)' }} fontSize="11">Not yet</text>
      {n > 1 && <polyline points={linePts} fill="none" style={{ stroke: 'var(--primary)' }} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />}
      {sorted.map((p, i) => (
        <circle key={i} cx={sx(i)} cy={sy(p.level)} r={6} style={{ fill: 'var(--primary)' }}>
          <title>{`${fmt(p.observedAt)} — level ${p.level}`}</title>
        </circle>
      ))}
      <text x={sx(0)} y={236} textAnchor="middle" style={{ fill: 'var(--muted-foreground)' }} fontSize="10">{fmt(sorted[0].observedAt)}</text>
      {n > 1 && <text x={sx(n - 1)} y={236} textAnchor="middle" style={{ fill: 'var(--foreground)', fontWeight: 700 }} fontSize="10">{fmt(sorted[n - 1].observedAt)}</text>}
    </svg>
  )
}

const DESTINATIONS = [
  { title: 'Classwork', items: [
    { href: '/lessons', title: 'All lessons', description: 'Find your lessons and return to earlier work.', icon: BookOpen },
    { href: '/lobby', title: 'Lobby', description: 'Join the activity your teacher starts in the Lobby.', icon: Users },
    { href: '/dashboard/growth', title: 'My progress', description: 'See teacher ratings and feedback.', icon: Target },
  ] },
  { title: 'Practice & help', items: [
    { href: '/dashboard/math-spine', title: 'Math practice', description: 'Build the math skills you use in class.', icon: Sigma },
    { href: '/vocabulary/work', title: 'Vocabulary', description: 'Open assigned words and review activities.', icon: BookText },
    { href: '/reference', title: 'Reference', description: 'Look up equations, units, and problem-solving help.', icon: BookOpen },
    { href: '/textbook', title: 'Textbook', description: 'Read Conceptual Physics.', icon: BookText },
  ] },
  { title: 'Play & rewards', items: [
    { href: '/arcade', title: 'Arcade', description: 'Play games and put your skills to work.', icon: Joystick },
    { href: '/leaderboard', title: 'Leaderboard', description: 'See class rankings.', icon: Trophy },
    { href: '/store', title: 'Store', description: 'Use your points for rewards.', icon: Gift },
    { href: '/avatar/gallery', title: 'Avatar gallery', description: 'Meet the characters in your classroom.', icon: Users },
    { href: '/avatar', title: 'My avatar', description: 'Customize your character and display name.', icon: UserRound },
  ] },
]

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [mathStatus, setMathStatus] = useState<DailyMathStatus | null>(null)
  const [vocabStatus, setVocabStatus] = useState<VocabPracticeStatus | null>(null)
  const [domain, setDomain] = useState<Domain>('reasoning')

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setLoading(true)
    setLoadError(false)
    fetch('/api/home', { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error('home'); return r.json() })
      .then((d: HomeData) => {
        if (!active) return
        setData(d)
        const firstWithData = DOMAINS.find((dm) => d.climb.some((c) => c.domain === dm.key))
        if (firstWithData) setDomain(firstWithData.key)
      })
      .catch(() => { if (active) setLoadError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [retry])

  const climbForDomain = useMemo(() => (data?.climb ?? []).filter((c) => c.domain === domain), [data, domain])
  const current = data?.continue
  const practiceLoading = !mathStatus || mathStatus.loading || !vocabStatus || vocabStatus.state === 'loading'
  const practiceError = mathStatus?.error || vocabStatus?.state === 'error'
  const practiceTotal = (mathStatus?.hasItem || mathStatus?.submitted ? 1 : 0) + (vocabStatus?.total ?? 0)
  const practiceCompleted = (mathStatus?.submitted ? 1 : 0) + (vocabStatus?.completed ?? 0)
  const practiceState = practiceError ? 'error' : practiceLoading ? 'loading' : practiceTotal === 0 ? 'empty' : practiceCompleted === practiceTotal ? 'done' : 'todo'
  const practiceLabel = practiceError ? 'Status unavailable' : practiceLoading ? 'Checking progress…' : practiceTotal === 0 ? 'Nothing assigned yet' : practiceCompleted === practiceTotal ? 'All done for now!' : `${practiceCompleted} of ${practiceTotal} done`


  return (
    <EnrollmentGate>
      <div className="mx-auto max-w-6xl space-y-8 pb-12 text-foreground">
        <StudentCheckIn name={data?.student.name} points={!loadError ? data?.points : undefined} streak={!loadError ? data?.streak.current : undefined} loading={loading} />
        <nav aria-label="Home sections" className={styles.homeNavigation}>
          <Button asChild className="min-h-11"><a href="#daily-work">Daily work<ArrowRight aria-hidden="true" /></a></Button>
          <Button asChild variant="outline" className="min-h-11"><a href="#teacher-feedback">Teacher feedback<MessageCircle aria-hidden="true" /></a></Button>
          <Button asChild variant="outline" className="min-h-11"><a href="#classroom-directory">Find what you need<ChevronDown aria-hidden="true" /></a></Button>
        </nav>
        <StudentClasses />
        <section id="daily-work" aria-labelledby="daily-work-heading" className={styles.dailyWork}>
          <div className="mb-5"><h2 id="daily-work-heading" className="text-title-2">Your daily work</h2><p className="mt-1 text-sm text-muted-foreground">Check off your practice and pick up your lesson. Follow your teacher’s directions during class.</p></div>
          <div className={styles.dailyWorkGrid}>
            <section aria-labelledby="practice-heading" className={`${styles.practice} space-y-4`}>
              <HomeSectionHeader title="Daily practice" eyebrow="A little progress, every day" description="Your math warm-up and assigned vocabulary, together in one place." icon={Sigma} tone="sage" id="practice-heading" status={<span role="status" aria-label="Daily practice completion"><PracticeCompletionBadge state={practiceState} label={practiceLabel} /></span>} />
              <DailyMathTask onStatus={setMathStatus} />
              <VocabTaskCards onStatus={setVocabStatus} />
            </section>
            <section aria-labelledby="next-heading">
              <Card className={`${styles.lesson} gap-0 overflow-hidden p-0`}>
                <HomeSectionHeader title="Continue learning" eyebrow="Your next lesson" icon={BookOpen} tone="indigo" />
                <div className="space-y-4 p-5 sm:p-6">
                {loading ? <div role="status" className="space-y-3"><h2 id="next-heading" className="text-title-2">Finding your next lesson…</h2><p className="text-sm text-muted-foreground">Your classroom links are ready below.</p></div>
                  : loadError ? <div role="alert" className="space-y-3"><h2 id="next-heading" className="text-title-2">Your lesson could not load</h2><p className="text-sm text-muted-foreground">Try again, or open All lessons to find your work.</p><Button onClick={() => setRetry(n => n + 1)} className="min-h-11">Try again</Button></div>
                  : current ? <>
                    <div><p className="mb-2 text-sm text-muted-foreground">{current.unitName ?? 'Your next lesson'}</p><h2 id="next-heading" className="text-title-2">{current.lesson.title}</h2></div>
                    <p className="text-sm text-muted-foreground">{current.lesson.progress > 0 ? 'Continue where you left off. Your saved work is in the lesson.' : 'Open the lesson to see the reading and activities.'} Follow your teacher’s directions during class.</p>
                    <div className="flex flex-wrap gap-3">
                      <Button asChild className="min-h-11"><Link href={`/lessons/${current.lesson.slug}`}>{current.lesson.progress > 0 ? 'Resume lesson' : 'Start lesson'}<ArrowRight aria-hidden="true" /></Link></Button>
                      <Button asChild variant="outline" className="min-h-11"><Link href="/lessons">All lessons</Link></Button>
                    </div>
                    <div className={styles.lessonProgress}><p className="text-sm text-muted-foreground">{current.completed} of {current.total} lessons completed{current.unitName ? ` in ${current.unitName}` : ''}</p><progress className={styles.unitProgress} value={current.completed} max={Math.max(1, current.total)} aria-label="Lessons completed in this unit" /></div>
                  </> : <>
                    <h2 id="next-heading" className="text-title-2">No next lesson to show</h2>
                    <p className="text-sm text-muted-foreground">Check All lessons for available work, or ask your teacher what to open next.</p>
                    <Button asChild variant="outline" className="min-h-11 self-start"><Link href="/lessons">Open all lessons<ArrowRight aria-hidden="true" /></Link></Button>
                  </>}
                </div>
              </Card>
            </section>
          </div>
        </section>
        <section id="teacher-feedback" aria-labelledby="feedback-heading" className={styles.coaching}>
          <header className={styles.coachingHeader}>
            <div className="flex items-center gap-4"><span className={styles.coachingIcon}><MessageCircle size={26} aria-hidden="true" /></span><div><p className={styles.coachingEyebrow}>Read · Revisit · Grow</p><h2 id="feedback-heading" className={styles.coachingTitle}>Your teacher’s feedback</h2></div></div>
            <Button asChild variant="outline" className="min-h-11 bg-card text-foreground"><Link href="/dashboard/growth">All feedback & progress<ArrowRight aria-hidden="true" /></Link></Button>
          </header>
          <div className={styles.coachingBody}>
            <TeacherFeedbackCard initialCount={1} featured />
            <div className={styles.coachingAction}>
              <span className={styles.actionIcon}><Target size={22} aria-hidden="true" /></span>
              <p className="text-overline mt-4">Put it into practice</p>
              {loading ? <p role="status" className="mt-3 text-sm text-muted-foreground">Loading your next step…</p>
                : loadError ? <p className="mt-3 text-sm text-muted-foreground">Open your progress to find the work you want to revisit.</p>
                : data?.retry.length ? <>
                  <p className="mt-2 text-xs font-medium text-muted-foreground">From your latest ratings · {data.retry[0].level === 1 ? 'Not yet' : 'Almost'}</p>
                  <h3 className="mt-3 text-title-3">{data.retry[0].statement}</h3>
                  <Button asChild className="mt-5 min-h-11"><Link href={`/review/${data.retry[0].targetId}`} aria-label={`Practice: ${data.retry[0].statement}`}>Revisit this skill<ArrowRight aria-hidden="true" /></Link></Button>
                  {data.retry.length > 1 && <p className="mt-3 text-xs text-muted-foreground">{data.retry.length - 1} more skills in All feedback & progress.</p>}
                </> : <><h3 className="mt-3 text-title-3">Keep building on your work.</h3><p className="mt-2 text-sm text-muted-foreground">No skills are listed for extra practice right now. Use your teacher’s notes to guide your next step.</p></>}
            </div>
          </div>
            <details className="group border-t border-border">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 p-5 text-sm font-semibold">View progress over time<ChevronDown aria-hidden="true" className="h-4 w-4 group-open:rotate-180" /></summary>
              <div className="space-y-4 px-5 pb-5"><p className="text-sm text-muted-foreground">Each dot is a teacher rating. The line gives more weight to recent work.</p><div className="flex flex-wrap gap-2" aria-label="Progress category">{DOMAINS.map(dm => <Button key={dm.key} variant={domain === dm.key ? 'default' : 'outline'} className="min-h-11" aria-pressed={domain === dm.key} onClick={() => setDomain(dm.key)}>{dm.label}</Button>)}</div><ClimbChart points={climbForDomain} /></div>
            </details>
        </section>
        <XpRequirements />
        <div className={styles.extrasGrid}>
            <section aria-labelledby="goals-heading" className={`${styles.rewards} space-y-3`}>
              <HomeSectionHeader title="Goals & rewards" eyebrow="Your effort adds up" description="Track your daily goal and teacher challenges." icon={Gift} tone="gold" id="goals-heading" />
              <XpGoalRing compact />
              <ChallengeCard compact />
            </section>
            <AvatarSpotlight />
            <section id="classroom-directory" aria-labelledby="find-heading" className={`${styles.directory} scroll-mt-28`}>
              <HomeSectionHeader title="Find what you need" eyebrow="Around your classroom" icon={BookOpen} tone="indigo" id="find-heading" />
              <Card className="gap-3 border-0 bg-transparent p-3 shadow-none">
                {DESTINATIONS.map(group => <nav key={group.title} aria-label={group.title} className={styles.directoryGroup}>
                  <h3 className="text-overline mb-2 text-muted-foreground">{group.title}</h3>
                  <ul className="space-y-1">{group.items.map(item => <li key={item.href}><Link href={item.href} className={styles.directoryLink}>
                    <span className={styles.directoryIcon}><item.icon aria-hidden="true" className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.title}</span><span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.description}</span></span><ArrowRight aria-hidden="true" className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link></li>)}</ul>
                </nav>)}
              </Card>
            </section>
        </div>
      </div>
    </EnrollmentGate>
  )
}
