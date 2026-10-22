"use client"

import { useSearchParams } from 'next/navigation'
import { teachingHref } from '@/lib/teaching-navigation'
import { lessonContextHref } from '@/lib/lesson-release'
import LessonContextLinks from '@/components/admin/LessonContextLinks'
import DayWorksheetDownloads from '@/components/admin/DayWorksheetDownloads'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarRange, BookOpen, Download, FileText, GraduationCap, MonitorPlay } from 'lucide-react'
import { planTeachHref } from '@/lib/course-plan-presentation'
import { deckForDay } from '@/data/lesson-decks'
import { classDayTool, classDayToolHref } from '@/lib/class-day-tools'
import tradesResetUnits from '@/data/trades-reset-units.json'
import tradesEtfUnits from '@/data/trades-etf-units.json'

interface DayPlan { lessons?: {id:string;title:string}[]; day: number; title: string; bodyHtml: string; kind?: 'daily'|'week-overview'; plan_fingerprint: string; lesson?: {id:string;published:boolean;content_fingerprint:string;revision:string}|null; alignment?: {status:string;message:string} }
const TRACK_LABEL: Record<string, string> = { cpa: 'CPA Physics', honors: 'Honors Physics', ap: 'AP Physics', pbl: 'Project-Based Physics', trades: 'Trades Physics', projects: 'Project Physics (MVP)' }
const UNIT_LABEL: Record<string, string> = {
  ...tradesResetUnits,
  ...tradesEtfUnits,
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
  'proj-1': 'Phase 1 · Track it',
  'proj-2': 'Phase 2 · Move it',
  'proj-3': 'Phase 3 · Sense it',
  'proj-4': 'Phase 4 · Power it, prove it',
}

// Project Physics packs two grains into one `day` number: week*10 is that week's
// overview, week*10 + n is day n inside it. Trades numbers sessions 1.1–3.5.
function dayLabel(unit: string, day: number): string {
  if (unit.startsWith('trades-reset-') || unit.startsWith('trades-etf-')) return `Meeting ${day}`
  if (unit.startsWith('trades-')) return `Session ${Math.floor((day - 1) / 5) + 1}.${((day - 1) % 5) + 1}`
  if (unit.startsWith('proj-')) {
    const wk = Math.floor(day / 10)
    return day % 10 === 0 ? `Week ${wk} · overview` : `Week ${wk} · Day ${day % 10}`
  }
  return `Day ${day}`
}

// The sidebar shows the label above, so strip whatever prefix the title repeats.
const stripTitlePrefix = (t: string) => t.replace(/^(Day \d+|Week \d+ · (?:Day \d+|Overview))\s*[·—-]\s*/, '')

// Which plan set a unit belongs to. A teacher who runs a Project Physics class
// alongside CPA holds two sets at once, so the header label has to follow the
// unit on screen — reading it off tracks[0] labels half the list wrongly.
function planSetFor(unit: string, tracks: string[]): string {
  if (unit.startsWith('proj-')) return 'projects'
  if (unit.startsWith('trades-')) return 'trades'
  return tracks.find((t) => t !== 'projects' && t !== 'trades') ?? tracks[0] ?? 'cpa'
}

