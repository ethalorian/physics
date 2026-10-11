import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import worksheetDecks from '@/data/worksheet-decks.json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Staff-only projected solutions. Answer-bearing HTML never enters /public. */
export const GET = withAuth<{ unit: string; day: string }>(async (request, ctx) => {
  if (!['admin', 'teacher', 'observer'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { unit, day } = await ctx.params
  const track = request.nextUrl.searchParams.get('track') ?? 'honors'
  const deck = /^unit-[1-8]$/.test(unit) && /^\d{1,2}$/.test(day) && ['cpa', 'honors'].includes(track)
    ? worksheetDecks.find(item => item.unit === unit && item.day === Number(day) && item.track === track)
    : undefined
  if (!deck) return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
  const html = await readFile(path.join(process.cwd(), 'resources', 'worksheet-decks', 'generated', deck.file), 'utf8')
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
})
