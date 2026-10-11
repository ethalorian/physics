'use client'

import { Sparkles } from 'lucide-react'
import { POINT_VALUES } from '@/lib/math-spine'
import { useTranslator } from '@/lib/math-translate-store'
import styles from './StudentMathInput.module.css'
import type { MathXpStatus } from '@/lib/xp-policy'

export default function ProblemReward({ practice = false, earned = null, status, lang = '' }: { practice?: boolean; earned?: number | null; status?: MathXpStatus | null; lang?: string }) {
  const t = useTranslator(lang)
  const amount = earned ?? (status?.remaining === 0 ? 0 : POINT_VALUES[practice ? 'practice-rep' : 'warmup-completion'])
  const label = earned !== null ? earned > 0 ? 'credited for this problem' : 'Daily Math / Arcade XP limit reached; your work is saved.' : status?.remaining === 0 ? 'Daily Math / Arcade XP limit reached' : practice ? 'for a correct answer, within the daily limit' : 'for submitting your work, within the daily limit'
  return <div className={styles.problemReward} aria-label={t('Problem XP reward')}>
    <div className={styles.rewardAmount}><Sparkles size={19} aria-hidden="true" /><strong>{amount > 0 ? '+' : ''}{amount} XP</strong><span>{t(label)}</span></div>
    {status && <p className="text-sm text-muted-foreground">{t('Math / Arcade XP today:')} {status.dailyEarned} / {status.dailyCap}. {t('Resets at')} {new Date(status.resetsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. {t('Milestone rewards are separate.')}</p>}
    {!practice && <details className={styles.rewardDetails}><summary>{t('Additional milestone XP')}</summary><p>{t('One-time milestones:')} <strong>+{POINT_VALUES['levelup-almost']} XP</strong> {t('for first reaching Almost;')} <strong>+{POINT_VALUES['competency-fluent']} XP</strong> {t('for first reaching Got it;')} <strong>+{POINT_VALUES['strand-complete']} XP</strong> {t('for completing a strand. Previously earned milestones do not pay again.')}</p></details>}
  </div>
}
