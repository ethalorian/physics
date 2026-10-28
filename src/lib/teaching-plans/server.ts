import 'server-only'
import { worksheetPlanCatalog } from './worksheets-server'
import { lessonLibraryFormat, readingTagForSource } from '@/lib/activity-library'
import { readingLibrary } from '@/lib/reading-library-server'
import { isInteractiveReading } from '@/lib/reading-availability'
import type { ReadingAssignment } from '@/lib/textbook-assignments'
import type { SavedUnitSequence } from './types'
import { supabaseAdmin } from '@/lib/supabase'
import { readingCourses, readingRows } from '@/lib/textbook-assignments-server'
import type { AuthContext } from '@/lib/api-auth'
import { ALL_ASSIGNMENTS } from '@/lib/interactive-assignments/catalog'
import { MISSIONS } from '@/lib/math-missions/catalog'
import { vocabularyFor } from '@/lib/vocab-scope-server'
import { releaseLessons } from '@/lib/lesson-release-server'
import { effectiveTrack } from '@/lib/track-visibility'
import { appliesToClass } from '@/lib/lesson-release'
import { classDayTool } from '@/lib/class-day-tools'
import { deckForDay } from '@/data/lesson-decks'
import { patternFromRow, asProgram } from '@/lib/pacing-server'
import type { RotationCalendar } from '@/lib/rotation'
import { meetingOptions, scheduleIssue } from './model'
import type { ClassPlan, PlanActivity, PlanningData, UnitPlan } from './types'

