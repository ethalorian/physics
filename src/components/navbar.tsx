"use client"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-[#4A1A4A] via-[#6A4C93] to-[#D4AF37] bg-clip-text text-transparent hover:scale-105 transition-transform">
          Antocci Physics
        </Link>
        
        <div className="flex items-center gap-6">
          {isLoading ? (
            // Loading state - minimal placeholder to prevent layout shift
            <div className="animate-pulse">
              <div className="h-10 w-32 bg-[#C5B9E8]/20 rounded-full" />
            </div>
          ) : isAuthenticated && session ? (
            <>
              <div className="hidden md:flex items-center gap-1 bg-gradient-to-r from-[#C5B9E8]/40 to-[#D4AF37]/10 rounded-full p-1 border border-[#D4AF37]/20">
                {/* Dashboard Link - directs to appropriate dashboard based on role */}
                <Link href={canAccessAdmin ? "/admin/dashboard" : "/dashboard"}>
                  <Button variant="ghost" className="rounded-full text-sm font-medium px-3 py-2 hover:bg-[#D4AF37]/20 hover:text-[#4A1A4A] transition-all">
                    Dashboard
                  </Button>
                </Link>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-[#D4AF37]/50 transition-all duration-200">
                    <Avatar className="h-10 w-10 ring-2 ring-[#D4AF37]/30 apple-shadow-sm">
                      <AvatarImage 
                        src={session.user?.image || ''} 
                        alt={session.user?.name || 'User'} 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-[#6A4C93] to-[#4A1A4A] text-[#F7F5F3] font-semibold">
                        {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 apple-card mt-2" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12 ring-2 ring-gray-200">
                        <AvatarImage 
                          src={session.user?.image || ''} 
                          alt={session.user?.name || 'User'} 
                        />
                        <AvatarFallback className="bg-gradient-to-br from-[#6A4C93] to-[#4A1A4A] text-[#F7F5F3] font-semibold">
                          {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
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
                              ? 'bg-gradient-to-r from-[#D4AF37]/20 to-[#B8941F]/20 text-[#B8941F] border-[#D4AF37]/30' 
                              : userRole === 'teacher'
                              ? 'bg-[#6A4C93]/10 text-[#6A4C93] border-[#6A4C93]/30'
                              : 'bg-[#9A8AC0]/10 text-[#9A8AC0] border-[#9A8AC0]/30'
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