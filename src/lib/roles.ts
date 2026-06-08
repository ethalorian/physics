import { supabaseAdmin } from '@/lib/supabase'

// DB-backed role grants. The hardcoded ADMIN_EMAILS in permissions.ts stay the
// source of truth for ADMINS (so the owner can never be locked out); this table
// holds TEACHER grants earned via Google Classroom or an admin approval. Role
// resolution is additive: a grant can only raise a student to teacher, never
// remove an admin.

export type GrantedRole = 'teacher' | 'admin'

export async function getGrantedRole(email: string): Promise<GrantedRole | null> {
  if (!email) return null
  const { data } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('email', email)
    .maybeSingle()
  const r = (data as { role?: string } | null)?.role
  return r === 'teacher' || r === 'admin' ? r : null
}

// Record a pending teacher-access request (a district staff member tried to sign
// in but isn't granted yet). Idempotent: never reopens an already-APPROVED request,
// but a fresh attempt after a denial re-opens it to pending so the admin sees it.
export async function requestTeacherAccess(email: string, name?: string | null): Promise<void> {
  const e = email.trim().toLowerCase()
  if (!e) return
  const { data: existing } = await supabaseAdmin.from('teacher_access_requests').select('status').eq('email', e).maybeSingle()
  if ((existing as { status?: string } | null)?.status === 'approved') return
  await supabaseAdmin.from('teacher_access_requests').upsert(
    { email: e, name: name ?? null, status: 'pending', created_at: new Date().toISOString() },
    { onConflict: 'email' },
  )
}

export async function grantTeacher(
  email: string,
  source: 'classroom' | 'admin_approval' | 'seed',
  grantedBy: string | null,
): Promise<void> {
  await supabaseAdmin
    .from('user_roles')
    .upsert(
      { email, role: 'teacher', source, granted_by: grantedBy, granted_at: new Date().toISOString() },
      { onConflict: 'email' },
    )
}
