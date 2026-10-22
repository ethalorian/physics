"use client"

// React/Next.js imports
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// External package imports
import { useSession, signIn } from "next-auth/react"
import { Menu, BookOpen, BookText, Settings, Home, Trophy, Gift, LayoutGrid, Users, Sigma, Joystick, Eye } from "lucide-react"

// Internal imports
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { PhysicsLevelBadge } from "@/components/physics-level-badge"
import { useViewAs } from "@/lib/use-view-as"
import { clearViewAs, clearStudentView } from "@/lib/view-as-shared"
import { useViewMode } from "@/contexts/ViewModeContext"
import { useViewAwarePermissions } from "@/hooks/useViewAwarePermissions"
import AccountMenu from "@/components/AccountMenu"
import NotificationBell from "@/components/NotificationBell"
import { useLessonContext } from '@/components/admin/useLessonContext'
import { lessonContextHref } from '@/lib/lesson-release'
import StudentNavigation from "@/components/StudentNavigation"
import BrandLogo from "@/components/BrandLogo"

export default function Navbar() {
  const { data: session, status } = useSession()
  const { viewMode } = useViewMode()
  const pathname = usePathname()
  const context = useLessonContext()
  const navigationHref=(path:string)=>['/admin/dashboard','/admin/control-room'].includes(path)?lessonContextHref(path,{class:context.classId,lesson:context.lessonId}):path

  // Use view-aware permissions for navigation decisions
  const {
    isAuthenticated
  } = useViewAwarePermissions(viewMode)

  // "View as teacher" (admin previewing the colleague experience)
  const { role, viewingAs, teacherEmail } = useViewAs()

  // Staff = effective teacher or admin. The nav branches on THIS, not on
  // canAccessAdmin — that flag is admin-only, which is exactly the bug that
  // dropped DB-granted teachers into the student nav by default. "View as
  // student" (viewMode, cookie-persisted) overrides it back to the student nav.
  const isStaff = role === 'teacher' || role === 'admin'
  const studentViewActive = isStaff && viewMode === 'student'

  // Prevent hydration errors by ensuring client-side rendering for auth-dependent content
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Presence: stamp "last seen" once per page load/navigation (staff only). This is
  // a page-load check — no polling timer — so the oversight dashboard can show who
  // is currently active without any background job.
  const sessionRole = session?.user?.role
  useEffect(() => {
    if (!session?.experience && (sessionRole === 'admin' || sessionRole === 'teacher')) {
      fetch('/api/presence/ping', { method: 'POST' }).catch(() => {})
    }
  }, [pathname, sessionRole, session?.experience])

  // Show loading state while session is loading to prevent hydration mismatch
  const isLoading = !mounted || status === "loading"

  // Navigation items based on user role and authentication
  const getNavigationItems = () => {
    if (!isAuthenticated) return []

    // Observer (principal / coach): insights and read-only curriculum access.
    if (role === 'observer') {
      return [
        { href: "/admin/analytics", label: "Mastery", icon: LayoutGrid },
        { href: "/admin/oversight", label: "Oversight", icon: Settings },
        { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { href: "/admin/teacher/plans", label: "Lesson plans", icon: BookOpen },
        { href: "/lessons", label: "Lessons & map", icon: BookOpen },
        { href: "/admin/resources", label: "Resources", icon: BookText },
      ]
    }

    // Staff get a focused tool bar (the Admin Home launches everything else);
    // students get their own journey. "View as student" sends staff to the
    // student nav below so they can preview it.
    if (isStaff && !studentViewActive) {
      // Teachers land in the Class Cockpit; the admin home stays the OWNER's
      // console (access requests, drafts, app-wide stats) — admin only.
      const isTeacherOnly = role === 'teacher'
      const staff = [
        { href: isTeacherOnly ? "/admin/classes" : "/admin/home", label: "Home", icon: Home },
        { href: "/admin/classes", label: "Classes", icon: BookOpen },
        { href: "/admin/control-room", label: "Student work", icon: LayoutGrid },
        { href: "/admin/dashboard", label: "Lessons", icon: BookOpen },
        { href: "/admin/resources", label: "Resources", icon: BookText },
        { href: "/arcade", label: "Arcade", icon: Joystick },
      ]
      // The global Admin tab is admin-only; it's also hidden while an admin is
      // previewing the teacher experience. Teachers whose Home IS the cockpit
      // don't need the duplicate Classes entry.
      const deduped = isTeacherOnly ? staff.filter((i) => i.label !== "Home") : staff
      return isTeacherOnly ? deduped : [...deduped, { href: "/experience", label: "Experience as…", icon: Eye }]
    }

    // Student nav: orient → work → play → compete → spend. Simulations are
    // reached through lesson blocks; My Growth lives in the avatar dropdown
    // ("My progress"), so neither needs a top-level link.
    return [
      { href: "/home", label: "Home", icon: Home },
      { href: "/lessons", label: "Lessons", icon: BookOpen },
      { href: "/quizzes", label: "Quizzes", icon: LayoutGrid },
      { href: "/reference", label: "Reference", icon: Sigma },
      { href: "/textbook", label: "Textbook", icon: BookText },   // Conceptual Physics, session-gated PDF reader
      { href: "/lobby", label: "Lobby", icon: Users },
      { href: "/arcade", label: "Arcade", icon: Joystick },      // ONE arcade: earn upstairs (vocab), spend downstairs (ranked)
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { href: "/store", label: "Store", icon: Gift },
    ]
  }

  const navigationItems = getNavigationItems()
  const groupedNavigation = isAuthenticated && role !== 'observer' && (!isStaff || studentViewActive)

  // Prefix-match active state (Surface 15): a lesson page lights the Lessons
  // tab, a lobby room lights Lobby. Boundary-safe so /store never matches
  // /storefront-style siblings.
  const isActivePath = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  // Signed-in users' logo goes home — their home, not the marketing splash.
  const logoHref = isAuthenticated ? (role === 'observer' ? '/admin/oversight' : role === 'teacher' && !studentViewActive ? '/admin/classes' : isStaff && !studentViewActive ? '/admin/home' : '/home') : '/'

  // Chrome-free embed pages (e.g. simulations rendered inside a lesson iframe).
  if (pathname?.startsWith('/embed') || pathname === '/admin/observe' || pathname === '/admin/command-center' || pathname === '/admin/projector') return null

  return (
    <>
    {viewingAs && (
      <div className="w-full text-sm flex items-center justify-center gap-3 py-1.5 px-4" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
        <span>Viewing as teacher{teacherEmail ? ` · ${teacherEmail}` : ''} — admin tools hidden.</span>
        <button onClick={() => { clearViewAs(); window.location.reload() }} className="underline font-medium">Exit</button>
      </div>
    )}
    {studentViewActive && (
      <div className="w-full text-sm flex items-center justify-center gap-3 py-1.5 px-4" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
        <span>Viewing as student — staff tools hidden.</span>
        <button onClick={() => { clearStudentView(); window.location.reload() }} className="underline font-medium">Exit</button>
      </div>
    )}
    <nav style={{ top: 'var(--role-walkthrough-height, 0px)' }} className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          {/* Shared Antocci Physics brand */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href={logoHref} className="group flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors duration-200">
              <BrandLogo decorative priority />
              <span className="text-base sm:text-lg tracking-tight">
                <span className="block lg:hidden">Physics</span>
                <span className="hidden lg:block">Antocci Physics</span>
                {groupedNavigation && <span className="hidden lg:block text-xs font-normal text-muted-foreground mt-0.5">HS Conceptual Physics</span>}
              </span>
            </Link>
            {/* Physics Level Badge - Hidden on Mobile */}
            {!groupedNavigation && <div className="hidden 2xl:block"><PhysicsLevelBadge variant="compact" /></div>}
          </div>

          {groupedNavigation && <StudentNavigation />}
          {/* Desktop navigation links */}
          {!groupedNavigation && isAuthenticated && navigationItems.length > 0 && (
            <div className="nav-rail hidden xl:flex items-center gap-0.5 rounded-xl px-1 py-0.5" aria-label="Main">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = isActivePath(item.href)
                return (
                  <Link
                    key={item.href}
                    href={navigationHref(item.href)}
                    data-active={isActive ? 'true' : 'false'}
                    title={item.label}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={`nav-link flex min-h-11 items-center px-2.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="ml-1.5 whitespace-nowrap">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Mobile Hamburger Menu - Only show when authenticated and has nav items */}
          {!groupedNavigation && isAuthenticated && navigationItems.length > 0 && (
            <div className="xl:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="min-h-11 gap-2 px-3">
                    <Menu className="h-5 w-5" />
                    <span>Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[320px] p-0 bg-background/95 backdrop-blur-xl">
                  <SheetHeader className="p-6 pb-5 border-b border-border/50">
                    <SheetTitle className="text-left text-lg font-semibold tracking-tight">Navigation</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col py-3">
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      const isActive = isActivePath(item.href)
                      return (
                        <SheetClose asChild key={item.href}>
                          <Link
                            href={navigationHref(item.href)}
                            className={`flex items-center gap-3 mx-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                              isActive
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            <Icon className={`h-5 w-5 ${isActive ? '' : 'opacity-70'}`} />
                            {item.label}
                          </Link>
                        </SheetClose>
                      )
                    })}

                    {/* Theme toggle in mobile menu */}
                    <div className="mx-3 px-4 py-4 border-t border-border/50 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Appearance</span>
                        <ThemeToggle />
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}

          {/* Right Side - Mobile First Layout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isLoading ? (
              // Loading state - Apple-style skeleton
              <div className="animate-pulse flex items-center gap-2">
                <div className="h-9 w-9 bg-muted rounded-full" />
                <div className="hidden sm:block h-9 w-24 bg-muted rounded-full" />
              </div>
            ) : isAuthenticated && session ? (
              <>
                {/* Keep appearance within reach in the student bar at every size. */}
                <div className={groupedNavigation ? 'shrink-0' : 'hidden md:block'}><ThemeToggle /></div>

                {/* Notifications — new ratings, grades, math, duels, due work */}
                <NotificationBell />

                {/* Account menu — avatar opens identity + My progress + Sign Out */}
                <AccountMenu />
              </>
            ) : (
              <>
                {/* Theme Toggle for non-authenticated users */}
                <div className="hidden md:block">
                  <ThemeToggle />
                </div>

                {/* Sign In Button - Apple-style pill */}
                <Button
                  onClick={() => signIn("google", { callbackUrl: "/home" })}
                  size="sm"
                  className="h-9 px-5 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30"
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
    </>
  )
}
