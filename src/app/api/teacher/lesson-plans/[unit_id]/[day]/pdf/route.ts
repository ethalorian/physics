import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// LEGACY ENDPOINT. PDF export no longer runs headless Chromium server-side.
// This route now permanently redirects to the print view, which the teacher's
// browser turns into a PDF via its native "Save as PDF" dialog. Kept only so
// any old links/bookmarks to /pdf still resolve. Auth is enforced by /print.

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ unit_id: string; day: string }> },
) {
  const { unit_id, day } = await ctx.params
  const target = new URL(
    `/api/teacher/lesson-plans/${encodeURIComponent(unit_id)}/${encodeURIComponent(day)}/print`,
    request.url,
  )
  return NextResponse.redirect(target, 308)
}
