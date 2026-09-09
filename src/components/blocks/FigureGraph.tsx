"use client"

import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label,
} from 'recharts'
import type { GraphSeries } from '@/data/content-blocks'

// ---------------------------------------------------------------------------
// FigureGraph — an interactive graph students READ (not a lab-data table). The
// author supplies one or more series; students hover for exact values and click
// a series in the legend to show/hide it (e.g. compare position-time to
// velocity-time). On-brand palette, recharts (already in the stack).
// ---------------------------------------------------------------------------

const PALETTE = ['var(--primary)', 'var(--success)', 'oklch(0.62 0.16 25)', 'oklch(0.58 0.10 255)', 'var(--reward)']

export default function FigureGraph({
  title, xLabel, yLabel, series, presentation = false,
}: {
  presentation?: boolean
  title?: string
  xLabel?: string
  yLabel?: string
  series: GraphSeries[]
}) {
  const labelSize = presentation ? 28 : 12
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  // Merge all series onto shared x rows so recharts can plot them together.
  const data = useMemo(() => {
    const byX = new Map<number, Record<string, number>>()
    for (const s of series) {
      for (const [x, y] of s.points) {
        const row = byX.get(x) ?? { x }
        row[s.label] = y
        byX.set(x, row)
      }
    }
    return Array.from(byX.values()).sort((a, b) => a.x - b.x)
  }, [series])

  const toggle = (label: string) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label); else next.add(label)
      return next
    })

  return (
    <figure style={{ margin: 0 }}>
      {title && <figcaption style={{ fontSize: presentation ? 36 : 13, fontWeight: 600, color: 'var(--foreground)', marginBottom: 6 }}>{title}</figcaption>}
      <div style={{ borderRadius: 12, border: '0.5px solid var(--border)', background: 'var(--card)', padding: '12px 10px 6px', width: '100%', height: presentation ? 600 : 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 40, bottom: presentation ? 50 : 26, left: presentation ? 30 : 6 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="x" type="number" stroke="var(--muted-foreground)" fontSize={labelSize} tickLine={false} height={presentation ? 75 : 40}>
              {xLabel && <Label value={xLabel} position="insideBottom" offset={0} fill="var(--muted-foreground)" fontSize={labelSize} />}
            </XAxis>
            <YAxis stroke="var(--muted-foreground)" fontSize={labelSize} tickLine={false} width={presentation ? 100 : 44}>
              {yLabel && <Label value={yLabel} angle={-90} position="insideLeft" fill="var(--muted-foreground)" fontSize={labelSize} style={{ textAnchor: 'middle' }} />}
            </YAxis>
            <Tooltip
              contentStyle={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: 'var(--muted-foreground)' }}
            />
            <Legend
              verticalAlign="top"
              align="center"
              onClick={(e) => toggle(String((e as { value?: string }).value ?? ''))}
              wrapperStyle={{ fontSize: labelSize, cursor: 'pointer', paddingBottom: 10 }}
            />
            {series.map((s, i) => (
              <Line
                key={s.label}
                type="monotone"
                dataKey={s.label}
                stroke={s.color ?? PALETTE[i % PALETTE.length]}
                strokeWidth={2.5}
                dot={{ r: 2.5 }}
                activeDot={{ r: 5 }}
                hide={hidden.has(s.label)}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption style={{ fontSize: presentation ? 24 : 11.5, color: 'var(--muted-foreground)', marginTop: 6 }}>
        {presentation ? 'Compare the axes, the patterns, and the evidence.' : 'Hover a point for its value · click a name in the key to show or hide that line.'}
      </figcaption>
    </figure>
  )
}
