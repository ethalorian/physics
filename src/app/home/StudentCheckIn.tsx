'use client'

import { type CSSProperties, type ReactNode, type RefObject } from 'react'
import Link from 'next/link'
import { ArrowUpRight, ArrowRight, Flame, MessageCircle, Pencil, Sparkles, Sprout, UserRound } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import IllustratedAvatar from '@/components/avatar/IllustratedAvatar'
import { ILLUSTRATED_AVATAR_LOOKS, type IllustratedAvatarLook } from '@/lib/avatar/illustrated'
import StudentClasses from './StudentClasses'
import SeasonalBackdrop from './SeasonalBackdrop'
import { dailyZenReflection } from '@/lib/daily-zen'
import { STUDENT_HOME_THEMES, type StudentHomeTask } from '@/lib/student-home-banner'
import { useAvatarPortrait } from '@/hooks/useAvatarPortrait'
import styles from './StudentCheckIn.module.css'

const compactXp = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const formatXp = (amount: number) => amount >= 100_000 ? compactXp.format(amount) : amount.toLocaleString('en-US')

interface StudentCheckInProps {
  name?: string
  streak?: number
  points?: { xp: number; balance: number }
  loading: boolean
  today: string
  task: StudentHomeTask | null
  onGrowth?: () => void
  onFeedback?: () => void
  growthActive?: boolean
  progressHref?: string
  feedbackHref?: string
  progressSummary?: ReactNode
  illustratedLook?: IllustratedAvatarLook
  onChangeLook?: () => void
  changeLookRef?: RefObject<HTMLButtonElement | null>
}

export default function StudentCheckIn({ name, streak, points, loading, today, task, onGrowth, onFeedback, growthActive, progressHref, feedbackHref, progressSummary, illustratedLook, onChangeLook, changeLookRef }: StudentCheckInProps) {
  const { portrait, loaded, error: avatarError } = useAvatarPortrait(!illustratedLook)
  const avatarLoading = !loaded

  const hasAvatar = Boolean(illustratedLook || (portrait?.setup_completed && portrait.traits))
  const avatarLabel = hasAvatar ? 'Customize your avatar' : avatarLoading || avatarError ? 'Open your avatar' : 'Build your avatar'
  const reflection = dailyZenReflection(today)
  const month = Number(today.slice(5, 7)) - 1
  const theme = STUDENT_HOME_THEMES[month]
  const palette = { '--season-base': theme.base, '--season-light': theme.light, '--season-low': theme.low, '--season-accent': theme.accent } as CSSProperties
  const avatarVisual = illustratedLook
    ? <IllustratedAvatar look={illustratedLook} className={styles.illustration} decorative priority sizes="(max-width: 540px) 140px, 280px" />
    : portrait?.setup_completed && portrait.traits
      ? <Avatar traits={portrait.traits} equipped={portrait.equipped} items={portrait.equipped_items} size={200} crop="portrait" className={styles.portrait} decorative />
      : <UserRound aria-hidden="true" className={styles.portraitPlaceholder} />

  return (
    <section className={`${styles.checkIn} ${illustratedLook ? styles.illustrated : ''}`} aria-labelledby="check-in-heading" style={palette} data-season={theme.name}>
      <SeasonalBackdrop month={month} />
      <div className={styles.identity}>
        {onChangeLook ? <button type="button" className={styles.portraitLink} aria-label={avatarLabel} onClick={onChangeLook}>{avatarVisual}</button>
          : <Link href="/avatar" className={styles.portraitLink} aria-label={avatarLabel}>{avatarVisual}</Link>}
        <div className={styles.identityActions}>
          {illustratedLook && <span className={styles.lookName}>{ILLUSTRATED_AVATAR_LOOKS[illustratedLook].name}</span>}
          {onChangeLook ? <button ref={changeLookRef} type="button" className={`${styles.raisedButton} ${styles.personalize}`} onClick={onChangeLook}><Pencil size={16} aria-hidden="true" />Change your look</button>
            : <Link href="/avatar" className={`${styles.raisedButton} ${styles.personalize}`}><Pencil size={16} aria-hidden="true" />{hasAvatar ? 'Change your look' : avatarLoading || avatarError ? 'My avatar' : 'Build my avatar'}</Link>}
          {streak !== undefined && streak > 0 && <span className={styles.streak}><Flame size={15} aria-hidden="true" />{streak}-day streak</span>}
        </div>
      </div>
      <div className={styles.welcome}>
        <div className={styles.heroClasses}><StudentClasses /></div>
        <h1 id="check-in-heading">{name ? `Hey, ${name}!` : 'Your classroom'}</h1>
        <figure className={styles.reflection} aria-label="Daily Zen reflection" data-reflection-id={reflection.id}>
          <blockquote>{reflection.text}</blockquote>
          <figcaption>{reflection.url
            ? <a href={reflection.url} target="_blank" rel="noopener noreferrer" aria-label={`${reflection.credit}. ${reflection.source} (opens in a new tab)`}>{reflection.credit}</a>
            : reflection.credit}</figcaption>
        </figure>
        <div className={styles.nextTask} aria-label="Your next learning step" aria-busy={!task}>
          <p className={styles.eyebrow}>{task ? `${task.kind === 'Keep exploring' || task.kind === 'Keep learning' ? '' : 'Next up · '}${task.kind}` : 'Your next step'}</p>
          <h2>{task?.title ?? 'Checking your work…'}</h2>
          <p className={styles.taskMeta}>{task?.meta ?? 'Finding your next learning step'}</p>
          {task && <Link href={task.href} className={`${styles.raisedButton} ${styles.startLearning}`}>{task.label}<span className={styles.actionArrow}><ArrowRight size={18} aria-hidden="true" /></span></Link>}
          <div className={styles.welcomeActions}>
            {progressHref ? <Link className={styles.raisedButton} href={progressHref}><Sprout size={17} aria-hidden="true" />My progress</Link> : onGrowth && <button type="button" className={styles.raisedButton} onClick={onGrowth} aria-controls="learning-dashboard-content" aria-current={growthActive ? 'page' : undefined}><Sprout size={17} aria-hidden="true" />My progress</button>}
            {feedbackHref ? <Link className={styles.feedback} href={feedbackHref}><MessageCircle size={16} aria-hidden="true" />Feedback</Link> : onFeedback && <button type="button" className={styles.feedback} onClick={onFeedback} aria-controls="learning-dashboard-content"><MessageCircle size={16} aria-hidden="true" />Feedback</button>}
          </div>
        </div>
      </div>
      <div className={styles.progressRail}>
        {progressSummary}
        <div className={styles.xpDisplay} aria-label="Your earned XP and spending balance">
          <div>
            <p className={styles.xpLabel}><Sparkles size={16} aria-hidden="true" />Lifetime XP</p>
            <p className={styles.xpTotal}><span aria-hidden="true">{points ? formatXp(points.xp) : '—'}</span><span className="sr-only">{points ? `${points.xp.toLocaleString('en-US')} lifetime XP` : 'XP unavailable'}</span></p>
            {!points && <p className={styles.xpCaption} role="status">{loading ? 'Loading your XP…' : 'XP is unavailable right now.'}</p>}
          </div>
          <div className={styles.walletBottom}>
            <p className={styles.balance}><strong><span aria-hidden="true">{points ? formatXp(points.balance) : '—'}</span><span className="sr-only">{points ? points.balance.toLocaleString('en-US') : 'Unavailable'}</span></strong> XP to spend</p>
            <Link href="/store" className={`${styles.raisedButton} ${styles.store}`}>Visit store<ArrowUpRight size={16} aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </section>
  )
}
