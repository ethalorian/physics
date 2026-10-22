'use client'

import { useState, type ReactNode } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { AnalyticsDataset } from '@/lib/analytics/types'
import { weeklyScores } from '@/lib/analytics/model'
import s from './analytics.module.css'

export type Navigate = (changes: Record<string, string | null>) => void
export const number = (value: number | null, decimals = 0) => value === null ? '—' : value.toFixed(decimals)
export const score = (value: number | null) => value === null ? 'No scored work' : `${number(value)}%`
export const change = (value: number | null, unit = '', decimals = 1) => value === null ? 'Not enough repeat evidence' : `${value > 0 ? '+' : ''}${number(value, decimals)}${unit}`
export const date = (at: string | null) => at ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(at) ? `${at}T12:00:00Z` : at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }) : 'Not recorded'
export function Panel({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return <Card className={s.panel}><header className={s.heading}><div><h2>{title}</h2>{description && <p className={s.muted}>{description}</p>}</div>{action}</header>{children}</Card>
}
export function Empty({ children }: { children: ReactNode }) { return <div className={s.empty}>{children}</div> }
export function Metric({ label, value, detail, tone, onClick, selected }: { label: string; value: ReactNode; detail: string; tone?: 'up' | 'down'; onClick?: () => void; selected?: boolean }) {
  const content = <><span className={s.metricLabel}>{label}{onClick && <ArrowUpRight size={15} aria-hidden />}</span><strong>{value}</strong><small>{detail}</small></>
  return onClick ? <button type="button" className={s.metric} data-tone={tone} onClick={onClick} aria-pressed={selected}>{content}</button> : <div className={s.metric} data-tone={tone}>{content}</div>
}
export function Delta({ value, percent = false }: { value: number | null; percent?: boolean }) { return <span className={value === null || value === 0 ? s.muted : value > 0 ? s.up : s.down}>{change(value, percent ? ' pp' : '', percent ? 0 : 2)}</span> }
export function Bar({ value, max = 100, tone }: { value: number | null; max?: number; tone?: string }) {
  return <div className={s.barTrack} aria-hidden><div className={s.barFill} data-tone={tone} style={{ width: `${Math.max(0, Math.min(100, (value ?? 0) / max * 100))}%` }} /></div>
}
export function Pair({ first, latest, max = 100, unit = '%', decimals = 0 }: { first: number | null; latest: number | null; max?: number; unit?: string; decimals?: number }) {
  return <div className={s.pair}><div className={s.pairLabels}><span>First {first === null ? '—' : number(first, decimals) + unit}</span><span>Latest {latest === null ? '—' : number(latest, decimals) + unit}</span></div><Bar value={first} max={max} tone="first" /><Bar value={latest} max={max} /></div>
}
export function Pages<T>({ rows, children, size = 12 }: { rows: T[]; children: (rows: T[]) => ReactNode; size?: number }) {
  const [page, setPage] = useState(0), last = Math.max(0, Math.ceil(rows.length / size) - 1), current = Math.min(page, last)
  return <>{children(rows.slice(current * size, (current + 1) * size))}{rows.length > size && <div className={s.pagination}><span>{current * size + 1}–{Math.min((current + 1) * size, rows.length)} of {rows.length}</span><div className="flex gap-2"><Button variant="outline" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Previous results"><ChevronLeft size={16} /></Button><Button variant="outline" disabled={current === last} onClick={() => setPage(current + 1)} aria-label="Next results"><ChevronRight size={16} /></Button></div></div>}</>
}
export function ScoreTrend({ data }: { data: AnalyticsDataset }) {
  const rows = weeklyScores(data)
  return <Panel title="Question performance over time" description="Weekly average of the latest scored submission per student and question. Question mix can change.">
    {!rows.some(r => r.score !== null) ? <Empty>No scored submissions in this period.</Empty> : <><div className={s.chart} role="img" aria-label="Weekly scored question performance. Exact values are in the table below."><ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{ top: 12, right: 16, bottom: 8, left: -14 }} accessibilityLayer><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="week" tickFormatter={date} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} minTickGap={32} /><YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} unit="%" /><Tooltip contentStyle={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)' }} labelFormatter={label => `Week starting ${date(String(label))}`} formatter={value => [`${Math.round(Number(value))}%`, 'Question score']} /><Line name="Question score" type="linear" dataKey="score" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--primary)' }} connectNulls={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div><details className={s.chartData}><summary>View chart data and evidence counts</summary><div className={s.tableWrap}><table className={s.table}><thead><tr><th>Week starting</th><th>Score</th><th>Scored student-question pairs</th><th>Students</th></tr></thead><tbody>{rows.map(r => <tr key={r.week}><td>{date(r.week)}</td><td>{score(r.score)}</td><td>{r.scored}</td><td>{r.students}</td></tr>)}</tbody></table></div></details></>}
  </Panel>
}
