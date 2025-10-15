import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import GlobalAssignmentHub from '@/components/admin/GlobalAssignmentHub'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export const metadata = {
  title: 'Global Assignment Hub | Physics Classroom',
  description: 'Manage all assignments - lessons, homework, vocabulary, and simulations in one place'
}

export default async function AssignmentHubPage() {
  const session = await auth()
  
  if (!session?.user?.email) {
    redirect('/auth/signin?callbackUrl=/admin/assignment-hub')
  }

  const userRole = getUserRole(session.user.email)
  
  if (userRole !== 'admin' && userRole !== 'teacher') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LoadingFallback />}>
        <GlobalAssignmentHub />
      </Suspense>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading Assignment Hub...</span>
        </CardContent>
      </Card>
    </div>
  )
}

