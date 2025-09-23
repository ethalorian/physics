"use client"
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useVocabulary } from '@/contexts/VocabularyContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Target, 
  Grid3x3, 
  Users, 
  Zap, 
  BookOpen, 
  Trophy,
  Play,
  ArrowRight,
  Gamepad2
} from 'lucide-react'
import Link from 'next/link'

const vocabularyGames = [
  {
    id: 'hangman',
    title: 'Hangman',
    description: 'Guess the physics term letter by letter before running out of chances',
    icon: Target,
    color: 'bg-red-500',
    difficulty: 'Easy',
    href: '/vocabulary/hangman'
  },
  {
    id: 'matching',
    title: 'Matching Game',
    description: 'Match physics terms with their correct definitions',
    icon: Users,
    color: 'bg-blue-500',
    difficulty: 'Medium',
    href: '/vocabulary/matching'
  },
  {
    id: 'crossword',
    title: 'Crossword Puzzle',
    description: 'Fill in the crossword with physics vocabulary terms',
    icon: Grid3x3,
    color: 'bg-green-500',
    difficulty: 'Hard',
    href: '/vocabulary/crossword'
  },
  {
    id: 'word-shoot',
    title: 'Word Shoot',
    description: 'Fast-paced shooting game with physics vocabulary',
    icon: Zap,
    color: 'bg-purple-500',
    difficulty: 'Medium',
    href: '/vocabulary/word-shoot'
  },
  {
    id: 'quiz-bowl',
    title: 'Quiz Bowl',
    description: 'Rapid-fire questions about physics terms and concepts',
    icon: Trophy,
    color: 'bg-orange-500',
    difficulty: 'Hard',
    href: '/vocabulary/quiz-bowl'
  },
  {
    id: 'concentration',
    title: 'Concentration',
    description: 'Memory game matching physics terms and definitions',
    icon: BookOpen,
    color: 'bg-teal-500',
    difficulty: 'Easy',
    href: '/vocabulary/concentration'
  }
]

export default function VocabularyGamesHub() {
  const { data: session, status } = useSession()
  const { vocabularySets, loading } = useVocabulary()
  
  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access vocabulary games.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const availableSets = vocabularySets.filter(set => set.terms.length > 0)

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Gamepad2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Vocabulary Games
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Practice physics vocabulary through fun, interactive games. Choose from different difficulty levels and game types to reinforce your learning.
        </p>
        
        {/* Vocabulary Sets Info */}
        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>{availableSets.length} vocabulary sets available</span>
          </div>
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4" />
            <span>Track your progress</span>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vocabularyGames.map((game) => {
          const IconComponent = game.icon
          return (
            <Card key={game.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${game.color} bg-opacity-10`}>
                    <IconComponent className={`h-6 w-6 ${game.color.replace('bg-', 'text-')}`} />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {game.difficulty}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {game.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {game.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href={game.href}>
                  <Button 
                    className="w-full group-hover:scale-105 transition-transform"
                    disabled={availableSets.length === 0}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Play Game
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* No Vocabulary Sets Message */}
      {availableSets.length === 0 && (
        <Card className="max-w-2xl mx-auto border-dashed">
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Vocabulary Sets Available
            </h3>
            <p className="text-muted-foreground mb-6">
              Your teacher hasn't uploaded any vocabulary sets yet. Games will be available once vocabulary sets are added to the system.
            </p>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                Return to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tips Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span>Game Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-foreground mb-2">Getting Started:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Start with easier games like Hangman</li>
                <li>• Review vocabulary sets before playing</li>
                <li>• Take your time to understand each term</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Improve Your Score:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Play regularly to reinforce learning</li>
                <li>• Try different difficulty levels</li>
                <li>• Focus on terms you find challenging</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
