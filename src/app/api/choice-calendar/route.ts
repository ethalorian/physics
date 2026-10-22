import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { readingJson, readingStaff } from '@/lib/textbook-assignments-server'
import { choiceCatalog, choiceCourses, choiceGroupSuggestions, choiceSections, choiceSnapshot } from '@/lib/choice-calendar-server'
import { sourceKey, validateSection, type ChoiceOption, type ChoiceSection } from '@/lib/choice-calendar'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const bad = (message: string, status = 400) => readingJson({ error: message }, status)

export const GET = withAuth(async (req, ctx) => {
  const params = new URL(req.url).searchParams, courseId = params.get('class')
  if (courseId && !uuid.test(courseId)) return bad('Choose a valid class.')
  const courses = await choiceCourses(ctx)
  if (courseId && !courses.some(c => c.id === courseId)) return bad('Choose one of your Physics classes.', 403)
  if (params.get('catalog') === '1') {
    if (!readingStaff(ctx) || !courseId) return bad('Choose a class as its teacher.', 403)
    return readingJson(await choiceCatalog(ctx, courseId))
  }
  return readingJson(await choiceSnapshot(ctx, courseId))
})

export const POST = withAuth(async (req, ctx) => {
  if (ctx.viewingAsTeacher) return bad('Return to your own teacher account before changing the calendar.', 403)
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return bad('Choose a calendar action.')
  const staff = readingStaff(ctx), courses = await choiceCourses(ctx)
  if (!staff && ctx.realRole !== 'student') return bad('Sign in as an enrolled student or the class teacher.', 403)
  if (body.action === 'create' || body.action === 'update') {
    if (!staff) return bad('Only teachers can create choice sections.', 403)
    const course = courses.find(c => c.id === body.course_id)
    if (!course) return bad('Choose one of your Physics classes.', 403)
    if (typeof body.opens_at !== 'string' || typeof body.due_at !== 'string') return bad('Choose opening and deadline times.')
    const original = body.action === 'update' ? (await choiceSections([course.id], true)).find(s => s.id === body.section_id) : undefined
    if (body.action === 'update' && (!original || body.version !== original.version)) return bad('This section changed. Refresh before editing.', 409)
    if (!Array.isArray(body.options) || body.options.length < 1 || body.options.length > 40) return bad('Add 1–40 choices.')
    const catalog = await choiceCatalog(ctx, course.id), byKey = new Map(catalog.steps.map(s => [sourceKey(s), s]))
    const options: ChoiceOption[] = []
    if (original?.published || original?.published_at) options.push(...original.options)
    else for (const raw of body.options) {
      if (!raw || typeof raw.title !== 'string' || typeof raw.category !== 'string' || typeof raw.lab !== 'boolean' || !Array.isArray(raw.steps) || !Array.isArray(raw.targetIds)) return bad('Each choice needs a title, category, and activity list.')
      if (raw.title.length > 180 || raw.category.length > 60 || raw.steps.length > 20 || raw.targetIds.length > 20 || raw.targetIds.some((id: unknown) => typeof id !== 'string' || !catalog.targets.some(t => t.id === id))) return bad('Check the choice title, steps, and mastery targets.')
      const steps = []
      for (const key of raw.steps) {
        const step = byKey.get(key)
        if (!step) return bad('Use published activities available to the whole class. Release the assignment first.')
        steps.push({ ...step })
      }
      // Preserve native reading→quiz links automatically. They never add to the
      // choice completion count, but remain separate student obligations.
      for (const link of catalog.links.filter(l => raw.steps.includes(l.reading))) {
        const quiz = byKey.get(link.quiz)
        if (!quiz) return bad('Release the reading’s attached quiz before offering this choice.')
        const existing = steps.find(s => sourceKey(s) === link.quiz)
        if (existing) { existing.followUp = true; existing.prerequisite = link.reading }
        else steps.push({ ...quiz, followUp: true, prerequisite: link.reading })
      }
      options.push({ id: original?.options.some(o => o.id === raw.id) ? raw.id : crypto.randomUUID(), title: raw.title.trim(), category: raw.category.trim(), lab: raw.lab, steps, targetIds: [...new Set<string>(raw.targetIds)] })
    }
    const minimums = body.category_minimums
    if (!minimums || typeof minimums !== 'object' || Array.isArray(minimums) || Object.values(minimums).some(n => typeof n !== 'number')) return bad('Choose valid category requirements.')
    const section: ChoiceSection = { id: original?.id ?? crypto.randomUUID(), course_id: course.id, title: typeof body.title === 'string' ? body.title.trim() : '',
      opens_at: body.opens_at, due_at: body.due_at, required_count: body.required_count, category_minimums: minimums,
      points_per_choice: body.points_per_choice, options, published: false, version: 1 }
    // Published structure remains stable so past work and grades keep their meaning.
    if (original?.published_at || original?.published) {
      section.options = original.options; section.required_count = original.required_count
      section.category_minimums = original.category_minimums; section.points_per_choice = original.points_per_choice
    }
    const error = validateSection(section)
    if (error) return bad(error)
    const existing = await choiceSections([course.id], true)
    const used = new Set(existing.filter(s => s.id !== original?.id).flatMap(s => s.options.flatMap(o => o.steps.map(sourceKey))))
    if (section.options.some(o => o.steps.some(s => used.has(sourceKey(s))))) return bad('An activity is already used in another choice section. Reuse that section or create a separate assignment copy.')
    const saved = await supabaseAdmin.rpc('save_choice_section', { p_section: section.id, p_course: course.id, p_actor: course.teacher_email, p_version: original?.version ?? null, p_payload: section })
    if (saved.error) return bad(saved.error.code === 'P0001' ? saved.error.message : 'Could not save this section.', saved.error.code === 'P0001' ? 409 : 500)
    return readingJson(saved.data, 201)
  }
  if (!uuid.test(body.section_id ?? '')) return bad('Choose a valid choice section.')
  const section = (await choiceSections(courses.map(c => c.id), staff)).find(s => s.id === body.section_id)
  const course = courses.find(c => c.id === section?.course_id)
  if (!section || !course) return bad('Choice section unavailable.', 404)
  if (body.action === 'suggest-groups') {
    if (!staff) return bad('Only the teacher can view mastery grouping.', 403)
    if (!['similar', 'mixed'].includes(body.strategy) || typeof body.option_id !== 'string') return bad('Choose a lab and grouping strategy.')
    if (!section.options.some(o => o.id === body.option_id && o.lab && o.targetIds.length)) return bad('Choose mastery targets for this lab first.')
    return readingJson(await choiceGroupSuggestions(section, body.option_id, body.strategy))
  }
  if (!['publish', 'slots', 'cancel-slot', 'cancel-booking', 'select', 'plan-step', 'book', 'remove', 'complete-lab', 'grade', 'book-group'].includes(body.action)) return bad('Unsupported calendar action.')
  if (!staff && !['select', 'plan-step', 'book', 'remove', 'cancel-booking'].includes(body.action)) return bad('Only teachers can change this setting.', 403)
  const user = staff ? body.user_id ?? null : ctx.userId
  if (user !== null && !uuid.test(user)) return bad('Choose a valid student.')
  if (body.action === 'publish' && typeof body.published !== 'boolean') return bad('Choose a published state.')
  if (['select', 'plan-step', 'book', 'remove', 'cancel-booking', 'complete-lab', 'grade', 'book-group'].includes(body.action) && !section.options.some(o => o.id === body.option_id)) return bad('Choose an activity in this section.')
  if (['select', 'plan-step'].includes(body.action) && body.planned_on != null && (!/^\d{4}-\d{2}-\d{2}$/.test(body.planned_on) || !Number.isFinite(Date.parse(body.planned_on)) || new Date(body.planned_on).toISOString().slice(0, 10) !== body.planned_on)) return bad('Choose a valid calendar date.')
  if (body.action === 'plan-step' && !section.options.find(o => o.id === body.option_id)?.steps.some(s => s.id === body.step_id && !s.followUp)) return bad('Choose an activity from this choice. Attached quiz dates follow the assignment.')
  if (['book', 'cancel-slot', 'book-group'].includes(body.action) && !uuid.test(body.slot_id ?? '')) return bad('Choose a valid lab session.')
  if (body.action === 'book-group' && (!Array.isArray(body.student_ids) || !body.student_ids.length || body.student_ids.length > 4 || new Set(body.student_ids).size !== body.student_ids.length || body.student_ids.some((id: unknown) => typeof id !== 'string' || !uuid.test(id)))) return bad('Choose up to four different students.')
  if (body.action === 'grade' && body.score !== null && (typeof body.score !== 'number' || !Number.isFinite(body.score) || body.score < 0 || body.score > section.points_per_choice)) return bad('Enter a score within the activity’s points.')
  if (body.action === 'slots' && (!Array.isArray(body.slots) || !body.slots.length || body.slots.length > 40 || body.slots.some((s: Record<string, unknown>) => !s || !section.options.some(o => o.id === s.option_id && o.lab) || ![1, 2].includes(Number(s.group_number)) || !Number.isInteger(s.capacity) || Number(s.capacity) < 1 || Number(s.capacity) > 4 || typeof s.starts_at !== 'string' || typeof s.ends_at !== 'string' || !Number.isFinite(Date.parse(s.starts_at)) || !Number.isFinite(Date.parse(s.ends_at)) || Date.parse(s.ends_at) <= Date.parse(s.starts_at)))) return bad('Choose valid lab sessions with at most four seats per group.')
  const payload = { option_id: body.option_id, step_id: body.step_id, slot_id: body.slot_id, planned_on: body.planned_on ?? null, score: body.score, published: body.published, slots: body.slots, student_ids: body.student_ids }
  const saved = await supabaseAdmin.rpc('mutate_choice_calendar', { p_section: section.id, p_user: user, p_actor: staff ? course.teacher_email : ctx.email, p_teacher: staff, p_action: body.action, p_payload: payload })
  if (saved.error) return bad(saved.error.code === 'P0001' ? saved.error.message : 'Could not save the calendar change. Please refresh and retry.', saved.error.code === 'P0001' ? 409 : 500)
  return readingJson(saved.data)
})
