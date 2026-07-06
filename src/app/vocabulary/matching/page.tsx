"use client"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import VocabPlaySource, { type ResolvedPlay } from '@/components/vocabulary/arcade/VocabPlaySource'
import VocabGameShell, { VocabEmptyBoard, VocabLoadingBoard } from '@/components/vocabulary/arcade/VocabGameShell'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users } from 'lucide-react'
import VocabularyMatchingGameWrapper from '@/components/vocabulary/games/VocabularyMatchingGameWrapper'
import ArcadeEndScreen from '@/components/vocabulary/arcade/ArcadeEndScreen'

// One-tap play: the page opens straight into the board with smart defaults
// (last-used words + settings via VocabPlaySource/localStorage). Setup lives
// in the shell's collapsed Options panel; rules live behind the "?" toggle.

const PREFS_KEY = 'vocab:prefs:matching'
const MIN_MATCHES = 4

type Difficulty = 'easy' | 'medium' | 'hard'

export default function StudentVocabularyMatchingPage() {
  const { data: session, status } = useSession()
  // null = the play source is still resolving its smart default
  const [play, setPlay] = useState<ResolvedPlay | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [maxMatches, setMaxMatches] = useState<number>(8)
  const [gameResults, setGameResults] = useState<{
    score: number
    totalMatches: number
    timeSpent: number
  } | null>(null)
  const [replay, setReplay] = useState(0)

  // Last-used settings survive between visits (smart defaults).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY)
      if (!raw) return
      const p = JSON.parse(raw) as { difficulty?: Difficulty; maxMatches?: number }
      if (p.difficulty === 'easy' || p.difficulty === 'medium' || p.difficulty === 'hard') setDifficulty(p.difficulty)
      if (typeof p.maxMatches === 'number' && [4, 6, 8, 10].includes(p.maxMatches)) setMaxMatches(p.maxMatches)
    } catch { /* ignore */ }
  }, [])
  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ difficulty, maxMatches })) } catch { /* ignore */ }
  }, [difficulty, maxMatches])

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
  // Board too big for the loaded words? Shrink to fit instead of blocking play.
  const effMatches = Math.max(MIN_MATCHES, Math.min(maxMatches, terms.length))
  const canPlay = terms.length >= MIN_MATCHES

  // Score saving is centralized in ArcadeEndScreen (the one uniform save path).
  const handleGameComplete = (score: number, totalMatches: number, timeSpent: number) => {
    setGameResults({ score, totalMatches, timeSpent })
  }

  if (gameResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ArcadeEndScreen
          gameType="matching"
          gameTitle="Matching"
          vocabularySetId={play?.scoreSetId}
          score={gameResults.score}
          maxScore={gameResults.totalMatches * 10}
          detail={`${gameResults.totalMatches} matches · ${Math.round(gameResults.timeSpent / 1000)}s`}
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
              <SelectItem value="easy">Easy (more time)</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard (faster)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Matches</label>
          <Select value={maxMatches.toString()} onValueChange={(value) => setMaxMatches(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4 matches</SelectItem>
              <SelectItem value="6">6 matches</SelectItem>
              <SelectItem value="8">8 matches</SelectItem>
              <SelectItem value="10">10 matches</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {canPlay && effMatches < maxMatches && (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          This selection has {terms.length} terms, so the board plays {effMatches} matches.
        </p>
      )}
    </>
  )

  const help = (
    <ul className="list-disc pl-4 space-y-1">
      <li>Click cards to reveal physics terms and definitions.</li>
      <li>Match each term with its correct definition — a quick match earns +10 points.</li>
      <li>Remember the positions of cards you have seen; careful attention pays.</li>
      <li>Find every pair to finish the board and bank a perfect-game bonus.</li>
    </ul>
  )

  return (
    <VocabGameShell
      icon={Users}
      title="Matching"
      hint="Pair each physics term with its definition."
      help={help}
      options={options}
      forceOptionsOpen={play !== null && !canPlay}
      sourceLabel={play ? (play.label ? `${play.label} · ${terms.length} terms` : null) : 'loading words…'}
    >
      {play === null ? (
        <VocabLoadingBoard />
      ) : canPlay ? (
        <VocabularyMatchingGameWrapper
          key={`${play.scoreSetId ?? 'none'}-${difficulty}-${effMatches}-${replay}`}
          vocabularyTerms={terms}
          difficulty={difficulty}
          maxMatches={effMatches}
          onGameComplete={handleGameComplete}
        />
      ) : (
        <VocabEmptyBoard message={`Pick a lesson or unit with at least ${MIN_MATCHES} terms in Options to start matching.`} />
      )}
    </VocabGameShell>
  )
}
