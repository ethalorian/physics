import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { translateMathPrompt } from '@/lib/math-translation'
import { MATH_LANGUAGES } from '@/lib/math-languages'

// POST /api/math-spine/translate-backfill — staff one-time helper: fill in
// translations for spiral items created before the feature existed (or any whose
// set is incomplete). Idempotent: items already fully translated are skipped.
export const POST = withAuth(async (_request, ctx) => {
  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { data: items } = await supabaseAdmin
    .from('math_spiral_items')
    .select('id, prompt, translations')

  let updated = 0
  let skipped = 0
  let failed = 0
  for (const it of items ?? []) {
    const t = (it.translations ?? {}) as Record<string, string>
    const complete = MATH_LANGUAGES.every((l) => typeof t[l.code] === 'string' && t[l.code])
    if (complete) { skipped++; continue }
    const tr = await translateMathPrompt(it.prompt)
    if (Object.keys(tr).length) {
      await supabaseAdmin.from('math_spiral_items').update({ translations: tr }).eq('id', it.id)
      updated++
    } else {
      failed++
    }
  }
  return NextResponse.json({ updated, skipped, failed, total: (items ?? []).length })
})
