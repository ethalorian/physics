'use client'

import Link from 'next/link'
import { ArrowRight, Gamepad2 } from 'lucide-react'
import type { MathRemediation } from '@/lib/math-remediation'
import { useTranslator } from '@/lib/math-translate-store'

export default function MathGameRecommendation({ recommendation, compact = false, lang = '' }: {
  recommendation: MathRemediation | null
  compact?: boolean
  lang?: string
}) {
  const t = useTranslator(lang)
  if (!recommendation) return null
  return <aside aria-label={t('Recommended game practice')} className={compact ? 'space-y-2' : 'space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4'}>
    <p className="flex items-center gap-2 text-sm font-semibold"><Gamepad2 aria-hidden="true" size={19} />{t('Build this skill in a game')}</p>
    {!compact && <>
      <p className="text-sm">{recommendation.reason === 'teacher' ? t('Your teacher’s review points to a step to practice.') : t('This answer needs another look. A guided game can help you work through the skill.')} {t(recommendation.skill)}.</p>
      <ol className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label={t('Your practice path')}>
        <li>{t('1. Learn a strategy')}</li><li>{t('2. Try it in the game')}</li><li>{t('3. Check a fresh problem')}</li>
      </ol>
    </>}
    <Link href={recommendation.href} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
      {t('Practice in')} {recommendation.game}<ArrowRight aria-hidden="true" size={17} />
    </Link>
    {!compact && <p className="text-xs text-muted-foreground">{t('Take your time. Help is built in. Your teacher reviews your reasoning before your skill rating changes.')}</p>}
  </aside>
}
