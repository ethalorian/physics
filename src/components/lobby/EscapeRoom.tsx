"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { Lock, Unlock, KeyRound, Sparkles, ShieldAlert, Check, Users, Timer, Volume2, VolumeX, Radio } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import type { AvatarTraits, EquippedItems, AvatarItem } from '@/lib/avatar/types'
import { sfx, isMuted, setMuted } from '@/lib/arcade-sound'

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
  room: { id: string; title: string; tagline: string; intro: string; finale: string; lockTitles: string[]; lockCount: number; accent?: string | null }
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

// Per-room accent (decorative glow/border colour). Falls back to the theme primary.
const ACCENTS: Record<string, string> = {
  'reactor-lockdown': '#E0843D',
  'green-light-garage': '#37B24D',
  'treasure-vault': '#C99A2E',
  'agent-academy': '#3A6FA5',
}
const PAR_SECONDS = 600 // 10:00 target before "overtime" — pressure, never a fail.

const mmss = (s: number) => `${Math.floor(Math.abs(s) / 60)}:${String(Math.abs(s) % 60).padStart(2, '0')}`

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
  const [shake, setShake] = useState(false)
  const [sweep, setSweep] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [muted, setMutedState] = useState(true)
  const startRef = useRef<number>(Date.now())
  const frozenRef = useRef<number | null>(null)
  const prevStageRef = useRef<number>(0)

  useEffect(() => { setMutedState(isMuted()) }, [])

  const poll = useCallback(() => {
    fetch(`/api/lobby/escape?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((d: EscapeView) => { if (d && d.room) setV(d) })
      .catch(() => {})
  }, [sessionId])
  useEffect(() => { poll(); const t = setInterval(poll, 3000); return () => clearInterval(t) }, [poll])

  // mission clock (counts up; frozen on escape)
  useEffect(() => {
    const t = setInterval(() => {
      if (frozenRef.current != null) { setElapsed(frozenRef.current); return }
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 250)
    return () => clearInterval(t)
  }, [])
  useEffect(() => { if (v?.finished && frozenRef.current == null) frozenRef.current = elapsed }, [v?.finished, elapsed])

  // cooldown countdown
  useEffect(() => {
    const until = v?.cooldownUntil ?? 0
    const tick = () => setCooldownLeft(Math.max(0, Math.ceil((until - Date.now()) / 1000)))
    tick(); const t = setInterval(tick, 400); return () => clearInterval(t)
  }, [v?.cooldownUntil])

  // a teammate advanced the lock → celebrate + sound, even if it wasn't me
  useEffect(() => {
    if (!v) return
    if (v.stage > prevStageRef.current) {
      setSweep(true); setTimeout(() => setSweep(false), 900)
      if (!muted) sfx.streak(v.stage)
    }
    prevStageRef.current = v.stage
  }, [v, muted])

  const toggleMute = () => { const next = !muted; setMuted(next); setMutedState(next) }

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
        if (!muted) { if (d.finished) sfx.start(); else sfx.correct() }
        if (d.advanced) setFlash({ kind: 'ok', text: d.reveal ? `Unlocked — ${d.reveal}` : 'Lock disengaged!' })
        else setFlash({ kind: 'wait', text: `Correct! Waiting for your team (${d.solvedCount}/${d.groupSize})` })
      } else {
        if (!muted) sfx.wrong()
        setShake(true); setTimeout(() => setShake(false), 480)
        setFlash({ kind: 'bad', text: d.cooling ? 'Panel resetting — hang on.' : 'Wrong code — rethink it together.' })
      }
      poll()
    } finally { setBusy(false) }
  }

  const accent = v ? (v.room.accent || ACCENTS[v.room.id] || 'var(--primary)') : 'var(--primary)'
  const remaining = PAR_SECONDS - elapsed
  const overtime = remaining < 0
  const clockColor = v?.finished ? 'var(--success)' : overtime ? 'var(--destructive)' : remaining < 120 ? '#E0843D' : accent

  const styleTag = (
    <style>{`
      @keyframes erShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(3px)} }
      @keyframes erPulse { 0%,100%{ box-shadow:0 0 0 0 var(--er-accent) } 50%{ box-shadow:0 0 18px 2px var(--er-accent) } }
      @keyframes erRing { 0%{ box-shadow:0 0 0 0 color-mix(in oklch, var(--er-accent) 55%, transparent) } 70%,100%{ box-shadow:0 0 0 12px transparent } }
      @keyframes erScan { 0%{ background-position:0 0 } 100%{ background-position:0 14px } }
      @keyframes erBlink { 0%,100%{ opacity:1 } 50%{ opacity:.35 } }
      @keyframes erFloat { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-5px) } }
      @keyframes erSweep { 0%{ transform:translateY(-110%) } 100%{ transform:translateY(110%) } }
      @keyframes erPop { 0%{ transform:scale(.6); opacity:0 } 60%{ transform:scale(1.12) } 100%{ transform:scale(1); opacity:1 } }
      @keyframes erFall { 0%{ transform:translateY(-20px) rotate(0); opacity:1 } 100%{ transform:translateY(360px) rotate(360deg); opacity:0 } }
      .er-scan::before{ content:''; position:absolute; inset:0; pointer-events:none; background:repeating-linear-gradient(0deg, color-mix(in oklch, var(--er-accent) 7%, transparent) 0 1px, transparent 1px 14px); animation:erScan 1.1s linear infinite; opacity:.5 }
    `}</style>
  )

  const shell = (inner: React.ReactNode, opts?: { alarm?: boolean }) => (
    <>
      {styleTag}
      <div className="max-w-md mx-auto p-4 mt-6" style={{ ['--er-accent' as string]: accent, color: 'var(--foreground)' }}>
        <div className="relative er-scan rounded-3xl overflow-hidden" style={{
          border: `1px solid color-mix(in oklch, ${accent} 45%, var(--border))`,
          background: 'var(--card)',
          boxShadow: opts?.alarm
            ? '0 0 50px -10px var(--destructive)'
            : `0 14px 50px -14px color-mix(in oklch, ${accent} 55%, transparent)`,
          animation: shake ? 'erShake .48s' : undefined,
        }}>
          {/* radial mood glow */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(120% 80% at 50% -10%, color-mix(in oklch, ${opts?.alarm ? 'var(--destructive)' : accent} 22%, transparent), transparent 60%)` }} />
          {/* success sweep */}
          {sweep && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, transparent, color-mix(in oklch, var(--success) 35%, transparent), transparent)', animation: 'erSweep .9s ease' }} />}
          <div className="relative">{inner}</div>
        </div>
      </div>
    </>
  )

  if (!v) return shell(<p className="text-sm p-6 text-center" style={{ color: 'var(--muted-foreground)' }}>Booting the room…</p>)

  const short = (t?: string) => t?.split('·').pop()?.trim() ?? ''

  // ---------- FINISHED ----------
  if (v.finished) {
    const confetti = Array.from({ length: 26 })
    const palette = ['#E0843D', '#37B24D', '#C99A2E', '#3A6FA5', '#C0584A', '#7B5EC4']
    return shell(
      <div>
        <div className="relative px-6 pt-8 pb-6 text-center" style={{ overflow: 'hidden', background: `linear-gradient(160deg, color-mix(in oklch, var(--reward) 28%, var(--card)), var(--card))` }}>
          {confetti.map((_, i) => (
            <span key={i} style={{
              position: 'absolute', top: -10, left: `${(i * 37) % 100}%`,
              width: 7, height: 11, borderRadius: 1, background: palette[i % palette.length],
              animation: `erFall ${1.6 + (i % 5) * 0.4}s ${(i % 7) * 0.12}s ease-in forwards`,
            }} />
          ))}
          <div style={{ animation: 'erFloat 2.4s ease-in-out infinite' }}>
            <div className="mx-auto grid place-items-center rounded-full mb-2" style={{ width: 70, height: 70, background: 'color-mix(in oklch, var(--reward) 22%, transparent)', border: '2px solid var(--reward)' }}>
              <Unlock size={34} style={{ color: 'var(--reward)' }} />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">YOU ESCAPED!</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{v.room.finale}</p>
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full font-mono font-bold" style={{ background: 'color-mix(in oklch, var(--success) 16%, transparent)', color: 'var(--success)' }}>
            <Timer size={14} /> Escaped in {mmss(frozenRef.current ?? elapsed)}
          </div>
        </div>
        <div className="px-6 pb-6">
          {v.fragments.length > 0 && (
            <div className="flex flex-col gap-1.5 my-4">
              {v.fragments.map((f, i) => (
                <div key={i} className="text-xs font-mono rounded-lg px-3 py-1.5 text-center font-semibold" style={{ background: 'color-mix(in oklch, var(--success) 14%, transparent)', color: 'var(--success)' }}>{f}</div>
              ))}
            </div>
          )}
          {v.prize && (
            <div className="rounded-2xl p-4 text-center" style={{ animation: 'erPop .5s ease both', background: 'color-mix(in oklch, var(--reward) 16%, transparent)', border: '1px solid color-mix(in oklch, var(--reward) 45%, transparent)' }}>
              <div className="inline-flex items-center justify-center gap-1.5 text-sm font-extrabold uppercase tracking-wide" style={{ color: 'var(--reward)' }}><Sparkles size={16} /> Prize</div>
              <p className="text-sm mt-1 font-medium">{v.prize.reveal}</p>
            </div>
          )}
        </div>
      </div>,
    )
  }

  // ---------- ACTIVE ----------
  const total = v.room.lockCount
  const alarm = overtime || cooldownLeft > 0
  return shell(
    <div>
      {/* HUD header */}
      <div className="px-5 pt-4 pb-4 text-center relative" style={{ background: `linear-gradient(160deg, color-mix(in oklch, ${accent} 24%, var(--card)), var(--card))` }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.18em] px-2 py-1 rounded-full" style={{ background: `color-mix(in oklch, ${accent} 22%, transparent)`, color: accent }}>
            <Radio size={11} style={{ animation: 'erBlink 1.3s infinite' }} /> Live
          </span>
          {/* mission clock */}
          <span className="inline-flex items-center gap-1.5 font-mono font-extrabold text-lg px-3 py-1 rounded-lg" style={{ color: clockColor, background: 'color-mix(in oklch, var(--background) 50%, transparent)', border: `1px solid color-mix(in oklch, ${clockColor} 45%, transparent)`, animation: alarm ? 'erBlink 1s infinite' : undefined }}>
            <Timer size={15} /> {overtime ? `+${mmss(remaining)}` : mmss(remaining)}
          </span>
          <button onClick={toggleMute} aria-label={muted ? 'unmute' : 'mute'} className="grid place-items-center rounded-md" style={{ width: 28, height: 28, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--muted-foreground)', cursor: 'pointer' }}>
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
        <h1 className="text-xl font-extrabold tracking-tight leading-tight">{v.room.title}</h1>
        <p className="text-xs mt-0.5" style={{ color: alarm ? 'var(--destructive)' : 'var(--muted-foreground)' }}>
          {overtime ? '⚠ OVERTIME — crack it before it’s too late!' : v.room.tagline}
        </p>
      </div>

      <div className="px-5 pb-5">
        {/* lock rail */}
        <div className="flex items-center justify-center gap-1 my-4">
          {Array.from({ length: total }).map((_, i) => {
            const open = i < v.stage
            const active = i === v.stage
            return (
              <div key={i} className="flex items-center" style={{ flex: i < total - 1 ? 1 : 'none' }}>
                <div className="flex flex-col items-center gap-1" style={{ width: 56 }}>
                  <div className="rounded-2xl grid place-items-center" style={{
                    width: 42, height: 42,
                    background: open ? 'color-mix(in oklch, var(--success) 22%, transparent)' : active ? `color-mix(in oklch, ${accent} 22%, transparent)` : 'var(--muted)',
                    color: open ? 'var(--success)' : active ? accent : 'var(--muted-foreground)',
                    border: `2px solid ${open ? 'var(--success)' : active ? accent : 'transparent'}`,
                    animation: active ? 'erRing 1.6s ease-out infinite' : undefined,
                  }}>
                    {open ? <Unlock size={19} /> : <Lock size={19} />}
                  </div>
                  <span className="text-[9px] font-bold text-center leading-tight uppercase tracking-wide" style={{ color: active ? accent : 'var(--muted-foreground)' }}>{short(v.room.lockTitles[i])}</span>
                </div>
                {i < total - 1 && <div style={{ flex: 1, height: 4, borderRadius: 2, background: i < v.stage ? 'var(--success)' : 'var(--muted)', transition: 'background .4s' }} />}
              </div>
            )
          })}
        </div>

        {v.stage === 0 && (
          <p className="text-sm mb-4 rounded-xl px-3 py-2.5" style={{ background: `color-mix(in oklch, ${accent} 9%, transparent)`, borderLeft: `3px solid ${accent}` }}>{v.room.intro}</p>
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
            <span className="text-[11px] font-extrabold uppercase tracking-wide block mb-0.5" style={{ color: accent }}>{short(v.currentLock.title)}</span>
            {v.currentLock.narrative}
          </div>
        )}

        {/* clue — transmission */}
        {v.myClue && (
          <div className="mb-4 rounded-2xl p-4" style={{ background: `color-mix(in oklch, ${accent} 12%, transparent)`, border: `2px solid color-mix(in oklch, ${accent} 50%, transparent)`, ['--er-accent' as string]: `color-mix(in oklch, ${accent} 35%, transparent)`, animation: 'erPulse 2.4s ease-in-out infinite' }}>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide mb-1.5 px-2 py-0.5 rounded-full" style={{ background: accent, color: '#fff' }}>
              <Radio size={12} /> Your clue · classified
            </div>
            <div className="text-base font-semibold leading-snug">{v.myClue}</div>
            <div className="text-[11px] mt-2" style={{ color: 'var(--muted-foreground)' }}>
              Only you have this. Your {v.groupSize}-person team each holds a different piece — say yours out loud.
            </div>
          </div>
        )}

        {v.fragments.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5 justify-center">
            {v.fragments.map((f, i) => (
              <span key={i} className="text-[11px] font-mono px-2.5 py-1 rounded-full font-bold" style={{ background: 'color-mix(in oklch, var(--success) 16%, transparent)', color: 'var(--success)' }}>{f}</span>
            ))}
          </div>
        )}

        {/* keypad OR waiting */}
        {v.iSolved ? (
          <div className="rounded-2xl p-4 text-center" style={{ background: 'color-mix(in oklch, var(--success) 12%, transparent)', border: '1px solid color-mix(in oklch, var(--success) 40%, transparent)' }}>
            <div className="inline-flex items-center gap-1.5 text-sm font-extrabold" style={{ color: 'var(--success)' }}><Check size={16} /> You cracked it!</div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>STANDBY — the lock won&apos;t open until everyone enters the code.</p>
            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              <Users size={13} style={{ color: 'var(--success)' }} />
              {Array.from({ length: v.groupSize }).map((_, i) => (
                <span key={i} className="rounded-full" style={{ width: 13, height: 13, background: i < v.solvedCount ? 'var(--success)' : 'color-mix(in oklch, var(--success) 25%, var(--muted))', animation: i < v.solvedCount ? undefined : 'erBlink 1.2s infinite' }} />
              ))}
              <span className="text-xs font-bold ml-1" style={{ color: 'var(--success)' }}>{v.solvedCount}/{v.groupSize} in</span>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
                placeholder="◉ ENTER CODE"
                disabled={cooldownLeft > 0}
                className="flex-1 rounded-xl px-3 py-3 text-lg font-mono font-bold text-center tracking-widest"
                style={{ border: `2px solid color-mix(in oklch, ${cooldownLeft > 0 ? 'var(--destructive)' : accent} 50%, var(--border))`, background: 'color-mix(in oklch, var(--background) 60%, var(--card))', color: 'var(--foreground)' }}
              />
              <button
                onClick={submit}
                disabled={busy || !code.trim() || cooldownLeft > 0}
                className="text-sm font-extrabold rounded-xl px-4 inline-flex items-center gap-1.5 disabled:opacity-50 uppercase"
                style={{ background: accent, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: `0 6px 18px -6px ${accent}` }}
              >
                <KeyRound size={17} /> {cooldownLeft > 0 ? `${cooldownLeft}s` : busy ? '…' : 'Unlock'}
              </button>
            </div>
            <p className="text-[11px] mt-2 text-center font-medium" style={{ color: 'var(--muted-foreground)' }}>Every teammate must enter the code before the lock opens.</p>
          </>
        )}

        {flash && (
          <p className="text-xs mt-2.5 inline-flex items-center gap-1 justify-center w-full font-semibold" style={{ color: flash.kind === 'bad' ? 'var(--destructive)' : flash.kind === 'wait' ? accent : 'var(--success)' }}>
            {flash.kind === 'bad' && <ShieldAlert size={13} />}{flash.kind === 'ok' && <Sparkles size={13} />}{flash.text}
          </p>
        )}
      </div>
    </div>,
    { alarm },
  )
}
