import { withRole } from '@/lib/api-auth'
import { readingCourses, readingJson } from '@/lib/textbook-assignments-server'
import { isCatalogUnit } from '@/lib/retired-curriculum'
import { supabaseAdmin } from '@/lib/supabase'
import { plannerDay } from '@/lib/reading-planner'
import { assignmentBySlug } from '@/lib/interactive-assignments/catalog'
import { lessonTargets } from '@/lib/interactive-assignments/server'
import { savedUnitSequences, loadPlan, planCatalog, planRotation, planScope, planRows, planningData } from '@/lib/teaching-plans/server'
import { validDay, validMeeting, validateSteps, meetingsInRange, scheduleIssue } from '@/lib/teaching-plans/model'
import type { ClassPlan, TeachingSlot } from '@/lib/teaching-plans/types'
import { teachingAssignment } from '@/lib/teaching-plans/schedule-server'

export const GET = withRole(['teacher', 'admin'], async (req, ctx) => {
  const q = new URL(req.url).searchParams, from = q.get('from') ?? plannerDay(new Date())
  if(q.get('view')==='sequences'){const sequences=await savedUnitSequences(ctx,q.get('class')??'');return sequences?readingJson({sequences}):readingJson({error:'Choose one of your classes.'},403)}
  if (q.get('view') === 'classes') return readingJson({ courses: await readingCourses(ctx), readOnly: ctx.viewingAsTeacher })
  if (q.get('view') === 'scope') {
    const course = (await readingCourses(ctx)).find(c => c.id === q.get('class'))
    if (!course) return readingJson({ error: 'Choose one of your classes.' }, 403)
    const units = (await planRows<{ id: string; name: string; program: string }>('units', 'id,name,program', query => query.eq('program', course.program), 'order_index')).filter(isCatalogUnit)
    const { data, error } = await supabaseAdmin.from('section_pacing').select('current_unit_id').eq('course_id', course.id).maybeSingle()
    if (error) throw error
    return readingJson({ classId: course.id, units, unitId: units.find(u => u.id === data?.current_unit_id)?.id ?? units[0]?.id ?? null })
  }
  if (!validDay(from)) return readingJson({ error: 'Choose a valid calendar date.' }, 400)
  const scope = await planScope(ctx, q.get('class') ?? '', q.get('unit') ?? '')
  if (!scope) return readingJson({ error: 'Choose one of your classes and a unit from its course.' }, 404)
  if (q.get('view') === 'meetings') {
    const through = q.get('through') ?? ''
    if (!validDay(through) || through < from || Date.parse(through) - Date.parse(from) > 62 * 86400000) return readingJson({ error: 'Choose a calendar range of up to 63 days.' }, 400)
    const { calendar, pattern } = await planRotation(scope.course.id, scope.course.program)
    return readingJson({ meetings: meetingsInRange(calendar, pattern, from, through), issue: scheduleIssue(calendar, pattern) })
  }
  try { return readingJson(await planningData(ctx, scope, from)) }
  catch (error) { console.error('Teaching plan load failed', error); return readingJson({ error: 'The plan could not load. Please retry in a moment.' }, 503) }
})

