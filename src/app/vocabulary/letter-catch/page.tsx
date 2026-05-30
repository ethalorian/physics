"use client"
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import VocabPlaySource, { type ResolvedPlay } from '@/components/vocabulary/arcade/VocabPlaySource'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ShoppingBasket, BookOpen, Clock, Flame } from 'lucide-react'
import Link from 'next/link'
import VocabularyLetterCatchGame from '@/components/vocabulary/games/VocabularyLetterCatchGame'
import ArcadeEndScreen from '@/components/vocabulary/arcade/ArcadeEndScreen'

export default function StudentVocabularyLetterCatchPage() {
  const { data: session, status } = useSession()
  const [play, setPlay] = useState<ResolvedPlay>({ terms: [], scoreSetId: null, label: '' })
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [gameLength, setGameLength] = useState<number>(10)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameResults, setGameResults] = useState<{
    score: number
    totalQuestions: number
    timeSpent: number
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

  // Score saving is centralized in ArcadeEndScreen (the one uniform save path).
  const handleGameComplete = (score: number, totalQuestions: number, timeSpent: number) => {
    setGameResults({ score, totalQuestions, timeSpent })
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
          gameType="letter-catch"
          gameTitle="Letter Catch"
          vocabularySetId={play.scoreSetId}
          score={gameResults.score}
          maxScore={gameResults.totalQuestions * 40}
          detail={`${gameResults.totalQuestions} words`}
          onPlayAgain={() => { setGameResults(null); setGameStarted(true) }}
        />
      </div>
    )
  }

  if (gameStarted && availableTerms.length >= gameLength) {
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

          <VocabularyLetterCatchGame
            vocabularyTerms={availableTerms}
            difficulty={difficulty}
            gameLength={gameLength}
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
            <ShoppingBasket className="h-8 w-8 text-purple-500" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Letter Catch
              </h1>
              <p className="text-muted-foreground">
                Catch falling letters in order to spell physics terms
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Game Setup */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Game Setup</span>
            </CardTitle>
            <CardDescription>
              Configure your letter catching game
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
                  <SelectItem value="easy">Easy (slow drops, more time, next letter glows)</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard (fast drops, less time, more distractors)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Game Length
              </label>
              <Select value={gameLength.toString()} onValueChange={(value) => setGameLength(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 words (Quick)</SelectItem>
                  <SelectItem value="8">8 words (Short)</SelectItem>
                  <SelectItem value="10">10 words (Medium)</SelectItem>
                  <SelectItem value="15">15 words (Long)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {availableTerms.length > 0 && availableTerms.length < gameLength && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  Not enough terms for {gameLength} words (need {gameLength}, have {availableTerms.length})
                </div>
              </div>
            )}

            <Button
              onClick={() => setGameStarted(true)}
              disabled={availableTerms.length < gameLength}
              className="w-full"
              size="lg"
            >
              <ShoppingBasket className="h-4 w-4 mr-2" />
              Start Letter Catch
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
                  <div className="font-medium text-foreground">Read the Definition</div>
                  <div className="text-sm text-muted-foreground">
                    A definition appears with the term&apos;s letters scrambled as a hint
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">2</Badge>
                <div>
                  <div className="font-medium text-foreground">Catch in Order</div>
                  <div className="text-sm text-muted-foreground">
                    Move the basket to catch the word&apos;s letters left-to-right. The next slot is highlighted.
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">3</Badge>
                <div>
                  <div className="font-medium text-foreground">Avoid Wrong Letters</div>
                  <div className="text-sm text-muted-foreground">
                    Distractor letters fall too. Catching the wrong one costs points and breaks your combo.
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">4</Badge>
                <div>
                  <div className="font-medium text-foreground">Spell as Many as You Can</div>
                  <div className="text-sm text-muted-foreground">
                    One relaxed clock runs the whole game. Faster spelling and combos score more. Stuck on a word? Hit Skip.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                🧺 Pro Tip
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                Use the scrambled hint to recall the word, then think one letter ahead so your basket is already in position.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <Flame className="h-4 w-4 mx-auto mb-1 text-green-600" />
                <div className="font-medium text-green-800 dark:text-green-300">Combo</div>
                <div className="text-green-600 dark:text-green-400">up to ×5</div>
              </div>
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <Clock className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                <div className="font-medium text-blue-800 dark:text-blue-300">One Clock</div>
                <div className="text-blue-600 dark:text-blue-400">for the whole game</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Game Controls:</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Move the mouse to slide the basket</li>
                <li>• Or use the ← → arrow keys</li>
                <li>• Catch the next letter in order (it&apos;s highlighted)</li>
                <li>• Missed letters that hit the floor don&apos;t hurt you</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
