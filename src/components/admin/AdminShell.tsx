"use client"

import { useEffect, useState, type ReactNode } from 'react'
import LibraryWorkspaceNav from './LibraryWorkspaceNav'
import { librarySectionForPath } from '@/lib/library-navigation'
import ResumeTeaching from './ResumeTeaching'
import { useClassScope } from '@/lib/use-class-scope'
import { useLessonContext } from './useLessonContext'
import { scopedTeachingHref, teachingNavActive } from '@/lib/teaching-navigation'
import LobbyLauncher from '@/components/admin/LobbyLauncher'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import type { UserRole } from '@/lib/permissions'
import type { ContentArea } from '@/lib/content-access'
import { GROUPS, gateGroups, flatTools } from './adminNav'
import { BookOpen } from 'lucide-react'
import AdminCommand from './AdminCommand'
import { Menu, X } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'

/**
 * Persistent admin/teacher shell: a grouped sidebar (the launcher, moved into
 * the nav) + a header carrying the global search. Replaces the old
 * card → page → "← Command center" loop so context is always held. Role gating
 * uses the server-resolved preview role (adminOnly tools hidden for teachers), the active
 * route is highlighted with `--primary`, and the sidebar collapses to a drawer
 * on narrow widths. Lives inside `.surface-refined` (set by admin/layout).
 */
export default function AdminShell({ children, effectiveRole, editableAreas = [] }: { children: ReactNode; effectiveRole: UserRole; editableAreas?: ContentArea[] }) {
  const context = useLessonContext()
  const { classId: sharedClassId } = useClassScope()
  const search = useSearchParams().toString()
  const scopedHref = (href: string) => scopedTeachingHref(href, search, sharedClassId ?? context.classId)
  const role = effectiveRole
  const { data: session, status } = useSession()
  const isAdmin = role === 'admin'
  const pathname = usePathname()
  // Observer: read-only sidebar — the FULL Insights group (mastery analytics,
  // app oversight, leaderboard) plus curriculum resources. adminOnly flags don't apply;
  // the observer role is itself the gate, and every destination is read-only.
  const observerGroups: typeof GROUPS = [
    { title: 'Insights', tools: (GROUPS.find((g) => g.title === 'Insights')?.tools ?? []).filter(t => t.href !== '/admin/collaborators') },
    {
      title: 'Plan',
      tools: [
        { href: '/admin/teacher/plans', label: 'Course plans', desc: 'Asteroid course plans and Trades plans', icon: BookOpen, accent: 'var(--primary)' },
        { href: '/lessons', label: 'Lessons & concept map', desc: 'Published video lessons and connected ideas, read-only', icon: BookOpen, accent: 'var(--primary)' },
        { href: '/admin/library?section=materials', label: 'Library', desc: 'Textbook, simulations, and teaching plans', icon: BookOpen, accent: 'var(--primary)' },
      ],
    },
  ]
  const groups = role === 'observer' ? observerGroups : gateGroups(GROUPS, isAdmin, editableAreas)
  const tools = (role === 'observer' ? groups.flatMap(group => group.tools) : flatTools(isAdmin, editableAreas)).map(tool => ({ ...tool, href: scopedHref(tool.href) }))
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileOpen(false) }, [pathname, search])

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

  const librarySection = librarySectionForPath(pathname, search)
  const isActive = (href: string) => teachingNavActive(pathname, search, href)

  const homeHref = role === 'observer' ? '/admin/analytics' : scopedHref('/admin/control-room?view=plan')
  const roleLabel = isAdmin ? 'Admin' : role === 'observer' ? 'Observer' : 'Teacher'

  if (pathname === '/admin/command-center' || pathname === '/admin/projector') return <div className="teaching-workspace">{children}</div>

  if (pathname === '/admin/observe') return <div className="observation-workspace">{children}</div>

  const NavBody = (
    <div className="flex flex-col h-full" style={{ background: 'var(--card)' }}>
      <Link href={homeHref} className="flex items-center gap-2 px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <BrandLogo decorative />
        <span className="min-w-0">
          <span className="block text-sm font-bold tracking-tight truncate" style={{ color: 'var(--foreground)' }}>Antocci Physics</span>
          <span className="block text-overline" style={{ color: 'var(--muted-foreground)' }}>{roleLabel} suite</span>
        </span>
      </Link>

      <nav aria-label={`${roleLabel} navigation`} className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((g) => (
          <div key={g.title} className="mb-4">
            <div className="text-overline px-2 mb-1.5" style={{ color: 'var(--muted-foreground)' }}>{g.title}</div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {(g.expanded ? g.tools : g.tools.slice(0, 1)).map((t) => {
                const Ico = t.icon
                const act = isActive(t.href)
                return (
                  <li key={t.href}>
                    <Link
                      href={scopedHref(t.href)}
                      aria-current={act ? 'page' : undefined}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm"
                      style={{
                        position: 'relative',
                        color: act ? 'var(--primary)' : 'var(--foreground)',
                        background: act ? 'color-mix(in oklch, var(--primary) 10%, transparent)' : 'transparent',
                        fontWeight: act ? 600 : 400,
                      }}
                    >
                      {act && <span aria-hidden style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 3, borderRadius: 'var(--radius-xs)', background: 'var(--primary)' }} />}
                      <Ico size={17} style={{ color: act ? 'var(--primary)' : t.accent, opacity: act ? 1 : 0.85, flexShrink: 0 }} />
                      <span className="truncate">{t.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
            {!g.expanded && g.tools.length > 1 && <details open={g.tools.slice(1).some(t => isActive(t.href)) || undefined} className="mt-1"><summary className="min-h-11 cursor-pointer px-2 py-3 text-xs text-muted-foreground">More {g.title.toLowerCase()} tools</summary><ul className="space-y-1 pl-2">{g.tools.slice(1).map(t => <li key={t.href}><Link href={scopedHref(t.href)} aria-current={isActive(t.href) ? 'page' : undefined} className={`flex min-h-11 items-center rounded-lg px-2 py-2 text-sm ${isActive(t.href) ? 'bg-primary/10 font-semibold' : ''}`}>{t.label}</Link></li>)}</ul></details>}
          </div>
        ))}
      </nav>
    </div>
  )

  return (
    <div className="lg:grid lg:items-start" style={{ gridTemplateColumns: '248px minmax(0, 1fr)' }}>
      {/* L-1 · the lobby launcher rides on every staff surface (press L) */}
      {role !== 'observer' && <LobbyLauncher />}
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
              style={{ top: 12, right: -46, width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--card)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--foreground)' }}
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
            style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer', color: 'var(--foreground)' }}
          >
            <Menu size={18} />
          </button>
          <AdminCommand tools={tools} />
          {role!=='observer' && <ResumeTeaching/>}
          <div className="ml-auto text-xs hidden sm:block truncate" style={{ color: 'var(--muted-foreground)', maxWidth: 200 }}>
            {session?.user?.name ?? ''}
          </div>
        </header>
        <div>{librarySection && pathname !== '/admin/library' && <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6"><p className="mb-3 text-overline text-muted-foreground">Library</p><LibraryWorkspaceNav active={librarySection} isAdmin={isAdmin} /></div>}{children}</div>
      </div>
    </div>
  )
}
