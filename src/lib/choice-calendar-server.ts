import 'server-only'
import { readingLibrary } from './reading-library-server'
import { readingTagForSource, type LibraryStep } from './activity-library'
import { isInteractiveReading } from './reading-availability'
import type { ReadingAssignment } from './textbook-assignments'
import { createHash } from 'node:crypto'
import { ALL_ASSIGNMENTS, submissionMatchesAssignment } from '@/lib/interactive-assignments/catalog'
import { supabaseAdmin } from '@/lib/supabase'
import type { AuthContext } from '@/lib/api-auth'
import { readingCourses, readingRows, readingStaff } from '@/lib/textbook-assignments-server'
import { releaseLessons } from '@/lib/lesson-release-server'
import { appliesToClass, lessonLabel, releaseStatus } from '@/lib/lesson-release'
import { summarizeWords, type VocabTask, type CheckRecord } from '@/lib/vocab-learning'
import { targetValue, type MasteryRecord } from '@/data/curriculum-types'
import { sectionProgress, sourceKey, suggestMasteryGroups, type ChoiceEvidenceMap, type ChoiceSection, type ChoiceSelection, type ChoiceStep, type GroupCandidate } from './choice-calendar'

export const choiceCourses = async (ctx: AuthContext) => (await readingCourses(ctx)).filter(c => (c.program ?? 'physics') === 'physics')
export type ChoiceSlot = { id: string; section_id: string; option_id: string; starts_at: string; ends_at: string; group_number: number; capacity: number; cancelled: boolean }
export type ChoiceBooking = { id: string; slot_id: string; section_id: string; option_id: string; user_id: string }
export type GradedSelection = ChoiceSelection & { score: number | null }
type Student = { id: string; name: string }
const rows = readingRows
export async function choiceSections(courseIds: string[], staff: boolean) {
  if (!courseIds.length) return []
  return rows<ChoiceSection>((a, b) => {
    let q = supabaseAdmin.from('choice_sections').select('*').in('course_id', courseIds)
    if (!staff) q = q.or('published.eq.true,published_at.not.is.null')
    return q.order('due_at', { ascending: false }).order('id').range(a, b)
  })
}
export async function choiceRoster(courseId: string): Promise<Student[]> {
  const roster = await rows<{ student_id: string; students: unknown }>((a, b) => supabaseAdmin.from('course_students').select('student_id,students(id,name)').eq('course_id', courseId).eq('enrollment_state', 'ACTIVE').order('id').range(a, b))
  return roster.flatMap(r => { const s = (Array.isArray(r.students) ? r.students[0] : r.students) as Student | null; return s ? [s] : [] })
}
export async function choiceCatalog(ctx: AuthContext, courseId: string) {
  const course = (await choiceCourses(ctx)).find(c => c.id === courseId)
  if (!course) throw Error('Choose one of your Physics classes.')
  const list = <T>(table: string, fields: string) => rows<T>((a, b) => supabaseAdmin.from(table).select(fields).eq('course_id', courseId).order('id').range(a, b) as never)
  const [lessons, windows, readings, quizzes, vocab, bundles, targets, interactive] = await Promise.all([
    releaseLessons(), list<{ lesson_id: string; open_at: string | null; close_at: string | null; due_at: string | null }>('lesson_class_windows', 'id,lesson_id,open_at,close_at,due_at'),
    list<ReadingAssignment>('textbook_assignments', '*'),
    list<{ id: string; title: string; status: string; deleted_at: string | null; due_at: string | null; student_ids: string[] | null }>('quiz_assignments', 'id,title,status,deleted_at,due_at,student_ids'),
    list<{ id: string; title: string; active: boolean; due_on: string | null; syllabus_draft: boolean; student_ids: string[] }>('vocab_tasks', 'id,title,active,due_on,syllabus_draft,student_ids'),
    rows<{ step_id: string; reading_id: string; reading_quiz_id: string }>((a, b) => supabaseAdmin.from('reading_syllabus_bundles').select('step_id,reading_id,reading_quiz_id').eq('course_id', courseId).order('step_id').range(a, b)),
    rows<{ id: string; statement: string; unit_id: string; slug: string; domain: string }>((a, b) => supabaseAdmin.from('learning_targets').select('id,statement,unit_id,slug,domain').eq('program', 'physics').order('id').range(a, b)),
    list<{ id: string; slug: string; due_on: string | null }>('interactive_assignments', 'id,slug,due_on'),
  ])
  const roster = await choiceRoster(courseId), allStudents = (ids: string[] | null) => !ids || roster.every(s => ids.includes(s.id))
  const steps: LibraryStep[] = []
  const add = (kind: ChoiceStep['kind'], sourceId: string, title: string, href: string, meta: Partial<LibraryStep> = {}) => steps.push({ ...meta, id: `${kind}:${sourceId}`, kind, sourceId, title, href, followUp: false })
  // Planning does not assign work. Missing calendar dates are installed atomically
  // when the teacher publishes the menu, alongside its choice availability.
  for (const l of lessons.filter(l => appliesToClass(l, { ...course, track: course.track ?? null }))) add('lesson', l.id, lessonLabel(l), '/lessons/' + l.slug, { unitIds: l.unit_id ? [l.unit_id] : [], targetIds: targets.filter(t => l.target_refs?.includes(t.id) || l.target_refs?.includes(t.slug)).map(t => t.id), format: l.reflection_kind === 'graphic-novel' ? 'graphic-novel' : l.video_sequence ? 'video' : 'lesson', chapter: l.chapter, book: l.reflection_kind === 'graphic-novel' ? '2026-XJ · Book One' : undefined, availability: windows.some(w => w.lesson_id === l.id && releaseStatus(w) === 'ended') ? 'Check access window' : 'Ready' })
  for (const r of readings.filter(r => isInteractiveReading(r) && (r.status === 'published' || r.status === 'draft' && bundles.some(b => b.reading_id === r.id)))) { const targetIds = [...new Set(r.questions.map(q => q.target_id))]; add('reading', r.id, r.title, '/readings/' + r.id, { unitIds: [...new Set(targets.filter(t => targetIds.includes(t.id)).map(t => t.unit_id))], targetIds, description: r.instructions, format: 'interactive-reading', readingTag: readingTagForSource(r), chapter: r.chapter, book: r.honors_reading ? 'OpenStax' : 'Hewitt', availability: r.status === 'draft' ? 'Draft · publishes with menu' : 'Ready' }) }
  for (const q of quizzes.filter(q => (q.status === 'published' || q.status === 'draft' && bundles.some(b => b.reading_quiz_id === q.id)) && !q.deleted_at && allStudents(q.student_ids))) add('quiz', q.id, q.title, '/quizzes/' + q.id)
  for (const v of vocab.filter(v => v.active && !v.syllabus_draft && allStudents(v.student_ids))) add('vocabulary', v.id, v.title, '/vocabulary/work?task_id=' + v.id)
  for (const step of steps) { const bundle=step.kind==='reading'?bundles.find(b=>b.reading_id===step.sourceId):null;step.planKey=bundle?'reading-template:'+bundle.step_id:sourceKey(step) }
  for (const activity of ALL_ASSIGNMENTS) {
    const target = targets.find(t => t.unit_id === activity.unit && t.slug === activity.targets[0])
    if (!target) continue
    const existing = interactive.find(a => a.slug === activity.slug)
    const hash = createHash('sha256').update(`choice:${courseId}:${activity.slug}`).digest('hex')
    const sourceId = existing?.id ?? `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`
    steps.push({ id: 'interactive:' + sourceId, kind: 'interactive', sourceId, title: activity.title, href: '/interactive-assignments/' + sourceId, followUp: false, planKey: 'interactive:' + activity.slug, assignmentSlug: activity.slug, targetId: target.id, targetIds: targets.filter(t => t.unit_id === activity.unit && activity.targets.includes(t.slug)).map(t => t.id), unitIds: [activity.unit], description: activity.targetNote, format: activity.simulation ? 'simulation' : 'interactive', availability: 'Ready' })
  }
  const readingTemplates = readingLibrary(course.track, targets).filter(t => !bundles.some(b => b.step_id === t.id)).map(t => ({ ...t, setupHref: '/admin/readings?view=syllabus&course_id=' + courseId + '&step_id=' + t.id }))
  const setupActivities = [...readings.filter(r => isInteractiveReading(r) && !steps.some(s => s.kind === 'reading' && s.sourceId === r.id)).map(r => ({ key:'reading:'+r.id, title:r.title, kind:'reading', format:'interactive-reading', readingTag:readingTagForSource(r), book:r.honors_reading?'OpenStax':'Hewitt', description:r.instructions, availability:r.status, unitIds:[...new Set(targets.filter(t=>r.questions.some(q=>q.target_id===t.id)).map(t=>t.unit_id))], targetIds:r.questions.map(q=>q.target_id), setupHref:'/admin/readings?course_id='+courseId+'&id='+r.id })), ...quizzes.filter(q=>!q.deleted_at && !steps.some(s=>s.kind==='quiz'&&s.sourceId===q.id)).map(q=>({key:'quiz:'+q.id,title:q.title,kind:'quiz',availability:q.status==='published'?'Selected students only':q.status,setupHref:'/admin/control-room?view=quizzes&class='+courseId+'&id='+q.id}))]
  return { steps, readingTemplates, setupActivities, links: bundles.map(b => ({ reading: 'reading:' + b.reading_id, quiz: 'quiz:' + b.reading_quiz_id })), targets }
}

