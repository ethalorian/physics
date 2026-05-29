import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'
import { getGrantedRole } from '@/lib/roles'

// A signed-in user (defaulted to student) asks to be made a teacher. If Google
// Classroom can't auto-verify them, this files a request that surfaces as an
// alert on the admin's command center for approval. One row per email.

export const GET = withAuth(async (_request, ctx) => {
    const email = ctx.email

    const isStaff = getUserRole(email) !== 'student' || (await getGrantedRole(email)) !== null
    const { data } = await supabaseAdmin
      .from('teacher_access_requests')
      .select('status, created_at, decided_at')
      .eq('email', email)
      .maybeSingle()

    return NextResponse.json({ isTeacher: isStaff, request: data ?? null })
})

export const POST = withAuth(async (request, ctx) => {
    const email = ctx.email

    // Already a teacher/admin (allowlist or grant)? Nothing to request.
    if (getUserRole(email) !== 'student' || (await getGrantedRole(email)) !== null) {
      return NextResponse.json({ alreadyTeacher: true })
    }

    const body = await request.json().catch(() => ({}))
    const note: string | null = typeof body.note === 'string' ? body.note.slice(0, 500) : null

    const { error } = await supabaseAdmin
      .from('teacher_access_requests')
      .upsert(
        { email, name: ctx.session.user.name ?? null, note, status: 'pending', created_at: new Date().toISOString(), decided_at: null, decided_by: null },
        { onConflict: 'email' },
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, status: 'pending' })
})
