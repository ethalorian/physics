"use client"
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, BookOpen, Gamepad2 } from 'lucide-react'
import Link from 'next/link'
import VocabularySetManager from '@/components/vocabulary/VocabularySetManager'

export default function VocabularyManagementPage() {
  const { data: session } = useSession()
  
  // Check if user has admin access
  const userRole = getUserRole(session?.user?.email)
  if (userRole !== 'admin' && userRole !== 'teacher') {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Vocabulary Management</h1>
          <p className="text-muted-foreground">
            Create and manage vocabulary sets for use in vocabulary games and assignments.
          </p>
        </div>
        <Link href="/admin/vocabulary/hangman">
          <Button className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Play Hangman
          </Button>
        </Link>
      </div>

      {/* Quick Games */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/admin/vocabulary/hangman">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Target className="h-6 w-6 text-red-600" />
                </div>
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardTitle className="text-lg mb-2">Hangman Game</CardTitle>
              <CardDescription>
                Play hangman with physics vocabulary terms
              </CardDescription>
            </CardContent>
          </Link>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <Gamepad2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CardTitle className="text-lg mb-2">Word Search</CardTitle>
            <CardDescription>
              Find physics terms in a word grid (Coming Soon)
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <Gamepad2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CardTitle className="text-lg mb-2">Quiz Bowl</CardTitle>
            <CardDescription>
              Fast-paced vocabulary quiz (Coming Soon)
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <VocabularySetManager />
    </div>
  )
}
