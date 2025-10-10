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
import { ArrowLeft, Grid3x3, Trophy, BookOpen, Target } from 'lucide-react'
import Link from 'next/link'
import VocabularyCrosswordGame from '@/components/vocabulary/games/VocabularyCrosswordGame'

export default function VocabularyCrosswordPage() {
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

  const handleGameComplete = (answers: Record<string, string>) => {
    // Calculate score based on correct answers
    const correctAnswers = Object.keys(answers).filter(key => {
      const userAnswer = answers[key]?.toLowerCase().trim()
      const correctTerm = availableTerms.find(term => term.id === key)
      return userAnswer === correctTerm?.term.toLowerCase().trim()
    }).length

    setGameResults({ 
      score: correctAnswers, 
      totalWords: availableTerms.length, 
      timeSpent: 0 
    })
    setGameStarted(false)
  }

  const startNewGame = () => {
    setGameResults(null)
    setGameStarted(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/vocabulary">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vocabulary
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Grid3x3 className="h-8 w-8 text-blue-600" />
            Physics Crossword
          </h1>
          <p className="text-muted-foreground">
            Solve crossword puzzles using physics vocabulary terms
          </p>
        </div>
      </div>

      {!gameStarted ? (
        <>
          {/* Game Results */}
          {gameResults && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Trophy className="h-5 w-5" />
                  Game Complete!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {gameResults.score}/{gameResults.totalWords}
                    </div>
                    <p className="text-sm text-green-600">Words Completed</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {Math.round((gameResults.score / gameResults.totalWords) * 100)}%
                    </div>
                    <p className="text-sm text-green-600">Accuracy</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {gameResults.timeSpent > 0 ? `${Math.floor(gameResults.timeSpent / 60)}m` : '--'}
                    </div>
                    <p className="text-sm text-green-600">Time Spent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Game Setup */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3x3 className="h-5 w-5" />
                    Game Setup
                  </CardTitle>
                  <CardDescription>
                    Choose your vocabulary set and difficulty
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vocabulary Set</label>
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty</label>
                    <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy (4 wrong guesses)</SelectItem>
                        <SelectItem value="medium">Medium (6 wrong guesses)</SelectItem>
                        <SelectItem value="hard">Hard (8 wrong guesses)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={startNewGame}
                    disabled={!selectedSetId || availableTerms.length === 0}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Start Crossword Game
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - How to Play */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  How to Play
                </CardTitle>
                <CardDescription>
                  Learn the rules of Physics Crossword
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Read the clues</h4>
                      <p className="text-sm text-muted-foreground">
                        Use physics definitions to find the correct terms
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Fill the grid</h4>
                      <p className="text-sm text-muted-foreground">
                        Click on cells and type to fill in answers
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Complete all words</h4>
                      <p className="text-sm text-muted-foreground">
                        Work through the entire vocabulary set
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Scoring:</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="font-semibold text-green-700">Easy</div>
                      <div className="text-sm text-green-600">10 pts/word</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-semibold text-blue-700">Medium</div>
                      <div className="text-sm text-blue-600">20 pts/word</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="font-semibold text-purple-700">Hard</div>
                      <div className="text-sm text-purple-600">30 pts/word</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Vocabulary Sets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Available Vocabulary Sets
              </CardTitle>
              <CardDescription>
                Your physics vocabulary collections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {vocabularySets.map((set) => (
                  <Card key={set.id} className="cursor-pointer transition-colors hover:bg-muted/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{set.name}</CardTitle>
                        <Badge variant="outline">{set.unit || 'unit-1'}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="mb-3">
                        {set.description}
                      </CardDescription>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{set.terms.length} terms</span>
                        <span>{set.unit || 'unit-1'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Game Interface */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => setGameStarted(false)} 
                variant="outline" 
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Setup
              </Button>
              <div>
                <h2 className="text-xl font-semibold">{selectedSet?.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {availableTerms.length} terms • {difficulty} difficulty
                </p>
              </div>
            </div>
          </div>

          <VocabularyCrosswordGame
            question={{
              id: 'crossword-game',
              type: 'vocabulary-crossword',
              question: 'Complete the crossword puzzle using the physics vocabulary terms.',
              points: availableTerms.length * 2,
              vocabularyTerms: availableTerms,
              gridSize: 15
            }}
            onAnswer={(answer) => handleGameComplete(answer.answers || {})}
            showResults={false}
            disabled={false}
          />
        </div>
      )}
    </div>
  )
}
