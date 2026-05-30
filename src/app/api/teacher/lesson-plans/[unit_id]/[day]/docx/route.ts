import { NextResponse } from 'next/server'
import HTMLtoDOCX from 'html-to-docx'
import { withRole } from '@/lib/api-auth'
import { buildLessonPlanHtml, findDay, resolveTracks } from '@/lib/lesson-plan-export'

// GET /api/teacher/lesson-plans/[unit_id]/[day]/docx
// Returns a downloadable .docx of a single day's lesson plan, generated from
// the same authored bodyHtml the in-app reader uses. Teachers can print or
// keep a copy offline. Same authorization gate as the reader route.
//
// html-to-docx runs in Node.js (not edge).

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

    const html = buildLessonPlanHtml(unitId, plan)
    const docxBuffer = await HTMLtoDOCX(html, null, {
      title: plan.title,
      orientation: 'portrait',
      margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1 inch (twips)
      font: 'Atkinson Hyperlegible',
      fontSize: 22, // 11pt (units are half-points)
      pageNumber: false,
      table: { row: { cantSplit: true } },
    })

    const safeDay = String(day).padStart(2, '0')
    const filename = `${unitId}-day-${safeDay}.docx`
    // Cast Buffer (which is Uint8Array-compatible) to BodyInit. In Node runtime
    // both `Response` and `NextResponse` accept it; the cast satisfies TS.
    return new Response(docxBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache',
      },
    })
})
