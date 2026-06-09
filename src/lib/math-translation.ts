import { MATH_LANGUAGES } from './math-languages'

// Server-side: translate a math warm-up prompt into every MATH_LANGUAGES language
// in ONE Claude call. Words only — numbers, variables, units, and equations are
// preserved verbatim so the math is never altered. Returns a { code: text } map
// (possibly empty if generation is unavailable; callers degrade gracefully).

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

const SYSTEM = `You translate a short math warm-up PROMPT for a high-school student. Reply with ONLY a JSON object, no prose, no markdown:
{ "es": "...", "fr": "...", "pt": "...", "ht": "..." }

- es = Spanish, fr = French, pt = Brazilian Portuguese, ht = Haitian Creole.
- Translate ONLY the words. Keep every number, variable, unit, symbol, fraction, and equation EXACTLY as written — e.g. "3x + 5 = 20", "12.5 m/s", "½", "Δx", "y = mx + b" must appear identically in each translation.
- Preserve the meaning precisely and read naturally for a student. Do NOT solve the problem or add anything.`

export async function translateMathPrompt(prompt: string): Promise<Record<string, string>> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || !prompt.trim()) return {}
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL, max_tokens: 1000, system: SYSTEM,
        messages: [{ role: 'user', content: `Translate this prompt:\n\n${prompt}` }],
      }),
    })
    if (!res.ok) return {}
    const data = (await res.json()) as { content?: { text?: string }[] }
    const text = data.content?.map((c) => c.text ?? '').join('') ?? ''
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) return {}
    const parsed = JSON.parse(m[0]) as Record<string, unknown>
    const out: Record<string, string> = {}
    for (const { code } of MATH_LANGUAGES) {
      if (typeof parsed[code] === 'string' && parsed[code]) out[code] = (parsed[code] as string).slice(0, 2000)
    }
    return out
  } catch {
    return {}
  }
}
