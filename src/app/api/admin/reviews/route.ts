import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getEffectiveContext } from '@/lib/effective-context'

// ADMIN-ONLY review queue for generated skill reviews. The application admin is
// the single quality gate app-wide: pending reviews are shown only to the
// student who generated them until the admin APPROVES one — approval puts it in
// the shared library served to every student weak on that target.

type Row = { id: string; target_id: string; reteach: string; questions: unknown; status: string; created_by: string | null; created_at: string }

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ctx = await getEffectiveContext(session.user.email)
    if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data } = await supabaseAdmin
      .from('target_reviews')
      .select('id, target_id, reteach, questions, status, created_by, created_at')
      .order('created_at', { ascending: false })
    const all = (data ?? []) as Row[]
    const pending = all.filter((r) => r.status === 'pending')

    // Attach each review's target statement for context.
    const targetIds = [...new Set(all.map((r) => r.target_id))]
    const stmtById = new Map<string, string>()
    if (targetIds.length > 0) {
      const { data: ts } = await supabaseAdmin.from('learning_targets').select('id, statement').in('id', targetIds)
      for (const t of (ts ?? []) as { id: string; statement: string }[]) stmtById.set(t.id, t.statement)
    }
    const decorate = (r: Row) => ({ ...r, targetStatement: stmtById.get(r.target_id) ?? r.target_id })

    return NextResponse.json({
      pending: pending.map(decorate),
      pendingCount: pending.length,
      recent: all.slice(0, 40).map(decorate),
    })
  } catch (error) {
    console.error('Error in GET /api/admin/reviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST { id, decision: 'approve' | 'reject' }
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ctx = await getEffectiveContext(session.user.email)
    if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const id: string | undefined = body.id
    const decision: 'approve' | 'reject' = body.decision
    if (!id || (decision !== 'approve' && decision !== 'reject')) {
      return NextResponse.json({ error: 'id and decision (approve|reject) required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('target_reviews')
      .update({ status: decision === 'approve' ? 'approved' : 'rejected', reviewed_by: ctx.realEmail, reviewed_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in POST /api/admin/reviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
