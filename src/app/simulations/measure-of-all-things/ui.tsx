"use client"

// Shared narrative + question components for "The Measure of All Things".
// Prose lives in string props (not JSX text) so apostrophes/quotes render
// freely without tripping react/no-unescaped-entities.

import { ReactNode, useState } from 'react'

/* ----------------------------- layout pieces ----------------------------- */

export function Scene({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-5 sm:p-6 space-y-4">
      {children}
    </div>
  )
}

export function YearBanner({ year, place }: { year: string; place: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 font-semibold tracking-wide">
        {year}
      </span>
      <span className="text-muted-foreground italic">{place}</span>
    </div>
  )
}

export function Narration({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-3">
      {lines.map((l, i) => (
        <p key={i} className="leading-relaxed text-[15px]">{l}</p>
      ))}
    </div>
  )
}

export function Speech({ who, text }: { who: string; text: string }) {
  return (
    <div className="border-l-4 border-amber-400 pl-3 py-1">
      <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{who}</div>
      <p className="italic leading-relaxed">{text}</p>
    </div>
  )
}

export function FactBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg bg-muted/60 border border-border p-3 text-sm">
      <span className="font-semibold">{title}: </span>
      <span className="text-muted-foreground">{text}</span>
    </div>
  )
}

export function NextButton({ label = 'Continue', onClick, disabled }: {
  label?: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
    >
      {label}
    </button>
  )
}

export function StepDots({ total, index }: { total: number; index: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${index + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${i <= index ? 'w-5 bg-amber-500' : 'w-2.5 bg-border'}`}
        />
      ))}
    </div>
  )
}

/* ------------------------------- questions ------------------------------- */

export interface MCProps {
  prompt: string
  choices: string[]
  answer: number
  explain: string
  /** Called once, the first time the correct answer is chosen. firstTry = no wrong picks before it. */
  onDone: (firstTry: boolean) => void
}

export function MC({ prompt, choices, answer, explain, onDone }: MCProps) {
  const [picked, setPicked] = useState<number | null>(null)
  const [wrongPicks, setWrongPicks] = useState<Set<number>>(new Set())
  const [solved, setSolved] = useState(false)

  const pick = (i: number) => {
    if (solved) return
    setPicked(i)
    if (i === answer) {
      setSolved(true)
      onDone(wrongPicks.size === 0)
    } else {
      setWrongPicks(prev => new Set(prev).add(i))
    }
  }

  return (
    <div className="space-y-3">
      <p className="font-medium">{prompt}</p>
      <div className="grid gap-2">
        {choices.map((c, i) => {
          const isWrong = wrongPicks.has(i)
          const isRight = solved && i === answer
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              disabled={solved || isWrong}
              className={`text-left px-3 py-2 rounded-lg border transition text-[15px]
                ${isRight ? 'border-green-500 bg-green-50 dark:bg-green-950/40' :
                  isWrong ? 'border-red-300 bg-red-50 dark:bg-red-950/30 opacity-60' :
                  'border-border bg-background hover:border-amber-400'}`}
            >
              {c}
            </button>
          )
        })}
      </div>
      {picked !== null && !solved && (
        <p className="text-sm text-red-600 dark:text-red-400">Not quite — think it through and try another.</p>
      )}
      {solved && (
        <p className="text-sm rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-300 dark:border-green-800 p-3">
          {explain}
        </p>
      )}
    </div>
  )
}

export interface NumQProps {
  prompt: string
  unit: string
  answer: number
  /** Relative tolerance (fraction of answer). Defaults to 2%. */
  tolerance?: number
  hint: string
  onDone: (firstTry: boolean) => void
}

export function NumQ({ prompt, unit, answer, tolerance = 0.02, hint, onDone }: NumQProps) {
  const [value, setValue] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [solved, setSolved] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const check = () => {
    if (solved) return
    const v = parseFloat(value.replace(/,/g, ''))
    if (Number.isNaN(v)) {
      setFeedback('Enter a number.')
      return
    }
    const tol = Math.max(Math.abs(answer) * tolerance, 1e-9)
    if (Math.abs(v - answer) <= tol) {
      setSolved(true)
      setFeedback(null)
      onDone(attempts === 0)
    } else {
      setAttempts(a => a + 1)
      setFeedback(attempts + 1 >= 2 ? `Hint: ${hint}` : 'Not quite — check your reasoning and try again.')
    }
  }

  return (
    <div className="space-y-3">
      <p className="font-medium">{prompt}</p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') check() }}
          disabled={solved}
          className="w-36 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
          aria-label={prompt}
        />
        <span className="text-muted-foreground font-medium">{unit}</span>
        {!solved && (
          <button
            type="button"
            onClick={check}
            className="px-3 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition"
          >
            Check
          </button>
        )}
        {solved && <span className="text-green-600 dark:text-green-400 font-semibold">Correct</span>}
      </div>
      {feedback && !solved && <p className="text-sm text-red-600 dark:text-red-400">{feedback}</p>}
    </div>
  )
}
