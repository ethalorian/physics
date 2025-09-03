"use client"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Physics Classroom
        </Link>
        
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Link href="/lessons">
                <Button variant="ghost">Lessons</Button>
              </Link>
              <Link href="/assignments">
                <Button variant="ghost">Assignments</Button>
              </Link>
              <Button onClick={() => signOut()} variant="outline">
                Sign Out
              </Button>
            </>
          ) : (
            <Button onClick={() => signIn("google")}>
              Sign In with Google
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
