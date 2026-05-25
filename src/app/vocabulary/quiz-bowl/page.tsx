"use client"
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import VocabPlaySource, { type ResolvedPlay } from '@/components/vocabulary/arcade/VocabPlaySource'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy, BookOpen, Zap, Clock } from 'lucide-react'
import Link from 'next/link'
import VocabularyQuizBowlGame from '@/components/vocabulary/games/VocabularyQuizBowlGame'
import ArcadeEndScreen from '@/components/vocabulary/arcade/ArcadeEndScreen'

export default function StudentVocabularyQuizBowlPage() {
  const { data: session, status } = useSession()
  const [play, setPlay] = useState<ResolvedPlay>({ terms: [], scoreSetId: null, label: '' })
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [timeLimit, setTimeLimit] = useState<number>(10)
  const [totalQuestions, setTotalQuestions] = useState<number>(20)
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
          gameType="quiz-bowl"
          gameTitle="Quiz bowl"
          vocabularySetId={play.scoreSetId}
          score={gameResults.score}
          maxScore={gameResults.totalQuestions * 10}
          detail={`${gameResults.totalQuestions} questions · ${Math.round(gameResults.timeSpent / 1000)}s`}
          onPlayAgain={() => { setGameResults(null); setGameStarted(true) }}
        />
      </div>
    )
  }

  if (gameStarted && availableTerms.length >= totalQuestions) {
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
          
          <VocabularyQuizBowlGame
            vocabularyTerms={availableTerms}
            difficulty={difficulty}
            timeLimit={timeLimit}
            totalQuestions={totalQuestions}
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
            <Trophy className="h-8 w-8 text-orange-500" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Quiz Bowl
              </h1>
              <p className="text-muted-foreground">
                Rapid-fire questions about physics terms
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
              Configure your quiz bowl challenge
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
                Time Per Question
              </label>
              <Select value={timeLimit.toString()} onValueChange={(value) => setTimeLimit(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 seconds (Lightning)</SelectItem>
                  <SelectItem value="10">10 seconds (Fast)</SelectItem>
                  <SelectItem value="15">15 seconds (Normal)</SelectItem>
                  <SelectItem value="20">20 seconds (Relaxed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Total Questions
              </label>
              <Select value={totalQuestions.toString()} onValueChange={(value) => setTotalQuestions(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 questions (Quick)</SelectItem>
                  <SelectItem value="15">15 questions (Medium)</SelectItem>
                  <SelectItem value="20">20 questions (Standard)</SelectItem>
                  <SelectItem value="25">25 questions (Challenge)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {availableTerms.length > 0 && availableTerms.length < totalQuestions && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  Not enough terms for {totalQuestions} questions (need {totalQuestions}, have {availableTerms.length})
                </div>
              </div>
            )}

            <Button
              onClick={() => setGameStarted(true)}
              disabled={availableTerms.length < totalQuestions}
              className="w-full"
              size="lg"
            >
              <Zap className="h-4 w-4 mr-2" />
              Start Quiz Bowl
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
                  <div className="font-medium text-foreground">Read Questions</div>
                  <div className="text-sm text-muted-foreground">
                    Each question tests your knowledge of physics vocabulary
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">2</Badge>
                <div>
                  <div className="font-medium text-foreground">Choose Fast</div>
                  <div className="text-sm text-muted-foreground">
                    Select the correct answer before time runs out
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">3</Badge>
                <div>
                  <div className="font-medium text-foreground">Beat the Clock</div>
                  <div className="text-sm text-muted-foreground">
                    Faster correct answers earn bonus points
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">4</Badge>
                <div>
                  <div className="font-medium text-foreground">Learn & Improve</div>
                  <div className="text-sm text-muted-foreground">
                    Review explanations after each question
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">
                ⚡ Pro Tip
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">
                Trust your first instinct! In rapid-fire questions, your initial reaction is often correct.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <Zap className="h-4 w-4 mx-auto mb-1 text-green-600" />
                <div className="font-medium text-green-800 dark:text-green-300">Quick Answer</div>
                <div className="text-green-600 dark:text-green-400">+5 bonus</div>
              </div>
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <Clock className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                <div className="font-medium text-blue-800 dark:text-blue-300">Time Pressure</div>
                <div className="text-blue-600 dark:text-blue-400">Builds focus</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Scoring System:</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Correct answer: +10 points</li>
                <li>• Quick answer bonus: +5 points</li>
                <li>• Wrong answer: 0 points</li>
                <li>• Time bonus for fast completion</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
