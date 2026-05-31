import { cn } from '@/lib/utils'

/**
 * ProgressTrack — the prototype's slim progress bar.
 *
 * A calm 7px track with a primary fill that eases in. Use for lesson progress,
 * mastery, completion — anywhere a 0–100 ratio is shown. The fill transition is
 * disabled automatically under prefers-reduced-motion (global guard).
 *
 * Usage: <ProgressTrack value={62} />
 */
export function ProgressTrack({
  value,
  className,
  'aria-label': ariaLabel,
}: {
  value: number
  className?: string
  'aria-label'?: string
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel ?? 'Progress'}
      className={cn('h-[7px] w-full rounded-full bg-secondary overflow-hidden', className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
