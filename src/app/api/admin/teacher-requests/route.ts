import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getEffectiveContext } from '@/lib/effective-context'
import { grantTeacher } from '@/lib/roles'

// Admin-only: review and decide teacher-access requests. Approving grants the
// teacher role (user_roles) so getEffectiveContext sees them as a teacher.

type Req = { email: string; name: string | null; note: string | null; status: string; created_at: string }

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ctx = await getEffectiveContext(session.user.email)
    if (ctx.realRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data } = await supabaseAdmin
      .from('teacher_access_requests')
      .select('email, name, note, status, created_at')
      .order('created_at', { ascending: false })
    const all = (data ?? []) as Req[]
    const pending = all.filter((r) => r.status === 'pending')

    return NextResponse.json({ pending, recent: all.slice(0, 30), pendingCount: pending.length })
  } catch (error) {
    console.error('Error in GET /api/admin/teacher-requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ctx = await getEffectiveContext(session.user.email)
    if (ctx.realRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const email: string | undefined = body.email
    const decision: 'approve' | 'deny' = body.decision
    if (!email || (decision !== 'approve' && decision !== 'deny')) {
      return NextResponse.json({ error: 'email and decision (approve|deny) required' }, { status: 400 })
    }

    if (decision === 'approve') {
      await grantTeacher(email, 'admin_approval', ctx.realEmail)
    }
    const { error } = await supabaseAdmin
      .from('teacher_access_requests')
      .update({ status: decision === 'approve' ? 'approved' : 'denied', decided_at: new Date().toISOString(), decided_by: ctx.realEmail })
      .eq('email', email)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in POST /api/admin/teacher-requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
