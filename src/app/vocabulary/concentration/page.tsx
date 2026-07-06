"use client"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import VocabPlaySource, { type ResolvedPlay } from '@/components/vocabulary/arcade/VocabPlaySource'
import VocabGameShell, { VocabEmptyBoard, VocabLoadingBoard } from '@/components/vocabulary/arcade/VocabGameShell'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Brain } from 'lucide-react'
import VocabularyConcentrationGame from '@/components/vocabulary/games/VocabularyConcentrationGame'
import ArcadeEndScreen from '@/components/vocabulary/arcade/ArcadeEndScreen'

// One-tap play: opens straight into the board with smart defaults; setup is
// demoted to the shell's collapsed Options panel, rules to the "?" toggle.

const PREFS_KEY = 'vocab:prefs:concentration'
const GRID_PAIRS = { '4x4': 8, '6x6': 18, '8x8': 32 } as const

type Difficulty = 'easy' | 'medium' | 'hard'
type GridSize = keyof typeof GRID_PAIRS

export default function StudentVocabularyConcentrationPage() {
  const { data: session, status } = useSession()
  // null = the play source is still resolving its smart default
  const [play, setPlay] = useState<ResolvedPlay | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [gridSize, setGridSize] = useState<GridSize>('4x4')
  const [gameResults, setGameResults] = useState<{
    score: number
    totalPairs: number
    timeSpent: number
  } | null>(null)
  const [replay, setReplay] = useState(0)

  // Last-used settings survive between visits (smart defaults).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY)
      if (!raw) return
      const p = JSON.parse(raw) as { difficulty?: Difficulty; gridSize?: GridSize }
      if (p.difficulty === 'easy' || p.difficulty === 'medium' || p.difficulty === 'hard') setDifficulty(p.difficulty)
      if (p.gridSize && p.gridSize in GRID_PAIRS) setGridSize(p.gridSize)
    } catch { /* ignore */ }
  }, [])
  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ difficulty, gridSize })) } catch { /* ignore */ }
  }, [difficulty, gridSize])

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
  // If the chosen grid needs more pairs than we have words, shrink to the
  // largest grid that fits instead of blocking play.
  const effGrid: GridSize =
    terms.length >= GRID_PAIRS[gridSize] ? gridSize : terms.length >= GRID_PAIRS['6x6'] ? '6x6' : '4x4'
  const requiredPairs = GRID_PAIRS[effGrid]
  const canPlay = terms.length >= GRID_PAIRS['4x4']

  // Score saving is centralized in ArcadeEndScreen (the one uniform save path).
  const handleGameComplete = (score: number, totalPairs: number, timeSpent: number) => {
    setGameResults({ score, totalPairs, timeSpent })
  }

  if (gameResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ArcadeEndScreen
          gameType="concentration"
          gameTitle="Concentration"
          vocabularySetId={play?.scoreSetId}
          score={gameResults.score}
          maxScore={gameResults.totalPairs * 10}
          detail={`${gameResults.totalPairs} pairs · ${Math.round(gameResults.timeSpent / 1000)}s`}
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
          <label className="text-sm font-medium text-foreground">Grid size</label>
          <Select value={gridSize} onValueChange={(value: GridSize) => setGridSize(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4x4">4×4 (8 pairs)</SelectItem>
              <SelectItem value="6x6">6×6 (18 pairs)</SelectItem>
              <SelectItem value="8x8">8×8 (32 pairs)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {canPlay && effGrid !== gridSize && (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          This selection has {terms.length} terms, so the board plays {effGrid} ({requiredPairs} pairs).
        </p>
      )}
    </>
  )

  const help = (
    <ul className="list-disc pl-4 space-y-1">
      <li>Flip cards to reveal physics terms and definitions.</li>
      <li>Match each term with its definition — a perfect match earns +20 points.</li>
      <li>Fewer moves means a higher memory bonus, so recall where cards sit.</li>
      <li>Clear the whole board to finish the game.</li>
    </ul>
  )

  return (
    <VocabGameShell
      icon={Brain}
      title="Concentration"
      hint="Flip cards and match every term to its definition from memory."
      help={help}
      options={options}
      forceOptionsOpen={play !== null && !canPlay}
      sourceLabel={play ? (play.label ? `${play.label} · ${terms.length} terms` : null) : 'loading words…'}
    >
      {play === null ? (
        <VocabLoadingBoard />
      ) : canPlay ? (
        <VocabularyConcentrationGame
          key={`${play.scoreSetId ?? 'none'}-${difficulty}-${effGrid}-${replay}`}
          vocabularyTerms={terms}
          difficulty={difficulty}
          numberOfPairs={requiredPairs}
          onGameComplete={handleGameComplete}
        />
      ) : (
        <VocabEmptyBoard message={`Pick a lesson or unit with at least ${GRID_PAIRS['4x4']} terms in Options to deal the cards.`} />
      )}
    </VocabGameShell>
  )
}