type Query = ReturnType<ReturnType<typeof supabaseAdmin.from>['select']>
export function planRows<T>(table: string, fields: string, filter: (q: Query) => Query = q => q, order = 'id') {
  return readingRows<T>((a, b) => filter(supabaseAdmin.from(table).select(fields)).order(order).range(a, b) as unknown as PromiseLike<{ data: T[] | null; error: unknown }>)
}
const planningTrack = (course: {program: string; track?: string | null}) => course.program === 'physics' ? effectiveTrack(course.track) : course.track ?? ''
export async function planScope(ctx: AuthContext, classId: string, unitId: string) {
  const owned = await readingCourses(ctx), course = owned.find(c => c.id === classId)
  if (!course) return null
  const { data: unit, error } = await supabaseAdmin.from('units').select('id,name,program').eq('id', unitId).eq('program', course.program).maybeSingle()
  if (error) throw error
  if (!unit) return null
  const courses = owned.filter(c => c.teacher_email === course.teacher_email && c.program === course.program && planningTrack(c) === planningTrack(course))
  return { course, courses, unit }
}
export async function loadPlan(scope: NonNullable<Awaited<ReturnType<typeof planScope>>>) {
  const { data, error } = await supabaseAdmin.from('teaching_unit_plans').select('id,version,steps,updated_at').eq('owner_email', scope.course.teacher_email).eq('program', scope.course.program).eq('track', planningTrack(scope.course)).eq('unit_id', scope.unit.id).maybeSingle()
  if (error) throw error
  return data as UnitPlan | null
}
export async function planRotation(courseId: string, program: string) {
  const [calendar, schedule] = await Promise.all([
    supabaseAdmin.from('rotation_calendar').select('anchor_date,anchor_p1_block,no_school_dates,cycle_offset,alt_week_anchor').eq('id', 'default').maybeSingle(),
    supabaseAdmin.from('section_schedules').select('blocks,block,week_pattern,on_week_anchor,on_week_dates').eq('course_id', courseId).maybeSingle(),
  ])
  if (calendar.error || schedule.error) throw calendar.error || schedule.error
  const cal: RotationCalendar = { anchor_date: null, anchor_p1_block: null, ...calendar.data, no_school_dates: calendar.data?.no_school_dates ?? [], cycle_offset: calendar.data?.cycle_offset ?? 0 }
  return { calendar: cal, pattern: patternFromRow(schedule.data, asProgram(program)) }
}
export async function planCatalog(ctx: AuthContext, scope: NonNullable<Awaited<ReturnType<typeof planScope>>>) {
  const warnings: string[] = [], catalog: PlanActivity[] = []
  const targets = await planRows<PlanningData['targets'][number]>('learning_targets', 'id,slug,statement,unit_id', q => q.eq('program', scope.course.program))
  const targetMap = new Map(targets.map(t => [t.id, t])), bySlug = new Map(targets.map(t => [t.slug, t.id]))
  catalog.push(...worksheetPlanCatalog(scope.course, targets))
  const ids = scope.courses.map(c => c.id), context = `class=${encodeURIComponent(scope.course.id)}&unit=${encodeURIComponent(scope.unit.id)}`
  if (scope.course.program === 'physics') for (const a of ALL_ASSIGNMENTS) {
    const deck = deckForDay(a.unit, a.day, scope.course.track ?? 'cpa')
    const tool = a.simulation || !classDayTool(a.unit,a.day) ? a.toolHref : `/admin/teacher/tools/${a.day}?unit=${a.unit}&class=${encodeURIComponent(scope.course.id)}`
    catalog.push({ key: 'interactive:' + a.slug, sourceId: a.slug, title: a.title, kind: a.simulation ? 'simulation' : 'interactive', unitIds: [a.unit], targetIds: a.targets.flatMap(slug => bySlug.has(slug) ? [bySlug.get(slug)!] : []), description: a.sections[0]?.learn || a.targetNote, prompts: a.questions.slice(0, 3).map(q => q.prompt), minutes: a.minutes ?? null, href: '/interactive-assignments/' + a.slug, setupHref: `/admin/interactive-assignments?${context}&activity=${a.slug}&plan=1`, teach: [...(deck && !a.transferBrief ? [{ label: 'Deck', href: deck.src }] : []), { label: a.transferBrief ? 'Open brief' : a.simulation ? 'Simulation' : 'Teaching tool', href: a.transferBrief ? '/interactive-assignments/'+a.slug : tool }], scheduling: 'interactive', availability: 'Ready to assign' })
  }
  if(scope.course.program==='physics') for(const reading of readingLibrary(scope.course.track,targets)) catalog.push({...reading,key:'reading-template:'+reading.id,sourceId:reading.id,kind:'reading',unitIds:reading.unitIds??[],targetIds:reading.targetIds??[],description:reading.description??'',prompts:[],minutes:null,href:'/readings/preview?course_id='+scope.course.id+'&step_id='+reading.id,setupHref:'/admin/readings?view=syllabus&course_id='+scope.course.id+'&step_id='+reading.id,teach:[],scheduling:'source',availability:'Prepare a class reading'})
  const sources: [string, () => Promise<PlanActivity[]>][] = [
    ...(['quiz', 'reading'] as const).map(kind => [kind === 'quiz' ? 'Quizzes' : 'Readings', async () => {
      type Row = { kind?: string; daily_sequence_key?: string | null; id: string; course_id: string; title: string; status: string; chapter:number; section_ids:string[]; honors_reading:ReadingAssignment['honors_reading']; passage:string|null; questions: { prompt: string; reference?: string; target_id: string }[] }
      const rows: Row[] = []
      for (let start = 0; start < ids.length; start += 100) rows.push(...await planRows<Row>(kind === 'quiz' ? 'quiz_assignments' : 'textbook_assignments', kind==='reading'?'id,course_id,title,status,questions,chapter,section_ids,honors_reading,passage':'id,course_id,title,status,questions,kind,daily_sequence_key', q => {
        const query = q.in('course_id', ids.slice(start, start + 100)).neq('status', 'archived')
        return kind === 'quiz' ? query.is('deleted_at', null) : query
      }))
      return rows.filter(a => kind !== 'reading' || isInteractiveReading(a)).map(a => ({ key: kind + ':' + a.id, sourceId: a.id, kind, quizSchedule: kind === 'quiz' ? (a.daily_sequence_key ? 'daily' as const : a.kind === 'vocabulary' ? 'vocabulary' as const : 'regular' as const) : undefined, format:kind==='reading'?'interactive-reading':kind, ...(kind==='reading'?{readingTag:readingTagForSource(a),book:a.honors_reading?'OpenStax':'Hewitt'}:{}), title: a.title, courseId: a.course_id, unitIds: [...new Set(a.questions.flatMap(q => targetMap.get(q.target_id)?.unit_id ? [targetMap.get(q.target_id)!.unit_id] : []))], targetIds: [...new Set(a.questions.map(q => q.target_id))], prompts: a.questions.slice(0, 3).map(q => q.prompt || q.reference || ''), description: kind === 'reading' ? 'Reading assignment. Manage linked reading, practice, and quiz dates in its original settings.' : 'A class quiz. Open its settings to prepare copies for other classes.', minutes: null, href: `/admin/control-room?view=${kind === 'quiz' ? 'quizzes' : 'readings'}&class=${a.course_id}&id=${a.id}`, setupHref: kind === 'reading' ? `/admin/readings?view=syllabus&course_id=${a.course_id}` : `/admin/control-room?view=quizzes&class=${a.course_id}&id=${a.id}`, teach: [], scheduling: 'source' as const, availability: a.status === 'draft' ? 'Draft · finish setup' : `Assigned in ${scope.courses.find(c => c.id === a.course_id)?.section || 'its source class'}` }))
    }] as [string, () => Promise<PlanActivity[]>]),
    ['Vocabulary', async () => (await vocabularyFor(ctx, { courseId: scope.course.id, authoring: true })).sets.map(s => ({ key: 'vocabulary:' + s.id, sourceId: s.id, kind: 'vocabulary' as const, title: s.name, unitIds: s.unit_id ? [s.unit_id] : [], targetIds: s.target_ids, description: `${s.term_ids.length} words${s.teachingConnection ? ' · ' + s.teachingConnection.label : ''}`, prompts: [], minutes: null, href: '/vocabulary/matching?set_id=' + s.id, setupHref: '/admin/vocabulary/tasks?' + context + '&set_id=' + s.id, teach: s.teachingConnection ? [{ label: 'Teaching material', href: s.teachingConnection.href }] : [], scheduling: 'source' as const, availability: 'Choose words, students, and deadline in vocabulary setup' }))],
    ['Videos and lessons', async () => (await releaseLessons()).filter(l => appliesToClass(l, { program: scope.course.program, track: scope.course.track ?? null })).map(l => ({ key: 'lesson:' + l.id, sourceId: l.id, kind: l.video_sequence ? 'video' as const : 'lesson' as const, title: l.title, unitIds: l.unit_id ? [l.unit_id] : [], targetIds: targets.filter(t => l.target_refs?.includes(t.id) || l.target_refs?.includes(t.slug)).map(t => t.id), format: lessonLibraryFormat(l), chapter: l.chapter, book: l.reflection_kind === 'graphic-novel' ? '2026-XJ · Book One' : undefined, description: l.reflection_kind === 'graphic-novel' ? 'Read the chapter and answer the questions using a scene or panel.' : 'Current published material. Manage student access and deadlines with Assigned work.', prompts: l.prompts ?? [], minutes: null, href: '/lessons/' + l.slug, setupHref: '/admin/control-room?view=assignments&' + context + '&workStatus=unassigned&workSearch=' + encodeURIComponent(l.title), teach: [{ label: 'Open lesson', href: '/lessons/' + l.slug }], scheduling: 'source' as const, availability: 'Set class access in Assigned work' }))],
  ]
  const results = await Promise.allSettled(sources.map(([, load]) => load()))
  results.forEach((r, i) => { if (r.status === 'fulfilled') catalog.push(...r.value); else { console.error('Planning catalog source failed', sources[i][0], r.reason); warnings.push(`${sources[i][0]} could not load. Other activities remain available.`) } })
  if (scope.course.program === 'physics') for (const slug of ['unit-1', 'unit-1-honors']) {
    if (slug.endsWith('honors') && scope.course.track !== 'honors') continue
    catalog.push({ key: 'review:' + slug, sourceId: slug, kind: 'review', title: slug.endsWith('honors') ? 'Unit 1 Honors review' : 'Unit 1 review', unitIds: ['unit-1'], targetIds: [], description: 'Interactive review. Choose participating classes and its access code in review settings.', prompts: [], minutes: null, href: '/review/' + slug, setupHref: '/admin/control-room?view=reviews&' + context + '&id=' + slug, teach: [], scheduling: 'source', availability: 'Review settings · no individual due-date support' })
  }
  for (const m of MISSIONS) catalog.push({ key: 'math:' + m.slug, sourceId: m.slug, kind: 'math', title: m.name, unitIds: [], targetIds: [], description: m.description, prompts: [m.verb], minutes: null, href: '/arcade/missions/' + m.slug, setupHref: '/admin/control-room?view=math&' + context, teach: [{ label: 'Open mission', href: '/arcade/missions/' + m.slug }], scheduling: 'source', availability: 'Choose a student and competency in Math' })
  return { catalog, targets, warnings }
}
export async function planningData(ctx: AuthContext, scope: NonNullable<Awaited<ReturnType<typeof planScope>>>, from: string): Promise<PlanningData> {
  const [plan, library] = await Promise.all([loadPlan(scope), planCatalog(ctx, scope)])
  const states = plan ? await planRows<ClassPlan>('teaching_plan_classes', 'course_id,plan_version,version,steps,meetings,current_step_id,confirmed_at', q => q.eq('plan_id', plan.id).in('course_id', scope.courses.map(c => c.id)), 'course_id') : []
  const classes = await Promise.all(scope.courses.map(async c => {
    let issue: string | null = null, meetings: PlanningData['classes'][number]['meetings'] = []
    try { const { calendar, pattern } = await planRotation(c.id, c.program); issue = scheduleIssue(calendar, pattern); meetings = meetingOptions(calendar, pattern, from) } catch { issue = 'The saved class schedule could not load. Retry before placing activities.' }
    return { id: c.id, label: c.name + (c.section ? ' · ' + c.section : ''), scheduleIssue: issue, meetings, state: states.find(s => s.course_id === c.id) ?? null }
  }))
  // Failure here must not look like "unassigned"; do not offer date writes on incomplete inventory.
  const assignments = scope.course.program === 'physics' ? await planRows<PlanningData['assignments'][number]>('interactive_assignments', 'id,course_id,slug,due_on', q => q.in('course_id', scope.courses.map(c => c.id))) : []
  return { classId: scope.course.id, unitId: scope.unit.id, unitName: scope.unit.name, plan, ...library, classes, assignments, readOnly: ctx.viewingAsTeacher }
}

/** Saved plans stay scoped to the teacher, program, and curriculum track. */
export async function savedUnitSequences(ctx:AuthContext,classId:string):Promise<SavedUnitSequence[]|null> {
  const course=(await readingCourses(ctx)).find(c=>c.id===classId);if(!course)return null
  const [plans,units]=await Promise.all([
    planRows<UnitPlan&{unit_id:string}>('teaching_unit_plans','id,unit_id,version,steps,updated_at',q=>q.eq('owner_email',course.teacher_email).eq('program',course.program).eq('track',planningTrack(course))),
    planRows<{id:string;name:string}>('units','id,name',q=>q.eq('program',course.program)),
  ])
  return plans.map(p=>({id:p.id,title:units.find(u=>u.id===p.unit_id)?.name??p.unit_id,unitId:p.unit_id,updatedAt:p.updated_at,steps:p.steps})).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))
}
