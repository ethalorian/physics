import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/admin/lifecycle/reactivate   body: { email: string }
// Admin-only. Undo path before a purge: re-activates a student by email. Their
// math/mastery spine is untouched and resumes automatically (same students.id).
export const POST = withRole('admin', async (request) => {
  let body: { email?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
  const email = (body.email ?? '').trim()
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  const { data, error } = await supabaseAdmin.rpc('reactivate_student', { p_email: email })
  if (error) {
    console.error('[lifecycle] reactivate failed:', error)
    return NextResponse.json({ error: 'Reactivate failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, email, reactivated: data === true })
})
