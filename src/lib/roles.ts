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
