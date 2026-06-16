// Renders a day's Honors Extension (the honors-thread blocks for that CPA day)
// using the SAME envelope as the CPA lesson-plan exports, so the Word/PDF look
// identical to every other day document. Source of truth is
// src/data/honors-extensions.json (generated from the unit-1 honors overlays).

import honorsData from '@/data/honors-extensions.json'
import { buildLessonPlanHtml, type BuildOpts } from '@/lib/lesson-plan-export'

interface HxBlock { type: string; [k: string]: unknown }
export interface HonorsExtension { day: number; title: string; blocks: HxBlock[] }

const DATA = honorsData as Record<string, HonorsExtension[]>

export function honorsDaysFor(unitId: string): number[] {
  return (DATA[unitId] ?? []).map((e) => e.day)
}
export function findHonorsExtension(unitId: string, day: number): HonorsExtension | null {
  return (DATA[unitId] ?? []).find((e) => e.day === day) ?? null
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Minimal markdown → the same HTML vocabulary the CPA plans use (h2 section
// headings, paragraphs, bullet lists, bold/italic). `$…$` math is left literal.
function mdToHtml(md: string): string {
  const inline = (s: string) => esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<strong>$1</strong>')
  let html = ''
  let inList = false
  const closeList = () => { if (inList) { html += '</ul>'; inList = false } }
  for (const raw of String(md ?? '').split('\n')) {
    const line = raw.trimEnd()
    if (!line.trim()) { closeList(); continue }
    let m: RegExpMatchArray | null
    if ((m = line.match(/^###\s+(.*)/))) { closeList(); html += `<h2>${inline(m[1])}</h2>`; continue }
    if ((m = line.match(/^##\s+(.*)/))) { closeList(); html += `<h2>${inline(m[1])}</h2>`; continue }
    if ((m = line.match(/^[-*]\s+(.*)/))) { if (!inList) { html += '<ul>'; inList = true } html += `<li>${inline(m[1])}</li>`; continue }
    closeList(); html += `<p>${inline(line)}</p>`
  }
  closeList()
  return html
}

function blockSection(b: HxBlock): string {
  const s = (k: string) => (typeof b[k] === 'string' ? (b[k] as string) : '')
  switch (b.type) {
    case 'callout': return `${s('title') ? `<h2>${esc(s('title'))}</h2>` : ''}${mdToHtml(s('markdown'))}`
    case 'prose': return mdToHtml(s('markdown'))
    case 'vocab': {
      const terms = (b.terms as { term: string; definition: string; cognate?: string }[] | undefined) ?? []
      const items = terms.map((t) => `<li><strong>${esc(t.term)}</strong> — ${esc(t.definition)}${t.cognate ? ` <em>(${esc(t.cognate)})</em>` : ''}</li>`).join('')
      return `<h2>Vocabulary</h2><ul>${items}</ul>`
    }
    case 'exit_ticket': return `<h2>Written response — homework</h2><p>${esc(s('prompt'))}</p>${s('frame') ? `<p><em>Sentence frame: ${esc(s('frame'))}</em></p>` : ''}`
    case 'gewa': return `<h2>Solve and justify</h2><p>${esc(s('prompt'))}</p>`
    case 'marzano': return `<h2>Self-rating (Marzano 1–2–3)</h2><p>Target: <strong>${esc(s('targetId'))}</strong></p>`
    case 'asteroid_thread': return `<h2>Asteroid thread</h2>${s('whatWeKnow') ? `<p><em>${esc(s('whatWeKnow'))}</em></p>` : ''}<p>${esc(s('connection'))}</p>`
    default: return ''
  }
}

/** Build the Honors Extension in the shared lesson-plan envelope — identical
 *  formatting (font, margins, headings, tables) to every other day document. */
export function buildHonorsExtensionHtml(unitId: string, ext: HonorsExtension, opts: BuildOpts = {}): string {
  const bodyHtml = ext.blocks.map(blockSection).join('\n')
  return buildLessonPlanHtml(unitId, { day: ext.day, title: `${ext.title} — Honors Extension`, bodyHtml }, opts)
}
