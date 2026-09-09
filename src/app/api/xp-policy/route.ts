import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

export const GET = withAuth(async (_request, ctx) => {
  const [report, term] = await Promise.all([
    supabaseAdmin.rpc('unit_xp_report', { p_user: ctx.userId }),
    supabaseAdmin.rpc('student_term_xp', { p_user: ctx.userId }),
  ])
  if (report.error || term.error || !report.data) return NextResponse.json({ error: 'XP progress could not load. Please retry.' }, { status: 503 })
  return NextResponse.json({ ...report.data, term: term.data ?? null })
})
