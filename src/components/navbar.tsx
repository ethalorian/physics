"use client"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { usePermissions } from "@/hooks/usePermissions"
import { useEffect, useState } from "react"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function Navbar() {
  const { data: session, status } = useSession()
  const {
    isAuthenticated,
    canAccessAdmin,
    userRole
  } = usePermissions()
  
  
  
  // Prevent hydration errors by ensuring client-side rendering for auth-dependent content
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading state while session is loading to prevent hydration mismatch
  const isLoading = !mounted || status === "loading"

  return (
    <nav className="apple-nav sticky top-0 z-50">
      <div className="w-full px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          {/* Brand Logo - Mobile Optimized */}
          <Link href="/" className="group font-bold text-foreground hover:text-primary transition-all duration-200 relative flex-shrink-0">
            <span className="relative text-base sm:text-lg md:text-xl lg:text-2xl">
              <span className="block sm:hidden">Antocci</span>
              <span className="hidden sm:block">Antocci Physics</span>
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 group-hover:w-full"></span>
            </span>
          </Link>
          
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
                
                {/* Theme Toggle */}
                <ThemeToggle />
                
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
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
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 sm:w-72 apple-card mt-1" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal p-3 sm:p-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        {session.user?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={session.user.image} 
                            alt={session.user.name || 'User'}
                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full ring-2 ring-border object-cover"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold flex items-center justify-center ring-2 ring-border">
                            {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="flex flex-col space-y-1 min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-none truncate">
                            {session.user?.name}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground truncate">
                            {session.user?.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium border ${
                              userRole === 'admin' 
                                ? 'bg-primary/20 text-primary border-primary/40' 
                                : userRole === 'teacher'
                                ? 'bg-primary/15 text-primary border-primary/40'
                                : 'bg-secondary/50 text-secondary-foreground border-secondary'
                            }`}>
                              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => signOut({ callbackUrl: "/" })} 
                      className="m-2 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive font-medium min-h-[44px] flex items-center"
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Theme Toggle for non-authenticated users */}
                <ThemeToggle />
                
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