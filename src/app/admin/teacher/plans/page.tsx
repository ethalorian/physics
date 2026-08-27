"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarRange, BookOpen, Download, FileText, GraduationCap, MonitorPlay } from 'lucide-react'
import { deckForDay } from '@/data/lesson-decks'
import { openPresenterWindow, fullscreenKeyHint } from '@/lib/present-deck'

interface DayPlan { day: number; title: string; bodyHtml: string }
const TRACK_LABEL: Record<string, string> = { cpa: 'CPA Physics', honors: 'Honors Physics', ap: 'AP Physics', pbl: 'Project-Based Physics', trades: 'Trades Physics' }
const UNIT_LABEL: Record<string, string> = {
  'unit-1': 'Unit 1 · Motion & Forces',
  'unit-2': 'Unit 2 · Gravitation & Fields',
  'unit-3': 'Unit 3 · Momentum & Collisions',
  'unit-4': 'Unit 4 · Energy & Work',
  'unit-5': 'Unit 5 · Thermal Physics & Second Law',
  'unit-6': 'Unit 6 · Waves, Sound & Light',
  'unit-7': 'Unit 7 · Electricity & Magnetism',
  'unit-8': 'Unit 8 · Car Project',
  'trades-1': 'Trades 1 · Length & Tolerance — The Fieldhouse Wall',
  'trades-2': 'Trades 2 · Plumb, Level, Square, Slope',
}
// Units that have a student packet file in /public/student-packets.
const PACKET_UNITS = new Set(['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5', 'unit-6', 'unit-7'])

