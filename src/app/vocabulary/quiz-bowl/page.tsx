"use client"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import VocabPlaySource, { type ResolvedPlay } from '@/components/vocabulary/arcade/VocabPlaySource'
import VocabGameShell, { VocabEmptyBoard, VocabLoadingBoard } from '@/components/vocabulary/arcade/VocabGameShell'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trophy } from 'lucide-react'
import VocabularyQuizBowlGame from '@/components/vocabulary/games/VocabularyQuizBowlGame'
import ArcadeEndScreen from '@/components/vocabulary/arcade/ArcadeEndScreen'

// One-tap play: opens straight into the board with smart defaults; setup is
// demoted to the shell's collapsed Options panel, rules to the "?" toggle.

const PREFS_KEY = 'vocab:prefs:quiz-bowl'
const MIN_QUESTIONS = 4

type Difficulty = 'easy' | 'medium' | 'hard'

export default function StudentVocabularyQuizBowlPage() {
  const { data: session, status } = useSession()
  // null = the play source is still resolving its smart default
  const [play, setPlay] = useState<ResolvedPlay | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [timeLimit, setTimeLimit] = useState<number>(10)
  const [totalQuestions, setTotalQuestions] = useState<number>(20)
  const [gameResults, setGameResults] = useState<{
    score: number
    totalQuestions: number
    timeSpent: number
  } | null>(null)
  const [replay, setReplay] = useState(0)

  // Last-used settings survive between visits (smart defaults).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY)
      if (!raw) return
      const p = JSON.parse(raw) as { difficulty?: Difficulty; timeLimit?: number; totalQuestions?: number }
      if (p.difficulty === 'easy' || p.difficulty === 'medium' || p.difficulty === 'hard') setDifficulty(p.difficulty)
      if (typeof p.timeLimit === 'number' && [5, 10, 15, 20].includes(p.timeLimit)) setTimeLimit(p.timeLimit)
      if (typeof p.totalQuestions === 'number' && [10, 15, 20, 25].includes(p.totalQuestions)) setTotalQuestions(p.totalQuestions)
    } catch { /* ignore */ }
  }, [])
  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ difficulty, timeLimit, totalQuestions })) } catch { /* ignore */ }
  }, [difficulty, timeLimit, totalQuestions])

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

  const terms = play?.terms ?? []
  // Fewer terms than the chosen round count? Play what we have instead of blocking.
  const effQuestions = Math.min(totalQuestions, terms.length)
  const canPlay = terms.length >= MIN_QUESTIONS

  // Score saving is centralized in ArcadeEndScreen (the one uniform save path).
  const handleGameComplete = (score: number, total: number, timeSpent: number) => {
    setGameResults({ score, totalQuestions: total, timeSpent })
  }

  if (gameResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ArcadeEndScreen
          gameType="quiz-bowl"
          gameTitle="Quiz bowl"
          vocabularySetId={play?.scoreSetId}
          score={gameResults.score}
          maxScore={gameResults.totalQuestions * 10}
          detail={`${gameResults.totalQuestions} questions · ${Math.round(gameResults.timeSpent / 1000)}s`}
          onPlayAgain={() => { setGameResults(null); setReplay((n) => n + 1) }}
        />
      </div>
    )
  }

  const options = (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">What to play</label>
        <VocabPlaySource onResolved={setPlay} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Difficulty</label>
          <Select value={difficulty} onValueChange={(value: Difficulty) => setDifficulty(value)}>
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
          <label className="text-sm font-medium text-foreground">Time per question</label>
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
          <label className="text-sm font-medium text-foreground">Questions</label>
          <Select value={totalQuestions.toString()} onValueChange={(value) => setTotalQuestions(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 questions</SelectItem>
              <SelectItem value="15">15 questions</SelectItem>
              <SelectItem value="20">20 questions</SelectItem>
              <SelectItem value="25">25 questions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {canPlay && effQuestions < totalQuestions && (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          This selection has {terms.length} terms, so the round runs {effQuestions} questions.
        </p>
      )}
    </>
  )

  const help = (
    <ul className="list-disc pl-4 space-y-1">
      <li>Each question tests one physics term — pick the right answer before the clock runs out.</li>
      <li>Correct answer: +10 points. Answer quickly for a +5 bonus.</li>
      <li>Wrong answers score nothing, so trust your first instinct.</li>
      <li>Review the explanation after each question to lock the term in.</li>
    </ul>
  )

  return (
    <VocabGameShell
      icon={Trophy}
      title="Quiz Bowl"
      hint="Rapid-fire questions — answer before the clock runs out."
      help={help}
      options={options}
      forceOptionsOpen={play !== null && !canPlay}
      sourceLabel={play ? (play.label ? `${play.label} · ${terms.length} terms` : null) : 'loading words…'}
    >
      {play === null ? (
        <VocabLoadingBoard />
      ) : canPlay ? (
        <VocabularyQuizBowlGame
          key={`${play.scoreSetId ?? 'none'}-${difficulty}-${timeLimit}-${effQuestions}-${replay}`}
          vocabularyTerms={terms}
          difficulty={difficulty}
          timeLimit={timeLimit}
          totalQuestions={effQuestions}
          onGameComplete={handleGameComplete}
        />
      ) : (
        <VocabEmptyBoard message={`Pick a lesson or unit with at least ${MIN_QUESTIONS} terms in Options to start the quiz.`} />
      )}
    </VocabGameShell>
  )
}
