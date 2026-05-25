"use client"

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { blockMeetsOnDate, blockMeetingsElapsed, type Block, type RotationCalendar } from '@/lib/rotation'

export interface CalSection { courseId: string; name: string; section: string | null; block: string | null; startDate: string | null }
export interface CalItem { index: number; cumStart: number; plannedDays: number; lessonId: string | null; title: string; unitName: string; kind: 'lesson' | 'unit' }
interface Props {
  sections: CalSection[]
  items: CalItem[]
  calendar: RotationCalendar
  filterCourseId?: string   // when set, show only this section
  compact?: boolean
}

// Calm, distinct color per block.
const BLOCK_COLOR: Record<string, string> = {
  A: 'var(--primary)', B: 'var(--success)', C: 'var(--reward)',
  D: '#C08B8B', E: '#6E93A8', F: '#9B8BC0', G: 'var(--muted-foreground)',
}
const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function isoOf(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

interface Meeting { courseId: string; section: string | null; block: string; long: boolean; lessonId: string | null; title: string }

export default function MonthCalendar({ sections, items, calendar, filterCourseId, compact }: Props) {
  const router = useRouter()
  const now = new Date()
  const [year, setYear] = useState(now.getUTCFullYear())
  const [month, setMonth] = useState(now.getUTCMonth())

  const activeSections = useMemo(
    () => sections.filter((s) => s.block && s.startDate && (!filterCourseId || s.courseId === filterCourseId)),
    [sections, filterCourseId],
  )

  const meetingsByIso = useMemo(() => {
    const map = new Map<string, Meeting[]>()
    // span the visible month
    const first = new Date(Date.UTC(year, month, 1))
    const last = new Date(Date.UTC(year, month + 1, 0))
    for (const s of activeSections) {
      const block = s.block as Block
      const start = s.startDate as string
      const d = new Date(first)
      while (d <= last) {
        const dow = d.getUTCDay()
        if (dow >= 1 && dow <= 5 && isoOf(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) >= start) {
          const { meets, long } = blockMeetsOnDate(calendar, block, d)
          if (meets) {
            const idx = blockMeetingsElapsed(calendar, block, start, d) - 1
            if (idx >= 0) {
              const item = items.find((i) => idx >= i.cumStart && idx < i.cumStart + i.plannedDays) ?? items[items.length - 1]
              if (item) {
                const iso = isoOf(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
                const arr = map.get(iso) ?? []
                arr.push({ courseId: s.courseId, section: s.section, block, long, lessonId: item.lessonId, title: item.title })
                map.set(iso, arr)
              }
            }
          }
        }
        d.setUTCDate(d.getUTCDate() + 1)
      }
    }
    // stable order by block within a day
    for (const arr of map.values()) arr.sort((a, b) => a.block.localeCompare(b.block))
    return map
  }, [activeSections, items, calendar, year, month])

  // build Mon–Fri week rows covering the month
  const weeks = useMemo(() => {
    const firstOfMonth = new Date(Date.UTC(year, month, 1))
    // step back to Monday
    const startDow = firstOfMonth.getUTCDay()
    const back = startDow === 0 ? 6 : startDow - 1
    const cursor = new Date(firstOfMonth)
    cursor.setUTCDate(cursor.getUTCDate() - back)
    const rows: { y: number; m: number; d: number; inMonth: boolean }[][] = []
    for (let w = 0; w < 6; w++) {
      const row: { y: number; m: number; d: number; inMonth: boolean }[] = []
      for (let i = 0; i < 5; i++) {
        row.push({ y: cursor.getUTCFullYear(), m: cursor.getUTCMonth(), d: cursor.getUTCDate(), inMonth: cursor.getUTCMonth() === month })
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      }
      cursor.setUTCDate(cursor.getUTCDate() + 2) // skip Sat+Sun
      rows.push(row)
      if (cursor.getUTCMonth() !== month && cursor > new Date(Date.UTC(year, month + 1, 0))) break
    }
    return rows
  }, [year, month])

  const todayIso = isoOf(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const noSchool = new Set(calendar.no_school_dates)

  const prev = () => { if (month === 0) { setYear((y) => y - 1); setMonth(11) } else setMonth((m) => m - 1) }
  const next = () => { if (month === 11) { setYear((y) => y + 1); setMonth(0) } else setMonth((m) => m + 1) }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="grid place-items-center rounded-lg border" style={{ width: 30, height: 30, borderColor: 'var(--border)' }} aria-label="Previous month"><ChevronLeft size={16} /></button>
        <div className="font-semibold" style={{ fontSize: 15 }}>{MONTHS[month]} {year}</div>
        <button onClick={next} className="grid place-items-center rounded-lg border" style={{ width: 30, height: 30, borderColor: 'var(--border)' }} aria-label="Next month"><ChevronRight size={16} /></button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        {WD.map((w) => (
          <div key={w} className="text-xs font-medium text-center pb-1" style={{ color: 'var(--muted-foreground)' }}>{w}</div>
        ))}
        {weeks.flat().map((cell, i) => {
          const iso = isoOf(cell.y, cell.m, cell.d)
          const isToday = iso === todayIso
          const off = noSchool.has(iso)
          const meetings = meetingsByIso.get(iso) ?? []
          return (
            <div key={i} className="rounded-lg border p-1.5 flex flex-col"
              style={{
                minHeight: compact ? 64 : 104,
                borderColor: isToday ? 'var(--primary)' : 'var(--border)',
                boxShadow: isToday ? '0 0 0 1px var(--primary)' : 'none',
                background: cell.inMonth ? (off ? 'color-mix(in oklch, var(--muted-foreground) 7%, transparent)' : 'var(--card)') : 'transparent',
                opacity: cell.inMonth ? 1 : 0.4,
              }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: isToday ? 'var(--primary)' : 'var(--muted-foreground)' }}>{cell.d}</span>
                {off && cell.inMonth && <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>no school</span>}
              </div>
              <div className="flex flex-col gap-1 mt-1">
                {meetings.map((m, j) => {
                  const color = BLOCK_COLOR[m.block] ?? 'var(--muted-foreground)'
                  const clickable = Boolean(m.lessonId)
                  const label = `${m.block}${filterCourseId ? '' : (m.section ? `·${m.section}` : '')}`
                  if (!clickable) {
                    // Unit placeholder — no authored lesson to open yet. Make that legible.
                    return (
                      <div key={j} title={`${m.block} block · ${m.title} · not built yet`}
                        className="text-left rounded-md px-1.5 py-1"
                        style={{ border: '1px dashed var(--border)', background: 'transparent' }}>
                        <div className="text-[10px] font-bold" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
                        <div className="text-[11px] leading-tight truncate" style={{ color: 'var(--muted-foreground)' }}>{m.title}</div>
                        <div className="text-[9px]" style={{ color: 'var(--muted-foreground)' }}>not built yet</div>
                      </div>
                    )
                  }
                  return (
                    <button
                      key={j}
                      onClick={() => router.push(`/admin/lessons/${m.lessonId}/build`)}
                      title={`${m.block} block · ${m.title}${m.long ? ' · LONG block' : ''} — open builder`}
                      className="text-left rounded-md px-1.5 py-1 transition-transform hover:translate-x-0.5"
                      style={{
                        background: `color-mix(in oklch, ${color} 14%, transparent)`,
                        borderLeft: `3px solid ${color}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold" style={{ color }}>{label}</span>
                        {m.long && <span className="text-[9px] font-bold rounded px-1" style={{ background: 'var(--reward)', color: 'var(--reward-foreground, #4a3b00)' }}>LONG</span>}
                      </div>
                      <div className="text-[11px] leading-tight truncate" style={{ color: 'var(--foreground)' }}>{m.title}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
