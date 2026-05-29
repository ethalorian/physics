import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth } from '@/lib/api-auth'

// POST /api/concept-exercises/[chapter]/grade   body: { answers: { [n]: value } }
// Server-side auto-grade against the teacher answer key (which never ships to the
// client). MC/TF exact; fill-in fuzzy (case/punct/article-insensitive, blanks
// order-independent); short-answer auto-scored by keyword overlap but ALWAYS
// flagged for teacher review (Craig: structured-not-automatic for open writing).

type ItemType = 'fill_in' | 'multiple_choice' | 'true_false' | 'short_answer'
interface ExItem { n: number; type: ItemType; multi?: boolean }
interface ExSection { id: string; items: ExItem[] }
type KeyVal = string | string[] | { model: string }

const STOP = new Set(['the', 'a', 'an', 'of', 'to', 'is', 'are', 'and', 'or', 'in', 'on', 'it', 'its', 'that', 'this', 'as', 'by', 'be', 'for', 'with', 'at', 'will', 'was', 'were', 'they', 'their', 'an'])

function norm(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[‘’“”]/g, "'")
    .replace(/[^a-z0-9 ]+/g, ' ').replace(/\b(a|an|the)\b/g, ' ').replace(/\s+/g, ' ').trim()
}
function tokens(s: string): string[] {
  return norm(s).split(' ').filter((w) => w && !STOP.has(w))
}
// fuzzy equality for a single short blank: exact-normalized, or one contains the other
function blankMatch(student: string, accepted: string): boolean {
  const a = norm(student), b = norm(accepted)
  if (!a) return false
  if (a === b) return true
  if (b.length >= 4 && (a.includes(b) || b.includes(a))) return true
  return false
}

function gradeItem(type: ItemType, multi: boolean | undefined, key: KeyVal, ans: unknown): { correct: boolean; needsReview?: boolean; answered: boolean } {
  // multiple choice
  if (type === 'multiple_choice') {
    if (multi) {
      const want = new Set((Array.isArray(key) ? key : [String(key)]).map((s) => String(s).toLowerCase()))
      const got = new Set((Array.isArray(ans) ? ans : []).map((s) => String(s).toLowerCase()))
      const answered = got.size > 0
      const correct = answered && want.size === got.size && [...want].every((l) => got.has(l))
      return { correct, answered }
    }
    const got = String(ans ?? '').toLowerCase()
    return { correct: !!got && got === String(key).toLowerCase(), answered: !!got }
  }
  if (type === 'true_false') {
    const got = String(ans ?? '').toLowerCase()
    return { correct: !!got && got === String(key).toLowerCase(), answered: !!got }
  }
  if (type === 'fill_in') {
    const accepted = Array.isArray(key) ? key.map(String) : [String(key)]
    const studentBlanks = (Array.isArray(ans) ? ans : [ans]).map((s) => String(s ?? ''))
    const answered = studentBlanks.some((s) => s.trim() !== '')
    // order-independent greedy match: each accepted answer must be matched by some unused student blank
    const used = new Array(studentBlanks.length).fill(false)
    let matched = 0
    for (const acc of accepted) {
      const idx = studentBlanks.findIndex((s, i) => !used[i] && blankMatch(s, acc))
      if (idx >= 0) { used[idx] = true; matched++ }
    }
    return { correct: answered && matched === accepted.length, answered }
  }
  // short_answer — tentative auto-score by keyword overlap, but always review
  const model = typeof key === 'object' && key && 'model' in key ? String((key as { model: string }).model) : String(key)
  const got = String(ans ?? '')
  const answered = got.trim().length > 0
  const mt = new Set(tokens(model))
  const gt = tokens(got)
  const overlap = mt.size === 0 ? 0 : gt.filter((w) => mt.has(w)).length / mt.size
  return { correct: answered && overlap >= 0.34, needsReview: true, answered }
}

export const POST = withAuth<{ chapter: string }>(async (req, ctx) => {
    const { chapter } = await ctx.params
    const ch = Number(chapter)
    if (!Number.isInteger(ch)) return NextResponse.json({ error: 'Bad chapter' }, { status: 400 })

    const body = (await req.json()) as { answers?: Record<string, unknown>; sectionIds?: string[] }
    const answers = body.answers ?? {}
    const onlySections = Array.isArray(body.sectionIds) && body.sectionIds.length ? new Set(body.sectionIds) : null

    const { data, error } = await supabaseAdmin
      .from('concept_exercises')
      .select('sections, answer_key')
      .eq('chapter', ch)
      .maybeSingle()
    if (error || !data) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })

    const sections = (data.sections ?? []) as ExSection[]
    const key = (data.answer_key ?? {}) as Record<string, KeyVal>
    const typeByN = new Map<number, { type: ItemType; multi?: boolean }>()
    for (const s of sections) {
      if (onlySections && !onlySections.has(s.id)) continue   // grade only the assigned reading sections
      for (const it of s.items ?? []) typeByN.set(it.n, { type: it.type, multi: it.multi })
    }

    const results: Record<string, { correct: boolean; needsReview?: boolean; answered: boolean }> = {}
    let autoTotal = 0, autoCorrect = 0, reviewCount = 0, answeredCount = 0
    for (const [nStr, meta] of typeByN) {
      const k = key[String(nStr)]
      if (k === undefined) continue
      const r = gradeItem(meta.type, meta.multi, k, answers[String(nStr)])
      results[String(nStr)] = r
      if (r.answered) answeredCount++
      if (r.needsReview) { reviewCount++ } else { autoTotal++; if (r.correct) autoCorrect++ }
    }

    return NextResponse.json({
      results,
      autoCorrect, autoTotal, reviewCount, answeredCount,
      itemCount: typeByN.size,
    })
})
