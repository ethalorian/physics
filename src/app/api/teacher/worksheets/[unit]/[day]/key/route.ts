import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { dailyWorksheet } from '@/lib/daily-worksheets'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withAuth<{ unit: string; day: string }>(async (_request, ctx) => {
  if (!['admin', 'teacher', 'observer'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const params = await ctx.params
  const day = Number(params.day)
  const worksheet = /^\d{1,2}$/.test(params.day) ? dailyWorksheet(params.unit, day) : null
  if (!worksheet) return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 })
  const filename = `day-${String(worksheet.day).padStart(2, '0')}.pdf`
  const bytes = await readFile(path.join(process.cwd(), 'resources', 'worksheet-keys', `unit-${worksheet.unit}`, filename))
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="unit-${worksheet.unit}-day-${worksheet.day}-teacher-key.pdf"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
})
