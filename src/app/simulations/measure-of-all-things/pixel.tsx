"use client"

// Tiny pixel-art engine for "The Measure of All Things".
// Sprites are arrays of string-map frames ('.'/' ' = transparent, any other
// char looks up a color in the sprite's palette). Rendered to a small canvas
// at native resolution and scaled up with image-rendering: pixelated, so
// everything stays crisp at any size.

import { CSSProperties, ReactNode, useEffect, useRef } from 'react'

export type Frame = string[]
export type Palette = Record<string, string>

export interface SpriteDef {
  frames: Frame[]
  palette: Palette
  fps?: number
}

export function PixelSprite({ sprite, scale = 4, className = '', style }: {
  sprite: SpriteDef
  scale?: number
  className?: string
  style?: CSSProperties
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { frames, palette, fps = 3 } = sprite
  const cols = Math.max(...frames[0].map(r => r.length))
  const rows = frames[0].length

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let i = 0
    const draw = () => {
      const f = frames[i % frames.length]
      ctx.clearRect(0, 0, cols, rows)
      for (let y = 0; y < f.length; y++) {
        const row = f[y]
        for (let x = 0; x < row.length; x++) {
          const color = palette[row[x]]
          if (!color) continue
          ctx.fillStyle = color
          ctx.fillRect(x, y, 1, 1)
        }
      }
      i++
    }
    draw()
    if (frames.length > 1) {
      const t = setInterval(draw, Math.max(120, 1000 / fps))
      return () => clearInterval(t)
    }
  }, [frames, palette, fps, cols, rows])

  return (
    <canvas
      ref={ref}
      width={cols}
      height={rows}
      aria-hidden
      className={className}
      style={{ width: cols * scale, height: rows * scale, imageRendering: 'pixelated', display: 'block', ...style }}
    />
  )
}

/* --------------------------------- stage --------------------------------- */

export type SkyMood = 'day' | 'dusk' | 'night' | 'dawn' | 'lab'

const SKIES: Record<SkyMood, { sky: string; ground: string }> = {
  day: { sky: 'linear-gradient(#a8cfe0 0%, #d9d3ad 75%, #e7d9b0 100%)', ground: '#8e9657' },
  dawn: { sky: 'linear-gradient(#cfa8c9 0%, #eebf84 60%, #f3d9a4 100%)', ground: '#97935e' },
  dusk: { sky: 'linear-gradient(#5d4a78 0%, #c97a4f 60%, #eaa85f 100%)', ground: '#5f5c3c' },
  night: { sky: 'linear-gradient(#16213e 0%, #233a5c 70%, #2e4a6b 100%)', ground: '#27314a' },
  lab: { sky: 'linear-gradient(#ddcba6 0%, #cdb88f 100%)', ground: '#6e553b' },
}

const STAGE_CSS = `
@keyframes moat-drift { from { transform: translateX(0); } to { transform: translateX(100vw); } }
@keyframes moat-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes moat-bob-sm { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes moat-ride { from { transform: translateX(-25vw); } to { transform: translateX(110vw); } }
@keyframes moat-sway { 0%,100% { transform: rotate(14deg); } 50% { transform: rotate(-14deg); } }
@keyframes moat-flicker { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
@media (prefers-reduced-motion: reduce) {
  .moat-stage * { animation: none !important; }
}
`

export function PixelStage({ mood, height = 150, label, children }: {
  mood: SkyMood
  height?: number
  label: string
  children: ReactNode
}) {
  const { sky, ground } = SKIES[mood]
  return (
    <div
      role="img"
      aria-label={label}
      className="moat-stage relative w-full overflow-hidden rounded-lg border border-border select-none"
      style={{ height, background: sky }}
    >
      <style>{STAGE_CSS}</style>
      {/* ground strip */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: 22, background: ground }} />
      <div className="absolute bottom-[18px] left-0 right-0" style={{ height: 4, background: 'rgba(0,0,0,0.15)' }} />
      {children}
    </div>
  )
}

/* ------------------------- positioning convenience ------------------------ */

export function At({ x, y, bottom, anim, dur, delay, children }: {
  /** Percent from left (or px string). */
  x: number | string
  /** Px from top (use bottom instead for ground-anchored sprites). */
  y?: number
  /** Px from bottom. */
  bottom?: number
  anim?: 'drift' | 'bob' | 'bob-sm' | 'ride' | 'flicker'
  dur?: number
  delay?: number
  children: ReactNode
}) {
  const animation = anim
    ? `moat-${anim} ${dur ?? 4}s ${anim === 'drift' || anim === 'ride' ? 'linear' : 'ease-in-out'} ${delay ?? 0}s infinite`
    : undefined
  return (
    <div
      className="absolute"
      style={{
        left: typeof x === 'number' ? `${x}%` : x,
        top: y,
        bottom,
        animation,
      }}
    >
      {children}
    </div>
  )
}

/* ------------------------------ star field ------------------------------- */

const STAR: SpriteDef = {
  frames: [
    ['.w.', 'www', '.w.'],
    ['...', '.w.', '...'],
  ],
  palette: { w: '#f7f1d8' },
  fps: 1,
}

export function Stars({ count = 8 }: { count?: number }) {
  // Deterministic pseudo-random placement so SSR/CSR agree.
  const pts = Array.from({ length: count }, (_, i) => ({
    x: ((i * 37 + 13) % 96) + 2,
    y: ((i * 23 + 7) % 55) + 6,
    d: (i % 3) * 0.7,
  }))
  return (
    <>
      {pts.map((p, i) => (
        <div key={i} className="absolute" style={{ left: `${p.x}%`, top: p.y, animation: `moat-flicker ${2 + p.d}s ease-in-out ${p.d}s infinite` }}>
          <PixelSprite sprite={STAR} scale={2} />
        </div>
      ))}
    </>
  )
}
