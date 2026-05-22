import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'

// POST /api/mastery/suggest-rating
// Teacher's-aide: given a learning target + the student's captured work, suggest a
// Marzano level (1-3) and a one-line rationale to speed the mastery sweep. This is
// ONLY a suggestion — the teacher always makes and saves the final rating.
//
// Uses Claude (Anthropic Messages API) via fetch — no SDK dependency.
// Requires env: ANTHROPIC_API_KEY. Optional: ANTHROPIC_MODEL (defaults below).

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = getUserRole(session.user.email)
    if (role !== 'admin' && role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI assist is not configured (missing ANTHROPIC_API_KEY).' }, { status: 503 })
    }

    const body = await request.json()
    const targetStatement: string = body.targetStatement ?? ''
    const work: string = body.work ?? ''
    if (!work.trim()) return NextResponse.json({ error: 'No student work to assess' }, { status: 400 })

    const system = `You assist a high school physics teacher who rates student mastery on a 3-level scale (Marzano): 1 = Not yet, 2 = Almost, 3 = Got it. Based on the learning target and the student's captured work, SUGGEST one level and a one-line rationale. This only speeds the teacher's review — the teacher makes the final call, so be conservative and concise. Judge against the target, valuing conceptual understanding over memorization, and only cite evidence actually present in the work. Reply with ONLY a JSON object, no prose: {"level": 1, "rationale": "one short sentence"}.`
    const userText = `LEARNING TARGET: ${targetStatement}\n\nSTUDENT WORK:\n${work}\n\nSuggest a level (1-3) and a one-line rationale as JSON.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 200,
        system,
        messages: [{ role: 'user', content: userText }],
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error('Anthropic API error:', res.status, detail)
      return NextResponse.json({ error: 'AI assist request failed' }, { status: 502 })
    }

    const data = (await res.json()) as { content?: { type?: string; text?: string }[] }
    const text = data.content?.map((c) => c.text ?? '').join('') ?? ''
    const match = text.match(/\{[\s\S]*\}/)
    const parsed = (match ? JSON.parse(match[0]) : {}) as { level?: number; rationale?: string }

    let level = Math.round(Number(parsed.level))
    if (!(level >= 1 && level <= 3)) level = 2
    return NextResponse.json({ level, rationale: parsed.rationale ?? '' })
  } catch (error) {
    console.error('Error in POST /api/mastery/suggest-rating:', error)
    return NextResponse.json({ error: 'Could not suggest a rating' }, { status: 500 })
  }
}
