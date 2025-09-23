"use client"
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useVocabulary } from '@/contexts/VocabularyContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, Trophy, BookOpen, RotateCcw, Target } from 'lucide-react'
import Link from 'next/link'
import VocabularyMatchingGameWrapper from '@/components/vocabulary/games/VocabularyMatchingGameWrapper'

export default function StudentVocabularyMatchingPage() {
  const { data: session, status } = useSession()
  const { vocabularySets, loading } = useVocabulary()
  const [selectedSetId, setSelectedSetId] = useState<string>('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [maxMatches, setMaxMatches] = useState<number>(8)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameResults, setGameResults] = useState<{
    score: number
    totalMatches: number
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

  const handleGameComplete = (results: { score: number, totalMatches: number, timeSpent: number }) => {
    setGameResults(results)
    setGameStarted(false)
  }

  const resetGame = () => {
    setGameStarted(false)
    setGameResults(null)
  }

  if (gameStarted && selectedSet && availableTerms.length >= maxMatches) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
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
          
          <VocabularyMatchingGameWrapper
            vocabularySet={selectedSet}
            difficulty={difficulty}
            maxMatches={maxMatches}
            onGameComplete={handleGameComplete}
            availableTerms={availableTerms}
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
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Matching Game
              </h1>
              <p className="text-muted-foreground">
                Match physics terms with their definitions
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
                <div className="text-2xl font-bold text-foreground">{gameResults.totalMatches}</div>
                <div className="text-sm text-muted-foreground">Matches</div>
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
              Configure your matching game settings
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
                  <SelectItem value="hard">Hard (>12 letters)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Number of Matches
              </label>
              <Select value={maxMatches.toString()} onValueChange={(value) => setMaxMatches(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 matches (Easy)</SelectItem>
                  <SelectItem value="6">6 matches (Medium)</SelectItem>
                  <SelectItem value="8">8 matches (Hard)</SelectItem>
                  <SelectItem value="10">10 matches (Expert)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedSet && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Available terms: <span className="font-medium text-foreground">{availableTerms.length}</span>
                </div>
                {availableTerms.length < maxMatches && (
                  <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                    Not enough terms for {maxMatches} matches (need {maxMatches}, have {availableTerms.length})
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={() => setGameStarted(true)}
              disabled={!selectedSetId || availableTerms.length < maxMatches}
              className="w-full"
              size="lg"
            >
              <Users className="h-4 w-4 mr-2" />
              Start Matching Game
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
                  <div className="font-medium text-foreground">Set Up Game</div>
                  <div className="text-sm text-muted-foreground">
                    Choose vocabulary set, difficulty, and number of matches
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">2</Badge>
                <div>
                  <div className="font-medium text-foreground">Find Pairs</div>
                  <div className="text-sm text-muted-foreground">
                    Click cards to reveal terms and definitions
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">3</Badge>
                <div>
                  <div className="font-medium text-foreground">Make Matches</div>
                  <div className="text-sm text-muted-foreground">
                    Match each physics term with its correct definition
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">4</Badge>
                <div>
                  <div className="font-medium text-foreground">Complete Board</div>
                  <div className="text-sm text-muted-foreground">
                    Find all matches to complete the game and earn points
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                💡 Pro Tip
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Try to remember the positions of cards you've seen. This memory game rewards careful attention!
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <Target className="h-4 w-4 mx-auto mb-1 text-green-600" />
                <div className="font-medium text-green-800 dark:text-green-300">Quick Match</div>
                <div className="text-green-600 dark:text-green-400">+10 points</div>
              </div>
              <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                <Trophy className="h-4 w-4 mx-auto mb-1 text-orange-600" />
                <div className="font-medium text-orange-800 dark:text-orange-300">Perfect Game</div>
                <div className="text-orange-600 dark:text-orange-400">Bonus points</div>
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
              Your teacher hasn't uploaded any vocabulary sets yet. Check back later or contact your teacher.
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
