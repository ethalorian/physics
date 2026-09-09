'use client'

import { Sparkles } from 'lucide-react'
import { POINT_VALUES } from '@/lib/math-spine'
import { useTranslator } from '@/lib/math-translate-store'
import styles from './StudentMathInput.module.css'

export default function ProblemReward({ practice = false, earned = 0, lang = '' }: { practice?: boolean; earned?: number; lang?: string }) {
  const t = useTranslator(lang)
  const amount = earned || POINT_VALUES[practice ? 'practice-rep' : 'warmup-completion']
  return <div className={styles.problemReward} aria-label={t('Problem XP reward')}>
    <div className={styles.rewardAmount}><Sparkles size={19} aria-hidden="true" /><strong>{amount > 0 ? '+' : ''}{amount} XP</strong><span>{t(earned > 0 ? 'earned' : practice ? 'for a correct answer' : 'for submitting your work')}</span></div>
    {!practice && <details className={styles.rewardDetails}><summary>{t('Additional milestone XP')}</summary><p>{t('One-time milestones:')} <strong>+{POINT_VALUES['levelup-almost']} XP</strong> {t('for first reaching Almost;')} <strong>+{POINT_VALUES['competency-fluent']} XP</strong> {t('for first reaching Got it;')} <strong>+{POINT_VALUES['strand-complete']} XP</strong> {t('for completing a strand. Previously earned milestones do not pay again.')}</p></details>}
  </div>
}
