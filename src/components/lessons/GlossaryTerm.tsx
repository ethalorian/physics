"use client"

import { useEffect, useId, useRef, useState } from 'react'

interface GlossaryTermProps {
  term: string
  definition: string
  cognate?: string
  /** the exact surface text matched in the prose (preserves the author's casing) */
  children: string
}

/**
 * A key term in lesson prose: a dotted underline that opens a definition
 * popover on hover (desktop) and tap/focus (touch + keyboard). Dismisses on
 * blur, mouse-leave, or Escape. Token-styled, accessible, no extra deps — it
 * stays inside the app's one design language rather than pulling in a second
 * popover primitive.
 */
export default function GlossaryTerm({ term, definition, cognate, children }: GlossaryTermProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLSpanElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDocClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDocClick)
    }
  }, [open])

  return (
    <span ref={wrapRef} style={{ position: 'relative', display: 'inline' }}>
      <span
        role="button"
        tabIndex={0}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v) } }}
        style={{
          cursor: 'help',
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textDecorationThickness: '1.5px',
          textUnderlineOffset: '3px',
          textDecorationColor: 'color-mix(in oklch, var(--primary) 60%, transparent)',
          color: 'inherit',
        }}
      >
        {children}
      </span>
      {open && (
        <span
          id={id}
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 40,
            left: 0,
            top: 'calc(100% + 6px)',
            width: 'max-content',
            maxWidth: 280,
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--card)',
            border: '1px solid color-mix(in oklch, var(--primary) 30%, var(--border))',
            boxShadow: '0 8px 28px -8px color-mix(in oklch, var(--primary) 35%, transparent)',
            color: 'var(--foreground)',
            fontWeight: 400,
            textAlign: 'left',
            whiteSpace: 'normal',
          }}
        >
          <span className="block text-overline" style={{ color: 'var(--primary)' }}>{term}</span>
          {cognate && (
            <span className="block text-[12px] italic" style={{ color: 'var(--muted-foreground)' }}>{cognate}</span>
          )}
          <span className="block text-[13px] mt-0.5" style={{ color: 'var(--foreground)', lineHeight: 1.4 }}>{definition}</span>
        </span>
      )}
    </span>
  )
}
