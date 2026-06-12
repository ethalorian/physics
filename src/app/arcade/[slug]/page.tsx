"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Coins, Trophy, Crown } from 'lucide-react'

/**
 * One arcade cabinet: the game in an iframe, bridged to the XP economy.
 *
 * Bridge protocol (any game dropped into public/games/ can speak it):
 *   game → page : { type:'arcade:coinRequest' }            ask to start a ranked run
 *   game → page : { type:'arcade:score', score, act?, final? }   report a score
 *   page → game : { type:'arcade:coinAccepted', playId, balance }
 *   page → game : { type:'arcade:coinDenied', reason, balance }
 *
 * A game opened directly (no bridge) simply never gets a coin reply and runs
 * as free practice — scores can only enter the boards through a paid playId.
 */

type Cabinet = {
  slug: string; name: string; unit: string | null; accent: string | null
  costXp: number; srcPath: string; myBest: number
}
type BoardRow = { rank: number; name: string; score: number; isMe: boolean }
type Board = { weekly: BoardRow[]; hallOfFame: BoardRow[]; myWeeklyRank: number | null }

export default function ArcadeCabinetPage() {
  const { slug } = useParams<{ slug: string }>()
  const [game, setGame] = useState<Cabinet | null>(null)
  const [gameOk, setGameOk] = useState<boolean | null>(null) // does the game file actually exist in this deploy?
  const [balance, setBalance] = useState<number | null>(null)
  const [board, setBoard] = useState<Board | null>(null)
  const [notice, setNotice] = useState('')
  const [err, setErr] = useState('')
  const frameRef = useRef<HTMLIFrameElement>(null)
  const playIdRef = useRef<string | null>(null)

  const loadBoard = useCallback(() => {
    fetch(`/api/arcade/leaderboard?slug=${slug}`)
      .then((r) => r.json())
      .then(setBoard)
      .catch(() => {})
  }, [slug])

  useEffect(() => {
    fetch('/api/arcade/cabinet')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Sign in to play ranked'))))
      .then((d) => {
        const g = (d.games as Cabinet[]).find((x) => x.slug === slug)
        if (!g) throw new Error('This cabinet is unplugged')
        setGame(g)
        setBalance(d.balance.balance)
        // Guard: a cabinet row can exist in the DB before its game file ships
        // in a deploy. Without this check the iframe renders the app 404 page.
        fetch(g.srcPath, { method: 'HEAD' })
          .then((r) => setGameOk(r.ok))
          .catch(() => setGameOk(false))
      })
      .catch((e) => setErr(e.message))
    loadBoard()
  }, [slug, loadBoard])

  useEffect(() => {
    const onMessage = async (e: MessageEvent) => {
      if (!frameRef.current || e.source !== frameRef.current.contentWindow) return
      const msg = e.data || {}
      const reply = (payload: Record<string, unknown>) =>
        frameRef.current?.contentWindow?.postMessage(payload, '*')

      if (msg.type === 'arcade:coinRequest') {
        const r = await fetch('/api/arcade/coin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        })
        const d = await r.json().catch(() => ({}))
        if (r.ok && d.playId) {
          playIdRef.current = d.playId
          if (typeof d.balance === 'number') setBalance(d.balance)
          setNotice(d.staff ? 'Staff run — free, unranked.'
            : game?.costXp === 0 ? 'Free cabinet — this run is RANKED and accuracy banks XP.'
            : d.freebie ? 'First coin’s on the house — this run is RANKED. Make it count.'
            : `Coin accepted — ${d.costXp} XP. Good luck.`)
          reply({ type: 'arcade:coinAccepted', playId: d.playId, balance: d.balance })
        } else {
          setNotice(d.error === 'Not enough XP'
            ? `Not enough XP (need ${d.needed}, you have ${d.balance}). Earn more in vocabulary games and lessons.`
            : (d.error || 'Could not start a ranked run'))
          if (typeof d.balance === 'number') setBalance(d.balance)
          reply({ type: 'arcade:coinDenied', reason: d.error || 'denied', balance: d.balance })
        }
      }

      if (msg.type === 'arcade:score' && playIdRef.current) {
        await fetch('/api/arcade/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playId: playIdRef.current,
            score: msg.score,
            act: msg.act,
            final: !!msg.final,
            stats: msg.stats,
          }),
        }).catch(() => {})
        if (msg.final) {
          const finishedPlayId = playIdRef.current
          playIdRef.current = null
          // Free cabinets pay mastery XP via the deliberate payout route
          // (never through the score path — see docs/ARCADE_PATTERN.md).
          if (game?.costXp === 0 && finishedPlayId) {
            const r = await fetch('/api/arcade/payout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ playId: finishedPlayId }),
            }).catch(() => null)
            const d = r ? await r.json().catch(() => ({})) : {}
            if (r?.ok) {
              if (typeof d.balance === 'number') setBalance(d.balance)
              reply({ type: 'arcade:xpAwarded', xp: d.xp ?? 0, capped: !!d.capped })
            }
          }
          loadBoard()
        }
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [slug, loadBoard, game])

  const accent = game?.accent || 'var(--primary)'

  return (
    <div className="max-w-5xl mx-auto p-4" style={{ color: 'var(--foreground)' }}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-3">
          <Link href="/arcade" className="flex items-center gap-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            <ArrowLeft size={16} /> Arcade
          </Link>
          {game && <h1 className="text-xl font-bold tracking-wide" style={{ color: accent }}>{game.name}</h1>}
          {game?.unit && <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>{game.unit}</span>}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {game && (
            <span className="flex items-center gap-1 rounded-full border px-3 py-1" style={{ borderColor: 'var(--border)' }}>
              <Coins size={14} style={{ color: accent }} />
              {game.costXp === 0 ? 'FREE · accuracy earns XP' : `${game.costXp} XP / ranked run`}
            </span>
          )}
          {balance !== null && <span className="font-semibold">{balance.toLocaleString()} XP</span>}
        </div>
      </div>

      {notice && (
        <p className="text-sm mb-2 rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          {notice}
        </p>
      )}
      {err && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{err}</p>}

      {game && gameOk === true && (
        <iframe
          ref={frameRef}
          src={game.srcPath}
          title={game.name}
          className="w-full rounded-xl border"
          style={{ borderColor: 'var(--border)', height: 'min(78vh, 820px)', background: '#04060d' }}
          allow="autoplay"
        />
      )}
      {game && gameOk === false && (
        <div className="w-full rounded-xl border grid place-items-center text-center p-8"
          style={{ borderColor: 'var(--border)', height: 'min(78vh, 820px)', background: '#04060d' }}>
          <div>
            <div className="text-lg font-bold tracking-wide" style={{ color: accent }}>CABINET BEING INSTALLED</div>
            <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
              {game.name} is on the truck — the game ships with the next site update.<br />
              No XP has been charged. Check back soon.
            </p>
          </div>
        </div>
      )}

      {board && (
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h2 className="flex items-center gap-2 font-semibold mb-2"><Trophy size={16} style={{ color: accent }} /> This week
              {board.myWeeklyRank && <span className="text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}>· you are #{board.myWeeklyRank}</span>}
            </h2>
            {board.weekly.length === 0 && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No ranked runs yet this week. The throne is empty.</p>}
            {board.weekly.map((r) => (
              <div key={r.rank} className="flex justify-between text-sm py-1" style={{ fontWeight: r.isMe ? 700 : 400 }}>
                <span>#{r.rank} {r.name}</span><span>{r.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h2 className="flex items-center gap-2 font-semibold mb-2"><Crown size={16} style={{ color: accent }} /> Hall of Fame</h2>
            {board.hallOfFame.length === 0 && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No records yet. Make history.</p>}
            {board.hallOfFame.map((r) => (
              <div key={r.rank} className="flex justify-between text-sm py-1" style={{ fontWeight: r.isMe ? 700 : 400 }}>
                <span>#{r.rank} {r.name}</span><span>{r.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
