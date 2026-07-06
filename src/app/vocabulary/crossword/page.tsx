"use client"
import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import VocabPlaySource, { type ResolvedPlay } from '@/components/vocabulary/arcade/VocabPlaySource'
import VocabGameShell, { VocabEmptyBoard, VocabLoadingBoard } from '@/components/vocabulary/arcade/VocabGameShell'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Grid3x3 } from 'lucide-react'
import VocabularyCrosswordGameWrapper from '@/components/vocabulary/games/VocabularyCrosswordGameWrapper'
import ArcadeEndScreen from '@/components/vocabulary/arcade/ArcadeEndScreen'

// One-tap play: opens straight into the puzzle using the shared VocabPlaySource
// smart default (last-used words, else first lesson) and saves through the one
// uniform ArcadeEndScreen path like every other arcade game. Setup lives in
// the shell's collapsed Options panel, rules behind the "?" toggle.

const PREFS_KEY = 'vocab:prefs:crossword'
const MIN_WORDS = 5

type Difficulty = 'easy' | 'medium' | 'hard'
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

// Crossword difficulty = word length (same bands the setup screen always used).
function matchesDifficulty(term: string, d: Difficulty): boolean {
  if (d === 'easy') return term.length <= 8
  if (d === 'medium') return term.length > 8 && term.length <= 12
  return term.length > 12
}

export default function StudentVocabularyCrosswordPage() {
  const { data: session, status } = useSession()
  // null = the play source is still resolving its smart default
  const [play, setPlay] = useState<ResolvedPlay | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [gameResults, setGameResults] = useState<{
    score: number
    totalWords: number
    timeSpent: number
  } | null>(null)
  const [replay, setReplay] = useState(0)
  const touchedDifficulty = useRef(false)

  // Last-used difficulty survives between visits (smart defaults).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY)
      if (!raw) return
      const p = JSON.parse(raw) as { difficulty?: Difficulty }
      if (p.difficulty && DIFFICULTIES.includes(p.difficulty)) setDifficulty(p.difficulty)
    } catch { /* ignore */ }
  }, [])
  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ difficulty })) } catch { /* ignore */ }
  }, [difficulty])

  // If the default word set can't fill a grid at the preferred length band,
  // quietly fall back to the first difficulty that can — but never override a
  // hand-picked choice.
  useEffect(() => {
    if (!play || touchedDifficulty.current) return
    setDifficulty((current) => {
      const countFor = (d: Difficulty) => play.terms.filter((t) => matchesDifficulty(t.term, d)).length
      if (countFor(current) >= MIN_WORDS) return current
      return DIFFICULTIES.find((d) => countFor(d) >= MIN_WORDS) ?? current
    })
  }, [play])

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

  const availableTerms = (play?.terms ?? []).filter((t) => matchesDifficulty(t.term, difficulty))
  const canPlay = availableTerms.length >= MIN_WORDS

  // Score saving is centralized in ArcadeEndScreen (the one uniform save path).
  const handleGameComplete = (score: number, totalWords: number, timeSpent: number) => {
    setGameResults({ score, totalWords, timeSpent })
  }

  if (gameResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ArcadeEndScreen
          gameType="crossword"
          gameTitle="Crossword"
          vocabularySetId={play?.scoreSetId}
          score={gameResults.score}
          maxScore={gameResults.totalWords * 10}
          detail={`${gameResults.totalWords} words · ${Math.round(gameResults.timeSpent)}s`}
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
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Difficulty</label>
        <Select
          value={difficulty}
          onValueChange={(value: Difficulty) => { touchedDifficulty.current = true; setDifficulty(value) }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Easy (words up to 8 letters)</SelectItem>
            <SelectItem value="medium">Medium (9–12 letters)</SelectItem>
            <SelectItem value="hard">Hard (13+ letters)</SelectItem>
          </SelectContent>
        </Select>
        {play !== null && !canPlay && (
          <p className="text-xs" style={{ color: 'var(--destructive)' }}>
            A crossword needs at least {MIN_WORDS} words at this difficulty — try another difficulty or word set.
          </p>
        )}
      </div>
    </>
  )

  const help = (
    <ul className="list-disc pl-4 space-y-1">
      <li>Each clue is a definition — fill the matching physics term into the grid.</li>
      <li>Words cross each other, so shared letters are free hints.</li>
      <li>Start with the words you know; they unlock the intersecting ones.</li>
      <li>A hint system is there if you get stuck. Fill every square to finish.</li>
    </ul>
  )

  return (
    <VocabGameShell
      icon={Grid3x3}
      title="Crossword"
      hint="Solve the puzzle — every clue is a physics definition."
      help={help}
      options={options}
      forceOptionsOpen={play !== null && !canPlay}
      sourceLabel={play ? (play.label ? `${play.label} · ${availableTerms.length} words` : null) : 'loading words…'}
    >
      {play === null ? (
        <VocabLoadingBoard />
      ) : canPlay ? (
        <VocabularyCrosswordGameWrapper
          key={`${play.scoreSetId ?? 'none'}-${difficulty}-${replay}`}
          vocabularyTerms={availableTerms}
          difficulty={difficulty}
          onGameComplete={handleGameComplete}
        />
      ) : (
        <VocabEmptyBoard message={`Pick a word set with at least ${MIN_WORDS} words in Options to build the puzzle.`} />
      )}
    </VocabGameShell>
  )
}
