'use client'

import { useMemo } from 'react'
import {
  Radar, Gauge, Wind, Thermometer, Mic, Zap, Activity, Magnet, Sun, LineChart, type LucideIcon,
} from 'lucide-react'
import type { SensorKind, SensorSpec, SensorSample } from './contract'

// A live readout styled like Vernier Graphical Analysis: a probe header with a
// live value, and an auto-scaling SVG trace. Reused by any sim that declares a
// SensorSpec — the bench probe and the sim show the same graph.

const KIND: Record<SensorKind, { color: string; Icon: LucideIcon }> = {
  motion: { color: 'var(--primary)', Icon: Radar },
  force: { color: '#D85A30', Icon: Gauge },
  pressure: { color: '#185FA5', Icon: Wind },
  temperature: { color: '#BA7517', Icon: Thermometer },
  microphone: { color: 'var(--success)', Icon: Mic },
  voltage: { color: '#BA7517', Icon: Zap },
  current: { color: '#185FA5', Icon: Activity },
  'magnetic-field': { color: '#7F77DD', Icon: Magnet },
  light: { color: 'var(--reward)', Icon: Sun },
  generic: { color: 'var(--muted-foreground)', Icon: LineChart },
}

const W = 560
const H = 200
const PAD = { l: 46, r: 14, t: 14, b: 28 }

export default function MockSensor({ spec, samples, live }: { spec: SensorSpec; samples: SensorSample[]; live: boolean }) {
  const meta = KIND[spec.kind] ?? KIND.generic
  const color = spec.color ?? meta.color
  const { Icon } = meta

  const view = useMemo(() => {
    if (samples.length === 0) return null
    const xs = samples.map((s) => s.x)
    const ys = samples.map((s) => s.y)
    const xMin = Math.min(...xs)
    let xMax = Math.max(...xs, xMin + 1)
    let yMin = Math.min(...ys, 0), yMax = Math.max(...ys, 0)
    if (yMax - yMin < 1e-6) { yMax += 1; yMin -= 1 }
    const yPad = (yMax - yMin) * 0.12
    yMin -= yPad; yMax += yPad
    if (xMax - xMin < 1e-6) xMax = xMin + 1
    const px = (x: number) => PAD.l + ((x - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r)
    const py = (y: number) => H - PAD.b - ((y - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b)
    const path = samples.map((s, i) => `${i === 0 ? 'M' : 'L'}${px(s.x).toFixed(1)},${py(s.y).toFixed(1)}`).join(' ')
    const last = samples[samples.length - 1]
    const yTicks = [yMin, (yMin + yMax) / 2, yMax]
    const zeroY = yMin < 0 && yMax > 0 ? py(0) : null
    return { px, py, path, last, yTicks, zeroY, xMax }
  }, [samples])

  const liveValue = samples.length ? samples[samples.length - 1].y : null

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '0.5px solid var(--border)', background: 'var(--card)' }}>
      {/* probe header */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: `color-mix(in oklch, ${color} 12%, var(--card))`, borderBottom: `0.5px solid color-mix(in oklch, ${color} 25%, var(--border))` }}>
        <span className="flex items-center justify-center shrink-0" style={{ width: 26, height: 26, borderRadius: 7, background: color, color: 'white' }}>
          <Icon size={15} />
        </span>
        <div className="leading-tight">
          <div style={{ fontSize: 12.5, fontWeight: 600, color: `color-mix(in oklch, ${color} 55%, var(--foreground))` }}>{spec.label}</div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{spec.quantity} · {spec.unit}</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {live && (
            <span className="inline-flex items-center gap-1" style={{ fontSize: 10.5, fontWeight: 600, color }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' }} /> LIVE
            </span>
          )}
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
            {liveValue === null ? '—' : liveValue.toFixed(2)}<span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}> {spec.unit}</span>
          </span>
        </div>
      </div>

      {/* trace */}
      <div style={{ padding: 8 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} preserveAspectRatio="xMidYMid meet">
          {/* plot frame */}
          <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} fill="none" stroke="var(--border)" strokeWidth="1" />
          {view ? (
            <>
              {/* horizontal gridlines + y ticks */}
              {view.yTicks.map((v, i) => {
                const yy = view.py(v)
                return (
                  <g key={i}>
                    <line x1={PAD.l} y1={yy} x2={W - PAD.r} y2={yy} stroke="var(--border)" strokeWidth="0.5" opacity="0.5" />
                    <text x={PAD.l - 6} y={yy + 3} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">{v.toFixed(1)}</text>
                  </g>
                )
              })}
              {/* zero line */}
              {view.zeroY !== null && (
                <line x1={PAD.l} y1={view.zeroY} x2={W - PAD.r} y2={view.zeroY} stroke={color} strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
              )}
              {/* trace */}
              <path d={view.path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {/* leading point */}
              <circle cx={view.px(view.last.x)} cy={view.py(view.last.y)} r="4" fill={color} />
            </>
          ) : (
            <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="12" fill="var(--muted-foreground)">Press Run to read the sensor</text>
          )}
          {/* axis labels */}
          <text x={(W) / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">{spec.xLabel ?? 'Time (s)'}</text>
        </svg>
      </div>
    </div>
  )
}