/** Read native receipts in batches. No answer text leaves this module. */
export async function choiceEvidence(sections: ChoiceSection[], users: string[]): Promise<Record<string, ChoiceEvidenceMap>> {
  const result: Record<string, ChoiceEvidenceMap> = Object.fromEntries(users.map(id => [id, {}]))
  if (!users.length) return result
  const all = sections.flatMap(s => s.options.flatMap(o => o.steps)), ids = (kind: ChoiceStep['kind']) => [...new Set(all.filter(s => s.kind === kind).map(s => s.sourceId))]
  const put = (user: string, key: string, attempted: boolean, submitted: boolean, earned: number | null = null, possible: number | null = null) => {
    if (!result[user]) return
    const old = result[user][key]
    result[user][key] = { attempted: attempted || !!old?.attempted, submitted: submitted || !!old?.submitted, earned: earned ?? old?.earned ?? null, possible: possible ?? old?.possible ?? null }
  }
  await Promise.all((['reading', 'quiz'] as const).map(async kind => {
    const keys = ids(kind); if (!keys.length) return
    const column = kind === 'reading' ? 'assignment_id' : 'quiz_id', table = kind === 'reading' ? 'textbook_work' : 'quiz_work'
    const work = await rows<{ assignment_id?: string; quiz_id?: string; user_id: string; answers: Record<string, unknown>; submission_id: string | null }>((a, b) => supabaseAdmin.from(table).select(`${column},user_id,answers,submission_id`).in(column, keys).in('user_id', users).order(column).order('user_id').range(a, b) as never)
    work.forEach(w => put(w.user_id, kind + ':' + (w.assignment_id ?? w.quiz_id), Object.keys(w.answers ?? {}).length > 0 || !!w.submission_id, !!w.submission_id))
  }))
  const lessons = ids('lesson')
  const interactive = ids('interactive')
  if (interactive.length) {
    const [work, submissions, assignments] = await Promise.all([
      rows<{ assignment_id: string; user_id: string; version: number }>((a, b) => supabaseAdmin.from('interactive_assignment_work').select('assignment_id,user_id,version').in('assignment_id', interactive).in('user_id', users).order('assignment_id').order('user_id').range(a, b)),
      rows<{ assignment_id: string; user_id: string; state: unknown }>((a, b) => supabaseAdmin.from('interactive_assignment_submissions').select('assignment_id,user_id,state').in('assignment_id', interactive).in('user_id', users).order('id').range(a, b)),
      rows<{ id: string; slug: string }>((a, b) => supabaseAdmin.from('interactive_assignments').select('id,slug').in('id', interactive).order('id').range(a, b)),
    ])
    work.forEach(w => put(w.user_id, 'interactive:' + w.assignment_id, w.version > 0, false))
    submissions.forEach(w => { const activity = ALL_ASSIGNMENTS.find(a => a.slug === assignments.find(a => a.id === w.assignment_id)?.slug); put(w.user_id, 'interactive:' + w.assignment_id, true, !!activity && submissionMatchesAssignment(w.state, activity)) })
  }
  if (lessons.length) {
    await Promise.all(['block_responses', 'block_drafts', 'lesson_submissions', 'lesson_artifacts'].map(async table => {
      const receipts = await rows<{ lesson_id: string; user_id: string }>((a, b) => supabaseAdmin.from(table).select('lesson_id,user_id').in('lesson_id', lessons).in('user_id', users).order('lesson_id').order('user_id').range(a, b))
      receipts.forEach(r => put(r.user_id, 'lesson:' + r.lesson_id, true, table === 'lesson_submissions'))
    }))
  }
  const vocab = ids('vocabulary')
  if (vocab.length) {
    const [tasks, checks, attempts] = await Promise.all([
      rows<VocabTask>((a, b) => supabaseAdmin.from('vocab_tasks').select('*').in('id', vocab).order('id').range(a, b)),
      rows<CheckRecord & { task_id: string; user_id: string }>((a, b) => supabaseAdmin.from('vocab_checks').select('id,task_id,user_id,result,completed_at').in('task_id', vocab).in('user_id', users).order('id').range(a, b)),
      rows<{ task_id: string; user_id: string; submitted_at: string | null; answers: Record<string, unknown> }>((a, b) => supabaseAdmin.from('vocab_checkpoint_attempts').select('task_id,user_id,submitted_at,answers').in('task_id', vocab).in('user_id', users).order('id').range(a, b)),
    ])
    const terms = [...new Set(tasks.flatMap(t => t.term_ids))]
    const practice = terms.length ? await rows<{ user_id: string; term_id: string; created_at: string }>((a, b) => supabaseAdmin.from('vocab_attempts').select('user_id,term_id,created_at').in('term_id', terms).in('user_id', users).gte('created_at', tasks.map(t => t.created_at).sort()[0]).order('id').range(a, b)) : []
    for (const t of tasks) for (const user of users) {
      const c = checks.filter(c => c.task_id === t.id && c.user_id === user), a = attempts.filter(a => a.task_id === t.id && a.user_id === user)
      const practiced = practice.some(p => p.user_id === user && t.term_ids.includes(p.term_id) && Date.parse(p.created_at) >= Date.parse(t.created_at))
      put(user, 'vocabulary:' + t.id, practiced || c.some(c => !!c.completed_at || !!c.result?.length) || a.some(a => !!a.submitted_at || Object.keys(a.answers ?? {}).length > 0), t.quiz_format === 'checkpoint' ? a.some(a => !!a.submitted_at) : summarizeWords({ ...t, threshold: 0 }, c).complete)
    }
  }
  const simulations = ids('simulation')
  if (simulations.length) {
    const work = await rows<{ simulation_assignment_id: string; student_id: string; started_at: string | null; submitted_at: string | null; score: number | null; max_score: number | null }>((a, b) => supabaseAdmin.from('student_simulation_assignments').select('simulation_assignment_id,student_id,started_at,submitted_at,score,max_score').in('simulation_assignment_id', simulations).in('student_id', users).order('id').range(a, b))
    work.forEach(w => put(w.student_id, 'simulation:' + w.simulation_assignment_id, !!w.started_at || !!w.submitted_at, !!w.submitted_at, w.score, w.max_score))
  }
  return result
}

