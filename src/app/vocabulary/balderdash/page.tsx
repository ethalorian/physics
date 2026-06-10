"use client"
import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import VocabPlaySource, { type ResolvedPlay } from '@/components/vocabulary/arcade/VocabPlaySource'
import VocabularyBalderdashGame, { type BalView } from '@/components/vocabulary/games/VocabularyBalderdashGame'
import ArcadeEndScreen from '@/components/vocabulary/arcade/ArcadeEndScreen'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Feather, Users, Trophy } from 'lucide-react'
import { BAL_ROUNDS, FOOL_POINTS, MIN_PLAYERS, SPOT_POINTS } from '@/lib/balderdash'

// Physics Balderdash — the higher-Bloom's vocab game. Players FORGE fake
// definitions (Create) and JUDGE which definition is real (Evaluate). Scores
// save through ArcadeEndScreen like every other arcade game.

interface OpenRoom { id: string; code: string; label: string; hostName: string; playerCount: number; joined: boolean }

export default function VocabularyBalderdashPage() {
  const { data: session, status } = useSession()
  const [play, setPlay] = useState<ResolvedPlay>({ terms: [], scoreSetId: null, label: '' })
  const [roomId, setRoomId] = useState<string | null>(null)
  const [result, setResult] = useState<BalView | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [open, setOpen] = useState<OpenRoom[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshOpen = useCallback(() => {
    fetch('/api/balderdash').then((r) => r.json()).then((d: { open?: OpenRoom[] }) => setOpen(d.open ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (roomId || result) return
    refreshOpen()
    const t = setInterval(refreshOpen, 5000)
    return () => clearInterval(t)
  }, [roomId, result, refreshOpen])

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

  const createRoom = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await fetch('/api/balderdash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms: play.terms, vocabularySetId: play.scoreSetId, label: play.label }),
      })
      const d = await r.json()
      if (!r.ok) setError(d.error ?? 'Could not create the room')
      else setRoomId(d.id)
    } catch {
      setError('Could not create the room')
    } finally {
      setBusy(false)
    }
  }

  const joinRoom = async (code: string) => {
    if (!code.trim()) return
    setBusy(true)
    setError(null)
    try {
      const r = await fetch('/api/balderdash/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const d = await r.json()
      if (!r.ok) setError(d.error ?? 'Could not join that room')
      else setRoomId(d.id)
    } catch {
      setError('Could not join that room')
    } finally {
      setBusy(false)
    }
  }

  const reset = () => { setRoomId(null); setResult(null); setJoinCode(''); setError(null) }

  // An unstarted room dies with its host's exit (keeps the open list clean).
  const leaveRoom = async () => {
    if (roomId) await fetch(`/api/balderdash/${roomId}`, { method: 'DELETE' }).catch(() => {})
    reset()
  }

  // ---- end screen ----------------------------------------------------------
  if (result) {
    const me = result.players.find((p) => p.isYou)
    const score = me?.score ?? 0
    const best = Math.max(...result.players.map((p) => p.score))
    const champion = result.players.filter((p) => p.score === best).map((p) => p.name).join(' & ')
    const spotted = (result.recap ?? []).filter((x) => x.spotted).length
    const fooled = (result.recap ?? []).reduce((s, x) => s + x.fooled, 0)
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <div className="max-w-md mx-auto text-center text-lg font-semibold" style={{ color: me && me.score === best ? 'var(--success)' : 'var(--muted-foreground)' }}>
          {me && me.score === best ? 'Champion wordsmith!' : `${champion} takes the crown`}
        </div>
        <ArcadeEndScreen
          gameType="balderdash"
          gameTitle="Physics Balderdash"
          vocabularySetId={result.vocabularySetId}
          score={score}
          maxScore={result.totalRounds * (SPOT_POINTS + FOOL_POINTS * Math.max(1, result.players.length - 1))}
          detail={`Spotted ${spotted} of ${result.totalRounds} real definitions · fooled classmates ${fooled}×`}
          onPlayAgain={reset}
        />
        <div className="max-w-md mx-auto rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Final standings</div>
          {[...result.players].sort((a, b) => b.score - a.score).map((p, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1" style={{ color: p.isYou ? 'var(--primary)' : 'var(--foreground)' }}>
              <span>{i + 1}. {p.name}{p.isYou ? ' (you)' : ''}</span>
              <span className="font-medium">{p.score}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ---- live room -------------------------------------------------------------
  if (roomId) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" onClick={leaveRoom} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Leave game
          </Button>
          <VocabularyBalderdashGame roomId={roomId} onComplete={setResult} />
        </div>
      </div>
    )
  }

  // ---- setup -----------------------------------------------------------------
  const canCreate = play.terms.length >= BAL_ROUNDS
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/vocabulary">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Games
          </Button>
        </Link>
        <div className="flex items-center space-x-3">
          <Feather className="h-8 w-8 text-purple-500" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Physics Balderdash</h1>
            <p className="text-muted-foreground">Forge fake definitions. Spot the real one. Fool your friends.</p>
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
              <Feather className="h-5 w-5" />
              <span>Open a Table</span>
            </CardTitle>
            <CardDescription>Pick vocab, gather {MIN_PLAYERS}+ players, start the bluffing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">What to play</label>
              <VocabPlaySource onResolved={setPlay} />
            </div>
            {play.terms.length > 0 && play.terms.length < BAL_ROUNDS && (
              <div className="p-3 bg-muted rounded-lg text-sm text-orange-600 dark:text-orange-400">
                Need at least {BAL_ROUNDS} terms (have {play.terms.length})
              </div>
            )}
            <Button onClick={createRoom} disabled={!canCreate || busy} className="w-full" size="lg">
              <Feather className="h-4 w-4 mr-2" /> Open Table
            </Button>

            <div className="pt-2 border-t space-y-2">
              <label className="text-sm font-medium text-foreground">Or join with a code</label>
              <div className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') joinRoom(joinCode) }}
                  placeholder="ABCDE"
                  maxLength={5}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm tracking-[0.2em] font-mono uppercase"
                  style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
                />
                <Button onClick={() => joinRoom(joinCode)} disabled={busy || joinCode.trim().length < 4} variant="outline">Join</Button>
              </div>
            </div>

            {open.length > 0 && (
              <div className="pt-2 border-t space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5"><Users className="h-4 w-4" /> Tables gathering now</label>
                {open.map((o) => (
                  <button key={o.id} onClick={() => joinRoom(o.code)} disabled={busy}
                    className="w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:opacity-80"
                    style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
                    <span className="font-medium">{o.hostName}{o.joined ? ' · rejoin' : ''}</span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{o.playerCount} seated · {o.label || 'Balderdash'}</span>
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
                  <div className="font-medium text-foreground">Forge a fake</div>
                  <div className="text-sm text-muted-foreground">Everyone secretly writes a convincing fake definition for the same physics term</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">2</Badge>
                <div>
                  <div className="font-medium text-foreground">Spot the real one</div>
                  <div className="text-sm text-muted-foreground">All fakes plus the real definition appear shuffled and anonymous — vote for the real one</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">3</Badge>
                <div>
                  <div className="font-medium text-foreground">The reveal</div>
                  <div className="text-sm text-muted-foreground">See who wrote what, who got fooled, and who has the sharpest eye</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Badge variant="secondary" className="mt-0.5">4</Badge>
                <div>
                  <div className="font-medium text-foreground">Why it&apos;s sneaky-smart</div>
                  <div className="text-sm text-muted-foreground">Writing a believable fake means knowing exactly what real physics definitions sound like</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground flex items-center gap-1.5"><Trophy className="h-4 w-4" /> Scoring:</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Vote the real definition: +{SPOT_POINTS} points</li>
                <li>• Each classmate your fake fools: +{FOOL_POINTS} points</li>
                <li>• {BAL_ROUNDS} rounds · {MIN_PLAYERS}–12 players</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
