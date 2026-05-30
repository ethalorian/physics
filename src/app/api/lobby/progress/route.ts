import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeWord, phraseComplete, missingCount } from '@/lib/lobby/passphrase'

// POST /api/lobby/progress { session_id, entered: string[] }
// The student reports every passphrase word they've collected so far. We append
// timestamped entries for any word we haven't seen before (the A2 timeline) and
// flip phrase_completed_at the moment they hold the full set.
export const POST = withAuth(async (request, ctx) => {
  const { session_id, entered } = (await request.json().catch(() => ({}))) as {
    session_id?: string
    entered?: string[]
  }
  if (!session_id || !Array.isArray(entered)) {
    return NextResponse.json({ error: 'session_id and entered[] required' }, { status: 400 })
  }

  const { data: member } = await supabaseAdmin
    .from('lobby_members')
    .select('group_id, word_entries, phrase_completed_at')
    .eq('session_id', session_id)
    .eq('user_id', ctx.userId)
    .maybeSingle()
  if (!member) return NextResponse.json({ error: 'Not in this lobby' }, { status: 404 })

  const m = member as {
    group_id: string | null
    word_entries: { word: string; at: string }[]
    phrase_completed_at: string | null
  }
  if (!m.group_id) return NextResponse.json({ error: 'Not grouped yet' }, { status: 409 })

  const { data: grp } = await supabaseAdmin
    .from('lobby_groups')
    .select('passphrase')
    .eq('id', m.group_id)
    .maybeSingle()
  const passphrase = ((grp as { passphrase: string[] } | null)?.passphrase ?? [])

  // Only timestamp words that belong to the phrase and are newly entered.
  const phraseSet = new Set(passphrase.map(normalizeWord))
  const seen = new Set((m.word_entries ?? []).map((e) => normalizeWord(e.word)))
  const now = new Date().toISOString()
  const timeline = [...(m.word_entries ?? [])]
  for (const raw of entered) {
    const w = normalizeWord(raw)
    if (phraseSet.has(w) && !seen.has(w)) {
      seen.add(w)
      timeline.push({ word: w, at: now })
    }
  }

  const enteredWords = timeline.map((e) => e.word)
  const complete = phraseComplete(enteredWords, passphrase)
  const completedAt = m.phrase_completed_at ?? (complete ? now : null)

  await supabaseAdmin
    .from('lobby_members')
    .update({ word_entries: timeline, phrase_completed_at: completedAt })
    .eq('session_id', session_id)
    .eq('user_id', ctx.userId)

  return NextResponse.json({
    completed: complete,
    missing: missingCount(enteredWords, passphrase),
    accepted: enteredWords,
  })
})
