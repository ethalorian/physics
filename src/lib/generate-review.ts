// Shared generator for targeted skill reviews via Claude. A review is a short
// RICH re-teach (an ordered array of display blocks — prose, callout, code-drawn
// diagram, read-the-graph, and ONE embedded simulation picked from the unit's
// catalog) followed by multiple-choice questions. The MC questions are the
// GRADED component; the blocks are instructional support. Used by the
// student-serve path and the admin "seed the library" action so the prompt +
// validation live in one place.

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

export type ReviewQ = { q: string; choices: string[]; answerIndex: number; explanation: string }

// A constrained subset of the content-block model for the re-teach. Shapes are
// kept structurally identical to src/data/content-blocks.ts so BlockRenderer
// renders them with no translation. Figures are intentionally excluded — Claude
// can't invent real image URLs.
export type ReteachBlock =
  | { id: string; type: 'prose'; markdown: string }
  | { id: string; type: 'callout'; variant: 'note' | 'tip' | 'warning' | 'misconception'; title?: string; markdown: string }
  | { id: string; type: 'diagram'; kind: 'free_body' | 'vectors' | 'motion_map'; title?: string; caption?: string; forces?: { label: string; dir: string | number; mag: number; color?: string }[]; vectors?: { label: string; angle: number; mag: number; color?: string }[]; showResultant?: boolean; dots?: number[] }
  | { id: string; type: 'graph'; title?: string; xLabel?: string; yLabel?: string; series: { label: string; color?: string; points: [number, number][] }[] }
  | { id: string; type: 'sim_embed'; simulationSlug: string }

export interface GeneratedReview { reteach: string; blocks: ReteachBlock[]; questions: ReviewQ[] }

export type SimOption = { slug: string; title: string; description?: string; topic?: string }

const CALLOUT_VARIANTS = new Set(['note', 'tip', 'warning', 'misconception'])
const DIAGRAM_KINDS = new Set(['free_body', 'vectors', 'motion_map'])
const DIR_WORDS = new Set(['up', 'down', 'left', 'right'])

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

// Validate a single re-teach block; return a clean typed block or null. `slugs`
// is the set of simulation slugs Claude was allowed to pick from.
function sanitizeBlock(raw: unknown, id: string, slugs: Set<string>): ReteachBlock | null {
  const b = raw as { type?: unknown }
  const type = asString(b?.type)
  if (type === 'prose') {
    const markdown = asString((raw as { markdown?: unknown }).markdown)
    return markdown ? { id, type: 'prose', markdown } : null
  }
  if (type === 'callout') {
    const o = raw as { variant?: unknown; title?: unknown; markdown?: unknown }
    const markdown = asString(o.markdown)
    if (!markdown) return null
    const variantRaw = asString(o.variant)
    const variant = CALLOUT_VARIANTS.has(variantRaw) ? (variantRaw as 'note' | 'tip' | 'warning' | 'misconception') : 'note'
    const title = asString(o.title)
    return { id, type: 'callout', variant, ...(title ? { title } : {}), markdown }
  }
  if (type === 'diagram') {
    const o = raw as { kind?: unknown; title?: unknown; caption?: unknown; forces?: unknown; vectors?: unknown; showResultant?: unknown; dots?: unknown }
    const kindStr = asString(o.kind)
    if (!DIAGRAM_KINDS.has(kindStr)) return null
    const kind = kindStr as 'free_body' | 'vectors' | 'motion_map'
    const out: ReteachBlock = { id, type: 'diagram', kind }
    const title = asString(o.title); if (title) out.title = title
    const caption = asString(o.caption); if (caption) out.caption = caption
    if (kind === 'free_body' && Array.isArray(o.forces)) {
      const forces = o.forces
        .map((f) => f as { label?: unknown; dir?: unknown; mag?: unknown; color?: unknown })
        .filter((f) => asString(f.label) && (DIR_WORDS.has(asString(f.dir)) || Number.isFinite(Number(f.dir))) && Number.isFinite(Number(f.mag)))
        .map((f) => ({
          label: asString(f.label),
          dir: DIR_WORDS.has(asString(f.dir)) ? asString(f.dir) : Number(f.dir),
          mag: Number(f.mag),
          ...(asString(f.color) ? { color: asString(f.color) } : {}),
        }))
      if (forces.length === 0) return null
      out.forces = forces
    } else if (kind === 'vectors' && Array.isArray(o.vectors)) {
      const vectors = o.vectors
        .map((v) => v as { label?: unknown; angle?: unknown; mag?: unknown; color?: unknown })
        .filter((v) => asString(v.label) && Number.isFinite(Number(v.angle)) && Number.isFinite(Number(v.mag)))
        .map((v) => ({ label: asString(v.label), angle: Number(v.angle), mag: Number(v.mag), ...(asString(v.color) ? { color: asString(v.color) } : {}) }))
      if (vectors.length === 0) return null
      out.vectors = vectors
      if (typeof o.showResultant === 'boolean') out.showResultant = o.showResultant
    } else if (kind === 'motion_map' && Array.isArray(o.dots)) {
      const dots = o.dots.map((d) => Number(d)).filter((d) => Number.isFinite(d))
      if (dots.length < 2) return null
      out.dots = dots
    } else {
      return null
    }
    return out
  }
  if (type === 'graph') {
    const o = raw as { title?: unknown; xLabel?: unknown; yLabel?: unknown; series?: unknown }
    const series = (Array.isArray(o.series) ? o.series : [])
      .map((s) => s as { label?: unknown; color?: unknown; points?: unknown })
      .map((s) => {
        const points = (Array.isArray(s.points) ? s.points : [])
          .map((p) => (Array.isArray(p) ? [Number(p[0]), Number(p[1])] as [number, number] : [NaN, NaN] as [number, number]))
          .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
        return { label: asString(s.label) || 'Series', ...(asString(s.color) ? { color: asString(s.color) } : {}), points }
      })
      .filter((s) => s.points.length >= 2)
    if (series.length === 0) return null
    const out: ReteachBlock = { id, type: 'graph', series }
    const title = asString(o.title); if (title) out.title = title
    const xLabel = asString(o.xLabel); if (xLabel) out.xLabel = xLabel
    const yLabel = asString(o.yLabel); if (yLabel) out.yLabel = yLabel
    return out
  }
  if (type === 'sim_embed') {
    const slug = asString((raw as { simulationSlug?: unknown }).simulationSlug)
    return slug && slugs.has(slug) ? { id, type: 'sim_embed', simulationSlug: slug } : null
  }
  return null
}