export default function CourseGuide({ embedded = false }: { embedded?: boolean }) {
  const search = useSearchParams().toString()
  const [days, setDays] = useState<DayPlan[]>([])
  const [tracks, setTracks] = useState<string[]>(['cpa'])
  const [presentationTrack,setPresentationTrack]=useState('cpa')
  const [unit, setUnit] = useState<string>('unit-1')
  const [availableUnits, setAvailableUnits] = useState<string[]>(['unit-1'])
  const [honorsDays, setHonorsDays] = useState<number[]>([])
  const [sel, setSel] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [courseId, setCourseId] = useState('')
  const [ready, setReady] = useState(false)
  const [canConfirm,setCanConfirm]=useState(false)
  const [checking, setChecking] = useState(false)
  const [reload, setReload] = useState(0)
  const [error, setError] = useState('')
  const requestedDay = useRef<number | null>(null)
  useEffect(() => { const p = new URLSearchParams(search); setCourseId(p.get('class') ?? ''); setUnit(p.get('unit') ?? 'unit-1'); requestedDay.current = p.has('day') ? Number(p.get('day')) : null; setSel(requestedDay.current); setReady(true) }, [search])

  useEffect(() => {
    if (!ready) return
    const controller = new AbortController()
    setLoading(true); setError('')
    fetch(`/api/teacher/lesson-plans?unit_id=${encodeURIComponent(unit)}${courseId ? `&course_id=${encodeURIComponent(courseId)}` : ''}`, { signal: controller.signal })
      .then(async r => {const d=await r.json();if(!r.ok)throw new Error(d.error??'Could not load teacher plans.');return d})
      .then((d: { days?: DayPlan[]; track?: string; tracks?: string[]; presentationTrack?: string; availableUnits?: string[]; honorsDays?: number[];canConfirm?:boolean }) => {
        if (controller.signal.aborted) return
        setPresentationTrack(d.presentationTrack??d.track??'cpa');setDays(d.days ?? []);setCanConfirm(Boolean(d.canConfirm))
        if (d.tracks?.length) setTracks(d.tracks)
        else if (d.track) setTracks([d.track])
        if (d.availableUnits?.length) setAvailableUnits(d.availableUnits)
        setHonorsDays(d.honorsDays ?? [])
        setSel(requestedDay.current !== null ? (d.days ?? []).some(x => x.day === requestedDay.current) ? requestedDay.current : null : d.days?.[0]?.day ?? null)
        if (requestedDay.current !== null && !(d.days ?? []).some(x => x.day === requestedDay.current)) {
          const lessonId=new URLSearchParams(window.location.search).get('lesson')
          if(lessonId){window.location.replace(lessonContextHref('/admin/lessons/'+encodeURIComponent(lessonId),{class:courseId}));return}
          setError('This plan is unavailable. Choose a plan from the unit below.')
        }
        requestedDay.current = null
        setLoading(false)
      })
      .catch(e => { if (!controller.signal.aborted) { setError(e.message);setLoading(false) } })
    return () => controller.abort()
  }, [unit,ready,courseId,reload])

  const physicsPlan = /^unit-[1-8]$/.test(unit)
  const current = days.find((d) => d.day === sel) ?? null
  useEffect(() => {
    if (loading || !sel || window.location.hash !== '#student-worksheets') return
    const frame = requestAnimationFrame(() => document.getElementById('student-worksheets')?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(frame)
  }, [loading, sel, unit])
  const track = planSetFor(unit, tracks)
  const unitTitle = (UNIT_LABEL[unit] ?? unit).replace(/^Unit \d+ · /, '')

  // The day's classroom slide deck (self-contained HTML in /public/decks/…).
  // Present the same curriculum day through the shared iPad/projector session.
  const deck = current ? deckForDay(unit, current.day, presentationTrack) : null
  const animation = current ? classDayTool(unit, current.day) : null
  const presentDeck = () => {
    if(current&&deck)window.location.assign(planTeachHref(unit,current.day,courseId))
  }

  return (
    <div className={embedded ? "py-3" : "max-w-6xl mx-auto p-5"} style={{ color: 'var(--foreground)' }}>
      {!embedded && !physicsPlan && <LessonContextLinks courseId={courseId} unitId={unit} day={sel} lessonId={current?.lesson?.id ?? ''} />}
      {error && <p role="alert" className="mb-3 text-sm text-destructive">{error} <button className="min-h-11 underline" onClick={()=>setReload(n=>n+1)}>Retry</button></p>}
      <Link href={teachingHref('plan', courseId, unit)} className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> Teaching · Plan
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <CalendarRange size={16} style={{ color: 'var(--primary)' }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Course guide · {TRACK_LABEL[track] ?? track}</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {UNIT_LABEL[unit] ?? unit.replace('unit-', 'Unit ')} — {unit.startsWith('proj-') ? 'week by week' : 'day by day'}
      </h1>
      <p className="text-sm mt-1 mb-4" style={{ color: 'var(--muted-foreground)' }}>
        {unit.startsWith('proj-')
          ? 'Every academic week has an overview; weeks that have been built out also have a plan for each day. Reference only — pick a week or a day.'
          : `Your classroom plans for each day of ${unitTitle}. Reference only — pick a day to see its full plan.`}
      </p>

      {physicsPlan && <section aria-label="How the course uses video lessons" className="mb-5 space-y-3 rounded-xl border bg-card p-4"><h2 className="font-semibold">Video lessons build the tools. The course plans put them to work.</h2><p className="text-sm text-muted-foreground">The video sequence is the concept spine: direct instruction, help, and context. These class-day plans organize the Asteroid story, investigations, discussion, and assessment. Each plan shows which videos to prepare with or revisit and what still needs classroom instruction.</p><Link className="inline-flex min-h-11 items-center font-medium text-primary underline" href={lessonContextHref('/admin/dashboard?view=videos',{class:courseId})}>Browse video lessons →</Link></section>}
      {!embedded && availableUnits.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {availableUnits.map((u) => {
            const active = u === unit
            return (
              <button
                key={u}
                onClick={() => { setUnit(u); setSel(null); const p = new URLSearchParams(window.location.search); p.set('unit',u); p.delete('day'); p.delete('lesson'); window.history.pushState(null,'','?' + p) }}
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

      {physicsPlan ? null : unit.startsWith('trades-etf-') ? (
        <p className="text-sm mb-5">
          Four ETF projects with trades math, measuring, and drawing/plan interpretation.
          {' '}<a className="underline" href="/trades-etf/index.html" target="_blank" rel="noopener noreferrer">Course map and printable lessons</a>.
          {' '}<a className="underline" href="/trades-etf/drawings.html" target="_blank" rel="noopener noreferrer">Supplied drawing set</a>.
        </p>
      ) : unit.startsWith('trades-reset-') ? (
        <p className="text-sm mb-5">
          Students use their pocket notebooks for measurements, drawings, calculations, and tests.
          {' '}<a className="underline" href="/trades-reset/index.html" target="_blank" rel="noopener noreferrer">Open the course map and printable job directions</a>.
          {unit==='trades-reset-1' && <> {' '}<a className="underline" href="/trades-reset/day-1-student-job.pdf" target="_blank" rel="noopener noreferrer">Day 1 student PDF</a>.</>}
        </p>
      ) : unit.startsWith('proj-') ? (
        <p className="text-xs mb-5" style={{ color: 'var(--muted-foreground)' }}>
          No paper packet for Project Physics — <strong>the app is the packet</strong>. Every capture block carries the prompt in English and Spanish,
          the tiered frames, the word bank and a visual, so the WIDA-1 route exists on every block. These plans carry what the blocks cannot:
          the clock and the materials, the Spanish to say, and the misconception to press.
        </p>
      ) : (
        <p className="text-xs mb-5" style={{ color: 'var(--muted-foreground)' }}>No student packet on file for this unit yet.</p>
      )}

      {loading && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading plans…</p>}
      {!loading && days.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No lesson plans for your class type yet.</p>
      )}

      {days.length > 0 && (
        <div className="grid gap-5 md:grid-cols-[minmax(150px,220px)_minmax(0,1fr)]">
          {/* day list */}
          <div className="flex flex-col gap-1.5" style={{ alignContent: 'start' }}>
            {days.map((d) => {
              const active = d.day === sel
              return (
                <button
                  key={d.day}
                  onClick={() => { setSel(d.day); const p = new URLSearchParams(window.location.search); p.set('day',String(d.day)); p.delete('lesson'); window.history.pushState(null,'','?' + p) }}
                  className="text-left rounded-lg px-3 py-2 text-sm"
                  style={{
                    border: '1px solid ' + (active ? 'color-mix(in oklch, var(--primary) 45%, var(--border))' : 'var(--border)'),
                    background: active ? 'color-mix(in oklch, var(--primary) 12%, var(--card))' : 'var(--card)',
                    color: 'var(--foreground)', cursor: 'pointer',
                  }}
                >
                  <span className="font-semibold">{dayLabel(unit, d.day)}</span>
                  <span className="block text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{stripTitlePrefix(d.title)}</span>
                </button>
              )
            })}
          </div>

          {/* selected plan */}
          <div className="rounded-2xl border p-5 min-w-0" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            {current ? (
              <>
                {Boolean(current.lessons?.length) && <nav aria-label="Classroom activities using this plan" className="mb-4 flex flex-wrap gap-3">{current.lessons?.map(l=><Link key={l.id} className="inline-flex min-h-11 items-center rounded-lg border px-3 text-sm" href={lessonContextHref(`/admin/lessons/${l.id}`,{class:courseId})}>{l.title} · Classroom activity</Link>)}</nav>}
                <div className="flex flex-wrap items-start gap-2 mb-3">
                  <BookOpen size={16} style={{ color: 'var(--primary)', marginTop: 3 }} />
                  <h2 className="text-lg font-semibold tracking-tight flex-1 min-w-0">{current.title}</h2>
                  <div className="flex w-full flex-wrap items-center gap-1.5">
                    {(deck || current.lessons?.length || current.lesson) && (
                      <button
                        onClick={presentDeck}
                        className="inline-flex items-center gap-1.5 min-h-11 text-xs font-bold rounded-lg px-2.5 py-1.5 whitespace-nowrap"
                        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}
                        title={deck ? `Open “${deck.title}” for guided problem solving — work through the problems together` : 'Open the linked classroom activity'}
                      >
                        <MonitorPlay size={13} /> Open guided activity
                      </button>
                    )}
                    <a
                      href={`/api/teacher/lesson-plans/${encodeURIComponent(unit)}/${current.day}/docx${courseId ? '?course_id=' + encodeURIComponent(courseId) : ''}`}
                      download
                      className="inline-flex items-center gap-1.5 min-h-11 text-xs font-semibold rounded-lg px-2.5 py-1.5 whitespace-nowrap"
                      style={{
                        border: '1px solid color-mix(in oklch, var(--primary) 35%, var(--border))',
                        background: 'color-mix(in oklch, var(--primary) 10%, var(--card))',
                        color: 'var(--primary)',
                      }}
                      title="Download this day as a Word document"
                    >
                      <Download size={13} /> Teacher plan Word
                    </a>
                    <a
                      href={`/api/teacher/lesson-plans/${encodeURIComponent(unit)}/${current.day}/print${courseId ? '?course_id=' + encodeURIComponent(courseId) : ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 min-h-11 text-xs font-semibold rounded-lg px-2.5 py-1.5 whitespace-nowrap"
                      style={{
                        border: '1px solid color-mix(in oklch, var(--primary) 35%, var(--border))',
                        background: 'color-mix(in oklch, var(--primary) 10%, var(--card))',
                        color: 'var(--primary)',
                      }}
                      title="Open a print view, then choose 'Save as PDF' in the print dialog"
                    >
                      <FileText size={13} /> Teacher plan PDF
                    </a>
                  </div>
                </div>

                {animation && <section aria-label="In-class teaching tool" className="mb-4 rounded-xl border bg-background p-4">
                  <h3 className="font-semibold">{animation.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Animated teaching tool with classroom stop points, playback controls, and a teacher guide.</p>
                  <Link href={classDayToolHref(animation.day, courseId, animation.unit)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><MonitorPlay size={16} /> Launch teaching tool</Link>
                </section>}

                <DayWorksheetDownloads unit={unit} day={current.day} track={presentationTrack} />

                {honorsDays.includes(current.day) && (
                  <div className="flex items-center flex-wrap gap-2 mb-3 rounded-lg border px-3 py-2" style={{ borderColor: 'color-mix(in oklch, var(--primary) 35%, var(--border))', background: 'color-mix(in oklch, var(--primary) 7%, var(--card))' }}>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--primary)' }}><GraduationCap size={14} /> Honors Extension</span>
                    <a href={`/api/teacher/lesson-plans/${encodeURIComponent(unit)}/${current.day}/honors-docx${courseId ? '?course_id=' + encodeURIComponent(courseId) : ''}`} download className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5" style={{ border: '1px solid color-mix(in oklch, var(--primary) 35%, var(--border))', background: 'var(--card)', color: 'var(--primary)' }} title="Download the Honors Extension as a Word document"><Download size={13} /> Word</a>
                    <a href={`/api/teacher/lesson-plans/${encodeURIComponent(unit)}/${current.day}/honors${courseId ? '?course_id=' + encodeURIComponent(courseId) : ''}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5" style={{ border: '1px solid color-mix(in oklch, var(--primary) 35%, var(--border))', background: 'var(--card)', color: 'var(--primary)' }} title="Open a print view of the Honors Extension, then 'Save as PDF'"><FileText size={13} /> PDF</a>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Differentiation for honors classes — the honors thread for this day.</span>
                  </div>
                )}
                <section className="mb-4 rounded-xl border p-4 text-sm" aria-label="Plan alignment"><p className="font-medium">{current.kind==='week-overview'?'Week overview':physicsPlan?'Classroom plan':'Daily lesson'} · {current.alignment?.message}</p>{current.lesson ? <><p>{current.lesson.published?'Student lesson published':'Student lesson is a draft'}</p><Link className="mr-4 inline-flex min-h-11 items-center underline" href={'/admin/lessons/'+current.lesson.id+'/preview?class='+encodeURIComponent(courseId)+'&return='+encodeURIComponent('/admin/teacher/plans?unit='+unit+'&day='+current.day+(courseId?'&class='+courseId:''))}>Compare student preview</Link>{canConfirm&&current.alignment?.status!=='aligned'&&<button className="min-h-11 underline" disabled={checking} onClick={async()=>{setChecking(true);setError('');try{const r=await fetch('/api/admin/lesson-plan-links',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lesson_id:current.lesson!.id,content_fingerprint:current.lesson!.revision,plan_fingerprint:current.plan_fingerprint})});const d=await r.json();if(!r.ok)throw Error(d.error??'Could not save alignment');setDays(ds=>ds.map(day=>day.day===current.day?{...day,alignment:{status:'aligned',message:'Plan and lesson alignment checked.'}}:day))}catch(e){setError(e instanceof Error?e.message:'Could not save alignment')}finally{setChecking(false)}}}>{checking?'Saving…':'I compared these: plan matches lesson'}</button>}</>:physicsPlan?<p className="mt-2 text-muted-foreground">Use the video support listed below for preparation. A course plan does not need a matching student video lesson.</p>:<Link className="inline-flex min-h-11 items-center underline" href={'/admin/lessons/new?unit='+unit+'&day='+current.day}>Create the missing lesson draft</Link>}</section><div className="plan-html" dangerouslySetInnerHTML={{ __html: courseId ? current.bodyHtml.replaceAll('view=videos&amp;video=', 'view=videos&amp;class='+encodeURIComponent(courseId)+'&amp;video=') : current.bodyHtml }} />
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
        .plan-html [data-video-spine] { border: 1px solid var(--border); border-left: 4px solid var(--primary); border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; background: var(--card); }
        .plan-html [data-video-spine] h2 { color: var(--primary); }
        .plan-html [data-video-spine] a { color: var(--primary); text-decoration: underline; display: inline-flex; align-items: center; min-height: 44px; }
        .plan-html strong { font-weight: 700; }
        .plan-html em { color: var(--muted-foreground); }
      `}</style>
    </div>
  )
}
