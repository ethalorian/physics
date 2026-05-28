"use client"

// React/Next.js imports
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// External package imports
import { useSession, signIn } from "next-auth/react"
import { Menu, BookOpen, Settings, Home, Gamepad2, Trophy, Gift, LayoutGrid } from "lucide-react"

// Internal imports
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { PhysicsLevelBadge } from "@/components/physics-level-badge"
import { useViewAs } from "@/lib/use-view-as"
import { clearViewAs } from "@/lib/view-as-shared"
import { useViewMode } from "@/contexts/ViewModeContext"
import { useViewAwarePermissions } from "@/hooks/useViewAwarePermissions"
import AccountMenu from "@/components/AccountMenu"

export default function Navbar() {
  const { data: session, status } = useSession()
  const { viewMode } = useViewMode()
  const pathname = usePathname()
  
  // Use view-aware permissions for navigation decisions
  const {
    isAuthenticated,
    canAccessAdmin
  } = useViewAwarePermissions(viewMode)

  // "View as teacher" (admin previewing the colleague experience)
  const { viewingAs, teacherEmail } = useViewAs()

  // Prevent hydration errors by ensuring client-side rendering for auth-dependent content
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading state while session is loading to prevent hydration mismatch
  const isLoading = !mounted || status === "loading"

  // Navigation items based on user role and authentication
  const getNavigationItems = () => {
    if (!isAuthenticated) return []
    
    // Staff get a focused tool bar (the Admin Home launches everything else);
    // students get their own journey. "View as student" flips canAccessAdmin off,
    // so staff can still preview the student nav.
    if (canAccessAdmin) {
      const staff = [
        { href: "/admin/home", label: "Home", icon: Home },
        { href: "/admin/control-room", label: "Control Room", icon: LayoutGrid },
        { href: "/admin/store", label: "Rewards", icon: Gift },
        { href: "/admin/dashboard", label: "Admin", icon: Settings },
      ]
      // Hide the global Admin tab while previewing the teacher experience.
      return viewingAs ? staff.filter((i) => i.href !== "/admin/dashboard") : staff
    }

    // Student nav: orient → work → play → compete → spend. Simulations are
    // reached through lesson blocks; My Growth lives in the avatar dropdown
    // ("My progress"), so neither needs a top-level link.
    return [
      { href: "/home", label: "Home", icon: Home },
      { href: "/lessons", label: "Lessons", icon: BookOpen },
      { href: "/vocabulary", label: "Arcade", icon: Gamepad2 },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { href: "/store", label: "Store", icon: Gift },
    ]
  }

  const navigationItems = getNavigationItems()

  // Chrome-free embed pages (e.g. simulations rendered inside a lesson iframe).
  if (pathname?.startsWith('/embed')) return null

  return (
    <>
    {viewingAs && (
      <div className="w-full text-sm flex items-center justify-center gap-3 py-1.5 px-4" style={{ background: 'var(--primary)', color: 'var(--primary-foreground, white)' }}>
        <span>Viewing as teacher{teacherEmail ? ` · ${teacherEmail}` : ''} — admin tools hidden.</span>
        <button onClick={() => { clearViewAs(); window.location.reload() }} className="underline font-medium">Exit</button>
      </div>
    )}
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          {/* Brand Logo - Apple-style clean typography with earth tones */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="group flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors duration-200">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-600/25">
                <span className="text-white text-sm font-bold">φ</span>
              </div>
              <span className="text-base sm:text-lg tracking-tight">
                <span className="block sm:hidden">Physics</span>
                <span className="hidden sm:block">Antocci Physics</span>
              </span>
            </Link>
            {/* Physics Level Badge - Hidden on Mobile */}
            <div className="hidden lg:block">
              <PhysicsLevelBadge variant="compact" />
            </div>
          </div>
          
          {/* Desktop navigation links */}
          {isAuthenticated && navigationItems.length > 0 && (
            <div className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Mobile Hamburger Menu - Only show when authenticated and has nav items */}
          {isAuthenticated && navigationItems.length > 0 && (
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[320px] p-0 bg-background/95 backdrop-blur-xl">
                  <SheetHeader className="p-6 pb-5 border-b border-border/50">
                    <SheetTitle className="text-left text-lg font-semibold tracking-tight">Navigation</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col py-3">
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      return (
                        <SheetClose asChild key={item.href}>
                          <Link
                            href={item.href}
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
                {/* Theme Toggle - Hidden on mobile */}
                <div className="hidden md:block">
                  <ThemeToggle />
                </div>
                
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