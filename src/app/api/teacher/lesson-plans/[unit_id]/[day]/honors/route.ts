import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { findHonorsExtension, buildHonorsExtensionHtml } from '@/lib/honors-extension-export'

// GET /api/teacher/lesson-plans/[unit_id]/[day]/honors
// The day's Honors Extension as print-ready HTML with an auto-print trigger —
// the teacher's browser handles "Save as PDF" (no headless Chromium). Mirrors
// the CPA plan's /print route. Returns 404 when no honors extension exists.

export const runtime = 'nodejs'

export const GET = withRole<{ unit_id: string; day: string }>(['admin', 'teacher'], async (_request, ctx) => {
  const { unit_id: unitId, day: dayStr } = await ctx.params
  const day = Number(dayStr)
  if (!unitId || !Number.isFinite(day)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const ext = findHonorsExtension(unitId, day)
  if (!ext) return NextResponse.json({ error: 'No honors extension for this day' }, { status: 404 })

  const html = buildHonorsExtensionHtml(unitId, ext, { forPdf: true }).replace(
    '</body>',
    `<script>window.addEventListener('load', function () { setTimeout(function () { window.print() }, 250) })</script></body>`,
  )

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-cache' },
  })
})
