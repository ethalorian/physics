'use client'

import Link from 'next/link'
import { ArrowDown, ArrowRight, BookOpen, Compass, MessageCircle, Sparkles, TrendingUp } from 'lucide-react'
import MasteryGrowth, { type MasteryGrowthProps } from '@/components/mastery/MasteryGrowth'
import MathSpineGrowth, { type MathSpineGrowthProps } from '@/components/math-spine/MathSpineGrowth'
import TeacherFeedbackCard from '@/components/feedback/TeacherFeedbackCard'
import { growthSnapshot } from './growth-model'
import s from './growth.module.css'

export interface GrowthJournalProps {
  name?: string
  physics: MasteryGrowthProps | null
  math: MathSpineGrowthProps | null
  physicsLoading: boolean
  mathLoading: boolean
  physicsError: boolean
  mathError: boolean
  retryPhysics: () => void
  retryMath: () => void
}

export default function GrowthJournal({ name, physics, math, physicsLoading, mathLoading, physicsError, mathError, retryPhysics, retryMath }: GrowthJournalProps) {
  const snapshot = physics ? growthSnapshot(physics.targets, physics.records, physics.recencyWeight) : null
  const mathReviewed = math ? new Set(math.records.filter(r => math.competencies.some(c => c.id === r.competencyId)).map(r => r.competencyId)).size : null
  const hasEvidence = snapshot && snapshot.reviewed > 0
  const reviewedPercent = snapshot?.items.length ? snapshot.reviewed / snapshot.items.length * 100 : 0
  return <div className={s.page}>
    <div className={s.pageTop}><p className={s.eyebrow}>Your learning journal</p><Link href="/lessons" className={s.textLink}>Back to lessons <ArrowRight size={16} aria-hidden="true" /></Link></div>
    <header className={s.hero}>
      <div className={s.heroCopy}>
        <p className={s.heroLabel}>{name ? `${name.split(' ')[0]}’s progress` : 'Your progress'} · one idea at a time</p>
        <h1>Your understanding.<br /><em>Taking shape.</em></h1>
        <p className={s.heroIntro}>{hasEvidence ? 'You’re building more than answers. See the ideas you understand, the progress you’ve made, and where to go next.' : 'Every question, attempt, and revision is a chance to grow. This is where your teacher-reviewed work becomes a picture of what you can do.'}</p>
        <a href="#growth-targets" className={s.heroAction}>Explore my growth <ArrowDown size={18} aria-hidden="true" /></a>
      </div>
      <div className={s.orbitPanel}>
        <svg className={s.orbits} viewBox="0 0 480 350" aria-hidden="true"><ellipse cx="240" cy="175" rx="224" ry="108" transform="rotate(-26 240 175)" /><ellipse cx="240" cy="175" rx="162" ry="153" transform="rotate(25 240 175)" /><circle cx="53" cy="222" r="7"/><circle cx="423" cy="91" r="5"/></svg>
        <div className={s.growthRing}>
          <svg viewBox="0 0 180 180" aria-hidden="true"><circle className={s.ringTrack} cx="90" cy="90" r="79" />{reviewedPercent > 0 && <circle className={s.ringFill} cx="90" cy="90" r="79" pathLength="100" strokeDasharray={`${reviewedPercent} 100`} transform="rotate(-90 90 90)" />}</svg>
          <div><span className={s.ringNumber}>{physicsLoading ? '…' : snapshot ? snapshot.reviewed : '—'}</span><span>targets with<br />rated evidence</span></div>
        </div>
        <div className={s.orbitCaption}>{snapshot ? `${snapshot.reviewed} of ${snapshot.items.length} targets · Physics, Unit 1` : physicsLoading ? 'Loading your learning story…' : 'Physics progress is unavailable'}</div>
        <p className={s.orbitNote}>A picture of your evidence.<br />Your next chapter is still open.</p>
      </div>
    </header>
    <nav className={s.jumpLinks} aria-label="Explore your growth"><a href="#growth-targets"><Compass size={18} aria-hidden="true"/>Physics targets</a><a href="#growth-math"><BookOpen size={18} aria-hidden="true"/>Math skills</a><a href="#growth-feedback"><MessageCircle size={18} aria-hidden="true"/>Teacher feedback</a></nav>
    <div className={s.stats} aria-label="Your progress at a glance">
      <div><span className={s.statIcon}><Sparkles aria-hidden="true" size={19}/></span><div><strong>{physicsLoading ? '…' : snapshot?.secure ?? '—'}</strong><h2>Targets at “Got it”</h2><p>Current weighted rating of 2.5 or higher</p></div></div>
      <div><span className={s.statIcon}><TrendingUp aria-hidden="true" size={19}/></span><div><strong>{physicsLoading ? '…' : snapshot?.improving ?? '—'}</strong><h2>Targets moving forward</h2><p>Higher after their latest teacher rating</p></div></div>
      <div><span className={s.statIcon}><BookOpen aria-hidden="true" size={19}/></span><div><strong>{mathLoading ? '…' : mathReviewed ?? '—'}</strong><h2>Math skills with evidence</h2><p>Teacher observations across the year</p></div></div>
    </div>
    <section id="growth-targets" className={s.section}>
      <div className={s.sectionHeading}><div><p className={s.eyebrow}>01 / Connect the dots</p><h2>Your physics, coming together.</h2></div><span className={s.scope}>Unit 1 · Motion &amp; Forces</span></div>
      <p className={s.sectionIntro}>Choose a kind of thinking, then a target. See the evidence behind your progress and one way to move it forward.</p>
      {physicsLoading ? <Loading label="Loading your physics evidence…"/> : physicsError ? <LoadError label="Your physics evidence couldn’t load." retry={retryPhysics}/> : physics && <MasteryGrowth {...physics}/>} 
    </section>
    <div className={s.feedbackBand} id="growth-feedback">
      <div className={s.feedbackHeading}><MessageCircle size={25} aria-hidden="true"/><p className={s.eyebrow}>A little guidance goes a long way</p><h2>Your teacher.<br /> In your corner.</h2><p>Notice what’s working. Pick one suggestion. Put it into practice.</p></div>
      <div className={s.feedbackBody}><h3>Notes &amp; next steps</h3><TeacherFeedbackCard featured initialCount={2} allowExpand/></div>
    </div>
    <section id="growth-math" className={s.section}>
      <div className={s.sectionHeading}><div><p className={s.eyebrow}>02 / Build your toolkit</p><h2>Skills that go with you.</h2></div><Link className={s.textLink} href="/dashboard/math-spine">Open Math Spine <ArrowRight size={17} aria-hidden="true"/></Link></div>
      <p className={s.sectionIntro}>Your math evidence stays with you across units. Select a skill to revisit your work, use feedback, or try it again.</p>
      {mathLoading ? <Loading label="Loading your math evidence…"/> : mathError ? <LoadError label="Your math evidence couldn’t load." retry={retryMath}/> : math && <MathSpineGrowth {...math} journal/>} 
    </section>
    <footer className={s.footer}><Sparkles size={22} aria-hidden="true"/><div><strong>Progress is a practice.</strong><p>Mastery comes from rated evidence. XP celebrates effort and milestones. Missing evidence is not a low score, and time alone doesn’t lower your rating.</p></div><Link href="/lessons" className={s.primaryLink}>Keep learning <ArrowRight size={17} aria-hidden="true"/></Link></footer>
  </div>
}
function Loading({ label }: { label: string }) { return <div className={s.state} role="status">{label}</div> }
function LoadError({ label, retry }: { label: string; retry: () => void }) { return <div className={s.state} role="alert"><p>{label} Your saved work is still there.</p><button className={s.outlineButton} onClick={retry} type="button">Try again</button></div> }
