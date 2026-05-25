"use client"
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import VocabPlaySource, { type ResolvedPlay } from '@/components/vocabulary/arcade/VocabPlaySource'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, BookOpen, Trophy, Brain, Eye } from 'lucide-react'
import Link from 'next/link'
import VocabularyConcentrationGame from '@/components/vocabulary/games/VocabularyConcentrationGame'
import ArcadeEndScreen from '@/components/vocabulary/arcade/ArcadeEndScreen'

export default function StudentVocabularyConcentrationPage() {
  const { data: session, status } = useSession()
  const [play, setPlay] = useState<ResolvedPlay>({ terms: [], scoreSetId: null, label: '' })
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [gridSize, setGridSize] = useState<'4x4' | '6x6' | '8x8'>('4x4')
  const [gameStarted, setGameStarted] = useState(false)
  const [gameResults, setGameResults] = useState<{
    score: number
    totalPairs: number
    timeSpent: number
    moves: number
  } | null>(null)
  
  if (status === 'loading') {
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

  const availableTerms = play.terms

  // Calculate required pairs for grid size
  const requiredPairs = gridSize === '4x4' ? 8 : gridSize === '6x6' ? 18 : 32

  // Score saving is centralized in ArcadeEndScreen (the one uniform save path).
  const handleGameComplete = (score: number, totalPairs: number, timeSpent: number) => {
    setGameResults({ score, totalPairs, timeSpent, moves: 0 })
    setGameStarted(false)
  }

  const resetGame = () => {
    setGameStarted(false)
    setGameResults(null)
  }

  if (gameResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ArcadeEndScreen
          gameType="concentration"
          gameTitle="Concentration"
          vocabularySetId={play.scoreSetId}
          score={gameResults.score}
          maxScore={gameResults.totalPairs * 10}
          detail={`${gameResults.totalPairs} pairs · ${Math.round(gameResults.timeSpent / 1000)}s`}
          onPlayAgain={() => { setGameResults(null); setGameStarted(true) }}
        />
      </div>
    )
  }

  if (gameStarted && availableTerms.length >= requiredPairs) {
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
          
          <VocabularyConcentrationGame
            vocabularyTerms={availableTerms}
            difficulty={difficulty}
            numberOfPairs={requiredPairs}
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
            <BookOpen className="h-8 w-8 text-teal-500" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Concentration
              </h1>
              <p className="text-muted-foreground">
                Memory game matching physics terms and definitions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Game Results */}
      {/* Game Setup */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Game Setup</span>
            </CardTitle>
            <CardDescription>
              Configure your concentration game
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                What to play
              </label>
              <VocabPlaySource onResolved={setPlay} />
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
                  <SelectItem value="easy">Easy (more time)</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard (faster)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Grid Size
              </label>
              <Select value={gridSize} onValueChange={(value: '4x4' | '6x6' | '8x8') => setGridSize(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4x4">4×4 (8 pairs - Beginner)</SelectItem>
                  <SelectItem value="6x6">6×6 (18 pairs - Intermediate)</SelectItem>
                  <SelectItem value="8x8">8×8 (32 pairs - Expert)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {availableTerms.length > 0 && availableTerms.length < requiredPairs && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  Not enough terms for {gridSize} grid (need {requiredPairs}, have {availableTerms.length})
                </div>
              </div>
            )}

            <Button
              onClick={() => setGameStarted(true)}
              disabled={availableTerms.length < requiredPairs}
              className="w-full"
              size="lg"
            >
              <Eye className="h-4 w-4 mr-2" />
              Start Concentration
            </Button>

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
                  <div className="font-medium text-foreground">Flip Cards</div>
                  <div className="text-sm text-muted-foreground">
                    Click cards to reveal physics terms and definitions
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">2</Badge>
                <div>
                  <div className="font-medium text-foreground">Find Matches</div>
                  <div className="text-sm text-muted-foreground">
                    Match each term with its correct definition
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">3</Badge>
                <div>
                  <div className="font-medium text-foreground">Remember Positions</div>
                  <div className="text-sm text-muted-foreground">
                    Use your memory to recall where cards are located
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">4</Badge>
                <div>
                  <div className="font-medium text-foreground">Clear the Board</div>
                  <div className="text-sm text-muted-foreground">
                    Match all pairs to complete the game
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
              <div className="text-sm font-medium text-teal-900 dark:text-teal-100 mb-1">
                🧠 Memory Tip
              </div>
              <div className="text-sm text-teal-700 dark:text-teal-300">
                Create mental associations between card positions and their content. The fewer moves, the higher your score!
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <Trophy className="h-4 w-4 mx-auto mb-1 text-green-600" />
                <div className="font-medium text-green-800 dark:text-green-300">Perfect Match</div>
                <div className="text-green-600 dark:text-green-400">+20 points</div>
              </div>
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <Brain className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                <div className="font-medium text-blue-800 dark:text-blue-300">Memory Bonus</div>
                <div className="text-blue-600 dark:text-blue-400">Fewer moves</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Grid Sizes:</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 4×4: Perfect for beginners (8 pairs)</li>
                <li>• 6×6: Intermediate challenge (18 pairs)</li>
                <li>• 8×8: Expert level memory test (32 pairs)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
