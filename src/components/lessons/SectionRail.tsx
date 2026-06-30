"use client"

import { Check } from 'lucide-react'
import type { LessonSection } from './lesson-sections'

interface SectionRailProps {
  sections: LessonSection[]
  currentIndex: number
  isComplete: (index: number) => boolean
  onJump: (index: number) => void
}

type DotState = 'done' | 'current' | 'todo'

function stateFor(index: number, currentIndex: number, done: boolean): DotState {
  if (index === currentIndex) return 'current'
  if (done || index < currentIndex) return 'done'
  return 'todo'
}

/**
 * Sticky section rail — the lesson's wayfinding spine (desktop).
 *
 * One node per section, threaded by a connector line. Done = solid --primary
 * with a check; current = --reward ring (the single wayfinding accent, matching
 * the Home journey-map); todo = dashed --border. Clicking a node jumps to that
 * section via the viewer's paginated `goTo`. Hidden under `lg` — narrow screens
 * get the segmented bar in the header instead.
 */
export default function SectionRail({ sections, currentIndex, isComplete, onJump }: SectionRailProps) {
  return (
    <nav aria-label="Lesson sections" className="hidden lg:block">
      <div className="text-overline mb-3" style={{ color: 'var(--muted-foreground)' }}>Sections</div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {sections.map((sec, i) => {
          const done = isComplete(i)
          const state = stateFor(i, currentIndex, done)
          const isLast = i === sections.length - 1
          return (
            <li key={i} className="relative">
              {/* connector thread between nodes */}
              {!isLast && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute', left: 10, top: 22, bottom: -6, width: 2,
                    background: state === 'done' ? 'var(--primary)' : 'var(--border)',
                  }}
                />
              )}
              <button
                onClick={() => onJump(i)}
                aria-current={state === 'current' ? 'step' : undefined}
                aria-label={`Section ${i + 1} of ${sections.length}: ${sec.title}${state === 'done' ? ' (done)' : state === 'current' ? ' (current)' : ''}`}
                className="group flex items-start gap-3 w-full text-left rounded-lg px-1.5 py-1.5"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <span
                  className="grid place-items-center shrink-0"
                  style={{
                    width: 22, height: 22, borderRadius: '50%', marginTop: 1,
                    transition: 'all .2s cubic-bezier(0.16,1,0.3,1)',
                    background: state === 'done' ? 'var(--primary)' : 'var(--card)',
                    color: state === 'done' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                    border:
                      state === 'current'
                        ? '2px solid var(--reward)'
                        : state === 'done'
                          ? '2px solid var(--primary)'
                          : '1.5px dashed var(--border)',
                    boxShadow: state === 'current' ? '0 0 0 3px color-mix(in oklch, var(--reward) 22%, transparent)' : 'none',
                  }}
                >
                  {state === 'done' ? (
                    <Check size={13} />
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: state === 'current' ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{i + 1}</span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block text-sm leading-snug truncate"
                    style={{
                      color: state === 'current' ? 'var(--foreground)' : state === 'done' ? 'var(--foreground)' : 'var(--muted-foreground)',
                      fontWeight: state === 'current' ? 600 : 400,
                    }}
                  >
                    {sec.title}
                  </span>
                  {sec.minutes > 0 && (
                    <span className="block text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                      ~{sec.minutes} min{sec.hasCapture ? ' · task' : ''}
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
