import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { touchStaffPresence } from '@/lib/presence'

// POST /api/presence/ping — fired once per page load/navigation by the navbar for
// staff. Records "last seen" so the oversight dashboard can show who is currently
// active. No timers, no cron: it only runs when a page actually loads.
export const POST = withAuth(async (_req, ctx) => {
  if (ctx.realRole === 'admin' || ctx.realRole === 'teacher') {
    try { await touchStaffPresence(ctx.email) } catch { /* ignore */ }
  }
  return NextResponse.json({ ok: true })
})
