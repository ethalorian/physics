import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/vocab/attempts
//   { set_id, game, l1_shown, support_level, attempts: [{ term_id, correct, ms? }] }
// One row per WORD attempt from any vocabulary game, stamped with the SEI state that
// was on (Spanish clue showing? support level?). Batched by the client (useVocabAttempts).
// Staff plays are not recorded — the competency grid is about students.

type In = { set_id?: string | null; game?: string; l1_shown?: boolean; support_level?: string; attempts?: { term_id?: string; correct?: boolean; ms?: number }[] }
const LEVELS = new Set(['full', 'partial', 'bare'])

export const POST = withAuth(async (request, ctx) => {
  if (ctx.realRole !== 'student') return NextResponse.json({ ok: true, recorded: 0, skipped: 'staff' })
  const body = (await request.json().catch(() => ({}))) as In
  const game = typeof body.game === 'string' ? body.game.slice(0, 40) : 'unknown'
  const level = LEVELS.has(String(body.support_level)) ? String(body.support_level) : 'bare'
  const rows = (Array.isArray(body.attempts) ? body.attempts : [])
    .filter((a) => typeof a.term_id === 'string' && typeof a.correct === 'boolean')
    .slice(0, 200)
    .map((a) => ({
      user_id: ctx.userId, term_id: a.term_id, vocabulary_set_id: body.set_id ?? null, game,
      correct: a.correct, l1_shown: Boolean(body.l1_shown), support_level: level,
      response_ms: typeof a.ms === 'number' && a.ms >= 0 ? Math.round(a.ms) : null,
    }))
  if (rows.length === 0) return NextResponse.json({ ok: true, recorded: 0 })
  // Games do not always know the set; the term does.
  if (!body.set_id) {
    const { data: t } = await supabaseAdmin.from('vocabulary_terms').select('id, vocabulary_set_id').in('id', [...new Set(rows.map((r) => r.term_id))])
    const setBy = new Map(((t ?? []) as { id: string; vocabulary_set_id: string }[]).map((x) => [x.id, x.vocabulary_set_id]))
    for (const r of rows) r.vocabulary_set_id = setBy.get(r.term_id as string) ?? null
  }
  const { error } = await supabaseAdmin.from('vocab_attempts').insert(rows)
  if (error) return NextResponse.json({ error: 'Could not record' }, { status: 500 })
  return NextResponse.json({ ok: true, recorded: rows.length })
})
