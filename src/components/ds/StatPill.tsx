import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * StatPill — the prototype's small status/stat chip (XP, streak, counts, tags).
 *
 * Tone maps to a brand token so color always carries meaning, never decoration:
 *   reward  = earned/achievement (solid gold)   success = positive/complete
 *   primary = in-progress/brand                  muted   = neutral/secondary
 *
 * Reward is the only solid-fill tone (it's the genuine "prize" accent, used
 * sparingly per the audit's gold dial); the rest are soft tints so the UI
 * stays calm. Usage: <StatPill tone="reward">★ 1,240 XP</StatPill>
 */
type Tone = 'reward' | 'success' | 'primary' | 'muted'

const TONES: Record<Tone, string> = {
  reward: 'bg-reward text-reward-foreground',
  success: 'bg-success/15 text-success',
  primary: 'bg-primary/12 text-primary',
  muted: 'bg-muted text-muted-foreground',
}

export function StatPill({
  children,
  tone = 'muted',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
