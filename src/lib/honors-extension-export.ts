// Renders a day's Honors Extension (the honors-thread blocks for that CPA day)
// to a printable HTML envelope, mirroring lesson-plan-export. Source of truth is
// src/data/honors-extensions.json (generated from the unit-1 honors block overlays).

import honorsData from '@/data/honors-extensions.json'
import { UNIT_LABEL } from '@/lib/lesson-plan-export'

interface HxBlock { type: string; [k: string]: unknown }
export interface HonorsExtension { day: number; title: string; blocks: HxBlock[] }

const DATA = honorsData as Record<string, HonorsExtension[]>

export function honorsDaysFor(unitId: string): number[] {
  return (DATA[unitId] ?? []).map((e) => e.day)
}
export function findHonorsExtension(unitId: string, day: number): HonorsExtension | null {
  return (DATA[unitId] ?? []).find((e) => e.day === day) ?? null
}

function esc(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Minimal markdown → HTML: headings, bold, italic, inline code, bullet lists,
// paragraphs. KaTeX/`$…$` is left literal (a teacher reference, not a render).
function mdToHtml(md: string): string {
  const inline = (s: string) => esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
  let html = ''
  let inList = false
  const closeList = () => { if (inList) { html += '</ul>'; inList = false } }
  for (const raw of String(md ?? '').split('\n')) {
    const line = raw.trimEnd()
    if (!line.trim()) { closeList(); continue }
    let m: RegExpMatchArray | null
    if ((m = line.match(/^###\s+(.*)/))) { closeList(); html += `<h3>${inline(m[1])}</h3>`; continue }
    if ((m = line.match(/^##\s+(.*)/))) { closeList(); html += `<h2 class="hx-h">${inline(m[1])}</h2>`; continue }
    if ((m = line.match(/^[-*]\s+(.*)/))) { if (!inList) { html += '<ul>'; inList = true } html += `<li>${inline(m[1])}</li>`; continue }
    closeList(); html += `<p>${inline(line)}</p>`
  }
  closeList()
  return html
}

function blockHtml(b: HxBlock): string {
  const s = (k: string) => (typeof b[k] === 'string' ? (b[k] as string) : '')
  switch (b.type) {
    case 'callout': {
      const variant = s('variant') || 'note'
      const title = s('title') ? `<div class="hx-ctitle">${esc(s('title'))}</div>` : ''
      return `<div class="hx-callout hx-${esc(variant)}">${title}${mdToHtml(s('markdown'))}</div>`
    }
    case 'prose': return `<div class="hx-prose">${mdToHtml(s('markdown'))}</div>`
    case 'vocab': {
      const terms = (b.terms as { term: string; definition: string; cognate?: string }[] | undefined) ?? []
      const items = terms.map((t) => `<li><strong>${esc(t.term)}</strong> — ${esc(t.definition)}${t.cognate ? ` <em>(${esc(t.cognate)})</em>` : ''}</li>`).join('')
      return `<div class="hx-box"><div class="hx-label">Vocabulary</div><ul>${items}</ul></div>`
    }
    case 'exit_ticket': return `<div class="hx-box"><div class="hx-label">Written response — homework</div><p>${esc(s('prompt'))}</p>${s('frame') ? `<p class="hx-frame">Sentence frame: ${esc(s('frame'))}</p>` : ''}</div>`
    case 'gewa': return `<div class="hx-box"><div class="hx-label">Solve &amp; justify</div><p>${esc(s('prompt'))}</p></div>`
    case 'marzano': return `<div class="hx-box"><div class="hx-label">Self-rating (Marzano 1–2–3)</div><p>Target: <code>${esc(s('targetId'))}</code></p></div>`
    case 'asteroid_thread': return `<div class="hx-box"><div class="hx-label">Asteroid thread</div>${s('whatWeKnow') ? `<p><em>${esc(s('whatWeKnow'))}</em></p>` : ''}<p>${esc(s('connection'))}</p></div>`
    default: return ''
  }
}

export function buildHonorsExtensionHtml(unitId: string, ext: HonorsExtension, opts: { forPdf?: boolean } = {}): string {
  const unitName = UNIT_LABEL[unitId] ?? unitId
  const printCss = opts.forPdf ? `@page { size: Letter; margin: 1in; } .hx-callout, .hx-box { page-break-inside: avoid; } h1, h2 { page-break-after: avoid; }` : ''
  const body = ext.blocks.map(blockHtml).join('\n')
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    body { font-family: 'Atkinson Hyperlegible', Calibri, sans-serif; font-size: 11pt; color: #111; }
    h1 { font-size: 18pt; margin: 0 0 4pt 0; }
    h2.hx-h { font-size: 12.5pt; margin: 10pt 0 3pt 0; color: #222; text-transform: none; letter-spacing: 0; }
    h3 { font-size: 11.5pt; margin: 8pt 0 2pt 0; }
    .hx-banner { display: inline-block; font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #5b4bd6; border: 1pt solid #5b4bd6; border-radius: 4pt; padding: 1pt 6pt; margin-bottom: 6pt; }
    .meta { font-size: 10pt; color: #666; margin-bottom: 12pt; }
    p { margin: 4pt 0; line-height: 1.4; }
    ul { margin: 4pt 0 4pt 18pt; } li { margin: 2pt 0; }
    strong { font-weight: 700; } em { color: #555; } code { background: #f0f0f4; padding: 0 3pt; border-radius: 3pt; }
    .hx-label { font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #666; margin-bottom: 2pt; }
    .hx-ctitle { font-weight: 700; margin-bottom: 2pt; }
    .hx-callout { border-left: 3pt solid #888; padding: 6pt 10pt; margin: 8pt 0; background: #fafafa; }
    .hx-note { border-left-color: #5b4bd6; } .hx-tip { border-left-color: #1d9e75; }
    .hx-warning { border-left-color: #ba7517; } .hx-misconception { border-left-color: #d85a30; }
    .hx-box { border: 0.75pt solid #ccc; border-radius: 5pt; padding: 6pt 10pt; margin: 8pt 0; }
    .hx-frame { color: #555; font-style: italic; }
    .hx-prose { margin: 6pt 0; }
    ${printCss}
  </style></head><body>
    <div class="hx-banner">Honors Extension</div>
    <h1>${esc(ext.title)}</h1>
    <div class="meta">${esc(unitName)} &middot; Day ${ext.day} &middot; Honors thread — depth of demand (justify &amp; connect)</div>
    ${body}
  </body></html>`
}
