import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'

// POST /api/analytics/insights
// Given a pre-aggregated, filtered slice of mastery data, ask Claude to help the
// admin LEARN from it: patterns & insights, reteach recommendations, an
// intervention list, and (when more than one class is in view) cross-class
// comparison. The server does NOT see raw student work — only the rolled numbers
// the page already computed. Teacher makes all instructional calls; this is a read.
//
// Uses Claude (Anthropic Messages API) via fetch — no SDK. Requires ANTHROPIC_API_KEY.

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

interface DomainStat { domain: string; avg: number | null; rated: number }
interface TargetStat { id: string; statement: string; domain: string; avg: number | null; rated: number; notYet: number }
interface ClassStat { name: string; section: string | null; teacher: string | null; avg: number | null; students: number }
interface InterventionStudent { name: string; teacher: string | null; overall: number | null; weakTargets: string[]; staleDays: number | null }
interface TrendPoint { week: string; avg: number | null; n: number }

interface InsightPayload {
  scopeLabel: string
  studentsInView: number
  classesInView: number
  overallAvg: number | null
  byDomain: DomainStat[]
  byTarget: TargetStat[]
  byClass: ClassStat[]
  interventions: InterventionStudent[]
  trend: TrendPoint[]
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (getUserRole(session.user.email) !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI insights are not configured (missing ANTHROPIC_API_KEY).' }, { status: 503 })
    }

    const p = (await request.json()) as InsightPayload
    if (!p || p.studentsInView === 0) {
      return NextResponse.json({ error: 'No data in the current view to analyze' }, { status: 400 })
    }

    const system = `You are a data coach for a high school physics department lead. You read a pre-aggregated slice of standards-based mastery data and help the lead LEARN from it. Mastery is on a 1-3 scale: 1 = Not yet, 2 = Almost, 3 = Got it (decaying-average rollup; higher is better, 2.45+ is solid, below 1.7 is a concern). Targets carry exactly one "domain" of thinking: knowledge, reasoning, skill, or product.

Be specific and grounded ONLY in the numbers provided — never invent data. Be concise and practical; this lead values conceptual understanding over memorization, formative use of evidence, and timely feedback. Reply with ONLY a JSON object (no prose, no markdown) in this exact shape:
{
  "patterns": ["short insight grounded in the numbers", "..."],
  "reteach": ["concrete instructional next step tied to a weak target or domain", "..."],
  "interventions": ["StudentName — why they need attention now (aging / not-yet / stalled) and a suggested move", "..."],
  "comparison": ["cross-class observation and a plausible explanation", "..."]
}
Keep each array to 2-5 items. If only one class is in view, return an empty "comparison" array. Use student names only from the interventions data provided.`

    const userText = `Analyze this slice of mastery data and return the JSON.\n\n${JSON.stringify(p, null, 2)}`

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
      return NextResponse.json({ error: 'AI insights request failed' }, { status: 502 })
    }

    const data = (await res.json()) as { content?: { type?: string; text?: string }[] }
    const text = data.content?.map((c) => c.text ?? '').join('') ?? ''
    const match = text.match(/\{[\s\S]*\}/)
    const parsed = (match ? JSON.parse(match[0]) : {}) as {
      patterns?: string[]; reteach?: string[]; interventions?: string[]; comparison?: string[]
    }

    return NextResponse.json({
      patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
      reteach: Array.isArray(parsed.reteach) ? parsed.reteach : [],
      interventions: Array.isArray(parsed.interventions) ? parsed.interventions : [],
      comparison: Array.isArray(parsed.comparison) ? parsed.comparison : [],
    })
  } catch (error) {
    console.error('Error in POST /api/analytics/insights:', error)
    return NextResponse.json({ error: 'Could not generate insights' }, { status: 500 })
  }
}
