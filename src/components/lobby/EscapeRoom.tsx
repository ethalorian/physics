"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { Lock, Unlock, KeyRound, Sparkles, ShieldAlert, PartyPopper, Check, Users } from 'lucide-react'
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
  iSolved: boolean
  solvedCount: number
}

const PRIMARY = 'var(--primary)'

export default function EscapeRoom({
  sessionId, group, avatarItems, myRole,
}: {
  sessionId: string
  group?: Mate[]
  avatarItems?: AvatarItem[]
  myRole?: Role | null
}) {
  const [v, setV] = useState<EscapeView | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<null | { kind: 'ok' | 'bad' | 'wait'; text: string }>(null)
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const justFinished = useRef(false)

  const poll = useCallback(() => {
    fetch(`/api/lobby/escape?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((d: EscapeView) => { if (d && d.room) setV(d) })
      .catch(() => {})
  }, [sessionId])
  useEffect(() => { poll(); const t = setInterval(poll, 3000); return () => clearInterval(t) }, [poll])

  useEffect(() => {
    const until = v?.cooldownUntil ?? 0
    const tick = () => setCooldownLeft(Math.max(0, Math.ceil((until - Date.now()) / 1000)))
    tick(); const t = setInterval(tick, 500); return () => clearInterval(t)
  }, [v?.cooldownUntil])

  const submit = async () => {
    if (!code.trim() || busy || cooldownLeft > 0) return
    setBusy(true); setFlash(null)
    try {
      const r = await fetch('/api/lobby/escape', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, code }),
      })
      const d = await r.json().catch(() => ({}))
      if (d.correct) {
        setCode('')
        if (d.finished) justFinished.current = true
        if (d.advanced) setFlash({ kind: 'ok', text: d.reveal ? `Unlocked — ${d.reveal}` : 'Unlocked!' })
        else setFlash({ kind: 'wait', text: `Correct! Waiting for your team (${d.solvedCount}/${d.groupSize})` })
      } else {
        setFlash({ kind: 'bad', text: d.cooling ? 'Panel resetting — hang on.' : 'Wrong code — rethink it together.' })
      }
      poll()
    } finally { setBusy(false) }
  }

  const shell = (inner: React.ReactNode) => (
    <>
      <style>{`
        @keyframes erPulse { 0%,100%{ box-shadow:0 0 0 0 color-mix(in oklch, ${PRIMARY} 45%, transparent) } 50%{ box-shadow:0 0 0 6px color-mix(in oklch, ${PRIMARY} 0%, transparent) } }
        @keyframes erPop { 0%{ transform:scale(.7); opacity:0 } 60%{ transform:scale(1.08) } 100%{ transform:scale(1); opacity:1 } }
        @keyframes erFloat { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-4px) } }
      `}</style>
      <div className="max-w-md mx-auto p-4 mt-6" style={{ color: 'var(--foreground)' }}>
        <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid color-mix(in oklch, var(--primary) 30%, var(--border))', background: 'var(--card)', boxShadow: '0 10px 40px -12px color-mix(in oklch, var(--primary) 40%, transparent)' }}>
          {inner}
        </div>
      </div>
    </>
  )

  if (!v) return shell(<p className="text-sm p-6 text-center" style={{ color: 'var(--muted-foreground)' }}>Booting the room…</p>)

  // ----- FINISHED: vault + prize -----
  if (v.finished) {
    return shell(
      <div>
        <div className="px-6 pt-7 pb-6 text-center" style={{ background: 'linear-gradient(160deg, color-mix(in oklch, var(--reward) 30%, var(--card)), var(--card))' }}>
          <div style={{ animation: 'erFloat 2.4s ease-in-out infinite' }}>
            <PartyPopper size={52} style={{ color: 'var(--reward)' }} className="mx-auto mb-2" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">You escaped!</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{v.room.finale}</p>
        </div>
        <div className="px-6 pb-6">
          {v.fragments.length > 0 && (
            <div className="flex flex-col gap-1.5 my-4">
              {v.fragments.map((f, i) => (
                <div key={i} className="text-xs font-mono rounded-lg px-3 py-1.5 text-center" style={{ background: 'color-mix(in oklch, var(--success) 14%, transparent)', color: 'var(--success)' }}>{f}</div>
              ))}
            </div>
          )}
          {v.prize && (
            <div className="rounded-2xl p-4 text-center" style={{ animation: 'erPop .5s ease both', background: 'color-mix(in oklch, var(--reward) 16%, transparent)', border: '1px solid color-mix(in oklch, var(--reward) 45%, transparent)' }}>
              <div className="inline-flex items-center justify-center gap-1.5 text-sm font-bold" style={{ color: 'var(--reward)' }}><Sparkles size={16} /> Prize</div>
              <p className="text-sm mt-1 font-medium">{v.prize.reveal}</p>
            </div>
          )}
        </div>
      </div>,
    )
  }

  // ----- ACTIVE -----
  const total = v.room.lockCount
  const short = (t?: string) => t?.split('·').pop()?.trim() ?? ''
  return shell(
    <div>
      {/* themed header */}
      <div className="px-5 pt-5 pb-4 text-center" style={{ background: 'linear-gradient(160deg, color-mix(in oklch, var(--primary) 22%, var(--card)), var(--card))' }}>
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full mb-1.5" style={{ background: 'color-mix(in oklch, var(--primary) 18%, transparent)', color: 'var(--primary)' }}>
          <KeyRound size={12} /> Escape Room
        </div>
        <h1 className="text-xl font-extrabold tracking-tight leading-tight">{v.room.title}</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{v.room.tagline}</p>
      </div>

      <div className="px-5 pb-5">
        {/* lock progress rail */}
        <div className="flex items-center justify-center gap-1 my-4">
          {Array.from({ length: total }).map((_, i) => {
            const open = i < v.stage
            const active = i === v.stage
            return (
              <div key={i} className="flex items-center" style={{ flex: i < total - 1 ? 1 : 'none' }}>
                <div className="flex flex-col items-center gap-1" style={{ width: 54 }}>
                  <div className="rounded-full grid place-items-center" style={{
                    width: 38, height: 38,
                    background: open ? 'color-mix(in oklch, var(--success) 22%, transparent)' : active ? 'color-mix(in oklch, var(--primary) 20%, transparent)' : 'var(--muted)',
                    color: open ? 'var(--success)' : active ? 'var(--primary)' : 'var(--muted-foreground)',
                    border: `2px solid ${open ? 'var(--success)' : active ? 'var(--primary)' : 'transparent'}`,
                    animation: active ? 'erPulse 1.8s ease-in-out infinite' : undefined,
                  }}>
                    {open ? <Unlock size={17} /> : <Lock size={17} />}
                  </div>
                  <span className="text-[9px] font-semibold text-center leading-tight" style={{ color: active ? 'var(--primary)' : 'var(--muted-foreground)' }}>{short(v.room.lockTitles[i])}</span>
                </div>
                {i < total - 1 && <div style={{ flex: 1, height: 3, borderRadius: 2, background: i < v.stage ? 'var(--success)' : 'var(--muted)' }} />}
              </div>
            )
          })}
        </div>

        {v.stage === 0 && (
          <p className="text-sm mb-4 rounded-xl px-3 py-2.5" style={{ background: 'color-mix(in oklch, var(--primary) 8%, transparent)' }}>{v.room.intro}</p>
        )}

        {myRole && (
          <div className="mb-3 rounded-lg px-3 py-2 text-xs" style={{ background: 'color-mix(in oklch, var(--reward) 14%, transparent)', borderLeft: '3px solid var(--reward)' }}>
            <span className="font-bold">Your role: {myRole.label}</span>
            <span style={{ color: 'var(--muted-foreground)' }}> — {myRole.blurb}</span>
          </div>
        )}

        {group && group.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {group.map((mate, i) => (
              <div key={i} className="flex flex-col items-center gap-1" style={{ width: 52 }}>
                <Avatar traits={mate.traits} equipped={mate.equipped} items={avatarItems} size={42} crop="head" />
                <span className="text-[10px] truncate w-full text-center" title={mate.alias}>{mate.alias}{mate.isMe ? ' (you)' : ''}</span>
              </div>
            ))}
          </div>
        )}

        {v.currentLock && (
          <div className="mb-3 rounded-xl px-3 py-2.5 text-sm font-medium" style={{ background: 'var(--muted)' }}>
            <span className="text-[11px] font-bold uppercase tracking-wide block mb-0.5" style={{ color: 'var(--primary)' }}>{short(v.currentLock.title)}</span>
            {v.currentLock.narrative}
          </div>
        )}

        {/* my clue — the spotlight element */}
        {v.myClue && (
          <div className="mb-4 rounded-2xl p-4" style={{ background: 'color-mix(in oklch, var(--primary) 12%, transparent)', border: '2px solid color-mix(in oklch, var(--primary) 45%, transparent)' }}>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-1.5 px-2 py-0.5 rounded-full" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              <Sparkles size={12} /> Your clue
            </div>
            <div className="text-base font-semibold leading-snug">{v.myClue}</div>
            <div className="text-[11px] mt-2" style={{ color: 'var(--muted-foreground)' }}>
              Only you have this. Your {v.groupSize}-person team each holds a different piece — share yours out loud.
            </div>
          </div>
        )}

        {v.fragments.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5 justify-center">
            {v.fragments.map((f, i) => (
              <span key={i} className="text-[11px] font-mono px-2.5 py-1 rounded-full font-semibold" style={{ background: 'color-mix(in oklch, var(--success) 16%, transparent)', color: 'var(--success)' }}>{f}</span>
            ))}
          </div>
        )}

        {/* keypad OR waiting-for-team panel */}
        {v.iSolved ? (
          <div className="rounded-2xl p-4 text-center" style={{ background: 'color-mix(in oklch, var(--success) 12%, transparent)', border: '1px solid color-mix(in oklch, var(--success) 40%, transparent)' }}>
            <div className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: 'var(--success)' }}><Check size={16} /> You cracked it!</div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>The lock won&apos;t open until everyone enters the code.</p>
            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              <Users size={13} style={{ color: 'var(--success)' }} />
              {Array.from({ length: v.groupSize }).map((_, i) => (
                <span key={i} className="rounded-full" style={{ width: 12, height: 12, background: i < v.solvedCount ? 'var(--success)' : 'color-mix(in oklch, var(--success) 25%, var(--muted))' }} />
              ))}
              <span className="text-xs font-semibold ml-1" style={{ color: 'var(--success)' }}>{v.solvedCount}/{v.groupSize} in</span>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
                placeholder="enter the panel code"
                disabled={cooldownLeft > 0}
                className="flex-1 rounded-xl border-2 px-3 py-2.5 text-base font-mono text-center"
                style={{ borderColor: 'color-mix(in oklch, var(--primary) 30%, var(--border))', background: 'var(--background)', color: 'var(--foreground)' }}
              />
              <button
                onClick={submit}
                disabled={busy || !code.trim() || cooldownLeft > 0}
                className="text-sm font-bold rounded-xl px-4 inline-flex items-center gap-1.5 disabled:opacity-50"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}
              >
                <KeyRound size={16} /> {cooldownLeft > 0 ? `${cooldownLeft}s` : busy ? '…' : 'Unlock'}
              </button>
            </div>
            <p className="text-[11px] mt-2 text-center" style={{ color: 'var(--muted-foreground)' }}>Every teammate must enter the code before the lock opens.</p>
          </>
        )}

        {flash && (
          <p className="text-xs mt-2.5 inline-flex items-center gap-1 justify-center w-full" style={{ color: flash.kind === 'bad' ? 'var(--destructive)' : flash.kind === 'wait' ? 'var(--primary)' : 'var(--success)' }}>
            {flash.kind === 'bad' && <ShieldAlert size={13} />}{flash.kind === 'ok' && <Sparkles size={13} />}{flash.text}
          </p>
        )}
      </div>
    </div>,
  )
}
