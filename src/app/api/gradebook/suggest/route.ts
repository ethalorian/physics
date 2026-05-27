import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'

// POST /api/gradebook/suggest
// Teacher's-aide: given a lesson and the student's captured work (+ how much of
// the lesson they completed), SUGGEST a gradebook PERCENTAGE (0-100) and a
// one-line rationale to speed grading. Only a suggestion — the teacher confirms
// or overrides. Separate from the formative 1-2-3 mastery suggestion.
// Uses Claude (Anthropic Messages API) via fetch. Requires ANTHROPIC_API_KEY.

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
    const lessonTitle: string = body.lessonTitle ?? ''
    const completionPct: number | null = typeof body.completionPct === 'number' ? body.completionPct : null
    const work: string = body.work ?? ''
    if (!work.trim() && completionPct == null) {
      return NextResponse.json({ error: 'No work or completion to assess' }, { status: 400 })
    }

    const system = `You assist a high school physics teacher who records a GRADEBOOK percentage (0-100) for a student's daily lesson work — this is a completion/effort grade toward the letter grade, NOT a formative mastery rating. Weigh how much of the lesson the student completed and whether the captured work shows a genuine, on-task attempt; daily work is graded generously for completion and effort, not perfection. Suggest ONE percentage and a one-line rationale. The teacher confirms or overrides, so be reasonable and concise. Reply with ONLY a JSON object, no prose: {"percent": 90, "rationale": "one short sentence"}.`
    const userText = `LESSON: ${lessonTitle}\nLESSON COMPLETION: ${completionPct == null ? 'unknown' : completionPct + '%'}\n\nSTUDENT WORK:\n${work || '(no captured text work)'}\n\nSuggest a gradebook percentage (0-100) and a one-line rationale as JSON.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 200, system, messages: [{ role: 'user', content: userText }] }),
    })
    if (!res.ok) {
      const detail = await res.text()
      console.error('Anthropic API error:', res.status, detail)
      return NextResponse.json({ error: 'AI assist request failed' }, { status: 502 })
    }

    const data = (await res.json()) as { content?: { type?: string; text?: string }[] }
    const text = data.content?.map((c) => c.text ?? '').join('') ?? ''
    const match = text.match(/\{[\s\S]*\}/)
    const parsed = (match ? JSON.parse(match[0]) : {}) as { percent?: number; rationale?: string }
    let percent = Math.round(Number(parsed.percent))
    if (!(percent >= 0 && percent <= 100)) percent = 0
    return NextResponse.json({ percent, rationale: parsed.rationale ?? '' })
  } catch (error) {
    console.error('Error in POST /api/gradebook/suggest:', error)
    return NextResponse.json({ error: 'Could not suggest a score' }, { status: 500 })
  }
}
