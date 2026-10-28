import { timingSafeEqual } from 'node:crypto'
import { runAutomaticGrading } from '@/lib/assessment-results/automatic-server'
export const maxDuration = 300
export const dynamic = 'force-dynamic'
// eslint-disable-next-line no-restricted-syntax -- Vercel Cron authenticates with a constant-time server secret check, not a browser session.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const supplied = request.headers.get('authorization') ?? ''
  const expected = secret ? `Bearer ${secret}` : ''
  if (!secret || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try { return Response.json(await runAutomaticGrading(), { headers: { 'Cache-Control': 'private, no-store' } }) }
  catch { console.error('[automatic-grading] Worker could not finish; queued work is retained.'); return Response.json({ error: 'Automatic grading needs attention.' }, { status: 503 }) }
}
