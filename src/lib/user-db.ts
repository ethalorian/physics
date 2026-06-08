import jwt from 'jsonwebtoken'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Per-user Supabase client — the application half of the database-level safety net.
 *
 * The roster-aware RLS policies (rls2_read on the student-data tables) only engage
 * when a query runs as the *authenticated user* rather than the service role. This
 * module mints a short-lived Supabase-compatible JWT from the NextAuth session
 * (sub = google_user_id, email) and returns a client that carries it, so PostgREST
 * runs the query under that identity and the RLS policies become a real backstop:
 * even if a route forgot to scope, the database returns only rows the caller may see.
 *
 * SAFETY / ROLLOUT: this is OFF by default. `getScopedDb` returns the normal service-
 * role client UNLESS `SUPABASE_RLS_USER_CLIENT === 'on'` AND `SUPABASE_JWT_SECRET` is
 * set. So shipping these route changes is a no-op in production until the flag is
 * flipped after a smoke test — flipping it can't take down classes by surprise, and
 * if the secret is missing it transparently falls back to today's behavior (which is
 * already protected by the app-layer roster scoping).
 */

const RLS_ENABLED = process.env.SUPABASE_RLS_USER_CLIENT === 'on'
// The Vercel↔Supabase integration provides the JWT secret prefixed
// (SUPABASE_SUPABASE_JWT_SECRET); accept either name so no copying is needed.
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET ?? process.env.SUPABASE_SUPABASE_JWT_SECRET
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Mint a Supabase-compatible JWT for this user (HS256, short TTL).
 *
 * Deliberately email-keyed, with NO `sub`: most google_user_id values are not
 * uuid-format, and Supabase's auth.uid() casts sub::uuid (which would throw). The
 * RLS policies resolve the caller's identity from `email` (app_uid() maps email →
 * google_user_id), so email is all that's needed and there is no uuid landmine.
 */
export function mintSupabaseToken(email: string): string | null {
  if (!JWT_SECRET) return null
  return jwt.sign(
    {
      email,                  // -> auth.jwt()->>'email' : drives every RLS policy
      role: 'authenticated',  // the Postgres role PostgREST switches to
      aud: 'authenticated',
    },
    JWT_SECRET,
    { expiresIn: '5m' },
  )
}

/**
 * The DB client a request handler should use for student-data reads. When the net
 * is enabled it is scoped to the caller (RLS applies); otherwise it is the normal
 * service-role client. Either way, keep the in-handler roster scoping — it is the
 * primary guarantee and this is defense in depth.
 */
export function getScopedDb(ctx: { userId: string; email: string }): SupabaseClient {
  if (!RLS_ENABLED || !JWT_SECRET || !SUPABASE_URL || !ANON_KEY) return supabaseAdmin
  const token = mintSupabaseToken(ctx.email)
  if (!token) return supabaseAdmin
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** True when the per-user RLS net is active (for diagnostics / health checks). */
export function isRlsNetEnabled(): boolean {
  return RLS_ENABLED && !!JWT_SECRET && !!SUPABASE_URL && !!ANON_KEY
}
