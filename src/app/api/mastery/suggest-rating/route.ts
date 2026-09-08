import { MASTERY_EVIDENCE_RUBRIC, parseMasterySuggestion } from '@/lib/mastery-evidence'
import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'

// POST /api/mastery/suggest-rating
// Teacher's-aide: given a learning target + the student's captured work, suggest a
// Marzano level (1-3) and a one-line rationale to speed the mastery sweep. This is
// ONLY a suggestion — the teacher always makes and saves the final rating.
//
// Uses Claude (Anthropic Messages API) via fetch — no SDK dependency.
// Requires env: ANTHROPIC_API_KEY. Optional: ANTHROPIC_MODEL (defaults below).

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

export const POST = withRole(['admin', 'teacher'], async (request) => {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI assist is not configured (missing ANTHROPIC_API_KEY).' }, { status: 503 })
    }

    const body = await request.json()
    const targetStatement = typeof body.targetStatement === 'string' ? body.targetStatement : ''
    const work = typeof body.work === 'string' ? body.work : ''
    if (!targetStatement.trim() || !work.trim()) return NextResponse.json({ error: 'No student work to assess' }, { status: 400 })

    const system = MASTERY_EVIDENCE_RUBRIC
    const userText = `LEARNING TARGET: ${targetStatement}\n\nSTUDENT WORK:\n${work}\n\nAssess the evidence quality. Return a supported level or null, rationale, and one next step as JSON.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 500,
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
    try {
      return NextResponse.json(parseMasterySuggestion(text))
    } catch {
      return NextResponse.json({ error: 'AI assist returned an invalid suggestion. Please review the evidence or try again.' }, { status: 502 })
    }
})