const revision = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 0 && Number(value) < 2147483647
export const POST = withRole(['teacher', 'admin'], async (req, ctx) => {
  if (ctx.viewingAsTeacher) return readingJson({ error: 'Use your own teacher account to edit plans.' }, 403)
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object' || JSON.stringify(body).length > 300000 || !revision(body.version)) return readingJson({ error: 'Reload the plan before saving.' }, 400)
  const scope = await planScope(ctx, String(body.classId ?? ''), String(body.unitId ?? ''))
  if (!scope) return readingJson({ error: 'Class or unit unavailable.' }, 404)
  const plan = await loadPlan(scope)
  if (body.action === 'draft') {
    let steps
    try { steps = validateSteps(body.steps, (await planCatalog(ctx, scope)).catalog, plan?.steps ?? []) }
    catch (error) { return readingJson({ error: (error as Error).message }, 400) }
    const { data, error } = await supabaseAdmin.rpc('save_teaching_plan', { p_owner: scope.course.teacher_email, p_course: scope.course.id, p_unit: scope.unit.id, p_version: body.version, p_steps: steps, p_actor: ctx.email })
    if (error) return saveError(error)
    return readingJson({ plan: data })
  }
  if (!plan || !revision(body.planVersion)) return readingJson({ error: 'Save the shared sequence first.' }, 409)
  const payload: Record<string, unknown> = {}
  if (!['apply', 'meeting', 'schedule', 'unassign', 'position', 'assign'].includes(body.action)) return readingJson({ error: 'Unknown plan action.' }, 400)
  if (body.action !== 'apply') {
    const { data, error } = await supabaseAdmin.from('teaching_plan_classes').select('steps,version').eq('plan_id', plan.id).eq('course_id', scope.course.id).maybeSingle()
    if (error) throw error
    const state = data as Pick<ClassPlan, 'steps' | 'version'> | null
    const firstPlacement = body.action === 'schedule' && !state && body.version === 0
    const step = (firstPlacement ? plan.steps : state?.steps)?.find(s => s.id === body.stepId)
    if (!step || !firstPlacement && state?.version !== body.version) return readingJson({ error: 'This class plan changed. Reload before saving.' }, 409)
    payload.stepId = step.id
    if (body.action === 'unassign') {
      const expected = body.expected
      if (expected !== null && (!expected || typeof expected !== 'object' || Array.isArray(expected) || typeof expected.sourceId !== 'string' || expected.version !== null && !revision(expected.version) || ['dueAt', 'opensAt', 'closesAt'].some(key => expected[key] !== null && (typeof expected[key] !== 'string' || !Number.isFinite(Date.parse(expected[key])))))) return readingJson({ error: 'Reload the assignment before unassigning it.' }, 400)
      payload.expected = expected
    }
    if (body.action === 'meeting' || body.action === 'schedule') {
      const slot = body.slot as TeachingSlot | null
      const { calendar, pattern } = await planRotation(scope.course.id, scope.course.program)
      if (slot !== null && (!slot || typeof slot.block !== 'string' || !validMeeting(slot, calendar, pattern))) return readingJson({ error: 'Choose a meeting from this class’s saved schedule.' }, 400)
      payload.slot = slot === null ? null : { date: slot.date, block: slot.block }
      if (body.action === 'schedule') {
        if (!slot) return readingJson({ error: 'Choose a calendar day to assign this activity.' }, 400)
        try { Object.assign(payload, await teachingAssignment(ctx, scope.course, step.activityKey)) }
        catch (error) { return readingJson({ error: error instanceof Error ? error.message : 'This activity could not load. Please retry.' }, 409) }
      }
    }
    if (body.action === 'assign') {
      const lesson = step.activityKey.startsWith('interactive:') ? assignmentBySlug(step.activityKey.slice(12)) : null
      if (!lesson || scope.course.program !== 'physics') return readingJson({ error: 'Use this activity’s original assignment settings.' }, 400)
      if (body.dueOn !== null && !validDay(body.dueOn) || body.expectedDue !== null && !validDay(body.expectedDue) || body.expectedId !== null && !/^[0-9a-f-]{36}$/i.test(body.expectedId)) return readingJson({ error: 'Reload the deadline and choose a valid date.' }, 400)
      if (body.dueOn === null && body.expectedId === null) return readingJson({ error: 'Choose a calendar date to assign this activity.' }, 400)
      const targets = await lessonTargets(lesson)
      Object.assign(payload, { dueOn: body.dueOn, expectedId: body.expectedId, expectedDue: body.expectedDue, targetId: targets[0].id })
    }
  }
  const calendarAction = body.action === 'schedule' || body.action === 'unassign'
  const { data, error } = await supabaseAdmin.rpc(calendarAction ? body.action === 'schedule' ? 'schedule_teaching_activity' : 'unassign_teaching_activity' : 'change_teaching_class', { p_owner: scope.course.teacher_email, p_plan: plan.id, p_course: scope.course.id, p_plan_version: body.planVersion, p_version: body.version, ...(calendarAction ? {} : { p_action: body.action }), p_payload: payload, p_actor: ctx.email })
  return error ? saveError(error) : readingJson(data)
})
function saveError(error: { code?: string; message: string }) {
  if (error.code === 'P0001') return readingJson({ error: error.message }, 409)
  console.error('Teaching plan save failed', error)
  return readingJson({ error: 'The change could not be confirmed. Reload to check its saved state before trying again.' }, 503)
}