export function sanitizeReview(raw: unknown, slugs: Set<string>): GeneratedReview | null {
  const obj = raw as { reteach?: unknown; blocks?: unknown; questions?: unknown }
  const reteach = asString(obj?.reteach)
  if (!reteach) return null

  // Blocks (optional, but cap at 6 and de-dupe an over-eager second sim).
  const blocks: ReteachBlock[] = []
  let simCount = 0
  for (const item of Array.isArray(obj?.blocks) ? obj.blocks : []) {
    const block = sanitizeBlock(item, `b${blocks.length + 1}`, slugs)
    if (!block) continue
    if (block.type === 'sim_embed') {
      if (simCount >= 1) continue
      simCount += 1
    }
    blocks.push(block)
    if (blocks.length >= 6) break
  }

  // MC questions — the graded component (unchanged contract).
  const qs: ReviewQ[] = []
  for (const item of Array.isArray(obj?.questions) ? obj.questions : []) {
    const it = item as { q?: unknown; choices?: unknown; answerIndex?: unknown; explanation?: unknown }
    const q = asString(it?.q)
    const choices = Array.isArray(it?.choices) ? it.choices.filter((c): c is string => typeof c === 'string').slice(0, 5) : []
    const answerIndex = Number(it?.answerIndex)
    const explanation = asString(it?.explanation)
    if (q && choices.length >= 2 && answerIndex >= 0 && answerIndex < choices.length) {
      qs.push({ q, choices, answerIndex, explanation })
    }
  }
  if (qs.length < 2) return null
  return { reteach, blocks, questions: qs.slice(0, 5) }
}

function simCatalogText(sims: SimOption[]): string {
  if (sims.length === 0) return 'No simulations are available for this unit — do NOT include a sim_embed block.'
  return sims.map((s) => `- slug "${s.slug}": ${s.title}${s.topic ? ` [${s.topic}]` : ''}${s.description ? ` — ${s.description}` : ''}`).join('\n')
}

// Extract a JSON object from Claude's reply, even if it's wrapped in markdown
// code fences or has leading/trailing prose. Returns null if no `{...}` is
// found.
function extractJsonObject(text: string): string | null {
  // Try a fenced block first (```json ... ``` or ``` ... ```).
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fence) {
    const inner = fence[1].trim()
    const m = inner.match(/\{[\s\S]*\}/)
    if (m) return m[0]
  }
  // Fall back to the first balanced-looking {...} run.
  const m = text.match(/\{[\s\S]*\}/)
  return m ? m[0] : null
}

