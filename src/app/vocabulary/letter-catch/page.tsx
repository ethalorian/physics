"use client"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import VocabPlaySource, { type ResolvedPlay } from '@/components/vocabulary/arcade/VocabPlaySource'
import VocabGameShell, { VocabEmptyBoard, VocabLoadingBoard } from '@/components/vocabulary/arcade/VocabGameShell'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShoppingBasket } from 'lucide-react'
import VocabularyLetterCatchGame from '@/components/vocabulary/games/VocabularyLetterCatchGame'
import ArcadeEndScreen from '@/components/vocabulary/arcade/ArcadeEndScreen'

// One-tap play: opens straight into the board with smart defaults; setup is
// demoted to the shell's collapsed Options panel, rules to the "?" toggle.

const PREFS_KEY = 'vocab:prefs:letter-catch'
const MIN_WORDS = 3

type Difficulty = 'easy' | 'medium' | 'hard'

export default function StudentVocabularyLetterCatchPage() {
  const { data: session, status } = useSession()
  // null = the play source is still resolving its smart default
  const [play, setPlay] = useState<ResolvedPlay | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [gameLength, setGameLength] = useState<number>(10)
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
      if (typeof p.gameLength === 'number' && [5, 8, 10, 15].includes(p.gameLength)) setGameLength(p.gameLength)
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
          gameType="letter-catch"
          gameTitle="Letter Catch"
          vocabularySetId={play?.scoreSetId}
          score={gameResults.score}
          maxScore={gameResults.totalQuestions * 40}
          detail={`${gameResults.totalQuestions} words`}
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Difficulty</label>
          <Select value={difficulty} onValueChange={(value: Difficulty) => setDifficulty(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy (slow drops, next letter glows)</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard (fast drops, more distractors)</SelectItem>
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
              <SelectItem value="5">5 words (Quick)</SelectItem>
              <SelectItem value="8">8 words (Short)</SelectItem>
              <SelectItem value="10">10 words (Medium)</SelectItem>
              <SelectItem value="15">15 words (Long)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {canPlay && effLength < gameLength && (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          This selection has {terms.length} terms, so the game runs {effLength} words.
        </p>
      )}
    </>
  )

  const help = (
    <ul className="list-disc pl-4 space-y-1">
      <li>Read the definition, then slide the basket (mouse or arrow keys) to catch the falling letters.</li>
      <li>The basket only grabs the letter you need — wrong letters bounce off with no penalty.</li>
      <li>Grab power-ups (bonus points, slow-mo, wilds, the broom); dodge the skull hazards.</li>
      <li>One relaxed clock runs the whole game; faster spelling and combos (up to ×5) score more. Stuck? Hit Skip.</li>
    </ul>
  )

  return (
    <VocabGameShell
      icon={ShoppingBasket}
      title="Letter Catch"
      hint="Catch falling letters in order to spell each physics term."
      help={help}
      options={options}
      forceOptionsOpen={play !== null && !canPlay}
      sourceLabel={play ? (play.label ? `${play.label} · ${terms.length} terms` : null) : 'loading words…'}
    >
      {play === null ? (
        <VocabLoadingBoard />
      ) : canPlay ? (
        <VocabularyLetterCatchGame
          key={`${play.scoreSetId ?? 'none'}-${difficulty}-${effLength}-${replay}`}
          vocabularyTerms={terms}
          difficulty={difficulty}
          gameLength={effLength}
          onGameComplete={handleGameComplete}
        />
      ) : (
        <VocabEmptyBoard message={`Pick a lesson or unit with at least ${MIN_WORDS} terms in Options to start catching.`} />
      )}
    </VocabGameShell>
  )
}
