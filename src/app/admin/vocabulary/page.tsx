"use client"
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Gamepad2, ExternalLink, BookOpen } from 'lucide-react'
import Link from 'next/link'
import VocabularySetManager from '@/components/vocabulary/VocabularySetManager'

export default function VocabularyManagementPage() {
  const { data: session, status } = useSession()
  
  // Wait for session to load before checking permissions
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }
  
  // Check if user has admin access
  const userRole = getUserRole(session?.user?.email)
  if (userRole !== 'admin' && userRole !== 'teacher') {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Vocabulary Management</h1>
          <p className="text-muted-foreground">
            Create and manage vocabulary sets for use in vocabulary games and assignments.
          </p>
        </div>
        <Link href="/vocabulary">
          <Button className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            Play Games
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {/* Quick Info Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            Vocabulary Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-4 gap-4 text-sm">
            <div className="relative">
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
              <div className="pl-6">
                <p className="font-medium mb-1">Create Sets</p>
                <p className="text-muted-foreground text-xs">Add vocabulary sets with terms and definitions below</p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
              <div className="pl-6">
                <p className="font-medium mb-1">Publish Sets</p>
                <p className="text-muted-foreground text-xs">Toggle published to make sets available</p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
              <div className="pl-6">
                <p className="font-medium mb-1">Assign (Optional)</p>
                <p className="text-muted-foreground text-xs">
                  <Link href="/admin/dashboard" className="text-primary hover:underline">
                    Go to Assign tab
                  </Link> to assign sets to specific courses
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">✓</div>
              <div className="pl-6">
                <p className="font-medium mb-1">Students Play</p>
                <p className="text-muted-foreground text-xs">Students access games from the Vocabulary section</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vocabulary Set Manager */}
      <VocabularySetManager />
    </div>
  )
}
