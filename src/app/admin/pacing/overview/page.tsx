"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarClock, AlertTriangle } from 'lucide-react'

interface Row {
  courseId: string
  name: string
  section: string | null
  teacher: string | null
  hasSchedule: boolean
  students: number
  notStarted: boolean
  elapsed: number
  totalDays: number
  plannedTitle: string | null
  actualTitle: string | null
  actualSource: 'auto' | 'confirmed' | 'none'
  deltaDays: number
  status: 'on' | 'ahead' | 'behind' | 'unknown'
}

const STATUS: Record<Row['status'], { label: string; color: string }> = {
  behind: { label: 'Behind', color: 'var(--viz-down)' },
  on: { label: 'On pace', color: 'var(--success)' },
  ahead: { label: 'Ahead', color: 'var(--primary)' },
  unknown: { label: 'No data', color: 'var(--muted-foreground)' },
}

function deltaLabel(d: number, status: Row['status']): string {
  if (status === 'unknown') return '—'
  if (Math.abs(d) < 0.1) return 'on pace'
  const n = Math.abs(d) % 1 === 0 ? Math.abs(d).toString() : Math.abs(d).toFixed(1)
  return d > 0 ? `${n}d ahead` : `${n}d behind`
}

export default function PacingOverviewPage() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/pacing/overview')
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d?.error || 'Could not load'); return d })
      .then((d) => setRows(d.rows as Row[]))
      .catch((e: Error) => setErr(e.message))
  }, [])

  const behind = (rows ?? []).filter((r) => r.status === 'behind').length
  const unscheduled = (rows ?? []).filter((r) => !r.hasSchedule).length

  return (
    <div className="max-w-6xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <Link href="/admin/home" className="inline-flex items-center gap-1 text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> Command center
      </Link>

      <div className="rounded-2xl p-6 mb-6" style={{
        border: '1px solid color-mix(in oklch, var(--primary) 30%, var(--border))',
        background: 'radial-gradient(90% 140% at 92% -20%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 55%), var(--card)',
      }}>
        <div className="flex items-center gap-2 mb-1">
          <CalendarClock size={16} style={{ color: 'var(--primary)' }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Pacing overview</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Every section against the pace</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Where each class is right now relative to the master pacing guide. Behind-pace sections surface first.
        </p>
      </div>

      {err && <div className="rounded-2xl border p-4 text-sm mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>{err}</div>}

      {behind > 0 && (
        <div className="flex items-center gap-2 text-sm rounded-xl p-3 mb-4" style={{ background: 'color-mix(in oklch, var(--viz-down) 14%, transparent)' }}>
          <AlertTriangle size={16} style={{ color: 'var(--viz-down)' }} />
          <span>{behind} section{behind === 1 ? '' : 's'} behind pace.</span>
          {unscheduled > 0 && <span style={{ color: 'var(--muted-foreground)' }}>· {unscheduled} without a calendar set yet.</span>}
        </div>
      )}

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: 'color-mix(in oklch, var(--muted-foreground) 8%, transparent)' }}>
                <th className="text-left font-medium py-2.5 px-4" style={{ color: 'var(--muted-foreground)' }}>Class</th>
                <th className="text-left font-medium py-2.5 px-3" style={{ color: 'var(--muted-foreground)' }}>Teacher</th>
                <th className="text-left font-medium py-2.5 px-3" style={{ color: 'var(--muted-foreground)' }}>Should be on</th>
                <th className="text-left font-medium py-2.5 px-3" style={{ color: 'var(--muted-foreground)' }}>Actually on</th>
                <th className="text-center font-medium py-2.5 px-3" style={{ color: 'var(--muted-foreground)' }}>Gap</th>
                <th className="text-center font-medium py-2.5 px-3" style={{ color: 'var(--muted-foreground)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr><td colSpan={6} className="py-10 text-center" style={{ color: 'var(--muted-foreground)' }}>Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center" style={{ color: 'var(--muted-foreground)' }}>No sections yet. Sync a roster first.</td></tr>
              ) : rows.map((r) => {
                const st = STATUS[r.status]
                return (
                  <tr key={r.courseId} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-2.5 px-4">
                      <div className="font-medium">{r.name}{r.section ? <span style={{ color: 'var(--muted-foreground)' }}> · {r.section}</span> : null}</div>
                      <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{r.students} students{!r.hasSchedule ? ' · no calendar set' : ''}</div>
                    </td>
                    <td className="py-2.5 px-3" style={{ color: 'var(--muted-foreground)' }}>{r.teacher ?? '—'}</td>
                    <td className="py-2.5 px-3">{r.notStarted ? <span style={{ color: 'var(--muted-foreground)' }}>not started</span> : (r.plannedTitle ?? '—')}</td>
                    <td className="py-2.5 px-3">
                      {r.actualTitle ?? <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                      {r.actualSource === 'auto' && r.actualTitle && <span className="text-xs ml-1" style={{ color: 'var(--muted-foreground)' }}>(auto)</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium" style={{ color: st.color }}>{deltaLabel(r.deltaDays, r.status)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ background: `color-mix(in oklch, ${st.color} 18%, transparent)`, color: st.color }}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs mt-4" style={{ color: 'var(--muted-foreground)' }}>
        Position is auto-detected from student activity unless a teacher has confirmed it. Sections without a calendar can&apos;t be placed against dates yet.
      </p>
    </div>
  )
}
