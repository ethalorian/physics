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

export default function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="apple-nav sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-[#4A1A4A] to-[#6A4C93] bg-clip-text text-transparent">
          Physics Classroom
        </Link>
        
        <div className="flex items-center gap-6">
          {session ? (
            <>
              <div className="hidden md:flex items-center gap-1 bg-[#C5B9E8]/40 rounded-full p-1">
                <Link href="/lessons">
                  <Button variant="ghost" className="rounded-full text-sm font-medium px-4 py-2 hover:bg-white/80">
                    Lessons
                  </Button>
                </Link>
                <Link href="/assignments">
                  <Button variant="ghost" className="rounded-full text-sm font-medium px-4 py-2 hover:bg-white/80">
                    Assignments
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button variant="ghost" className="rounded-full text-sm font-medium px-4 py-2 hover:bg-white/80">
                    Admin
                  </Button>
                </Link>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-blue-500/20 transition-all duration-200">
                    <Avatar className="h-10 w-10 ring-2 ring-white apple-shadow-sm">
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
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200/50" />
                  <DropdownMenuItem 
                    onClick={() => signOut()} 
                    className="m-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button 
              onClick={() => signIn("google")} 
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
