import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { buildLessonPlanHtml, findDay, resolveTracks } from '@/lib/lesson-plan-export'

// GET /api/teacher/lesson-plans/[unit_id]/[day]/print
// Returns the print-formatted lesson HTML (same envelope used for the old
// PDF export) with an auto-invoked window.print(). The teacher's browser
// handles "Save as PDF" — no headless Chromium, so nothing to crash in the
// serverless runtime. Opened in a new tab from the "PDF" button.

export const runtime = 'nodejs'

export const GET = withRole<{ unit_id: string; day: string }>(['admin', 'teacher'], async (request, ctx) => {
  const { unit_id: unitId, day: dayStr } = await ctx.params
  const day = Number(dayStr)
  if (!unitId || !Number.isFinite(day)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const tracks = await resolveTracks({ role: ctx.role, scopeEmail: ctx.scopeEmail })
  const plan = findDay(unitId, day, tracks)
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const html = buildLessonPlanHtml(unitId, plan, { forPdf: true })

  // Inject an auto-print trigger just before </body>. Wrapping print() in a
  // short timeout lets fonts settle before the print dialog opens.
  const withPrint = html.replace(
    '</body>',
    `<script>window.addEventListener('load', function () { setTimeout(function () { window.print() }, 250) })</script></body>`,
  )

  return new Response(withPrint, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-cache',
    },
  })
})
