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
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="group text-2xl font-bold text-foreground hover:text-primary hover:scale-105 transition-all duration-200 relative">
          <span className="relative">
            Antocci Physics
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 group-hover:w-full"></span>
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {isLoading ? (
            // Loading state - minimal placeholder to prevent layout shift
            <div className="animate-pulse">
              <div className="h-10 w-32 bg-muted rounded-full" />
            </div>
          ) : isAuthenticated && session ? (
            <>
              <div className="hidden md:flex items-center gap-1 bg-gradient-to-r from-secondary/60 to-primary/10 rounded-full p-1 border border-primary/30">
                {/* Dashboard Link - directs to appropriate dashboard based on role */}
                <Link href={canAccessAdmin ? "/admin/dashboard" : "/dashboard"}>
                  <Button variant="ghost" className="rounded-full text-sm font-medium px-3 py-2 hover:bg-primary/20 hover:text-primary transition-all">
                    Dashboard
                  </Button>
                </Link>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/50 transition-all duration-200 p-0 overflow-hidden ring-2 ring-primary/30 apple-shadow-sm">
                    {session.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold flex items-center justify-center">
                        {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 apple-card mt-2" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-4">
                    <div className="flex items-center space-x-3">
                      {session.user?.image ? (
                        <img 
                          src={session.user.image} 
                          alt={session.user.name || 'User'}
                          className="h-12 w-12 rounded-full ring-2 ring-gray-200 object-cover"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#6A4C93] to-[#4A1A4A] text-[#F7F5F3] font-semibold flex items-center justify-center ring-2 ring-gray-200">
                          {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none">
                          {session.user?.name}
                        </p>
                        <p className="text-xs leading-none text-gray-500">
                          {session.user?.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium border ${
                            userRole === 'admin' 
                              ? 'bg-primary/20 text-primary border-primary/40 dark:bg-primary/25 dark:text-primary dark:border-primary/60' 
                              : userRole === 'teacher'
                              ? 'bg-primary/15 text-primary border-primary/40 dark:bg-primary/20 dark:text-primary dark:border-primary/60'
                              : 'bg-secondary/50 text-secondary-foreground border-secondary dark:bg-secondary dark:text-secondary-foreground dark:border-secondary/60'
                          }`}>
                            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200/50" />
                  <DropdownMenuItem 
                    onClick={() => signOut({ callbackUrl: "/" })} 
                    className="m-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button 
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })} 
              className="apple-button"
            >
              Sign In with Google
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}