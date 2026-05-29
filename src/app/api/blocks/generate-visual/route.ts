import { NextRequest, NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'

// POST /api/blocks/generate-visual
// Turn a teacher's PLAIN-ENGLISH description into the structured data for a
// visual lesson block — so authors never hand-write JSON. Two targets:
//   - diagram: free-body / vectors / motion-map  (drawn as on-brand SVG)
//   - graph:   one or more line series the student reads (recharts)
// Uses Claude (Anthropic Messages API) via fetch — no SDK. Requires ANTHROPIC_API_KEY.

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

type Target = 'diagram' | 'graph'

const DIAGRAM_SYSTEM = `You convert a high-school physics teacher's plain-English description into the DATA for a code-drawn diagram. Reply with ONLY a JSON object (no prose, no markdown).

You are given a diagram "kind". Use the matching shape:

free_body — a free-body diagram (forces on one object):
{ "title": "short title", "caption": "one plain sentence a student reads", "forces": [ { "label": "Weight", "dir": "down", "mag": 100 }, { "label": "Normal", "dir": "up", "mag": 100 } ] }
- "dir" is one of "up" | "down" | "left" | "right", OR a number = angle in degrees CCW from the +x axis (e.g. 30 for a force up a ramp).
- "mag" is a RELATIVE positive number (longer arrow = bigger force); keep them proportional, not real Newtons.

vectors — arrows drawn from a common origin, with an optional resultant:
{ "title": "...", "caption": "...", "vectors": [ { "label": "v", "angle": 30, "mag": 80 } ], "showResultant": true }
- "angle" in degrees CCW from +x. "mag" relative positive number. Set showResultant true when the description involves adding vectors / a net or resultant.

motion_map — a strobe row of dots whose spacing shows speeding up / slowing down:
{ "title": "...", "caption": "...", "dots": [1, 1.4, 1.9, 2.5] }
- "dots" are RELATIVE gaps between successive strobe flashes. Increasing = speeding up, decreasing = slowing down, equal = constant speed. Use 4-6 values.

Keep titles under ~6 words and captions one sentence. Ground everything in the description; do not invent unrelated forces or motion.`

const GRAPH_SYSTEM = `You convert a high-school physics teacher's plain-English description into the DATA for an interactive line graph the student reads. Reply with ONLY a JSON object (no prose, no markdown), in this shape:
{ "title": "short title", "xLabel": "Time (s)", "yLabel": "Velocity (m/s)", "series": [ { "label": "Cart A", "points": [[0,0],[1,2],[2,4],[3,6]] } ] }
- Each series is a labeled line; "points" are [x, y] pairs in increasing x order (use 4-9 points).
- Choose axis labels WITH units that match the description. Make the numbers physically sensible (e.g. constant velocity = straight sloped line; constant acceleration = straight v-t line; position under constant accel = upward curve).
- Include multiple series only if the description compares cases. Keep labels short.`

function clampNum(v: unknown, lo: number, hi: number, dflt: number): number {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return dflt
  return Math.max(lo, Math.min(hi, n))
}

export const POST = withRole(['teacher', 'admin'], async (request) => {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Generation is not configured (missing ANTHROPIC_API_KEY).' }, { status: 503 })
    }

    const body = (await request.json()) as { target?: Target; diagramKind?: string; prompt?: string }
    const target: Target = body.target === 'graph' ? 'graph' : 'diagram'
    const prompt = (body.prompt ?? '').trim()
    if (!prompt) return NextResponse.json({ error: 'Describe the visual first.' }, { status: 400 })

    const diagramKind = ['free_body', 'vectors', 'motion_map'].includes(body.diagramKind ?? '')
      ? (body.diagramKind as string) : 'free_body'

    const system = target === 'graph' ? GRAPH_SYSTEM : DIAGRAM_SYSTEM
    const userText = target === 'graph'
      ? `Build the graph data for this description:\n\n${prompt}`
      : `Diagram kind: ${diagramKind}\n\nBuild the diagram data for this description:\n\n${prompt}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1200,
        system,
        messages: [{ role: 'user', content: userText }],
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error('Anthropic API error:', res.status, detail)
      return NextResponse.json({ error: 'Generation request failed' }, { status: 502 })
    }

    const data = (await res.json()) as { content?: { type?: string; text?: string }[] }
    const text = data.content?.map((c) => c.text ?? '').join('') ?? ''
    const match = text.match(/\{[\s\S]*\}/)
    let parsed: Record<string, unknown> = {}
    try { parsed = match ? JSON.parse(match[0]) : {} } catch { parsed = {} }

    // ---- validate + shape into a clean block patch ------------------------
    const title = typeof parsed.title === 'string' ? parsed.title.slice(0, 80) : undefined
    const caption = typeof parsed.caption === 'string' ? parsed.caption.slice(0, 240) : undefined

    if (target === 'graph') {
      const rawSeries = Array.isArray(parsed.series) ? parsed.series : []
      const series = rawSeries.slice(0, 5).map((s) => {
        const o = (s ?? {}) as Record<string, unknown>
        const pts = Array.isArray(o.points) ? o.points : []
        const points = pts
          .map((p) => Array.isArray(p) ? [Number(p[0]), Number(p[1])] : null)
          .filter((p): p is number[] => !!p && Number.isFinite(p[0]) && Number.isFinite(p[1]))
          .slice(0, 40)
        return { label: typeof o.label === 'string' ? o.label.slice(0, 40) : 'Series', points }
      }).filter((s) => s.points.length >= 2)
      if (series.length === 0) return NextResponse.json({ error: 'Could not build a graph from that. Try describing the axes and what each line does.' }, { status: 422 })
      return NextResponse.json({
        block: {
          title,
          xLabel: typeof parsed.xLabel === 'string' ? parsed.xLabel.slice(0, 40) : undefined,
          yLabel: typeof parsed.yLabel === 'string' ? parsed.yLabel.slice(0, 40) : undefined,
          series,
          spec: undefined,
        },
      })
    }

    // diagram
    if (diagramKind === 'motion_map') {
      const dots = (Array.isArray(parsed.dots) ? parsed.dots : [])
        .map((d) => clampNum(d, 0.1, 20, 1)).slice(0, 8)
      if (dots.length < 2) return NextResponse.json({ error: 'Could not build a motion map. Describe whether it speeds up, slows down, or stays steady.' }, { status: 422 })
      return NextResponse.json({ block: { kind: 'motion_map', title, caption, dots, forces: undefined, vectors: undefined, showResultant: undefined, spec: undefined } })
    }
    if (diagramKind === 'vectors') {
      const vectors = (Array.isArray(parsed.vectors) ? parsed.vectors : []).slice(0, 6).map((v) => {
        const o = (v ?? {}) as Record<string, unknown>
        return { label: typeof o.label === 'string' ? o.label.slice(0, 24) : 'v', angle: clampNum(o.angle, -360, 360, 0), mag: clampNum(o.mag, 1, 1000, 50) }
      })
      if (vectors.length === 0) return NextResponse.json({ error: 'Could not build vectors from that. Try naming each vector, its direction, and size.' }, { status: 422 })
      return NextResponse.json({ block: { kind: 'vectors', title, caption, vectors, showResultant: parsed.showResultant === true, forces: undefined, dots: undefined, spec: undefined } })
    }
    // free_body (default)
    const forces = (Array.isArray(parsed.forces) ? parsed.forces : []).slice(0, 8).map((f) => {
      const o = (f ?? {}) as Record<string, unknown>
      const dirRaw = o.dir
      const dir = (typeof dirRaw === 'string' && ['up', 'down', 'left', 'right'].includes(dirRaw))
        ? dirRaw : clampNum(dirRaw, -360, 360, 0)
      return { label: typeof o.label === 'string' ? o.label.slice(0, 24) : 'Force', dir, mag: clampNum(o.mag, 1, 1000, 50) }
    })
    if (forces.length === 0) return NextResponse.json({ error: 'Could not build a free-body diagram. Try naming each force and its direction.' }, { status: 422 })
    return NextResponse.json({ block: { kind: 'free_body', title, caption, forces, vectors: undefined, dots: undefined, showResultant: undefined, spec: undefined } })
})
