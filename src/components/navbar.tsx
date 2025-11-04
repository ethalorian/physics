"use client"

// React/Next.js imports
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// External package imports
import { useSession, signIn, signOut } from "next-auth/react"
import { Menu, BookOpen, FileText, Settings, Home, Users, Trophy, Microscope, LogOut } from "lucide-react"

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
    
    const items = [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/lessons", label: "Lessons", icon: BookOpen },
      { href: "/assignments", label: "Assignments", icon: FileText },
      { href: "/simulations", label: "Simulations", icon: Microscope },
      { href: "/vocabulary", label: "Vocabulary Games", icon: Users },
      { href: "/gamification", label: "Leaderboard", icon: Trophy },
    ]

    if (canAccessAdmin) {
      items.push(
        { href: "/admin/dashboard", label: "Admin Dashboard", icon: Settings },
        { href: "/admin/assignments", label: "Manage Assignments", icon: FileText },
        { href: "/admin/simulations", label: "Manage Simulations", icon: Microscope },
        { href: "/admin/question-bank", label: "Question Bank", icon: BookOpen },
        { href: "/admin/vocabulary", label: "Manage Vocabulary", icon: Settings }
      )
    }

    return items
  }

  const navigationItems = getNavigationItems()

  return (
    <nav className="sticky top-0 z-50 border-b bg-background backdrop-blur-sm shadow-sm">
      <div className="w-full px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          {/* Brand Logo - Mobile Optimized */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="group font-bold text-foreground hover:text-primary transition-all duration-200 relative flex-shrink-0">
              <span className="relative text-sm sm:text-base md:text-lg lg:text-xl">
                <span className="block sm:hidden">Physics</span>
                <span className="hidden sm:block">Antocci Physics</span>
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 group-hover:w-full"></span>
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
                <SheetContent side="left" className="w-[280px] sm:w-[300px] p-0">
                  <SheetHeader className="p-6 pb-4 border-b">
                    <SheetTitle className="text-left">Navigation</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col py-4">
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      return (
                        <SheetClose asChild key={item.href}>
                          <Link
                            href={item.href}
                            className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors ${
                              isActive 
                                ? 'bg-primary/10 text-primary border-l-4 border-primary' 
                                : 'hover:bg-accent hover:text-accent-foreground'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            {item.label}
                          </Link>
                        </SheetClose>
                      )
                    })}
                    
                    {/* Theme toggle in mobile menu */}
                    <div className="px-6 py-4 border-t mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Theme</span>
                        <ThemeToggle />
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}

          {/* Right Side - Mobile First Layout */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {isLoading ? (
              // Loading state
              <div className="animate-pulse flex items-center gap-1">
                <div className="h-8 w-8 bg-muted rounded-full" />
                <div className="hidden sm:block h-8 w-20 bg-muted rounded-full" />
              </div>
            ) : isAuthenticated && session ? (
              <>
                {/* Dashboard Link - Always visible but responsive */}
                <Link href={canAccessAdmin ? "/admin/dashboard" : "/dashboard"}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 sm:h-9 px-2 sm:px-3 rounded-full text-xs sm:text-sm font-medium hover:bg-primary/20 hover:text-primary transition-all touch-manipulation"
                  >
                    <span className="hidden sm:block">Dashboard</span>
                    <span className="block sm:hidden text-lg">•</span>
                  </Button>
                </Link>
                
                
                {/* Theme Toggle - Hidden on mobile (available in hamburger menu) */}
                <div className="hidden md:block">
                  <ThemeToggle />
                </div>
                
                {/* Quick Sign Out Button */}
                <Button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/20 hover:bg-destructive hover:text-white hover:border-destructive px-2 sm:px-3 text-xs sm:text-sm h-8 sm:h-9"
                >
                  <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
                
                {/* User Menu - Direct Sheet Trigger */}
                <UserContextSheet>
                  <Button 
                    variant="ghost" 
                    className="relative h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full hover:ring-2 hover:ring-primary/50 transition-all duration-200 p-0 overflow-hidden ring-1 ring-primary/20 touch-manipulation"
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
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold flex items-center justify-center text-xs sm:text-sm">
                        {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </Button>
                </UserContextSheet>
              </>
            ) : (
              <>
                {/* Theme Toggle for non-authenticated users - Hidden on mobile */}
                <div className="hidden md:block">
                  <ThemeToggle />
                </div>
                
                {/* Sign In Button - Mobile Optimized */}
                <Button 
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })} 
                  size="sm"
                  className="bg-primary hover:bg-primary/80 text-primary-foreground px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all touch-manipulation"
                >
                  <span className="hidden sm:block">Sign In</span>
                  <span className="block sm:hidden">Sign In</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}