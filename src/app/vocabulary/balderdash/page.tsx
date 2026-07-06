"use client"
import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import VocabPlaySource, { type ResolvedPlay } from '@/components/vocabulary/arcade/VocabPlaySource'
import VocabGameShell from '@/components/vocabulary/arcade/VocabGameShell'
import VocabularyBalderdashGame, { type BalView } from '@/components/vocabulary/games/VocabularyBalderdashGame'
import ArcadeEndScreen from '@/components/vocabulary/arcade/ArcadeEndScreen'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Feather, Users } from 'lucide-react'
import { BAL_ROUNDS, FOOL_POINTS, MIN_PLAYERS, SPOT_POINTS } from '@/lib/balderdash'

// Physics Balderdash — the higher-Bloom's vocab game. Players FORGE fake
// definitions (Create) and JUDGE which definition is real (Evaluate). Scores
// save through ArcadeEndScreen like every other arcade game.
// One-tap flow: VocabPlaySource resolves a smart default on its own, so the
// lobby opens with "Open Table" ready immediately; changing the word set
// lives in the shell's collapsed Options panel.

interface OpenRoom { id: string; code: string; label: string; hostName: string; playerCount: number; joined: boolean }

export default function VocabularyBalderdashPage() {
  const { data: session, status } = useSession()
  // null = the play source is still resolving its smart default
  const [play, setPlay] = useState<ResolvedPlay | null>(null)
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
    if (!play) return
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

  // ---- lobby -----------------------------------------------------------------
  const terms = play?.terms ?? []
  const canCreate = terms.length >= BAL_ROUNDS

  const options = (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">What to play</label>
      <VocabPlaySource onResolved={setPlay} />
      {play !== null && terms.length > 0 && terms.length < BAL_ROUNDS && (
        <p className="text-xs" style={{ color: 'var(--destructive)' }}>
          Need at least {BAL_ROUNDS} terms (this selection has {terms.length}).
        </p>
      )}
    </div>
  )

  const help = (
    <ul className="list-disc pl-4 space-y-1">
      <li>Everyone secretly writes a convincing fake definition for the same physics term.</li>
      <li>All fakes plus the real definition appear shuffled and anonymous — vote for the real one.</li>
      <li>The reveal shows who wrote what and who got fooled. Writing a believable fake means knowing what real physics definitions sound like.</li>
      <li>Scoring: +{SPOT_POINTS} for spotting the real definition, +{FOOL_POINTS} per classmate your fake fools · {BAL_ROUNDS} rounds · {MIN_PLAYERS}–12 players.</li>
    </ul>
  )

  return (
    <VocabGameShell
      icon={Feather}
      title="Physics Balderdash"
      hint="Forge fake definitions, spot the real one, fool your friends."
      help={help}
      options={options}
      forceOptionsOpen={play !== null && terms.length < BAL_ROUNDS}
      sourceLabel={play ? (play.label ? `${play.label} · ${terms.length} terms` : null) : 'loading words…'}
    >
      {error && (
        <div className="max-w-md p-3 rounded-lg border text-sm" style={{ borderColor: 'var(--destructive)', color: 'var(--destructive)' }}>{error}</div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Feather className="h-5 w-5" style={{ color: 'var(--primary)' }} />
              <span>Open a Table</span>
            </CardTitle>
            <CardDescription>Gather {MIN_PLAYERS}+ players and start the bluffing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={createRoom} disabled={!canCreate || busy} className="w-full" size="lg">
              <Feather className="h-4 w-4 mr-2" /> Open Table
            </Button>
            <p className="text-xs text-muted-foreground">
              You&apos;ll get a code — classmates use it to take a seat at your table.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" style={{ color: 'var(--primary)' }} />
              <span>Join a Table</span>
            </CardTitle>
            <CardDescription>Enter a table code, or grab a seat below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {open.length > 0 ? (
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
            ) : (
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                No tables gathering right now — open one and share the code.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </VocabGameShell>
  )
}
