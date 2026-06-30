import type { ReactNode } from 'react'
import AdminShell from '@/components/admin/AdminShell'

/**
 * Admin/teacher layout.
 *
 * Staff work on Mac displays (wide gamut, high contrast, good viewing angles),
 * unlike students on cheap Chromebook LCDs. The `surface-refined` scope (see
 * globals.css) swaps the Chromebook-hardened defaults for a more delicate
 * treatment on these screens only — finer hairline borders, softer shadows —
 * while inheriting the same palette, type scale, and components. One system,
 * one refined sub-surface; no second design language.
 *
 * `AdminShell` adds the persistent grouped sidebar + global search so the suite
 * holds context across its ~25 destinations instead of bouncing through a
 * launcher and back-links.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="surface-refined">
      <AdminShell>{children}</AdminShell>
    </div>
  )
}
