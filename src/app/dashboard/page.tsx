import { redirect } from 'next/navigation'

/**
 * The legacy student dashboard is retired (Surface 19): /home is the one
 * student home. The daily math task renders once, folded into /home's
 * Continue path; sign-in and auth-error callbacks land on /home directly.
 * The assignments feature it displayed was retired with it (2026-07) — no
 * student-facing assignment UI remains. The route stays as a redirect so old
 * links and bookmarks keep working. Subroutes (/dashboard/growth,
 * /dashboard/math-spine) are separate pages and still live.
 */
export default function DashboardRedirect() {
  redirect('/home')
}
