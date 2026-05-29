import { NextRequest, NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import { auth } from '@/lib/auth'
import { getEffectiveContext } from '@/lib/effective-context'
import { requireEnrolledStudent } from '@/lib/student-enrollment'
import type { UserRole } from '@/lib/permissions'

/**
 * API route authorization wrappers.
 *
 * Why this exists: authorization used to be hand-rolled in every route
 * (`await auth()` → null check → `getUserRole`/`getEffectiveContext` → role
 * check → inline try/catch). That made it trivial to ship a route that forgot
 * the session check or the role gate — which is exactly how the earlier
 * unauthenticated and IDOR bugs happened. These wrappers make the protection a
 * property of how the handler is exported, so it cannot be silently omitted.
 *
 *   export const GET  = withAuth(async (req, ctx) => { ... })            // any signed-in user
 *   export const POST = withRole('admin', async (req, ctx) => { ... })   // admin only
 *   export const PUT  = withRole(['teacher', 'admin'], handler)          // teacher OR admin
 *   export const POST = withEnrolledStudent(async (req, ctx) => { ... }) // enrolled student write
 *
 * Every wrapper:
 *   - returns 401 if there is no valid session,
 *   - builds a typed AuthContext from getEffectiveContext (so "view as teacher"
 *     and DB-granted roles are respected everywhere),
 *   - catches thrown errors and returns a generic 500 (raw DB/internal messages
 *     are logged server-side, never returned to the client),
 *   - preserves the Next 15 route context, including `params` (a Promise).
 *
 * Roster scoping (which student a teacher may see) is intentionally NOT done
 * here — it is request-specific. Use the helpers in `@/lib/teacher-scope`
 * (resolveTargetStudent / getTeacherStudentGids) inside the handler.
 */

export interface AuthContext<P = Record<string, string>> {
  /** The full NextAuth session (guaranteed non-null inside a wrapped handler). */
  session: Session
  /** session.user.id — the Google user id used as the key on all work tables. */
  userId: string
  /** session.user.email. */
  email: string
  /** Effective role: an admin "viewing as teacher" sees role === 'teacher'. */
  role: UserRole
  /** The caller's true role, ignoring any "view as" downgrade. */
  realRole: UserRole
  /** Email to scope teacher-owned data by (the impersonated teacher when viewing-as). */
  scopeEmail: string
  /** True when an admin is previewing the app as a teacher. */
  viewingAsTeacher: boolean
  /** The Next route context params (Promise). `await ctx.params` to read them. */
  params: Promise<P>
}

type Handler<P> = (
  request: NextRequest,
  ctx: AuthContext<P>,
) => Promise<Response> | Response

// Next 15 ALWAYS passes the route context as the second argument, with `params`
// as a Promise. Next's route-type validator requires this argument to be a
// required (non-undefined) type whose params value type accepts its SegmentParams
// (`string | string[] | undefined`) for both static and dynamic segments — so we
// type it broadly here. AuthContext re-exposes params as Promise<P> for ergonomic
// typing inside handlers.
type NextRouteContext = { params: Promise<Record<string, string | string[] | undefined>> }

const EMPTY_PARAMS = Promise.resolve({})

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

/**
 * Require a valid session. The handler receives a fully-populated AuthContext.
 */
export function withAuth<P extends Record<string, string> = Record<string, string>>(
  handler: Handler<P>,
) {
  return async function (
    request: NextRequest,
    routeCtx: NextRouteContext,
  ): Promise<Response> {
    try {
      const session = await auth()
      if (!session?.user?.email || !session?.user?.id) {
        return unauthorized()
      }

      const ec = await getEffectiveContext(session.user.email)
      const ctx: AuthContext<P> = {
        session,
        userId: session.user.id,
        email: session.user.email,
        role: ec.role,
        realRole: ec.realRole,
        scopeEmail: ec.scopeEmail,
        viewingAsTeacher: ec.viewingAsTeacher,
        params: ((routeCtx?.params ?? EMPTY_PARAMS) as unknown) as Promise<P>,
      }

      return await handler(request, ctx)
    } catch (err) {
      console.error(`[api] ${request.method} ${request.nextUrl?.pathname ?? ''} failed:`, err)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

/**
 * Require a valid session AND one of the allowed roles. Admins (by real role)
 * always pass — they are a superset — so an admin "viewing as teacher" is never
 * locked out of admin tooling.
 */
export function withRole<P extends Record<string, string> = Record<string, string>>(
  roles: UserRole | UserRole[],
  handler: Handler<P>,
) {
  const allowed = Array.isArray(roles) ? roles : [roles]
  return withAuth<P>(async (request, ctx) => {
    const isAllowed = ctx.realRole === 'admin' || allowed.includes(ctx.role)
    if (!isAllowed) return forbidden()
    return handler(request, ctx)
  })
}

/**
 * Require a valid session AND, for students, an active class enrollment. Staff
 * (teacher/admin) bypass the enrollment gate. Use on student-write endpoints.
 */
export function withEnrolledStudent<P extends Record<string, string> = Record<string, string>>(
  handler: Handler<P>,
) {
  return withAuth<P>(async (request, ctx) => {
    const gate = await requireEnrolledStudent(ctx.userId, ctx.realRole)
    if (gate) return gate
    return handler(request, ctx)
  })
}