export default function TeacherPlansPage() {
  const [days, setDays] = useState<DayPlan[]>([])
  const [track, setTrack] = useState<string>('cpa')
  const [unit, setUnit] = useState<string>('unit-1')
  const [availableUnits, setAvailableUnits] = useState<string[]>(['unit-1'])
  const [honorsDays, setHonorsDays] = useState<number[]>([])
  const [sel, setSel] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/teacher/lesson-plans?unit_id=${encodeURIComponent(unit)}`)
      .then((r) => r.json())
      .then((d: { days?: DayPlan[]; track?: string; availableUnits?: string[]; honorsDays?: number[] }) => {
        setDays(d.days ?? [])
        if (d.track) setTrack(d.track)
        if (d.availableUnits?.length) setAvailableUnits(d.availableUnits)
        setHonorsDays(d.honorsDays ?? [])
        setSel((d.days ?? []).length ? d.days![0].day : null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [unit])

  const current = days.find((d) => d.day === sel) ?? null
  const unitTitle = (UNIT_LABEL[unit] ?? unit).replace(/^Unit \d+ · /, '')

  // The day's classroom slide deck (self-contained HTML in /public/decks/…).
  // Opens in a presenter window on the projector — see src/lib/present-deck.ts.
  const deck = current ? deckForDay(unit, current.day) : null
  const [deckOpened, setDeckOpened] = useState(false)
  useEffect(() => { setDeckOpened(false) }, [sel, unit])
  const presentDeck = async () => {
    if (!deck) return
    const w = await openPresenterWindow(deck.src)
    setDeckOpened(Boolean(w))
  }

  return (
    <div className="max-w-6xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <Link href="/admin/teacher" className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> Dashboard
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <CalendarRange size={16} style={{ color: 'var(--primary)' }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Lesson plans · {TRACK_LABEL[track] ?? track}</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{unit.replace('unit-', 'Unit ')} — day by day</h1>
      <p className="text-sm mt-1 mb-4" style={{ color: 'var(--muted-foreground)' }}>
        Your teacher lesson plans for each day of {unitTitle}. Reference only — pick a day to see its full plan.
      </p>

      {availableUnits.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {availableUnits.map((u) => {
            const active = u === unit
            return (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  border: '1px solid ' + (active ? 'color-mix(in oklch, var(--primary) 50%, var(--border))' : 'var(--border)'),
                  background: active ? 'color-mix(in oklch, var(--primary) 14%, var(--card))' : 'var(--card)',
                  color: active ? 'var(--primary)' : 'var(--foreground)', cursor: 'pointer',
                }}
              >
                {UNIT_LABEL[u] ?? u}
              </button>
            )
          })}
        </div>
      )}

      {/* Unit-level student packet — download (Word) / print (PDF) */}
      {PACKET_UNITS.has(unit) ? (
        <div className="rounded-xl border p-3 mb-5 flex items-center gap-3 flex-wrap"
          style={{ borderColor: 'color-mix(in oklch, var(--primary) 30%, var(--border))', background: 'color-mix(in oklch, var(--primary) 6%, var(--card))' }}>
          <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--primary)' }}>
            <BookOpen size={15} /> Student packet — {unit.replace('unit-', 'Unit ')}
          </div>
          <div className="flex items-center gap-1.5 sm:ml-auto">
            <a href={`/student-packets/${unit}.docx`} download={`${unit.replace('unit-', 'Unit ')} Student Packet.docx`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-1.5"
              style={{ border: '1px solid color-mix(in oklch, var(--primary) 35%, var(--border))', background: 'var(--card)', color: 'var(--primary)' }}
              title="Download the student packet as a Word document">
              <Download size={14} /> Word
            </a>
            <a href={`/student-packets/${unit}.pdf`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-1.5"
              style={{ border: '1px solid color-mix(in oklch, var(--primary) 35%, var(--border))', background: 'var(--card)', color: 'var(--primary)' }}
              title="Open the student packet PDF to view or print">
              <FileText size={14} /> PDF
            </a>
          </div>
        </div>
      ) : (
        <p className="text-xs mb-5" style={{ color: 'var(--muted-foreground)' }}>No student packet on file for this unit yet.</p>
      )}

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
                  <span className="font-semibold">{unit.startsWith('trades-') ? `Session ${Math.floor((d.day - 1) / 5) + 1}.${((d.day - 1) % 5) + 1}` : `Day ${d.day}`}</span>
                  <span className="block text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{d.title.replace(/^Day \d+ ·\s*/, '')}</span>
                </button>
              )
            })}
          </div>

          {/* selected plan */}
          <div className="rounded-2xl border p-5 min-w-0" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            {current ? (
              <>
                <div className="flex items-start gap-2 mb-3">
                  <BookOpen size={16} style={{ color: 'var(--primary)', marginTop: 3 }} />
                  <h2 className="text-lg font-semibold tracking-tight flex-1 min-w-0">{current.title}</h2>
                  <div className="flex items-center gap-1.5">
                    {deck && (
                      <button
                        onClick={presentDeck}
                        className="inline-flex items-center gap-1.5 text-xs font-bold rounded-lg px-2.5 py-1.5 whitespace-nowrap"
                        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}
                        title={`Open “${deck.title}” in a presenter window — arrows navigate, T opens the class timer`}
                      >
                        <MonitorPlay size={13} /> Present deck
                      </button>
                    )}
                    <a
                      href={`/api/teacher/lesson-plans/${encodeURIComponent(unit)}/${current.day}/docx`}
                      download
                      className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5 whitespace-nowrap"
                      style={{
                        border: '1px solid color-mix(in oklch, var(--primary) 35%, var(--border))',
                        background: 'color-mix(in oklch, var(--primary) 10%, var(--card))',
                        color: 'var(--primary)',
                      }}
                      title="Download this day as a Word document"
                    >
                      <Download size={13} /> Word
                    </a>
                    <a
                      href={`/api/teacher/lesson-plans/${encodeURIComponent(unit)}/${current.day}/print`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5 whitespace-nowrap"
                      style={{
                        border: '1px solid color-mix(in oklch, var(--primary) 35%, var(--border))',
                        background: 'color-mix(in oklch, var(--primary) 10%, var(--card))',
                        color: 'var(--primary)',
                      }}
                      title="Open a print view, then choose 'Save as PDF' in the print dialog"
                    >
                      <FileText size={13} /> PDF
                    </a>
                  </div>
                </div>
                {deckOpened && (
                  <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
                    Deck opened. If it landed on this screen: drag it to the projector, then press{' '}
                    <strong>{fullscreenKeyHint()}</strong> for fullscreen. Display mode must be <strong>Extend</strong>, not Mirror.
                  </p>
                )}
                {honorsDays.includes(current.day) && (
                  <div className="flex items-center flex-wrap gap-2 mb-3 rounded-lg border px-3 py-2" style={{ borderColor: 'color-mix(in oklch, var(--primary) 35%, var(--border))', background: 'color-mix(in oklch, var(--primary) 7%, var(--card))' }}>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--primary)' }}><GraduationCap size={14} /> Honors Extension</span>
                    <a href={`/api/teacher/lesson-plans/${encodeURIComponent(unit)}/${current.day}/honors-docx`} download className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5" style={{ border: '1px solid color-mix(in oklch, var(--primary) 35%, var(--border))', background: 'var(--card)', color: 'var(--primary)' }} title="Download the Honors Extension as a Word document"><Download size={13} /> Word</a>
                    <a href={`/api/teacher/lesson-plans/${encodeURIComponent(unit)}/${current.day}/honors`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5" style={{ border: '1px solid color-mix(in oklch, var(--primary) 35%, var(--border))', background: 'var(--card)', color: 'var(--primary)' }} title="Open a print view of the Honors Extension, then 'Save as PDF'"><FileText size={13} /> PDF</a>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Differentiation for honors classes — the honors thread for this day.</span>
                  </div>
                )}
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
        .plan-html td p:first-child > strong { color: var(--primary); }
        .plan-html tr:first-child td > strong { color: var(--primary); }
        .plan-html strong { font-weight: 700; }
        .plan-html em { color: var(--muted-foreground); }
      `}</style>
    </div>
  )
}
