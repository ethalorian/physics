import type { ReactNode } from 'react'

/**
 * Admin/teacher layout.
 *
 * Staff work on Mac displays (wide gamut, high contrast, good viewing angles),
 * unlike students on cheap Chromebook LCDs. The `surface-refined` scope (see
 * globals.css) swaps the Chromebook-hardened defaults for a more delicate
 * treatment on these screens only — finer hairline borders, softer shadows —
 * while inheriting the same palette, type scale, and components. One system,
 * one refined sub-surface; no second design language.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="surface-refined">{children}</div>
}
