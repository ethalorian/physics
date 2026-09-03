"use client"

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { useViewAs } from '@/lib/use-view-as'
import { GROUPS, gateGroups, flatTools } from './adminNav'
import { BookOpen } from 'lucide-react'
import AdminCommand from './AdminCommand'
import { Menu, X, FlaskConical } from 'lucide-react'

/**
 * Persistent admin/teacher shell: a grouped sidebar (the launcher, moved into
 * the nav) + a header carrying the global search. Replaces the old
 * card → page → "← Command center" loop so context is always held. Role gating
 * is preserved via `useViewAs` (adminOnly tools hidden for teachers), the active
 * route is highlighted with `--primary`, and the sidebar collapses to a drawer
 * on narrow widths. Lives inside `.surface-refined` (set by admin/layout).
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  const { role } = useViewAs()
  const { data: session, status } = useSession()
  const isAdmin = role === 'admin'
  const pathname = usePathname()
  // Observer: read-only sidebar — the FULL Insights group (mastery analytics,
  // app oversight, leaderboard) plus lesson plans. adminOnly flags don't apply;
  // the observer role is itself the gate, and every destination is read-only.
  const observerGroups: typeof GROUPS = [
    GROUPS.find((g) => g.title === 'Insights') ?? { title: 'Insights', tools: [] },
    {
      title: 'Plan',
      tools: [
        { href: '/admin/teacher/plans', label: 'Lesson plans', desc: 'Every class type, read-only', icon: BookOpen, accent: 'var(--primary)' },
      ],
    },
  ]
  const groups = role === 'observer' ? observerGroups : gateGroups(GROUPS, isAdmin)
  const tools = flatTools(isAdmin)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Signed-out visitors to any staff page get bounced to Google sign-in instead
  // of a shell full of failed fetches ("Could not load..." with no way forward).
  useEffect(() => {
    if (status === 'unauthenticated') signIn(undefined, { callbackUrl: pathname ?? '/admin/home' })
  }, [status, pathname])

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Redirecting to sign-in&hellip;
      </div>
    )
  }

  const isActive = (href: string) =>
    href === '/home' ? pathname === '/home' : pathname === href || pathname.startsWith(href + '/')

  const roleLabel = isAdmin ? 'Admin' : role === 'observer' ? 'Observer' : 'Teacher'

  const NavBody = (
    <div className="flex flex-col h-full" style={{ background: 'var(--card)' }}>
      <Link href="/admin/home" className="flex items-center gap-2 px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="grid place-items-center shrink-0" style={{ width: 32, height: 32, borderRadius: 9, background: 'color-mix(in oklch, var(--primary) 16%, transparent)', color: 'var(--primary)' }}>
          <FlaskConical size={18} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold tracking-tight truncate" style={{ color: 'var(--foreground)' }}>Antocci Physics</span>
          <span className="block text-overline" style={{ color: 'var(--muted-foreground)' }}>{roleLabel} suite</span>
        </span>
      </Link>

      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((g) => (
          <div key={g.title} className="mb-4">
            <div className="text-overline px-2 mb-1.5" style={{ color: 'var(--muted-foreground)' }}>{g.title}</div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {g.tools.map((t) => {
                const Ico = t.icon
                const act = isActive(t.href)
                return (
                  <li key={t.href}>
                    <Link
                      href={t.href}
                      aria-current={act ? 'page' : undefined}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm"
                      style={{
                        position: 'relative',
                        color: act ? 'var(--primary)' : 'var(--foreground)',
                        background: act ? 'color-mix(in oklch, var(--primary) 10%, transparent)' : 'transparent',
                        fontWeight: act ? 600 : 400,
                      }}
                    >
                      {act && <span aria-hidden style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 3, borderRadius: 2, background: 'var(--primary)' }} />}
                      <Ico size={17} style={{ color: act ? 'var(--primary)' : t.accent, opacity: act ? 1 : 0.85, flexShrink: 0 }} />
                      <span className="truncate">{t.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )

  return (
    <div className="lg:grid lg:items-start" style={{ gridTemplateColumns: '248px minmax(0, 1fr)' }}>
      {/* desktop sidebar */}
      <aside className="hidden lg:block sticky top-0" style={{ height: '100vh', borderRight: '1px solid var(--border)' }}>
        {NavBody}
      </aside>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" onMouseDown={() => setMobileOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'color-mix(in oklch, var(--foreground) 28%, transparent)' }} />
          <div className="relative" style={{ width: 264, maxWidth: '82vw', boxShadow: '0 24px 60px -12px color-mix(in oklch, var(--primary) 35%, transparent)' }} onMouseDown={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute"
              style={{ top: 12, right: -42, width: 34, height: 34, borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--foreground)' }}
            >
              <X size={17} />
            </button>
            {NavBody}
          </div>
        </div>
      )}

      {/* main column */}
      <div className="min-w-0">
        <header
          className="sticky top-0 z-30 flex items-center gap-3 px-4 py-2.5"
          style={{ background: 'color-mix(in oklch, var(--background) 90%, transparent)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="lg:hidden grid place-items-center shrink-0"
            style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer', color: 'var(--foreground)' }}
          >
            <Menu size={18} />
          </button>
          <AdminCommand tools={tools} />
          <div className="ml-auto text-xs hidden sm:block truncate" style={{ color: 'var(--muted-foreground)', maxWidth: 200 }}>
            {session?.user?.name ?? ''}
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}
