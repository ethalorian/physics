"use client"

// React/Next.js imports
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// External package imports
import { useSession, signIn, signOut } from "next-auth/react"
import { Menu, BookOpen, FileText, Settings, Home, Gamepad2, Trophy, Microscope, LogOut } from "lucide-react"

// Internal imports
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { PhysicsLevelBadge } from "@/components/physics-level-badge"
import { usePermissions } from "@/hooks/usePermissions"
import { useViewMode } from "@/contexts/ViewModeContext"
import { useViewAwarePermissions } from "@/hooks/useViewAwarePermissions"
import UserContextSheet from "@/components/UserContextSheet"

export default function Navbar() {
  const { data: session, status } = useSession()
  const { viewMode } = useViewMode()
  const pathname = usePathname()
  
  // Use view-aware permissions for navigation decisions
  const {
    isAuthenticated,
    canAccessAdmin
  } = useViewAwarePermissions(viewMode)

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
    
    // Core student navigation items - streamlined for clear user journey
    const items = [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/lessons", label: "Lessons", icon: BookOpen },
      { href: "/assignments", label: "Assignments", icon: FileText },
      { href: "/simulations", label: "Simulations", icon: Microscope },
      { href: "/vocabulary", label: "Games", icon: Gamepad2 },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ]

    // Simplified admin navigation - one entry point
    if (canAccessAdmin) {
      items.push(
        { href: "/admin/dashboard", label: "Admin", icon: Settings }
      )
    }

    return items
  }

  const navigationItems = getNavigationItems()

  return (
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
                
                {/* Sign Out - Subtle ghost style */}
                <Button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 rounded-full text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Sign Out</span>
                </Button>
                
                {/* User Avatar - Apple-style with ring on hover */}
                <UserContextSheet>
                  <Button 
                    variant="ghost" 
                    className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-primary/30 hover:ring-offset-2 hover:ring-offset-background"
                  >
                    {session.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold flex items-center justify-center text-sm">
                        {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </Button>
                </UserContextSheet>
              </>
            ) : (
              <>
                {/* Theme Toggle for non-authenticated users */}
                <div className="hidden md:block">
                  <ThemeToggle />
                </div>
                
                {/* Sign In Button - Apple-style pill */}
                <Button 
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })} 
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
  )
}