"use client"
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Gamepad2, Grid3x3, Zap, Users, Brain } from 'lucide-react'
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Vocabulary Management</h1>
          <p className="text-muted-foreground">
            Create and manage vocabulary sets for use in vocabulary games and assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/vocabulary/hangman">
            <Button variant="outline" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Play Hangman
            </Button>
          </Link>
          <Link href="/admin/vocabulary/crossword">
            <Button variant="outline" className="flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              Play Crossword
            </Button>
          </Link>
          <Link href="/admin/vocabulary/quiz-bowl">
            <Button variant="outline" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Play Quiz Bowl
            </Button>
          </Link>
          <Link href="/admin/vocabulary/matching">
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Play Matching
            </Button>
          </Link>
          <Link href="/admin/vocabulary/concentration">
            <Button variant="outline" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Play Concentration
            </Button>
          </Link>
          <Link href="/admin/vocabulary/word-shoot">
            <Button className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Play Word Shoot
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Games */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/admin/vocabulary/crossword">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Grid3x3 className="h-6 w-6 text-blue-600" />
                </div>
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardTitle className="text-lg mb-2">Crossword Puzzle</CardTitle>
              <CardDescription>
                Solve crosswords with physics vocabulary terms
              </CardDescription>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/admin/vocabulary/quiz-bowl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardTitle className="text-lg mb-2">Quiz Bowl</CardTitle>
              <CardDescription>
                Fast-paced vocabulary quiz with time pressure
              </CardDescription>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/admin/vocabulary/matching">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardTitle className="text-lg mb-2">Matching Game</CardTitle>
              <CardDescription>
                Match physics terms with their definitions
              </CardDescription>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/admin/vocabulary/concentration">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardTitle className="text-lg mb-2">Concentration</CardTitle>
              <CardDescription>
                Memory card game with physics vocabulary
              </CardDescription>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/admin/vocabulary/word-shoot">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardTitle className="text-lg mb-2">Word Shoot</CardTitle>
              <CardDescription>
                Shoot floating vocabulary bubbles
              </CardDescription>
            </CardContent>
          </Link>
        </Card>
      </div>

      <VocabularySetManager />
    </div>
  )
}
