import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { getStudentClassIdentity } from '@/lib/student-class-identity'

export const GET = withAuth(async (_request, ctx) => {
  const classes = await getStudentClassIdentity(ctx.userId)
  return NextResponse.json({ classes }, { headers: { 'Cache-Control': 'private, no-store' } })
})
