"use client"

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, HelpCircle, Settings2, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Shared chrome for every arcade vocab game (one build, ten games):
//   - Back goes straight to /arcade in ONE hop (never via the /vocabulary
//     redirect page).
//   - The old "How to Play" wall is a one-line hint; full rules live behind
//     the "?" toggle for whoever wants them.
//   - Setup is demoted to a collapsed "Options" panel. The panel stays
//     MOUNTED when closed (hidden with CSS) so the VocabPlaySource inside
//     keeps its selection state while the board is up.
// Colors come from the OKLCH tokens only — no raw Tailwind palette classes.

interface Props {
  icon: LucideIcon
  title: string
  /** One-line "how to play" that replaces the old instruction wall. */
  hint: string
  /** Full rules, shown only when the "?" toggle is open. */
  help?: ReactNode
  /** Setup controls (play source, difficulty, …) behind the Options toggle. */
  options?: ReactNode
  /** Keep Options open regardless of the toggle (e.g. not enough terms). */
  forceOptionsOpen?: boolean
  /** What's loaded, e.g. "Unit 3 · Forces · 24 terms". */
  sourceLabel?: string | null
  children: ReactNode
}

export default function VocabGameShell({
  icon: Icon,
  title,
  hint,
  help,
  options,
  forceOptionsOpen = false,
  sourceLabel,
  children,
}: Props) {
  const [helpOpen, setHelpOpen] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const showOptions = optionsOpen || forceOptionsOpen

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/arcade">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Arcade
          </Link>
        </Button>
        <Icon className="h-7 w-7 shrink-0" style={{ color: 'var(--primary)' }} aria-hidden />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {hint}
            {sourceLabel ? <span> · {sourceLabel}</span> : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {help ? (
            <Button
              variant="outline"
              size="sm"
              aria-label="How to play"
              aria-expanded={helpOpen}
              onClick={() => setHelpOpen((v) => !v)}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          ) : null}
          {options ? (
            <Button
              variant="outline"
              size="sm"
              aria-expanded={showOptions}
              onClick={() => setOptionsOpen((v) => !v)}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Options
            </Button>
          ) : null}
        </div>
      </div>

      {help && helpOpen ? (
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {help}
            </div>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              aria-label="Close how to play"
              className="shrink-0"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {options ? (
        <div
          className={showOptions ? 'rounded-xl border p-4 space-y-4' : 'hidden'}
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          {options}
        </div>
      ) : null}

      {children}
    </div>
  )
}

/** Shared "words are on their way" placeholder while the play source resolves its default. */
export function VocabLoadingBoard({ label = 'Finding your words…' }: { label?: string }) {
  return (
    <div
      className="rounded-xl border p-10 flex flex-col items-center justify-center gap-3"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
    </div>
  )
}

/** Shared empty state when the current selection can't seed a board. */
export function VocabEmptyBoard({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl border border-dashed p-10 text-center"
      style={{ borderColor: 'var(--border)' }}
    >
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{message}</p>
    </div>
  )
}
