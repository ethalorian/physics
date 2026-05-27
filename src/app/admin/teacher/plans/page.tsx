"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarRange, BookOpen } from 'lucide-react'

interface DayPlan { day: number; title: string; bodyHtml: string }
const TRACK_LABEL: Record<string, string> = { cpa: 'CPA Physics', honors: 'Honors Physics', ap: 'AP Physics', pbl: 'Project-Based Physics' }

export default function TeacherPlansPage() {
  const [days, setDays] = useState<DayPlan[]>([])
  const [track, setTrack] = useState<string>('cpa')
  const [sel, setSel] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/teacher/lesson-plans?unit_id=unit-1')
      .then((r) => r.json())
      .then((d: { days?: DayPlan[]; track?: string }) => {
        setDays(d.days ?? [])
        if (d.track) setTrack(d.track)
        if ((d.days ?? []).length) setSel(d.days![0].day)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const current = days.find((d) => d.day === sel) ?? null

  return (
    <div className="max-w-6xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <Link href="/admin/teacher" className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> Dashboard
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <CalendarRange size={16} style={{ color: 'var(--primary)' }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Lesson plans · {TRACK_LABEL[track] ?? track}</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Unit 1 — day by day</h1>
      <p className="text-sm mt-1 mb-5" style={{ color: 'var(--muted-foreground)' }}>
        Your teacher lesson plans for each day of Unit 1. Reference only — pick a day to see its full plan.
      </p>

      {loading && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading plans…</p>}
      {!loading && days.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No lesson plans for your class type yet.</p>
      )}

      {days.length > 0 && (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'minmax(150px, 220px) 1fr' }}>
          {/* day list */}
          <div className="flex flex-col gap-1.5" style={{ alignContent: 'start' }}>
            {days.map((d) => {
              const active = d.day === sel
              return (
                <button
                  key={d.day}
                  onClick={() => setSel(d.day)}
                  className="text-left rounded-lg px-3 py-2 text-sm"
                  style={{
                    border: '1px solid ' + (active ? 'color-mix(in oklch, var(--primary) 45%, var(--border))' : 'var(--border)'),
                    background: active ? 'color-mix(in oklch, var(--primary) 12%, var(--card))' : 'var(--card)',
                    color: 'var(--foreground)', cursor: 'pointer',
                  }}
                >
                  <span className="font-semibold">Day {d.day}</span>
                  <span className="block text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{d.title.replace(/^Day \d+ ·\s*/, '')}</span>
                </button>
              )
            })}
          </div>

          {/* selected plan */}
          <div className="rounded-2xl border p-5 min-w-0" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            {current ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={16} style={{ color: 'var(--primary)' }} />
                  <h2 className="text-lg font-semibold tracking-tight">{current.title}</h2>
                </div>
                <div className="plan-html" dangerouslySetInnerHTML={{ __html: current.bodyHtml }} />
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Pick a day on the left.</p>
            )}
          </div>
        </div>
      )}

      {/* scoped styling for the authored plan HTML (tables, lists, emphasis) */}
      <style jsx global>{`
        .plan-html { font-size: 14px; line-height: 1.55; color: var(--foreground); overflow-x: auto; }
        .plan-html h1, .plan-html h2, .plan-html h3 { font-weight: 700; margin: 14px 0 6px; }
        .plan-html h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted-foreground); }
        .plan-html p { margin: 6px 0; }
        .plan-html ul, .plan-html ol { margin: 6px 0 6px 18px; }
        .plan-html li { margin: 3px 0; }
        .plan-html table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        .plan-html td, .plan-html th { border: 1px solid var(--border); padding: 8px 10px; vertical-align: top; text-align: left; }
        .plan-html tr:first-child td strong { color: var(--primary); }
        .plan-html strong { font-weight: 700; }
        .plan-html em { color: var(--muted-foreground); }
      `}</style>
    </div>
  )
}
