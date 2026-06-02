"use client"
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import VocabPlaySource, { type ResolvedPlay } from '@/components/vocabulary/arcade/VocabPlaySource'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Zap, BookOpen, Target, Heart } from 'lucide-react'
import Link from 'next/link'
import VocabularyWordShootGame from '@/components/vocabulary/games/VocabularyWordShootGame'
import ArcadeEndScreen from '@/components/vocabulary/arcade/ArcadeEndScreen'

export default function StudentVocabularyWordShootPage() {
  return (
    <Suspense fallback={null}>
      <WordShootInner />
    </Suspense>
  )
}

function WordShootInner() {
  const { data: session, status } = useSession()
  // Deep link from a lesson preselects that lesson's vocab in the picker.
  const lessonIdParam = useSearchParams().get('lesson_id') ?? undefined
  const [play, setPlay] = useState<ResolvedPlay>({ terms: [], scoreSetId: null, label: '' })
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [gameLength, setGameLength] = useState<number>(20)
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
          gameType="word-shoot"
          gameTitle="Word shoot"
          vocabularySetId={play.scoreSetId}
          score={gameResults.score}
          maxScore={gameResults.totalQuestions * 15}
          detail={`${gameResults.totalQuestions} questions`}
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
          
          <VocabularyWordShootGame
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
            <Zap className="h-8 w-8 text-purple-500" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Word Shoot
              </h1>
              <p className="text-muted-foreground">
                Fast-paced shooting game with physics vocabulary
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
              <BookOpen className="h-5 w-5" />
              <span>Game Setup</span>
            </CardTitle>
            <CardDescription>
              Configure your word shooting game
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                What to play
              </label>
              <VocabPlaySource onResolved={setPlay} initialLessonId={lessonIdParam} />
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
                  <SelectItem value="easy">Easy (more time, more lives)</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard (faster, fewer lives)</SelectItem>
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
                  <SelectItem value="10">10 questions (Quick)</SelectItem>
                  <SelectItem value="15">15 questions (Medium)</SelectItem>
                  <SelectItem value="20">20 questions (Long)</SelectItem>
                  <SelectItem value="25">25 questions (Marathon)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {availableTerms.length > 0 && availableTerms.length < gameLength && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  Not enough terms for {gameLength} questions (need {gameLength}, have {availableTerms.length})
                </div>
              </div>
            )}

            <Button
              onClick={() => setGameStarted(true)}
              disabled={availableTerms.length < gameLength}
              className="w-full"
              size="lg"
            >
              <Zap className="h-4 w-4 mr-2" />
              Start Word Shoot
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
                  <div className="font-medium text-foreground">Read Definition</div>
                  <div className="text-sm text-muted-foreground">
                    A physics term definition appears at the top
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">2</Badge>
                <div>
                  <div className="font-medium text-foreground">Aim & Shoot</div>
                  <div className="text-sm text-muted-foreground">
                    Click on the correct word as it falls from the top
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">3</Badge>
                <div>
                  <div className="font-medium text-foreground">Stay Alive</div>
                  <div className="text-sm text-muted-foreground">
                    Don&apos;t let wrong answers hit you - you have limited lives
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">4</Badge>
                <div>
                  <div className="font-medium text-foreground">Score High</div>
                  <div className="text-sm text-muted-foreground">
                    Quick correct answers earn more points
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                🎯 Pro Tip
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                Read the definition quickly and look for key words. Speed and accuracy both matter for your final score!
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <Target className="h-4 w-4 mx-auto mb-1 text-green-600" />
                <div className="font-medium text-green-800 dark:text-green-300">Quick Shot</div>
                <div className="text-green-600 dark:text-green-400">+15 points</div>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                <Heart className="h-4 w-4 mx-auto mb-1 text-red-600" />
                <div className="font-medium text-red-800 dark:text-red-300">Lives</div>
                <div className="text-red-600 dark:text-red-400">3 total</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Game Controls:</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Click words to shoot them</li>
                <li>• Move mouse to aim</li>
                <li>• Speed increases over time</li>
                <li>• Watch your lives counter</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
