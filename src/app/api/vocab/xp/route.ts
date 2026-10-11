import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { accessVocabTask } from '@/lib/vocab-access'
import { UUID } from '@/lib/vocab-learning'
import { supabaseAdmin } from '@/lib/supabase'
import { VOCAB_ASSIGNMENT_XP } from '@/lib/xp-policy'

export const GET = withAuth(async (req, ctx) => {
  const id = new URL(req.url).searchParams.get('task_id') ?? ''
  if (!UUID.test(id)) return NextResponse.json({ error: 'Choose an assignment.' }, { status: 400 })
  if (ctx.realRole !== 'student') return NextResponse.json({ preview: true, available: VOCAB_ASSIGNMENT_XP })
  if (!await accessVocabTask(id, ctx)) return NextResponse.json({ error: 'Assignment unavailable.' }, { status: 403 })
  const { data, error } = await supabaseAdmin.from('economy_point_grants').select('points,awarded_at')
    .eq('user_id', ctx.userId).eq('dedupe_key', `vocab-assignment:${id}:${ctx.userId}`).maybeSingle()
  if (error) throw error
  return NextResponse.json({ earned: data?.points ?? 0, awardedAt: data?.awarded_at ?? null, available: VOCAB_ASSIGNMENT_XP }, { headers: { 'Cache-Control': 'private, no-store' } })
})
