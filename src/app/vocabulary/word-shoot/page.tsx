"use client"
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import VocabPlaySource, { type ResolvedPlay } from '@/components/vocabulary/arcade/VocabPlaySource'
import VocabGameShell, { VocabEmptyBoard, VocabLoadingBoard } from '@/components/vocabulary/arcade/VocabGameShell'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Zap } from 'lucide-react'
import VocabularyWordShootGame from '@/components/vocabulary/games/VocabularyWordShootGame'
import ArcadeEndScreen from '@/components/vocabulary/arcade/ArcadeEndScreen'

// One-tap play: the page opens straight into the board. Lesson deep links
// (?lesson_id=) preload that lesson's vocab; otherwise VocabPlaySource
// resolves a smart default (last-used, else first lesson). Setup lives in
// the shell's collapsed Options panel, rules behind the "?" toggle.

const PREFS_KEY = 'vocab:prefs:word-shoot'
const MIN_WORDS = 3

type Difficulty = 'easy' | 'medium' | 'hard'

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
  // null = the play source is still resolving its smart default / deep link
  const [play, setPlay] = useState<ResolvedPlay | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [gameLength, setGameLength] = useState<number>(20)
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
      const p = JSON.parse(raw) as { difficulty?: Difficulty; gameLength?: number }
      if (p.difficulty === 'easy' || p.difficulty === 'medium' || p.difficulty === 'hard') setDifficulty(p.difficulty)
      if (typeof p.gameLength === 'number' && [10, 15, 20, 25].includes(p.gameLength)) setGameLength(p.gameLength)
    } catch { /* ignore */ }
  }, [])
  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ difficulty, gameLength })) } catch { /* ignore */ }
  }, [difficulty, gameLength])

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
  // Fewer words than the chosen length? Play what we have instead of blocking.
  const effLength = Math.min(gameLength, terms.length)
  const canPlay = terms.length >= MIN_WORDS

  // Score saving is centralized in ArcadeEndScreen (the one uniform save path).
  const handleGameComplete = (score: number, totalQuestions: number, timeSpent: number) => {
    setGameResults({ score, totalQuestions, timeSpent })
  }

  if (gameResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ArcadeEndScreen
          gameType="word-shoot"
          gameTitle="Word shoot"
          vocabularySetId={play?.scoreSetId}
          score={gameResults.score}
          maxScore={gameResults.totalQuestions * 15}
          detail={`${gameResults.totalQuestions} questions`}
          onPlayAgain={() => { setGameResults(null); setReplay((n) => n + 1) }}
        />
      </div>
    )
  }

  const options = (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">What to play</label>
        <VocabPlaySource onResolved={setPlay} initialLessonId={lessonIdParam} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Difficulty</label>
          <Select value={difficulty} onValueChange={(value: Difficulty) => setDifficulty(value)}>
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
          <label className="text-sm font-medium text-foreground">Game length</label>
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
      </div>
      {canPlay && effLength < gameLength && (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          This selection has {terms.length} terms, so the game runs {effLength} questions.
        </p>
      )}
    </>
  )

  const help = (
    <ul className="list-disc pl-4 space-y-1">
      <li>A definition appears at the top — click the matching word as it falls.</li>
      <li>Quick, correct shots earn up to +15 points; speed increases over time.</li>
      <li>Do not let wrong answers reach you — you have 3 lives.</li>
      <li>Read fast, look for key words, and keep your aim steady.</li>
    </ul>
  )

  return (
    <VocabGameShell
      icon={Zap}
      title="Word Shoot"
      hint="Shoot the falling word that matches the definition."
      help={help}
      options={options}
      forceOptionsOpen={play !== null && !canPlay}
      sourceLabel={play ? (play.label ? `${play.label} · ${terms.length} terms` : null) : 'loading words…'}
    >
      {play === null ? (
        <VocabLoadingBoard label="Loading Word Shoot…" />
      ) : canPlay ? (
        <VocabularyWordShootGame
          key={`${play.scoreSetId ?? 'none'}-${difficulty}-${effLength}-${replay}`}
          vocabularyTerms={terms}
          difficulty={difficulty}
          gameLength={effLength}
          onGameComplete={handleGameComplete}
        />
      ) : (
        <VocabEmptyBoard message={`Pick a lesson or unit with at least ${MIN_WORDS} terms in Options to start shooting.`} />
      )}
    </VocabGameShell>
  )
}
