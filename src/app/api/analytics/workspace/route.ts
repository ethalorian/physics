import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { loadAnalytics } from '@/lib/analytics/server'

export const dynamic = 'force-dynamic'
export const GET = withAuth(async (request, ctx) => {
  // Use the effective role: an admin previewing a student/teacher must not leak global data.
  if (ctx.role !== 'admin' && ctx.role !== 'observer') return NextResponse.json({ error: 'Analytics requires an admin or observer account.' }, { status: 403 })
  const url = new URL(request.url), program = url.searchParams.get('program') ?? 'physics', days = Number(url.searchParams.get('days') ?? 90)
  if (!['physics', 'trades', 'projects'].includes(program) || ![7, 30, 90, 365].includes(days)) return NextResponse.json({ error: 'Choose a supported program and reporting period.' }, { status: 400 })
  return NextResponse.json(await loadAnalytics(program, days), { headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } })
})
