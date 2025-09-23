"use client"
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/permissions'
import { useVocabulary } from '@/contexts/VocabularyContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Target, Trophy, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'
import VocabularyHangmanGame from '@/components/vocabulary/games/VocabularyHangmanGame'

export default function VocabularyHangmanPage() {
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
  
  // Check if user has admin/teacher access
  const userRole = getUserRole(session?.user?.email)
  if (userRole !== 'admin' && userRole !== 'teacher') {
    redirect('/dashboard')
  }

  const selectedSet = vocabularySets.find(set => set.id === selectedSetId)
  
  // Apply proper difficulty filtering
  const availableTerms = selectedSet?.terms.filter(term => {
    if (difficulty === 'easy') {
      return term.difficulty === 'easy' || !term.difficulty
    } else if (difficulty === 'hard') {
      return term.difficulty === 'hard' || !term.difficulty
    }
    // For medium difficulty, use all terms (no filtering)
    return true
  }) || []

  const handleGameComplete = (score: number, totalWords: number, timeSpent: number) => {
    setGameResults({ score, totalWords, timeSpent })
    setGameStarted(false)
  }

  const startNewGame = () => {
    setGameResults(null)
    setGameStarted(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin/vocabulary">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Vocabulary
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            Physics Hangman
          </h1>
          <p className="text-muted-foreground">
            Play hangman with your physics vocabulary terms
          </p>
        </div>
      </div>

      {!gameStarted ? (
        <div className="space-y-6">
          {/* Game Results */}
          {gameResults && (
            <Card className="border-green-500 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Trophy className="h-5 w-5" />
                  Game Complete!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">{gameResults.score}</div>
                    <p className="text-sm text-green-600">Final Score</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">{gameResults.totalWords}</div>
                    <p className="text-sm text-green-600">Words Completed</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">{Math.floor(gameResults.timeSpent / 60)}m {gameResults.timeSpent % 60}s</div>
                    <p className="text-sm text-green-600">Time Taken</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Game Setup */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Game Setup</CardTitle>
                <CardDescription>
                  Choose your vocabulary set and difficulty
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Vocabulary Set</label>
                  <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vocabulary set" />
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

                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty</label>
                  <Select value={difficulty} onValueChange={(value) => setDifficulty(value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy (8 wrong guesses)</SelectItem>
                      <SelectItem value="medium">Medium (6 wrong guesses)</SelectItem>
                      <SelectItem value="hard">Hard (4 wrong guesses)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedSet && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Available Terms:</span>
                      <Badge variant="outline">{availableTerms.length} words</Badge>
                    </div>
                    {availableTerms.length === 0 && (
                      <p className="text-sm text-red-500">
                        No terms available for selected difficulty. Try a different difficulty or add more terms.
                      </p>
                    )}
                  </div>
                )}

                <Button 
                  onClick={startNewGame}
                  disabled={!selectedSetId || availableTerms.length === 0}
                  className="w-full"
                  size="lg"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Start Hangman Game
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How to Play</CardTitle>
                <CardDescription>
                  Learn the rules of Physics Hangman
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center mt-0.5">1</div>
                    <div>
                      <p className="font-medium text-sm">Guess the physics term</p>
                      <p className="text-xs text-muted-foreground">Letter by letter, reveal the hidden word</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center mt-0.5">2</div>
                    <div>
                      <p className="font-medium text-sm">Use hints wisely</p>
                      <p className="text-xs text-muted-foreground">See definitions but lose points</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center mt-0.5">3</div>
                    <div>
                      <p className="font-medium text-sm">Complete all words</p>
                      <p className="text-xs text-muted-foreground">Work through the entire vocabulary set</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-2">Scoring:</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-bold text-green-700">Easy</div>
                      <div className="text-green-600">10 pts/word</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="font-bold text-blue-700">Medium</div>
                      <div className="text-blue-600">20 pts/word</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <div className="font-bold text-purple-700">Hard</div>
                      <div className="text-purple-600">30 pts/word</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vocabulary Sets Overview */}
          {vocabularySets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Vocabulary Sets</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create vocabulary sets to play hangman games.
                </p>
                <Link href="/admin/vocabulary">
                  <Button>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Manage Vocabulary
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Available Vocabulary Sets</CardTitle>
                <CardDescription>
                  Your physics vocabulary collections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {vocabularySets.map((set) => (
                    <Card 
                      key={set.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedSetId === set.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedSetId(set.id)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{set.name}</CardTitle>
                        {set.description && (
                          <CardDescription className="text-xs">{set.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{set.terms.length} terms</Badge>
                          {set.unit && (
                            <Badge variant="secondary" className="text-xs">
                              {set.unit}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Game Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Playing: {selectedSet?.name}
                  </CardTitle>
                  <CardDescription>
                    Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} • 
                    {availableTerms.length} terms available
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setGameStarted(false)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Setup
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Hangman Game */}
          <VocabularyHangmanGame
            vocabularyTerms={availableTerms}
            difficulty={difficulty}
            showDefinitions={true}
            maxWrongGuesses={difficulty === 'easy' ? 8 : difficulty === 'medium' ? 6 : 4}
            onGameComplete={handleGameComplete}
          />
        </div>
      )}
    </div>
  )
}


