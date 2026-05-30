import { NextResponse } from 'next/server'
import HTMLtoDOCX from 'html-to-docx'
import { withRole } from '@/lib/api-auth'
import unit1Cpa from '@/data/unit1-cpa-lesson-plans.json'
import unit2Cpa from '@/data/unit2-cpa-lesson-plans.json'
import unit3Cpa from '@/data/unit3-cpa-lesson-plans.json'
import unit4Cpa from '@/data/unit4-cpa-lesson-plans.json'
import unit5Cpa from '@/data/unit5-cpa-lesson-plans.json'
import unit6Cpa from '@/data/unit6-cpa-lesson-plans.json'
import unit7Cpa from '@/data/unit7-cpa-lesson-plans.json'
import unit8Cpa from '@/data/unit8-cpa-lesson-plans.json'

// GET /api/teacher/lesson-plans/[unit_id]/[day]/docx
// Returns a downloadable .docx of a single day's lesson plan, generated from
// the same authored bodyHtml the in-app reader uses. Teachers can print or
// keep a copy offline. Same authorization gate as the reader route.
//
// We use the same PLANS map as the reader; in practice this is small enough
// (8 units × ≤22 days) to ship inline. If we ever go multi-track, factor it.
// html-to-docx runs in Node.js (not edge) — that's set explicitly below.

export const runtime = 'nodejs'

interface DayPlan { day: number; title: string; bodyHtml: string }

const PLANS: Record<string, Record<string, DayPlan[]>> = {
  cpa: {
    'unit-1': unit1Cpa as DayPlan[],
    'unit-2': unit2Cpa as DayPlan[],
    'unit-3': unit3Cpa as DayPlan[],
    'unit-4': unit4Cpa as DayPlan[],
    'unit-5': unit5Cpa as DayPlan[],
    'unit-6': unit6Cpa as DayPlan[],
    'unit-7': unit7Cpa as DayPlan[],
    'unit-8': unit8Cpa as DayPlan[],
  },
}

const UNIT_LABEL: Record<string, string> = {
  'unit-1': 'Unit 1 · Motion & Forces',
  'unit-2': 'Unit 2 · Gravitation & Fields',
  'unit-3': 'Unit 3 · Momentum & Collisions',
  'unit-4': 'Unit 4 · Energy & Work',
  'unit-5': 'Unit 5 · Thermal Physics & Second Law',
  'unit-6': 'Unit 6 · Waves, Sound & Light',
  'unit-7': 'Unit 7 · Electricity & Magnetism',
  'unit-8': 'Unit 8 · Car Project',
}

// Find the day across the teacher's tracks (only `cpa` exists today, but the
// helper is shaped for the same fan-out as the reader.)
function findDay(unitId: string, day: number, tracks: string[]): DayPlan | null {
  for (const t of tracks) {
    const u = PLANS[t]?.[unitId]
    if (!u) continue
    const hit = u.find((p) => p.day === day)
    if (hit) return hit
  }
  return null
}

// Wrap the authored bodyHtml in a styled envelope. Bold serif headers, sans
// body, gray-bordered tables. Print-safe grayscale only. We *request*
// Atkinson Hyperlegible per Craig's print contracts; Word falls back to a
// system sans if it isn't installed (Calibri is the typical fallback).
function buildHtmlDoc(unitId: string, day: DayPlan): string {
  const unitName = UNIT_LABEL[unitId] ?? unitId
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    body { font-family: 'Atkinson Hyperlegible', Calibri, sans-serif; font-size: 11pt; color: #111; }
    h1 { font-size: 18pt; margin: 0 0 4pt 0; }
    h2 { font-size: 13pt; text-transform: uppercase; letter-spacing: 0.04em; color: #444; margin: 14pt 0 4pt 0; }
    .meta { font-size: 10pt; color: #666; margin-bottom: 14pt; }
    table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
    td, th { border: 0.75pt solid #999; padding: 6pt 8pt; vertical-align: top; }
    tr:first-child td > strong:first-child { color: #222; }
    p { margin: 4pt 0; line-height: 1.4; }
    ul, ol { margin: 4pt 0 4pt 18pt; }
    li { margin: 2pt 0; }
    strong { font-weight: 700; }
    em { color: #555; }
  </style></head><body>
    <h1>${escapeHtml(day.title)}</h1>
    <div class="meta">${escapeHtml(unitName)} &middot; Teacher lesson plan</div>
    ${day.bodyHtml}
  </body></html>`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export const GET = withRole<{ unit_id: string; day: string }>(['admin', 'teacher'], async (request, ctx) => {
    const { unit_id: unitId, day: dayStr } = await ctx.params
    const day = Number(dayStr)
    if (!unitId || !Number.isFinite(day)) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }

    // Teachers only see plans for the tracks they teach. Admins see all.
    let tracks: string[]
    if (ctx.role === 'admin') {
      tracks = Object.keys(PLANS)
    } else {
      const { supabaseAdmin } = await import('@/lib/supabase')
      const { data } = await supabaseAdmin.from('courses').select('track').eq('teacher_email', ctx.scopeEmail)
      tracks = [...new Set(((data ?? []) as { track: string | null }[]).map((c) => c.track).filter((t): t is string => Boolean(t)))]
    }

    const plan = findDay(unitId, day, tracks)
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

    const html = buildHtmlDoc(unitId, plan)
    const docxBuffer = await HTMLtoDOCX(html, null, {
      title: plan.title,
      orientation: 'portrait',
      margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1 inch (twips)
      font: 'Atkinson Hyperlegible',
      fontSize: 22, // 11pt (units are half-points)
      pageNumber: false,
      table: { row: { cantSplit: true } },
    })

    const safeDay = String(day).padStart(2, '0')
    const filename = `${unitId}-day-${safeDay}.docx`
    // Cast Buffer (which is Uint8Array-compatible) to BodyInit. In Node runtime
    // both `Response` and `NextResponse` accept it; the cast satisfies TS.
    return new Response(docxBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache',
      },
    })
})
