'use client'

import { useEffect } from 'react'
import LessonBrowser from '@/components/lessons/LessonBrowser'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BookOpen, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default function LessonsPage() {
  const { data: session, status } = useSession()
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

  if (!session) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-purple-100/20 border-b">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>

            {/* Title */}
            <div className="space-y-3">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Physics Lessons
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Explore fundamental concepts through interactive simulations, video lessons, and comprehensive content.
                Track your progress and master physics one lesson at a time.
              </p>
            </div>

            {/* Quick Stats or Actions */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href="/dashboard">
                <Button variant="outline" size="lg">
                  <BookOpen className="h-5 w-5 mr-2" />
                  My Dashboard
                </Button>
              </Link>
              <Link href="/simulations">
                <Button size="lg">
                  Explore Simulations
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <LessonBrowser />
      </div>

      {/* Help Section */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="bg-card border rounded-lg p-8 text-center space-y-4">
          <h3 className="text-2xl font-bold">Need Help?</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Each lesson is designed to build on previous concepts. Start from the beginning or jump to a specific topic.
            Complete lessons to track your progress and unlock achievements!
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/dashboard">
              <Button variant="outline">View Progress</Button>
            </Link>
            <Link href="/assignments">
              <Button variant="outline">My Assignments</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
