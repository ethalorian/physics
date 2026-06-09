"use client"
import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import VocabPlaySource, { type ResolvedPlay } from '@/components/vocabulary/arcade/VocabPlaySource'
import VocabularyDuelGame, { type MatchView } from '@/components/vocabulary/games/VocabularyDuelGame'
import ArcadeEndScreen from '@/components/vocabulary/arcade/ArcadeEndScreen'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Swords, Users, Zap, Trophy, Ghost } from 'lucide-react'
import { MIN_TERMS, POINTS_CORRECT, POINTS_SPEED, SPEED_MS, TIE_BONUS, WINNER_BONUS, type DuelMode } from '@/lib/duel'

// Vocab Duel — head-to-head buzzer race, two ways to play:
//   Live duel        — get a code, hand it to a rival who's online right now.
//   Ghost challenge  — record a run; anyone in ANY class period can race it
//                      for a week. (Cross-period play without needing to be
//                      online together.)
// Score saving is centralized in ArcadeEndScreen, same as every other arcade
// game; both players earn, the winner gets a bonus. A ghost that successfully
// defends pays its recorder a server-side bonus (see /api/duel/[id]).

interface OpenDuel { id: string; code: string; label: string; hostName: string; createdAt: string }

// Score from the sanitized match view. Rounds expose `correct` once resolved —
// or, for the host of a freshly recorded ghost, immediately (participation pay
// happens at recording time; the defense bonus comes later, server-side).
function scoreFromMatch(m: MatchView): { score: number; correct: number; played: number } {
  let score = 0
  let correct = 0
  let played = 0
  for (const r of m.rounds) {
    if (r.correct === undefined) continue
    played++
    if (r.mine && r.mine.answer === r.correct) {
      correct++
      score += POINTS_CORRECT
      if (r.mine.ms <= SPEED_MS) score += POINTS_SPEED
    }
  }
  if (m.winner === m.role) score += WINNER_BONUS
  else if (m.winner === 'tie') score += TIE_BONUS
  return { score, correct, played }
}

