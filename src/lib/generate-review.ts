// Shared generator for targeted skill reviews (re-teach blurb + multiple-choice
// questions) via Claude. Used by the student-serve path and the teacher "seed
// the library" action so the prompt + validation live in one place.

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

export type ReviewQ = { q: string; choices: string[]; answerIndex: number; explanation: string }
export interface GeneratedReview { reteach: string; questions: ReviewQ[] }

export function sanitizeReview(raw: unknown): GeneratedReview | null {
  const obj = raw as { reteach?: unknown; questions?: unknown }
  const reteach = typeof obj?.reteach === 'string' ? obj.reteach.trim() : ''
  if (!reteach) return null
  const qs: ReviewQ[] = []
  for (const item of Array.isArray(obj?.questions) ? obj.questions : []) {
    const it = item as { q?: unknown; choices?: unknown; answerIndex?: unknown; explanation?: unknown }
    const q = typeof it?.q === 'string' ? it.q.trim() : ''
    const choices = Array.isArray(it?.choices) ? it.choices.filter((c): c is string => typeof c === 'string').slice(0, 5) : []
    const answerIndex = Number(it?.answerIndex)
    const explanation = typeof it?.explanation === 'string' ? it.explanation.trim() : ''
    if (q && choices.length >= 2 && answerIndex >= 0 && answerIndex < choices.length) {
      qs.push({ q, choices, answerIndex, explanation })
    }
  }
  if (qs.length < 2) return null
  return { reteach, questions: qs.slice(0, 5) }
}

// Returns { review } on success or { error } (incl. a friendly 'not configured').
export async function generateTargetReview(statement: string): Promise<{ review?: GeneratedReview; error?: string }> {
  if (!process.env.ANTHROPIC_API_KEY) return { error: 'Review generation is not configured (missing ANTHROPIC_API_KEY).' }
  const system = `You are a high-school physics teacher's aide creating a short SKILL REVIEW for a CPA (college-prep, conceptual-first) student who is struggling with one learning target. Produce: (1) a brief, encouraging plain-English re-teach (3-5 sentences, concrete, idealized physics — round g, no air resistance — no heavy math), then (2) 3-4 multiple-choice questions that build from recognition to application, each with 3-4 answer choices, the index of the correct one, and a one-sentence explanation. Keep language accessible for English learners. Reply with ONLY a JSON object, no prose: {"reteach":"...","questions":[{"q":"...","choices":["...","..."],"answerIndex":0,"explanation":"..."}]}`
  const userText = `LEARNING TARGET: ${statement}\n\nWrite the re-teach and questions as JSON.`
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 1200, system, messages: [{ role: 'user', content: userText }] }),
    })
    if (!res.ok) return { error: 'Could not reach the review generator.' }
    const data = (await res.json()) as { content?: { text?: string }[] }
    const text = data.content?.map((c) => c.text ?? '').join('') ?? ''
    const match = text.match(/\{[\s\S]*\}/)
    const parsed = match ? sanitizeReview(JSON.parse(match[0])) : null
    if (!parsed) return { error: 'The generated review was malformed.' }
    return { review: parsed }
  } catch {
    return { error: 'Could not generate the review.' }
  }
}
