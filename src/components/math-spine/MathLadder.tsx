'use client'

/**
 * MathLadder — the student-facing map of the skill ladder (redesign decision 4).
 *
 * Makes the invisible picker visible: every rung in order, its state in the one
 * student vocabulary (Not yet / Almost / Got it / Needs a refresh), a "today"
 * marker on the rung the picker chose, and a plain-language explainer of how
 * rungs advance. Pure/presentational; both the warm-up page (compact) and the
 * math-literacy dashboard (full) render it from the same rung states computed
 * by src/lib/math-spine-picker.ts — the map IS the picker's view.
 */
import { RUNG_STATE_LABEL, type RungState } from '@/lib/math-spine-picker'

export interface LadderRung {
  competencyId: string
  code: string
  statement: string
  state: RungState
  isToday?: boolean
}

const STATE_STYLE: Record<RungState, { bg: string; fg: string; icon: string }> = {
  'got-it': { bg: 'var(--viz-up-surface)', fg: 'var(--viz-up)', icon: '★' },
  'almost': { bg: 'color-mix(in oklch, var(--primary) 12%, transparent)', fg: 'var(--primary)', icon: '◐' },
  'not-yet': { bg: 'var(--muted)', fg: 'var(--muted-foreground)', icon: '○' },
  'refresh': { bg: 'color-mix(in oklch, #f59e0b 14%, transparent)', fg: '#b45309', icon: '↻' },
}

export default function MathLadder({
  rungs,
  compact = false,
}: {
  rungs: LadderRung[]
  compact?: boolean
}) {
  if (rungs.length === 0) return null
  const gotIt = rungs.filter((r) => r.state === 'got-it').length

  if (compact) {
    // One-line strip for the warm-up page: dots up the ladder + today marker.
    return (
      <div className="flex items-center gap-1.5 flex-wrap" aria-label="your skill ladder">
        {rungs.map((r) => {
          const s = STATE_STYLE[r.state]
          return (
            <span
              key={r.competencyId}
              title={`${r.code} — ${RUNG_STATE_LABEL[r.state]}${r.isToday ? ' (today)' : ''}`}
              className="inline-flex items-center justify-center rounded-full text-[10px] font-bold tabular-nums"
              style={{
                width: 22,
                height: 22,
                background: s.bg,
                color: s.fg,
                outline: r.isToday ? '2px solid var(--primary)' : 'none',
                outlineOffset: 1,
              }}
            >
              {r.state === 'got-it' ? '★' : r.code.replace(/[^0-9]/g, '') || '·'}
            </span>
          )
        })}
        <span className="text-[11px] text-muted-foreground ml-1">
          {gotIt} of {rungs.length} at “Got it”
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card" style={{ borderColor: 'var(--border)' }}>
      <div className="px-4 pt-3 pb-2">
        <p className="text-sm font-medium text-foreground">Your skill ladder</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          One skill at a time, bottom to top. Your daily warm-up always targets the rung that
          needs you most: a “Needs a refresh” rung jumps the queue, then the lowest rung not yet
          at “Got it”. A skill reaches <b>Got it</b> when your recent ratings average 2.5+.
        </p>
      </div>
      <div className="px-4 pb-3">
        {[...rungs].reverse().map((r, i) => {
          const s = STATE_STYLE[r.state]
          return (
            <div
              key={r.competencyId}
              className="flex items-center gap-3 py-2"
              style={{ borderTop: i === 0 ? 'none' : '0.5px solid var(--secondary)' }}
            >
              <span
                aria-hidden
                className="inline-flex items-center justify-center rounded-full text-[11px] font-bold"
                style={{ width: 24, height: 24, background: s.bg, color: s.fg }}
              >
                {s.icon}
              </span>
              <span
                className="text-[11px] font-medium rounded px-2 py-0.5 tabular-nums"
                style={{ background: 'var(--secondary)', color: 'var(--foreground)' }}
              >
                {r.code}
              </span>
              <span className="flex-1 text-[13px] leading-snug text-foreground">{r.statement}</span>
              {r.isToday && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5"
                  style={{ background: 'color-mix(in oklch, var(--primary) 12%, transparent)', color: 'var(--primary)' }}
                >
                  today
                </span>
              )}
              <span className="text-xs font-medium" style={{ color: s.fg }}>
                {RUNG_STATE_LABEL[r.state]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
