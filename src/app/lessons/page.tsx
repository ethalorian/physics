'use client'

import { useEffect } from 'react'
import LessonBrowser from '@/components/lessons/LessonBrowser'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'

export default function LessonsPage() {
  const { status } = useSession()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/lessons')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Will redirect
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Simple Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Physics Lessons</h1>
          <p className="text-sm text-muted-foreground">
            Explore concepts through videos, simulations, and interactive content
          </p>
        </div>
      </div>

      {/* Main Content */}
      <LessonBrowser />
    </div>
  )
}
