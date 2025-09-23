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
import { ArrowLeft, Zap, Trophy, Users, BookOpen, Target, Clock } from 'lucide-react'
import Link from 'next/link'
import VocabularyQuizBowlGame from '@/components/vocabulary/games/VocabularyQuizBowlGame'

export default function VocabularyQuizBowlPage() {
  const { data: session, status } = useSession()
  const { vocabularySets, loading } = useVocabulary()
  const [selectedSetId, setSelectedSetId] = useState<string>('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [timeLimit, setTimeLimit] = useState<number>(10)
  const [totalQuestions, setTotalQuestions] = useState<number>(20)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameResults, setGameResults] = useState<{
    score: number
    totalQuestions: number
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

  const handleGameComplete = (score: number, totalQuestions: number, timeSpent: number) => {
    setGameResults({ score, totalQuestions, timeSpent })
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
            <Zap className="h-8 w-8 text-yellow-600" />
            Physics Quiz Bowl
          </h1>
          <p className="text-muted-foreground">
            Fast-paced vocabulary quiz with time pressure and scoring streaks
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
                  Quiz Bowl Complete!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {gameResults.score}
                    </div>
                    <p className="text-sm text-green-600">Final Score</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {gameResults.totalQuestions}
                    </div>
                    <p className="text-sm text-green-600">Questions</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {Math.floor(gameResults.timeSpent / 60)}m {gameResults.timeSpent % 60}s
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
                    <Zap className="h-5 w-5" />
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
                        <SelectItem value="easy">Easy (10 pts base)</SelectItem>
                        <SelectItem value="medium">Medium (20 pts base)</SelectItem>
                        <SelectItem value="hard">Hard (30 pts base)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time per Question</label>
                    <Select value={timeLimit.toString()} onValueChange={(value) => setTimeLimit(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 seconds (Lightning)</SelectItem>
                        <SelectItem value="10">10 seconds (Standard)</SelectItem>
                        <SelectItem value="15">15 seconds (Relaxed)</SelectItem>
                        <SelectItem value="20">20 seconds (Learning)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of Questions</label>
                    <Select value={totalQuestions.toString()} onValueChange={(value) => setTotalQuestions(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 questions (Quick)</SelectItem>
                        <SelectItem value="20">20 questions (Standard)</SelectItem>
                        <SelectItem value="30">30 questions (Extended)</SelectItem>
                        <SelectItem value="50">50 questions (Marathon)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={startNewGame}
                    disabled={!selectedSetId || availableTerms.length === 0}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Start Quiz Bowl Game
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
                  Learn the rules of Physics Quiz Bowl
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Read the definition</h4>
                      <p className="text-sm text-muted-foreground">
                        Physics definitions appear - type the correct term quickly
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Beat the clock</h4>
                      <p className="text-sm text-muted-foreground">
                        Answer before time runs out to earn points and bonuses
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Build streaks</h4>
                      <p className="text-sm text-muted-foreground">
                        Consecutive correct answers earn streak bonuses
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Scoring:</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="font-semibold text-green-700">Easy</div>
                      <div className="text-sm text-green-600">10 pts base</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-semibold text-blue-700">Medium</div>
                      <div className="text-sm text-blue-600">20 pts base</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="font-semibold text-purple-700">Hard</div>
                      <div className="text-sm text-purple-600">30 pts base</div>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <div className="text-sm text-muted-foreground">
                      + Speed bonus + Streak bonus (3+ correct)
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
                  {totalQuestions} questions • {timeLimit}s per question • {difficulty} difficulty
                </p>
              </div>
            </div>
          </div>

          <VocabularyQuizBowlGame
            vocabularyTerms={availableTerms}
            onGameComplete={handleGameComplete}
            difficulty={difficulty}
            timeLimit={timeLimit}
            totalQuestions={totalQuestions}
          />
        </div>
      )}
    </div>
  )
}
