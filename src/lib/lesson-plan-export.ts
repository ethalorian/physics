// Shared helpers for exporting a single day's lesson plan to a printable
// format (Word .docx and PDF). The PLANS map mirrors the reader route's;
// in both cases we keep a single source of truth for unit→day→bodyHtml.

import unit1Cpa from '@/data/unit1-cpa-lesson-plans.json'
import unit2Cpa from '@/data/unit2-cpa-lesson-plans.json'
import unit3Cpa from '@/data/unit3-cpa-lesson-plans.json'
import unit4Cpa from '@/data/unit4-cpa-lesson-plans.json'
import unit5Cpa from '@/data/unit5-cpa-lesson-plans.json'
import unit6Cpa from '@/data/unit6-cpa-lesson-plans.json'
import unit7Cpa from '@/data/unit7-cpa-lesson-plans.json'
import unit8Cpa from '@/data/unit8-cpa-lesson-plans.json'

export interface DayPlan { day: number; title: string; bodyHtml: string }

export const PLANS: Record<string, Record<string, DayPlan[]>> = {
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

export const UNIT_LABEL: Record<string, string> = {
  'unit-1': 'Unit 1 · Motion & Forces',
  'unit-2': 'Unit 2 · Gravitation & Fields',
  'unit-3': 'Unit 3 · Momentum & Collisions',
  'unit-4': 'Unit 4 · Energy & Work',
  'unit-5': 'Unit 5 · Thermal Physics & Second Law',
  'unit-6': 'Unit 6 · Waves, Sound & Light',
  'unit-7': 'Unit 7 · Electricity & Magnetism',
  'unit-8': 'Unit 8 · Car Project',
}

/** Find a day's plan across the teacher's tracks (only `cpa` ships today). */
export function findDay(unitId: string, day: number, tracks: string[]): DayPlan | null {
  for (const t of tracks) {
    const u = PLANS[t]?.[unitId]
    if (!u) continue
    const hit = u.find((p) => p.day === day)
    if (hit) return hit
  }
  return null
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export interface BuildOpts {
  /** When `true`, add @page CSS for PDF (page-break-inside on tables, etc.). */
  forPdf?: boolean
}

/** Wrap the authored bodyHtml in a styled envelope. Same look for docx + pdf;
 *  PDF adds a print stylesheet so the headless browser paginates well. */
export function buildLessonPlanHtml(unitId: string, day: DayPlan, opts: BuildOpts = {}): string {
  const unitName = UNIT_LABEL[unitId] ?? unitId
  const printCss = opts.forPdf
    ? `
      @page { size: Letter; margin: 1in; }
      table, tr, td, th { page-break-inside: avoid; }
      h1, h2 { page-break-after: avoid; }
    `
    : ''
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
    ${printCss}
  </style></head><body>
    <h1>${escapeHtml(day.title)}</h1>
    <div class="meta">${escapeHtml(unitName)} &middot; Teacher lesson plan</div>
    ${day.bodyHtml}
  </body></html>`
}

/** Compute the list of curriculum tracks the requester is scoped to. Admins
 *  see all tracks; teachers see only the tracks they teach (from `courses`). */
export async function resolveTracks(opts: { role: string; scopeEmail: string }): Promise<string[]> {
  if (opts.role === 'admin') return Object.keys(PLANS)
  const { supabaseAdmin } = await import('@/lib/supabase')
  const { data } = await supabaseAdmin.from('courses').select('track').eq('teacher_email', opts.scopeEmail)
  return [...new Set(((data ?? []) as { track: string | null }[]).map((c) => c.track).filter((t): t is string => Boolean(t)))]
}
