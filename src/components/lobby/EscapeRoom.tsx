"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { Lock, Unlock, KeyRound, Sparkles, ShieldAlert, PartyPopper } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import type { AvatarTraits, EquippedItems, AvatarItem } from '@/lib/avatar/types'

interface Mate {
  alias: string
  traits: AvatarTraits
  equipped: EquippedItems
  completed?: boolean
  isMe?: boolean
  role?: string
  idx?: number
}
interface Role { label: string; blurb: string; stem: string }

interface EscapePrize { tier: string; xp?: number; reveal: string }
interface EscapeView {
  room: { id: string; title: string; tagline: string; intro: string; finale: string; lockTitles: string[]; lockCount: number }
  stage: number
  finished: boolean
  fragments: string[]
  ordinal: number
  groupSize: number
  currentLock: { title: string; narrative: string } | null
  myClue: string | null
  cooldownUntil: number
  prize: EscapePrize | null
}

export default function EscapeRoom({
  sessionId,
  group,
  avatarItems,
  myRole,
}: {
  sessionId: string
  group?: Mate[]
  avatarItems?: AvatarItem[]
  myRole?: Role | null
}) {
  const [v, setV] = useState<EscapeView | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<null | { kind: 'ok' | 'bad'; text: string }>(null)
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const justFinished = useRef(false)

  const poll = useCallback(() => {
    fetch(`/api/lobby/escape?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((d: EscapeView) => { if (d && d.room) setV(d) })
      .catch(() => {})
  }, [sessionId])

  useEffect(() => { poll(); const t = setInterval(poll, 3000); return () => clearInterval(t) }, [poll])

  // Tick down the soft cooldown after a wrong code.
  useEffect(() => {
    const until = v?.cooldownUntil ?? 0
    const tick = () => setCooldownLeft(Math.max(0, Math.ceil((until - Date.now()) / 1000)))
    tick()
    const t = setInterval(tick, 500)
    return () => clearInterval(t)
  }, [v?.cooldownUntil])

  const submit = async () => {
    if (!code.trim() || busy || cooldownLeft > 0) return
    setBusy(true)
    setFlash(null)
    try {
      const r = await fetch('/api/lobby/escape', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, code }),
      })
      const d = await r.json().catch(() => ({}))
      if (d.correct) {
        setCode('')
        if (d.finished) justFinished.current = true
        setFlash({ kind: 'ok', text: d.reveal ? `Unlocked — ${d.reveal}` : 'Unlocked!' })
      } else {
        setFlash({ kind: 'bad', text: d.cooling ? 'Panel is resetting — hang on.' : 'Wrong code — recheck your reasoning together.' })
      }
      poll()
    } finally {
      setBusy(false)
    }
  }

  const shell = (inner: React.ReactNode) => (
    <div className="max-w-md mx-auto p-5 mt-8" style={{ color: 'var(--foreground)' }}>
      <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>{inner}</div>
    </div>
  )

  if (!v) return shell(<p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Booting the room…</p>)

  // --- Finished: vault + prize -------------------------------------------------
  if (v.finished) {
    return shell(
      <div className="text-center">
        <PartyPopper size={44} style={{ color: 'var(--reward)' }} className="mx-auto mb-2" />
        <h1 className="text-xl font-bold">You escaped!</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{v.room.finale}</p>
        {v.fragments.length > 0 && (
          <div className="mt-4 flex flex-col gap-1.5">
            {v.fragments.map((f, i) => (
              <div key={i} className="text-xs font-mono rounded-lg px-2 py-1" style={{ background: 'var(--muted)' }}>{f}</div>
            ))}
          </div>
        )}
        {v.prize && (
          <div className="mt-4 rounded-xl p-4" style={{ background: 'color-mix(in oklch, var(--reward) 14%, transparent)', border: '1px solid color-mix(in oklch, var(--reward) 40%, transparent)' }}>
            <div className="flex items-center justify-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--reward)' }}>
              <Sparkles size={15} /> Prize
            </div>
            <p className="text-sm mt-1">{v.prize.reveal}</p>
          </div>
        )}
      </div>,
    )
  }

  // --- Active run --------------------------------------------------------------
  const total = v.room.lockCount
  return shell(
    <div>
      <div className="text-center mb-4">
        <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>Escape Room</div>
        <h1 className="text-lg font-bold">{v.room.title}</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{v.room.tagline}</p>
      </div>

      {/* Stage strip */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {Array.from({ length: total }).map((_, i) => {
          const open = i < v.stage
          const active = i === v.stage
          return (
            <div key={i} className="flex flex-col items-center gap-1" style={{ width: 56 }}>
              <div className="rounded-full p-2" style={{
                background: open ? 'color-mix(in oklch, var(--success) 18%, transparent)' : active ? 'color-mix(in oklch, var(--primary) 16%, transparent)' : 'var(--muted)',
                color: open ? 'var(--success)' : active ? 'var(--primary)' : 'var(--muted-foreground)',
              }}>
                {open ? <Unlock size={16} /> : <Lock size={16} />}
              </div>
              <span className="text-[10px] text-center leading-tight" style={{ color: active ? 'var(--primary)' : 'var(--muted-foreground)' }}>
                {v.room.lockTitles[i]?.split('·').pop()?.trim() ?? `Lock ${i + 1}`}
              </span>
            </div>
          )
        })}
      </div>

      {v.stage === 0 && (
        <p className="text-sm mb-4 rounded-lg px-3 py-2" style={{ background: 'color-mix(in oklch, var(--primary) 8%, transparent)' }}>{v.room.intro}</p>
      )}

      {myRole && (
        <div className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ background: 'color-mix(in oklch, var(--reward) 14%, transparent)', borderLeft: '3px solid var(--reward)' }}>
          <span className="font-semibold">Your role: {myRole.label}</span>
          <span style={{ color: 'var(--muted-foreground)' }}> — {myRole.blurb}</span>
        </div>
      )}

      {/* Group avatars */}
      {group && group.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          {group.map((mate, i) => (
            <div key={i} className="flex flex-col items-center gap-1" style={{ width: 56 }}>
              <Avatar traits={mate.traits} equipped={mate.equipped} items={avatarItems} size={44} crop="head" />
              <span className="text-[11px] truncate w-full text-center" title={mate.alias}>{mate.alias}{mate.isMe ? ' (you)' : ''}</span>
            </div>
          ))}
        </div>
      )}

      {/* Current lock */}
      {v.currentLock && (
        <p className="text-sm mb-3 rounded-lg px-3 py-2" style={{ background: 'var(--muted)' }}>{v.currentLock.narrative}</p>
      )}

      {/* My clue — only you hold this */}
      {v.myClue && (
        <div className="mb-4 rounded-lg p-3" style={{ background: 'color-mix(in oklch, var(--primary) 10%, transparent)', border: '1px solid color-mix(in oklch, var(--primary) 35%, transparent)' }}>
          <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--primary)' }}>Your clue — only you have this</div>
          <div className="text-sm font-medium">{v.myClue}</div>
          <div className="text-xs mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
            Say it out loud. Your {v.groupSize}-person team each holds a different piece — you can&apos;t crack the panel without all of them.
          </div>
        </div>
      )}

      {/* Fragments collected */}
      {v.fragments.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {v.fragments.map((f, i) => (
            <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in oklch, var(--success) 14%, transparent)', color: 'var(--success)' }}>{f}</span>
          ))}
        </div>
      )}

      {/* Keypad */}
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="enter the panel code"
          disabled={cooldownLeft > 0}
          className="flex-1 rounded-lg border p-2 text-sm font-mono"
          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        />
        <button
          onClick={submit}
          disabled={busy || !code.trim() || cooldownLeft > 0}
          className="text-sm font-semibold rounded-lg px-3 inline-flex items-center gap-1.5 disabled:opacity-50"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}
        >
          <KeyRound size={15} /> {cooldownLeft > 0 ? `${cooldownLeft}s` : busy ? '…' : 'Unlock'}
        </button>
      </div>

      {flash && (
        <p className="text-xs mt-2 inline-flex items-center gap-1" style={{ color: flash.kind === 'ok' ? 'var(--success)' : 'var(--destructive)' }}>
          {flash.kind === 'bad' && <ShieldAlert size={13} />}{flash.text}
        </p>
      )}
    </div>,
  )
}
