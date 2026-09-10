import { auth } from '@/lib/auth'
import { getEditableAreas } from '@/lib/content-access'
import { getEffectiveContext } from '@/lib/effective-context'
import type { ReactNode } from 'react'
import { QuestionBankProvider } from '@/contexts/QuestionBankContext'
import { VocabularyProvider } from '@/contexts/VocabularyContext'
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
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  const context = session?.user?.email ? await getEffectiveContext(session.user.email) : null
  const editableAreas = context ? await getEditableAreas(context.scopeEmail, context.role === 'admin') : []
  return (
    <div className="surface-refined">
      <QuestionBankProvider>
        <VocabularyProvider>
          <AdminShell effectiveRole={context?.role ?? 'student'} editableAreas={editableAreas}>{children}</AdminShell>
        </VocabularyProvider>
      </QuestionBankProvider>
    </div>
  )
}
