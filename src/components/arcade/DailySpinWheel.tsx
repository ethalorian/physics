"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'

/**
 * The Daily Spin — one free wheel spin per day. The SERVER rolls the prize
 * (/api/arcade/spin); this component only animates the wheel to the wedge
 * the server chose. Mostly crumbs (2–5 XP), one gold jackpot wedge (500 XP)
 * at very long odds.
 */

const SEGMENTS = [2, 5, 3, 10, 2, 25, 3, 5, 2, 500, 3, 5] // mirror of the API route
const SEG_COLORS = ['#1d4ed8', '#0f766e', '#7c3aed', '#0e7490', '#1d4ed8', '#b45309',
                    '#7c3aed', '#0f766e', '#1d4ed8', '#eab308', '#7c3aed', '#0f766e']
const SEG = (Math.PI * 2) / SEGMENTS.length
const R = 74 // wheel radius (canvas px)

type Status = { spunToday: boolean; prize: number | null }

export default function DailySpinWheel({ onWon }: { onWon?: (xp: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotRef = useRef(0)
  const animRef = useRef<number>(0)
  const [status, setStatus] = useState<Status | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<{ prize: number; jackpot: boolean } | null>(null)

  const draw = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const size = (R + 14) * 2
    if (cv.width !== size * dpr) { cv.width = size * dpr; cv.height = size * dpr }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)
    const cx = size / 2, cy = size / 2, rot = rotRef.current
    const done = status?.spunToday && !spinning
    ctx.globalAlpha = done ? 0.45 : 1
    for (let i = 0; i < SEGMENTS.length; i++) {
      const a0 = rot + i * SEG - Math.PI / 2, a1 = a0 + SEG
      const jackpot = SEGMENTS[i] >= 500
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath()
      ctx.fillStyle = SEG_COLORS[i]; ctx.fill()
      ctx.strokeStyle = '#0b0407'; ctx.lineWidth = 2; ctx.stroke()
      // label
      const mid = (a0 + a1) / 2
      ctx.save(); ctx.translate(cx + Math.cos(mid) * R * 0.66, cy + Math.sin(mid) * R * 0.66)
      ctx.rotate(mid + Math.PI / 2)
      ctx.fillStyle = jackpot ? '#1a1203' : '#fff'
      ctx.font = `${jackpot ? '900 11px' : '700 11px'} Orbitron, monospace`
      ctx.textAlign = 'center'
      ctx.fillText(jackpot ? '★500' : String(SEGMENTS[i]), 0, 4)
      ctx.restore()
      if (jackpot) { // gold glow on the jackpot wedge
        ctx.save(); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath()
        ctx.shadowColor = '#eab308'; ctx.shadowBlur = 12
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()
      }
    }
    // hub + rim
    ctx.globalAlpha = done ? 0.45 : 1
    ctx.beginPath(); ctx.arc(cx, cy, 13, 0, 7)
    ctx.fillStyle = '#0b0407'; ctx.fill(); ctx.strokeStyle = '#6b7280'; ctx.stroke()
    ctx.beginPath(); ctx.arc(cx, cy, R + 2, 0, 7)
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 3; ctx.stroke()
    ctx.globalAlpha = 1
    // pointer (top)
    ctx.beginPath(); ctx.moveTo(cx - 8, 2); ctx.lineTo(cx + 8, 2); ctx.lineTo(cx, 16); ctx.closePath()
    ctx.fillStyle = '#f59e0b'; ctx.fill(); ctx.strokeStyle = '#0b0407'; ctx.stroke()
  }, [status, spinning])

  useEffect(() => {
    fetch('/api/arcade/spin').then((r) => r.json())
      .then((s: Status) => setStatus({ spunToday: !!s.spunToday, prize: s.prize ?? null }))
      .catch(() => setStatus({ spunToday: false, prize: null }))
  }, [])
  useEffect(() => { draw() }, [draw, status])
  useEffect(() => () => cancelAnimationFrame(animRef.current), [])

  const spin = async () => {
    if (spinning || !status || status.spunToday) return
    setSpinning(true)
    const r = await fetch('/api/arcade/spin', { method: 'POST' })
    const d = await r.json().catch(() => ({}))
    if (!r.ok || typeof d.segment !== 'number') {
      setSpinning(false)
      setStatus({ spunToday: true, prize: d.prize ?? null })
      return
    }
    // animate: several full turns, ease out, land with the wedge under the pointer
    const target = -(d.segment + 0.5) * SEG + (Math.random() - 0.5) * SEG * 0.5
    const start = rotRef.current
    const delta = ((target - start) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
    const total = Math.PI * 2 * 6 + delta
    const dur = 4200, t0 = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / dur)
      rotRef.current = start + total * (1 - Math.pow(1 - t, 3))
      draw()
      if (t < 1) animRef.current = requestAnimationFrame(tick)
      else {
        setSpinning(false)
        setStatus({ spunToday: true, prize: d.prize })
        setResult({ prize: d.prize, jackpot: !!d.jackpot })
        onWon?.(d.prize)
      }
    }
    animRef.current = requestAnimationFrame(tick)
  }

  return (
    <div className="rounded-2xl border p-4 flex items-center gap-4 flex-wrap"
      style={{ borderColor: result?.jackpot ? '#eab308' : 'var(--border)', background: 'var(--card)' }}>
      <button onClick={spin} disabled={spinning || !!status?.spunToday}
        title={status?.spunToday ? 'Come back tomorrow' : 'Spin!'}
        style={{ background: 'none', border: 'none', cursor: status?.spunToday ? 'default' : 'pointer', lineHeight: 0 }}>
        <canvas ref={canvasRef} style={{ width: (R + 14) * 2, height: (R + 14) * 2 }} />
      </button>
      <div className="flex-1 min-w-[180px]">
        <div className="font-semibold flex items-center gap-1.5">
          <Sparkles size={16} style={{ color: '#eab308' }} /> Daily spin
        </div>
        {result ? (
          result.jackpot ? (
            <div className="text-lg font-black mt-1" style={{ color: '#eab308', textShadow: '0 0 14px #eab30888' }}>
              ★ JACKPOT! +{result.prize} XP ★
            </div>
          ) : (
            <div className="text-sm mt-1">You won <b style={{ color: 'var(--reward, #f59e0b)' }}>+{result.prize} XP</b>. The gold wedge is still out there.</div>
          )
        ) : status?.spunToday ? (
          <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Spun today{typeof status.prize === 'number' ? <> — won <b>+{status.prize} XP</b></> : null}. Come back tomorrow.
          </div>
        ) : (
          <div className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            One free spin a day. Mostly crumbs — but one wedge is gold.
          </div>
        )}
        {!status?.spunToday && !spinning && (
          <button onClick={spin} className="mt-2 text-xs font-bold rounded-lg px-3 py-1.5"
            style={{ background: 'var(--reward, #f59e0b)', color: '#1a1203', border: 'none', cursor: 'pointer' }}>
            SPIN
          </button>
        )}
        {spinning && <div className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>Round and round it goes…</div>}
      </div>
    </div>
  )
}
