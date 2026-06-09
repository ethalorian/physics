import { supabaseAdmin } from '@/lib/supabase'

// Staff presence: who is online and when they last signed in. `last_login` is set
// at authentication; `last_seen` is a lightweight heartbeat (the notification bell
// polls every 60s on every staff page), so "active now" = a recent last_seen.

export interface Presence { email: string; last_login: string | null; last_seen: string | null }

/** Stamp a fresh sign-in (sets both last_login and last_seen). */
export async function recordStaffLogin(email: string | null | undefined): Promise<void> {
  const e = (email ?? '').trim().toLowerCase()
  if (!e) return
  const now = new Date().toISOString()
  await supabaseAdmin.from('staff_presence').upsert(
    { email: e, last_login: now, last_seen: now, updated_at: now },
    { onConflict: 'email' },
  )
}

/** Heartbeat — bump last_seen (leaves last_login untouched). */
export async function touchStaffPresence(email: string | null | undefined): Promise<void> {
  const e = (email ?? '').trim().toLowerCase()
  if (!e) return
  const now = new Date().toISOString()
  await supabaseAdmin.from('staff_presence').upsert(
    { email: e, last_seen: now, updated_at: now },
    { onConflict: 'email' },
  )
}

/** All staff presence rows (for the oversight dashboard). */
export async function getStaffPresence(): Promise<Presence[]> {
  const { data } = await supabaseAdmin.from('staff_presence').select('email, last_login, last_seen')
  return (data ?? []) as Presence[]
}
