'use client'

import Link from 'next/link'
import {missionForCode,missionHref} from '@/lib/math-missions/catalog'
import { useEffect, useRef } from 'react'
import { Target } from 'lucide-react'
import { useTranslator } from '@/lib/math-translate-store'
import styles from './StudentMathInput.module.css'

/** The task's own standard, never inferred from its prompt or the student's answer. */
export default function StandardFocus({ code, statement, mode = 'assessment', lang = '' }: {
  code: string
  statement: string
  mode?: 'assessment' | 'practice' | 'submitted'
  lang?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const t = useTranslator(lang)
  useEffect(() => {
    const panel = ref.current
    const studio = panel?.closest<HTMLElement>('[data-math-studio]')
    const nav = document.querySelector('nav')
    if (!panel) return
    const measure = () => {
      const offset = nav?.getBoundingClientRect().height ?? 0
      panel.style.setProperty('--math-nav-height', `${offset}px`)
      if (studio && mode === 'assessment') {
        studio.style.setProperty('--math-nav-height', `${offset}px`)
        studio.style.setProperty('--math-focus-height', `${panel.getBoundingClientRect().height}px`)
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(panel)
    if (nav) observer.observe(nav)
    return () => observer.disconnect()
  }, [mode])
  return <section ref={ref} className={`${styles.standardFocus} ${mode === 'submitted' ? styles.standardStatic : ''}`} aria-label={t(mode === 'practice' ? 'Practice standard' : 'Assessed standard')}>
    <div className={styles.standardIcon}><Target size={23} aria-hidden="true" /></div>
    <div className={styles.standardContent}>
      <div className={styles.standardHeading}><span>{t(mode === 'practice' ? 'Practicing now' : mode === 'submitted' ? 'Submitted for assessment' : 'Assessing now')}</span><span className={styles.standardCode}>{code}</span><span>{t('Mathematics')}</span></div>
      <p>{t(statement)}</p>
      <span className={styles.standardNote}>{t(mode === 'practice' ? 'Practice only · this check does not change your teacher rating.' : 'Your teacher assesses this standard from your work and explanation.')}</span>
    {mode!=="assessment"&&missionForCode(code)&&<Link className="inline-flex min-h-11 items-center text-sm underline" href={missionHref(code)}>Practice this skill in a math mission →</Link>}
    </div>
  </section>
}
