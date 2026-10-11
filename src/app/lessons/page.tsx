'use client'

import { Spinner } from '@/components/ui/spinner'
import { useEffect } from 'react'
import LessonBrowser from '@/components/lessons/LessonBrowser'
import EnrollmentGate from '@/components/EnrollmentGate'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'

export default function LessonsPage() {
  const { data: session, status } = useSession()
  const observer = session?.user?.role === 'observer'
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
          <Spinner size="lg" className="mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Will redirect
  }

  return (
    <EnrollmentGate>
      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        {/* Simple Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{observer ? 'Lessons & concept map' : 'Your lessons'}</h1>
            <p className="text-sm text-muted-foreground">
              {observer ? 'Browse published video lessons and explore how the concepts connect. Observer access is read-only.' : 'Watch, investigate, and show your thinking. Follow your class learning path.'}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <LessonBrowser observer={observer} />
      </div>
    </EnrollmentGate>
  )
}