// Returns { review } on success or { error } (incl. a friendly 'not configured').
export async function generateTargetReview(statement: string, sims: SimOption[] = []): Promise<{ review?: GeneratedReview; error?: string }> {
  if (!process.env.ANTHROPIC_API_KEY) return { error: 'Review generation is not configured (missing ANTHROPIC_API_KEY).' }
  const slugs = new Set(sims.map((s) => s.slug))
  const system = `You are a high-school physics teacher's aide building a short, visually rich SKILL REVIEW for a CPA (college-prep, conceptual-first) student who is struggling with one learning target. Idealized physics only (round g to 10 m/s^2, no air resistance, no heavy math). Keep language accessible for English learners.

Produce a JSON object with THREE keys:

1. "reteach": a 1-2 sentence plain-English summary of the skill (fallback text; keep it short).

2. "blocks": an ORDERED array (3-6 items) that re-teaches the skill, building from idea to picture to interaction. Allowed block types ONLY:
   - {"type":"prose","markdown":"..."}  — short explanatory paragraph (markdown + KaTeX OK).
   - {"type":"callout","variant":"note|tip|warning|misconception","title":"...","markdown":"..."} — a key idea or a common misconception to avoid.
   - {"type":"diagram","kind":"free_body","forces":[{"label":"weight","dir":"down","mag":10},{"label":"normal","dir":"up","mag":10}]} — code-drawn free-body diagram. dir is up/down/left/right or an angle in degrees.
   - {"type":"diagram","kind":"vectors","vectors":[{"label":"v","angle":30,"mag":12}],"showResultant":true} — vector addition. angle in degrees CCW from +x.
   - {"type":"diagram","kind":"motion_map","dots":[1,1,1,2,3]} — strobe dots; relative gaps show speeding up / slowing down / constant.
   - {"type":"graph","title":"...","xLabel":"time (s)","yLabel":"position (m)","series":[{"label":"car","points":[[0,0],[1,2],[2,4]]}]} — a graph to read. Use simple, correct numbers.
   - {"type":"sim_embed","simulationSlug":"..."} — embed AT MOST ONE simulation, and ONLY if a slug from this catalog genuinely fits the skill. Follow it with a prose block explaining what to DO in the sim and what to NOTICE. Available simulations for this unit:
${simCatalogText(sims)}
   Use a diagram or graph only when it is physically correct and actually clarifies THIS skill. Omit visuals you are unsure about rather than risk a wrong picture.

3. "questions": 3-4 multiple-choice questions that build from recognition to application (THIS is the graded part). Each: {"q":"...","choices":["...","..."],"answerIndex":0,"explanation":"one sentence"}. 3-4 choices each.

Reply with ONLY the JSON object, no prose, no markdown fences.`
  const userText = `LEARNING TARGET: ${statement}\n\nWrite the review as JSON.`
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 4000, system, messages: [{ role: 'user', content: userText }] }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[generate-review] anthropic non-OK', res.status, body.slice(0, 400))
      return { error: `Generator returned ${res.status}.` }
    }
    const data = (await res.json()) as { content?: { text?: string }[]; stop_reason?: string }
    const text = data.content?.map((c) => c.text ?? '').join('') ?? ''
    const jsonStr = extractJsonObject(text)
    if (!jsonStr) {
      console.error('[generate-review] no JSON object found. stop_reason=', data.stop_reason, 'preview=', text.slice(0, 300))
      return { error: 'The generated review was malformed (no JSON).' }
    }
    let raw: unknown
    try { raw = JSON.parse(jsonStr) }
    catch (e) {
      console.error('[generate-review] JSON.parse failed. stop_reason=', data.stop_reason, 'preview=', jsonStr.slice(0, 300), 'err=', (e as Error).message)
      return { error: 'The generated review was malformed (JSON parse).' }
    }
    const parsed = sanitizeReview(raw, slugs)
    if (!parsed) {
      console.error('[generate-review] sanitize rejected. raw=', JSON.stringify(raw).slice(0, 400))
      return { error: 'The generated review was malformed (sanitize).' }
    }
    return { review: parsed }
  } catch (err) {
    console.error('[generate-review] threw', err)
    return { error: 'Could not generate the review.' }
  }
}
