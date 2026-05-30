"use client"
import { useVocabulary } from '@/contexts/VocabularyContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Gamepad2, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function VocabularyGamesOverview() {
  const { vocabularySets, loading } = useVocabulary()
  
  const vocabularyGames = [
    { id: 'hangman', name: 'Hangman', icon: '🎯', difficulty: 'Easy', description: 'Guess physics terms letter by letter' },
    { id: 'matching', name: 'Matching', icon: '🧩', difficulty: 'Medium', description: 'Match terms with definitions' },
    { id: 'crossword', name: 'Crossword', icon: '📝', difficulty: 'Hard', description: 'Fill physics crossword puzzles' },
    { id: 'word-shoot', name: 'Word Shoot', icon: '🎮', difficulty: 'Medium', description: 'Fast-paced vocabulary shooting' },
    { id: 'quiz-bowl', name: 'Quiz Bowl', icon: '🏆', difficulty: 'Hard', description: 'Rapid-fire physics questions' },
    { id: 'concentration', name: 'Concentration', icon: '🧠', difficulty: 'Easy', description: 'Memory matching game' },
    { id: 'letter-catch', name: 'Letter Catch', icon: '🧺', difficulty: 'Medium', description: 'Catch falling letters to spell terms' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Vocabulary Games</h2>
        <p className="text-muted-foreground">
          Practice physics terms through fun, interactive games
        </p>
      </div>

      {/* Vocabulary Sets Status */}
      <Card className="apple-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Available Vocabulary Sets</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vocabularySets.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No vocabulary sets available yet. Your teacher will upload vocabulary sets for you to practice with.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vocabularySets.slice(0, 4).map((set) => (
                <div key={set.id} className="p-3 bg-muted rounded-lg">
                  <div className="font-medium text-foreground">{set.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {set.terms.length} terms available
                  </div>
                </div>
              ))}
              {vocabularySets.length > 4 && (
                <div className="p-3 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-sm text-muted-foreground">
                    +{vocabularySets.length - 4} more sets
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vocabularyGames.map((game) => (
          <Link key={game.id} href={`/vocabulary/${game.id}`}>
            <Card className="apple-card group hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl">{game.icon}</div>
                  <Badge variant="secondary" className="text-xs">
                    {game.difficulty}
                  </Badge>
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                  {game.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {game.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Access to All Games */}
      <div className="text-center">
        <Link href="/vocabulary">
          <Button size="lg" className="group">
            <Gamepad2 className="h-4 w-4 mr-2" />
            Explore All Vocabulary Games
            <CheckCircle className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
