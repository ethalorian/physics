import type { ReactNode, CSSProperties } from 'react'
import { cn } from '@/lib/utils'

/**
 * SectionLabel — the prototype's "lane" header.
 *
 * An uppercase overline with a short colored accent bar. This is the canonical
 * way to title a section/lane across the app (Home lanes, dashboards, panels).
 * Pass an `accent` token to color the bar by meaning:
 *   primary = navigation/continue · reward = achievement · success = positive
 *   destructive = needs attention · secondary = neutral
 *
 * Usage: <SectionLabel accent="var(--primary)">Continue your journey</SectionLabel>
 */
export function SectionLabel({
  children,
  accent = 'var(--primary)',
  className,
  style,
}: {
  children: ReactNode
  accent?: string
  className?: string
  style?: CSSProperties
}) {
  return (
    <div className={cn('flex items-center gap-2 mt-8 mb-3 text-overline', className)} style={style}>
      <span aria-hidden style={{ width: 22, height: 3, borderRadius: 2, background: accent }} />
      {children}
    </div>
  )
}
