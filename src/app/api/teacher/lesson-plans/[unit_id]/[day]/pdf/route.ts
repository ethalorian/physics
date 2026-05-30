import { NextResponse } from 'next/server'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
import type { Browser } from 'puppeteer-core'
import { withRole } from '@/lib/api-auth'
import { buildLessonPlanHtml, findDay, resolveTracks } from '@/lib/lesson-plan-export'

// GET /api/teacher/lesson-plans/[unit_id]/[day]/pdf
// Server-side PDF generation via headless Chromium. Same authored bodyHtml as
// the docx + reader; we just render it with print CSS and capture page.pdf().
// @sparticuz/chromium ships a Vercel-compatible Chromium binary; puppeteer-core
// drives it. Both are Node-only (not edge).

export const runtime = 'nodejs'
// Cold starts of headless Chromium can take 5–10s. Give the route headroom.
export const maxDuration = 60

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

    let browser: Browser | null = null
    try {
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
        defaultViewport: chromium.defaultViewport,
      })
      const page = await browser.newPage()
      // Set the HTML directly — no network resources, so we don't wait for
      // load/networkidle (it'd just time out). `domcontentloaded` is enough.
      await page.setContent(html, { waitUntil: 'domcontentloaded' })
      const pdfBytes = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
      })

      const safeDay = String(day).padStart(2, '0')
      const filename = `${unitId}-day-${safeDay}.pdf`
      // puppeteer.pdf returns Uint8Array; cast to BodyInit for the Response.
      return new Response(pdfBytes as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'private, no-cache',
        },
      })
    } finally {
      if (browser) await browser.close().catch(() => undefined)
    }
})
