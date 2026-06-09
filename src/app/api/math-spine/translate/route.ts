import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { MATH_LANGUAGES } from '@/lib/math-languages'

// POST /api/math-spine/translate  { texts: string[], lang } → { map: { orig: translated } }
// Batched live translation for the warm-up UI (statement, mini-lesson, chrome,
// diagram labels). Any signed-in user may call it; words only, math preserved.

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
const NAME: Record<string, string> = { es: 'Spanish', fr: 'French', pt: 'Brazilian Portuguese', ht: 'Haitian Creole' }

export const POST = withAuth(async (request) => {
  const body = await request.json().catch(() => ({}))
  const lang = String(body.lang || '')
  const texts: string[] = Array.isArray(body.texts)
    ? body.texts.filter((t: unknown): t is string => typeof t === 'string' && t.length > 0).slice(0, 80)
    : []
  if (!MATH_LANGUAGES.some((l) => l.code === lang) || texts.length === 0) return NextResponse.json({ map: {} })

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return NextResponse.json({ map: {} })

  const system = `You translate UI strings for a high-school math warm-up into ${NAME[lang]}. You are given a JSON array of strings. Reply with ONLY a JSON array of the SAME length and SAME order, where each element is the ${NAME[lang]} translation of the corresponding input.
- Translate ONLY the words. Keep every number, variable, unit, symbol, fraction, and equation EXACTLY as written (e.g. "3x + 5 = 20", "12.5 m/s", "10×", "÷10", "8,500" stay identical).
- Keep it natural and concise for a student. Preserve any trailing punctuation or arrows (→, ←) as-is.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 4000, system, messages: [{ role: 'user', content: JSON.stringify(texts) }] }),
    })
    if (!res.ok) return NextResponse.json({ map: {} })
    const data = (await res.json()) as { content?: { text?: string }[] }
    const txt = data.content?.map((c) => c.text ?? '').join('') ?? ''
    const m = txt.match(/\[[\s\S]*\]/)
    if (!m) return NextResponse.json({ map: {} })
    const arr = JSON.parse(m[0]) as unknown[]
    const map: Record<string, string> = {}
    texts.forEach((t, i) => { map[t] = typeof arr[i] === 'string' ? (arr[i] as string) : t })
    return NextResponse.json({ map })
  } catch {
    return NextResponse.json({ map: {} })
  }
})
