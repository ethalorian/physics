import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { evidenceWithLinks } from '@/lib/lesson-evidence-links'
import { buildLessonSignals, type Target, type Resp, type Rec, type Calibration } from '@/lib/lesson-signals'

// O-1/O-2, SEI-10: descriptive, read-only comparisons. Never assign mastery.
const PAGE = 500
async function pages<T>(read: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await read(from, from + PAGE - 1)
    if (error) throw error
    if (!Array.isArray(data)) throw new Error('Invalid analytics query response')
    rows.push(...data as T[])
    if (data.length < PAGE) return rows
  }
}
export const GET = withAuth(async (request, ctx) => {
  if (ctx.role !== 'admin' && ctx.role !== 'observer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const unit = new URL(request.url).searchParams.get('unit')
  try {
    const asOf = new Date().toISOString()
    const targets = await pages<Target>((from, to) => {
      let query = supabaseAdmin.from('learning_targets').select('id, slug, statement, unit_id').order('id').range(from, to)
      if (unit && unit !== 'all') query = query.eq('unit_id', unit)
      return query
    })
    const responses: Resp[] = [], records: Rec[] = [], calibration: Calibration[] = []
    if (targets.length) {
      // Read all evidence, including historically untargeted rows, then apply authoritative
      // repairs before scope filtering. Page each overlay call to stay below API row limits.
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabaseAdmin.from('block_responses')
          .select('id, user_id, lesson_id, block_id, session_id, present_session_id, poll_run_id, target_id, evidence_source, confidence, scaffolds_used, response, created_at')
          .lte('created_at', asOf).order('id').range(from, from + PAGE - 1)
        if (error) throw error
        if (!data) throw new Error('Missing analytics evidence')
        const linked = await evidenceWithLinks(data as Resp[])
        responses.push(...linked)
        if (data.length < PAGE) break
      }
      for (let offset = 0; offset < targets.length; offset += 100) {
        const ids = targets.slice(offset, offset + 100).map((target) => target.id)
        const [rated, calibrated] = await Promise.all([
          pages<Rec>((from, to) => supabaseAdmin.from('mastery_records').select('id, user_id, target_id, level, observed_at').in('target_id', ids).order('id').range(from, to)),
          pages<Calibration>((from, to) => supabaseAdmin.from('mastery_calibration').select('user_id, target_id, delta').in('target_id', ids).not('delta', 'is', null).order('user_id').order('target_id').range(from, to)),
        ])
        records.push(...rated); calibration.push(...calibrated)
      }
    }
    return NextResponse.json({ ...buildLessonSignals(targets, responses, records, calibration), readOnly: ctx.role === 'observer' })
  } catch (error) {
    console.error('Lesson signals query failed', error)
    return NextResponse.json({ error: 'Could not load lesson signals. Please retry.' }, { status: 500 })
  }
})
