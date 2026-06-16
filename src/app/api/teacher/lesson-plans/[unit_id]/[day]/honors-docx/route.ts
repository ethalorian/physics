import { NextResponse } from 'next/server'
import HTMLtoDOCX from 'html-to-docx'
import { withRole } from '@/lib/api-auth'
import { findHonorsExtension, buildHonorsExtensionHtml } from '@/lib/honors-extension-export'

// GET /api/teacher/lesson-plans/[unit_id]/[day]/honors-docx
// The day's Honors Extension as a downloadable .docx, generated from the same
// shared envelope the CPA day plans use — identical Word formatting.

export const runtime = 'nodejs'

export const GET = withRole<{ unit_id: string; day: string }>(['admin', 'teacher'], async (_request, ctx) => {
  const { unit_id: unitId, day: dayStr } = await ctx.params
  const day = Number(dayStr)
  if (!unitId || !Number.isFinite(day)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const ext = findHonorsExtension(unitId, day)
  if (!ext) return NextResponse.json({ error: 'No honors extension for this day' }, { status: 404 })

  const html = buildHonorsExtensionHtml(unitId, ext)
  const docxBuffer = await HTMLtoDOCX(html, null, {
    title: `${ext.title} — Honors Extension`,
    orientation: 'portrait',
    margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
    font: 'Atkinson Hyperlegible',
    fontSize: 22,
    pageNumber: false,
    table: { row: { cantSplit: true } },
  })

  const safeDay = String(day).padStart(2, '0')
  const filename = `${unitId}-day-${safeDay}-honors-extension.docx`
  return new Response(docxBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-cache',
    },
  })
})
