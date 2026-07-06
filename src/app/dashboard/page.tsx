import { redirect } from 'next/navigation'

/**
 * The legacy student dashboard is retired (Surface 19): /home is the one
 * student home. Its useful pieces were relocated —
 *  - assignments + deadlines + average grade → <AssignmentsPanel> on /home
 *  - the daily math task renders once, folded into /home's Continue path
 *  - sign-in and auth-error callbacks now land on /home directly
 * The route stays as a permanent redirect so old links and bookmarks keep
 * working.
 */
export default function DashboardRedirect() {
  redirect('/home')
}
