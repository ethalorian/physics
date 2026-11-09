'use client'

import { useId, useState, type ReactNode } from 'react'
import type { BinderSource } from '@/lib/binder-reading'
import BinderDailyReader from './BinderDailyReader'
import styles from './BinderWorkLayout.module.css'

export default function BinderWorkLayout({ source, reading, children }: {
  source?: BinderSource | null
  reading?: ReactNode
  children: ReactNode
}) {
  const id = useId()
  const [pane, setPane] = useState<'reading' | 'questions'>('questions')
  if (!source) return <>{children}</>
  return <div className={styles.workspace}>
    <div className={styles.switcher} role="group" aria-label="Reading check view">
      {(['reading', 'questions'] as const).map(value =>
        <button key={value} type="button" aria-controls={id + value} aria-pressed={pane === value} onClick={() => setPane(value)}>
          {value === 'reading' ? 'Reading & notes' : 'Questions'}
        </button>
      )}
    </div>
    <div className={styles.columns} data-pane={pane}>
      <section id={id + 'reading'} aria-label="Daily reading and notes" tabIndex={0} className={styles.reading}>
        <h2 className={styles.paneTitle}>Reading &amp; notes</h2>
        {reading ?? <BinderDailyReader source={source} heading={false}/>}
      </section>
      <section id={id + 'questions'} aria-label="Reading questions" tabIndex={0} className={styles.questions}>
        {children}
      </section>
    </div>
  </div>
}
