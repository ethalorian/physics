"use client"
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useVocabulary } from '@/contexts/VocabularyContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Target, Trophy, BookOpen, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import VocabularyHangmanGame from '@/components/vocabulary/games/VocabularyHangmanGame'

export default function StudentVocabularyHangmanPage() {
  const { data: session, status } = useSession()
  const { vocabularySets, loading } = useVocabulary()
  const [selectedSetId, setSelectedSetId] = useState<string>('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [gameStarted, setGameStarted] = useState(false)
  const [gameResults, setGameResults] = useState<{
    score: number
    totalWords: number
    timeSpent: number
  } | null>(null)
  
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
            <CardDescription>Please sign in to play vocabulary games.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const selectedSet = vocabularySets.find(set => set.id === selectedSetId)
  
  // Apply proper difficulty filtering
  const availableTerms = selectedSet?.terms.filter(term => {
    if (difficulty === 'easy') return term.term.length <= 8
    if (difficulty === 'medium') return term.term.length > 8 && term.term.length <= 12
    return term.term.length > 12
  }) || []

  const handleGameComplete = async (score: number, totalWords: number, timeSpent: number) => {
    const results = { score, totalWords, timeSpent }
    setGameResults(results)
    setGameStarted(false)

    // Save to database
    if (selectedSetId && session?.user?.id) {
      try {
        await fetch('/api/student-progress/game-scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vocabulary_set_id: selectedSetId,
            game_type: 'hangman',
            score: score,
            max_score: totalWords * 10,
            accuracy: (score / (totalWords * 10)) * 100,
            time_spent: timeSpent,
            difficulty: difficulty,
            terms_completed: totalWords,
            terms_total: totalWords
          })
        })
      } catch (error) {
        console.error('Error saving game score:', error)
      }
    }
  }

  const resetGame = () => {
    setGameStarted(false)
    setGameResults(null)
  }

  if (gameStarted && selectedSet && availableTerms.length > 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={resetGame}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Setup
            </Button>
          </div>
          
          <VocabularyHangmanGame
            vocabularyTerms={availableTerms}
            difficulty={difficulty}
            onGameComplete={handleGameComplete}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/vocabulary">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Games
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <Target className="h-8 w-8 text-red-500" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Hangman Game
              </h1>
              <p className="text-muted-foreground">
                Guess the physics term letter by letter
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Game Results */}
      {gameResults && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-300">
              <Trophy className="h-5 w-5" />
              <span>Game Complete!</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground">{gameResults.score}</div>
                <div className="text-sm text-muted-foreground">Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{gameResults.totalWords}</div>
                <div className="text-sm text-muted-foreground">Words</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{Math.round(gameResults.timeSpent / 1000)}s</div>
                <div className="text-sm text-muted-foreground">Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Setup */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Game Setup</span>
            </CardTitle>
            <CardDescription>
              Choose your vocabulary set and difficulty level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Vocabulary Set
              </label>
              <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vocabulary set" />
                </SelectTrigger>
                <SelectContent>
                  {vocabularySets.map((set) => (
                    <SelectItem key={set.id} value={set.id}>
                      {set.name} ({set.terms.length} terms)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Difficulty Level
              </label>
              <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy (≤8 letters)</SelectItem>
                  <SelectItem value="medium">Medium (9-12 letters)</SelectItem>
                  <SelectItem value="hard">Hard (&gt;12 letters)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedSet && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Available terms: <span className="font-medium text-foreground">{availableTerms.length}</span>
                </div>
                {availableTerms.length === 0 && (
                  <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                    No terms available for this difficulty level
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={() => setGameStarted(true)}
              disabled={!selectedSetId || availableTerms.length === 0}
              className="w-full"
              size="lg"
            >
              <Target className="h-4 w-4 mr-2" />
              Start Hangman Game
            </Button>

            {gameResults && (
              <Button
                onClick={resetGame}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Play Again
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Game Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Play</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">1</Badge>
                <div>
                  <div className="font-medium text-foreground">Choose Your Set</div>
                  <div className="text-sm text-muted-foreground">
                    Select a vocabulary set and difficulty level
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">2</Badge>
                <div>
                  <div className="font-medium text-foreground">Guess Letters</div>
                  <div className="text-sm text-muted-foreground">
                    Click letters to guess the hidden physics term
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">3</Badge>
                <div>
                  <div className="font-medium text-foreground">Avoid Mistakes</div>
                  <div className="text-sm text-muted-foreground">
                    You have limited wrong guesses before the game ends
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">4</Badge>
                <div>
                  <div className="font-medium text-foreground">Learn & Score</div>
                  <div className="text-sm text-muted-foreground">
                    Complete words to earn points and learn definitions
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                💡 Pro Tip
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Start with common letters like E, A, R, S, T to maximize your chances of success!
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {vocabularySets.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Vocabulary Sets Available
            </h3>
            <p className="text-muted-foreground mb-6">
              Your teacher hasn&apos;t uploaded any vocabulary sets yet. Check back later or contact your teacher.
            </p>
            <Button variant="outline" asChild>
              <Link href="/vocabulary">
                Back to Games
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
