"use client"

import { Check, Lock } from 'lucide-react'
import type { LessonSection } from './lesson-sections'
import styles from './LessonViewer.module.css'

interface SectionRailProps {
  sections: LessonSection[]
  currentIndex: number
  isComplete: (index: number) => boolean
  isLocked?: (index: number) => boolean
  onJump: (index: number) => void
}

/** A readable lesson path, with progress based on saved work and reading checkpoints. */
export default function SectionRail({ sections, currentIndex, isComplete, isLocked, onJump }: SectionRailProps) {
  const completed = sections.filter((_, i) => isComplete(i)).length
  return (
    <nav aria-label="Lesson sections" className={styles.rail}>
      <div className={styles.railHeading}>
        <div className={styles.pathProgress} aria-label={`${completed} of ${sections.length} steps complete`}>
          <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" /><circle cx="32" cy="32" r="27" pathLength="100" strokeDasharray={`${sections.length ? completed / sections.length * 100 : 0} 100`} /></svg>
          <span aria-hidden="true">{completed}<small>/{sections.length}</small></span>
        </div>
        <div><strong>Your lesson path</strong><span>One step at a time.</span></div>
      </div>
      <ol>
        {sections.map((sec, i) => {
          const done = isComplete(i)
          const locked = isLocked?.(i) ?? false
          const current = i === currentIndex
          return <li key={i}>
            <button type="button" onClick={() => onJump(i)} disabled={locked}
              aria-current={current ? 'step' : undefined}
              aria-label={`Section ${i + 1} of ${sections.length}: ${sec.title}${current ? ' (current)' : done ? ' (done)' : locked ? ' (locked)' : ''}`}
              title={locked ? 'Finish the checkpoint before this section to unlock it' : sec.title}
              className={styles.railButton}>
              <span className={styles.railNumber} data-done={done} aria-hidden="true">{locked ? <Lock size={13} /> : done ? <Check size={15} /> : i + 1}</span>
              <span className={styles.railLabel}>{sec.title}<small>{current ? 'You are here' : done ? 'Complete' : locked ? 'Finish the earlier checkpoint' : sec.hasCapture ? 'Activity' : 'Read & explore'}{sec.minutes > 0 ? ` · ~${sec.minutes} min` : ''}</small></span>
            </button>
          </li>
        })}
      </ol>
    </nav>
  )
}
