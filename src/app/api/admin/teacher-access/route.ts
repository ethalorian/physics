import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { grantObserver, listRoleGrants, revokeRole } from '@/lib/roles'
import { ADMIN_EMAILS } from '@/lib/permissions'

// Admin-only: see and manage who has staff access.
//  - grants: DB-granted teachers/admins (from user_roles) — revocable here.
//  - builtinAdmins: hardcoded owners (permissions.ts) — always admins, NOT revocable
//    from the UI (they're the lock-out safety net).

export const GET = withRole('admin', async () => {
  const grants = await listRoleGrants()
  return NextResponse.json({ grants, builtinAdmins: ADMIN_EMAILS })
})

export const POST = withRole('admin', async (request, ctx) => {
  const body = (await request.json()) as { email?: string; action?: string }
  const email = (body.email ?? '').trim().toLowerCase()
  if (!email || (body.action !== 'revoke' && body.action !== 'grant-observer')) {
    return NextResponse.json({ error: 'email and action="revoke"|"grant-observer" are required' }, { status: 400 })
  }
  if (body.action === 'grant-observer') {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    }
    if (ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email)) {
      return NextResponse.json({ error: 'Built-in admins cannot be downgraded' }, { status: 400 })
    }
    await grantObserver(email, ctx.email)
    return NextResponse.json({ ok: true })
  }
  // Never revoke a built-in owner via this endpoint.
  if (ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email)) {
    return NextResponse.json({ error: 'Built-in admins cannot be revoked here' }, { status: 400 })
  }
  await revokeRole(email)
  return NextResponse.json({ ok: true })
})