export default function VocabularyDuelPage() {
  const { data: session, status } = useSession()
  const [play, setPlay] = useState<ResolvedPlay>({ terms: [], scoreSetId: null, label: '' })
  const [matchId, setMatchId] = useState<string | null>(null)
  const [result, setResult] = useState<MatchView | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [open, setOpen] = useState<OpenDuel[]>([])
  const [ghosts, setGhosts] = useState<OpenDuel[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshOpen = useCallback(() => {
    fetch('/api/duel').then((r) => r.json())
      .then((d: { open?: OpenDuel[]; ghosts?: OpenDuel[] }) => { setOpen(d.open ?? []); setGhosts(d.ghosts ?? []) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (matchId || result) return
    refreshOpen()
    const t = setInterval(refreshOpen, 5000)
    return () => clearInterval(t)
  }, [matchId, result, refreshOpen])

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

  const createDuel = async (mode: DuelMode) => {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch('/api/duel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms: play.terms, vocabularySetId: play.scoreSetId, label: play.label, mode }),
      })
      const d = await r.json()
      if (!r.ok) setError(d.error ?? 'Could not create the duel')
      else setMatchId(d.id)
    } catch {
      setError('Could not create the duel')
    } finally {
      setBusy(false)
    }
  }

  const joinDuel = async (code: string) => {
    if (!code.trim()) return
    setBusy(true)
    setError(null)
    try {
      const r = await fetch('/api/duel/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const d = await r.json()
      if (!r.ok) setError(d.error ?? 'Could not join that duel')
      else setMatchId(d.id)
    } catch {
      setError('Could not join that duel')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => { setMatchId(null); setResult(null); setJoinCode(''); setError(null) }

  // Leaving an unclaimed challenge cancels it server-side, so the open list
  // never shows duels whose host has walked away. (The server refuses to
  // delete anything a challenger has already claimed.)
  const leaveDuel = async () => {
    if (matchId) await fetch(`/api/duel/${matchId}`, { method: 'DELETE' }).catch(() => {})
    reset()
  }

  // ---- end screen ----------------------------------------------------------
  if (result) {
    const { score, correct, played } = scoreFromMatch(result)
    const ghostPosted = result.status === 'open' // host just finished recording
    const iWon = result.winner === result.role
    const tie = result.winner === 'tie'
    const oppName = result.role === 'host' ? result.guestName ?? 'Opponent' : result.hostName
    const headline = ghostPosted
      ? 'Ghost posted! Classmates in any period can race it for a week.'
      : tie ? `Dead heat with ${oppName}!` : iWon ? `Victory over ${oppName}!` : `${oppName} wins this one — rematch?`
    const detail = ghostPosted
      ? `${correct} of ${played} correct · +${WINNER_BONUS} more if your ghost defends`
      : `${correct} of ${played} correct · ${result.wins[result.role]}–${result.wins[result.role === 'host' ? 'guest' : 'host']} rounds${iWon ? ` · +${WINNER_BONUS} winner bonus` : tie ? ` · +${TIE_BONUS} tie bonus` : ''}`
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <div className="max-w-md mx-auto text-center text-lg font-semibold" style={{ color: ghostPosted ? 'var(--primary)' : iWon ? 'var(--success)' : tie ? 'var(--reward)' : 'var(--muted-foreground)' }}>
          {headline}
        </div>
        <ArcadeEndScreen
          gameType="duel"
          gameTitle="Vocab Duel"
          vocabularySetId={result.vocabularySetId}
          score={score}
          maxScore={result.totalRounds * (POINTS_CORRECT + POINTS_SPEED) + WINNER_BONUS}
          detail={detail}
          onPlayAgain={reset}
        />
      </div>
    )
  }

  // ---- live match / recording ----------------------------------------------
  if (matchId) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" onClick={leaveDuel} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Leave duel
          </Button>
          <VocabularyDuelGame matchId={matchId} onComplete={setResult} />
        </div>
      </div>
    )
  }

  // ---- setup ----------------------------------------------------------------
  const canCreate = play.terms.length >= MIN_TERMS
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/vocabulary">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Games
          </Button>
        </Link>
        <div className="flex items-center space-x-3">
          <Swords className="h-8 w-8 text-red-500" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Vocab Duel</h1>
            <p className="text-muted-foreground">Race a classmate — fastest correct answer wins the round</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-md p-3 rounded-lg border text-sm" style={{ borderColor: '#C08B8B', color: '#C08B8B' }}>{error}</div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Swords className="h-5 w-5" />
              <span>Start a Duel</span>
            </CardTitle>
            <CardDescription>Pick vocab, then duel live or post a ghost for other periods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">What to play</label>
              <VocabPlaySource onResolved={setPlay} />
            </div>
            {play.terms.length > 0 && play.terms.length < MIN_TERMS && (
              <div className="p-3 bg-muted rounded-lg text-sm text-orange-600 dark:text-orange-400">
                Need at least {MIN_TERMS} terms to duel (have {play.terms.length})
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => createDuel('live')} disabled={!canCreate || busy} size="lg">
                <Zap className="h-4 w-4 mr-2" /> Live Duel
              </Button>
              <Button onClick={() => createDuel('ghost')} disabled={!canCreate || busy} size="lg" variant="secondary">
                <Ghost className="h-4 w-4 mr-2" /> Post a Ghost
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Live needs your rival online now. A ghost records your run so anyone — any period — can race it this week.
            </p>

            <div className="pt-2 border-t space-y-2">
              <label className="text-sm font-medium text-foreground">Or join with a code</label>
              <div className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') joinDuel(joinCode) }}
                  placeholder="ABCDE"
                  maxLength={5}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm tracking-[0.2em] font-mono uppercase"
                  style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
                />
                <Button onClick={() => joinDuel(joinCode)} disabled={busy || joinCode.trim().length < 4} variant="outline">Join</Button>
              </div>
            </div>

            {open.length > 0 && (
              <div className="pt-2 border-t space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5"><Users className="h-4 w-4" /> Live now</label>
                {open.map((o) => (
                  <button key={o.id} onClick={() => joinDuel(o.code)} disabled={busy}
                    className="w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:opacity-80"
                    style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
                    <span className="font-medium">{o.hostName}</span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{o.label || 'Vocab duel'}</span>
                  </button>
                ))}
              </div>
            )}

            {ghosts.length > 0 && (
              <div className="pt-2 border-t space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5"><Ghost className="h-4 w-4" /> Ghost challenges</label>
                {ghosts.map((o) => (
                  <button key={o.id} onClick={() => joinDuel(o.code)} disabled={busy}
                    className="w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:opacity-80"
                    style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
                    <span className="font-medium">{o.hostName}&apos;s ghost</span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{o.label || 'Vocab duel'}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Play</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">1</Badge>
                <div>
                  <div className="font-medium text-foreground">Same question, same clock</div>
                  <div className="text-sm text-muted-foreground">You and your rival see the same definition with 15 seconds to answer</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">2</Badge>
                <div>
                  <div className="font-medium text-foreground">Fastest correct wins the round</div>
                  <div className="text-sm text-muted-foreground">A right answer beats a wrong one; two right answers go to the quicker player</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">3</Badge>
                <div>
                  <div className="font-medium text-foreground">First to 4 rounds</div>
                  <div className="text-sm text-muted-foreground">Best of 7 — clinch 4 round wins and the match is yours</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">4</Badge>
                <div>
                  <div className="font-medium text-foreground">Ghosts cross periods</div>
                  <div className="text-sm text-muted-foreground">Rival not online? Race their recorded ghost — their answer times are baked in</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground flex items-center gap-1.5"><Trophy className="h-4 w-4" /> Scoring:</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Correct answer: +{POINTS_CORRECT} points</li>
                <li>• Under {SPEED_MS / 1000}s: +{POINTS_SPEED} speed bonus</li>
                <li>• Win the match (or your ghost defends): +{WINNER_BONUS} bonus</li>
                <li>• Dead-heat tie: +{TIE_BONUS} each</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
