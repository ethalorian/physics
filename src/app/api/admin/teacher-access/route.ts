import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { listRoleGrants, revokeRole } from '@/lib/roles'
import { ADMIN_EMAILS } from '@/lib/permissions'

// Admin-only: see and manage who has staff access.
//  - grants: DB-granted teachers/admins (from user_roles) — revocable here.
//  - builtinAdmins: hardcoded owners (permissions.ts) — always admins, NOT revocable
//    from the UI (they're the lock-out safety net).

export const GET = withRole('admin', async () => {
  const grants = await listRoleGrants()
  return NextResponse.json({ grants, builtinAdmins: ADMIN_EMAILS })
})

export const POST = withRole('admin', async (request) => {
  const body = (await request.json()) as { email?: string; action?: string }
  const email = (body.email ?? '').trim().toLowerCase()
  if (!email || body.action !== 'revoke') {
    return NextResponse.json({ error: 'email and action="revoke" are required' }, { status: 400 })
  }
  // Never revoke a built-in owner via this endpoint.
  if (ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email)) {
    return NextResponse.json({ error: 'Built-in admins cannot be revoked here' }, { status: 400 })
  }
  await revokeRole(email)
  return NextResponse.json({ ok: true })
})