export async function choiceSnapshot(ctx: AuthContext, requestedClass: string | null) {
  const courses = await choiceCourses(ctx), staff = readingStaff(ctx)
  const courseIds = requestedClass ? courses.filter(c => c.id === requestedClass).map(c => c.id) : staff ? courses.slice(0, 1).map(c => c.id) : courses.map(c => c.id)
  if (requestedClass && !courseIds.length) throw Error('Choose one of your Physics classes.')
  const sections = await choiceSections(courseIds, staff), sectionIds = sections.map(s => s.id)
  const roster = staff && courseIds.length ? await choiceRoster(courseIds[0]) : [{ id: ctx.userId, name: 'You' }]
  const users = roster.map(s => s.id)
  const [selections, slots, bookings, evidence, targets] = await Promise.all([
    sectionIds.length && users.length ? rows<GradedSelection>((a, b) => supabaseAdmin.from('choice_selections').select('*').in('section_id', sectionIds).in('user_id', users).order('section_id').order('option_id').order('user_id').range(a, b)) : [],
    sectionIds.length ? rows<ChoiceSlot>((a, b) => supabaseAdmin.from('choice_lab_slots').select('id,section_id,option_id,starts_at,ends_at,group_number,capacity,cancelled').in('section_id', sectionIds).eq('cancelled', false).order('starts_at').order('id').range(a, b)) : [],
    sectionIds.length ? rows<ChoiceBooking>((a, b) => supabaseAdmin.from('choice_lab_bookings').select('id,slot_id,section_id,option_id,user_id').in('section_id', sectionIds).order('id').range(a, b)) : [],
    choiceEvidence(sections, users),
    rows<{id: string; statement: string}>((a,b) => supabaseAdmin.from('learning_targets').select('id,statement').eq('program','physics').order('id').range(a,b)),
  ])
  return { staff, readOnly: ctx.viewingAsTeacher || !!ctx.session.experience, courses, courseId: courseIds[0] ?? null, sections, roster,
    selections, targets, slots: slots.map(s => ({ ...s, booked: bookings.filter(b => b.slot_id === s.id).length, mine: bookings.some(b => b.slot_id === s.id && b.user_id === ctx.userId) })),
    bookings: staff ? bookings : bookings.filter(b => b.user_id === ctx.userId), evidence,
    progress: Object.fromEntries(users.map(user => [user, Object.fromEntries(sections.map(s => [s.id, sectionProgress(s, selections.filter(v => v.user_id === user && v.section_id === s.id), evidence[user], Date.now())]))])),
  }
}
export type ChoiceSnapshot = Awaited<ReturnType<typeof choiceSnapshot>>
export const choiceQuizDispositions = (courseIds: string[], users: string[]) => choiceSourceDispositions(courseIds, users, 'quiz')
export async function choiceSourceDispositions(courseIds: string[], users: string[], kind: ChoiceStep['kind']) {
  const sections = (await choiceSections(courseIds, false)).filter(s => s.options.some(o => o.steps.some(step => step.kind === kind)))
  const exemptions: Record<string, string[]> = {}, available: Record<string, string[]> = {}
  if (!sections.length || !users.length) return { exemptions, available }
  const [evidence, selections] = await Promise.all([
    choiceEvidence(sections, users),
    rows<ChoiceSelection>((a, b) => supabaseAdmin.from('choice_selections').select('*').in('section_id', sections.map(s => s.id)).in('user_id', users).order('section_id').order('option_id').order('user_id').range(a, b)),
  ])
  for (const section of sections) for (const user of users) {
    const progress = sectionProgress(section, selections.filter(s => s.section_id === section.id && s.user_id === user), evidence[user], Date.now())
    for (const option of progress.options) for (const step of option.option.steps.filter(s => s.kind === kind)) {
      if (option.grade === 'EX') (exemptions[step.sourceId] ??= []).push(user)
      else if (option.grade === 'available') (available[step.sourceId] ??= []).push(user)
    }
  }
  return { exemptions, available }
}
export async function choiceGroupSuggestions(section: ChoiceSection, optionId: string, strategy: 'similar' | 'mixed') {
  const option = section.options.find(o => o.id === optionId && o.lab)
  if (!option || !option.targetIds.length) throw Error('Choose a lab and its mastery targets first.')
  const roster = await choiceRoster(section.course_id)
  const [selections, booked, records] = await Promise.all([
    rows<ChoiceSelection>((a, b) => supabaseAdmin.from('choice_selections').select('*').eq('section_id', section.id).eq('option_id', optionId).eq('selected', true).order('user_id').range(a, b)),
    rows<ChoiceBooking>((a, b) => supabaseAdmin.from('choice_lab_bookings').select('*').eq('section_id', section.id).eq('option_id', optionId).order('id').range(a, b)),
    roster.length ? rows<{ user_id: string; target_id: string; level: 1 | 2 | 3; observed_at: string }>((a, b) => supabaseAdmin.from('mastery_records').select('user_id,target_id,level,observed_at').in('target_id', option.targetIds).in('user_id', roster.map(s => s.id)).order('id').range(a, b)) : [],
  ])
  const candidates: GroupCandidate[] = roster.filter(s => selections.some(c => c.user_id === s.id && !c.lab_completed_at) && !booked.some(b => b.user_id === s.id)).map(s => {
    const values = option.targetIds.flatMap(target => {
      const entries: MasteryRecord[] = records.filter(r => r.user_id === s.id && r.target_id === target).map(r => ({ studentId: s.id, targetId: target, level: r.level, observedAt: r.observed_at }))
      const value = targetValue(entries); return value === null ? [] : [value]
    })
    return { ...s, mastery: values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : null }
  })
  return suggestMasteryGroups(candidates, strategy)
}
