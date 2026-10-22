export type AssessmentView = 'choices' | 'access' | 'tasks' | 'pacing' | 'plan' | 'guide' | 'live' | 'calendar' | 'assignments' | 'mastery' | 'lessons' | 'videos' | 'vocabulary' | 'math' | 'quizzes' | 'readings' | 'results' | 'interactive' | 'reviews'
export function assessmentView(value: string | null): AssessmentView {
  return value === 'choices' || value === 'access' || value === 'tasks' || value === 'pacing' || value === 'guide' || value === 'live' || value === 'plan' || value === 'calendar' || value === 'results' || value === 'interactive' || value === 'reviews' || value === 'assignments' || value === 'lessons' || value === 'videos' || value === 'vocabulary' || value === 'math' || value === 'quizzes' || value === 'readings' ? value : 'mastery'
}
/** Keep the class and unit while dropping a different assessment's detail ID. */
export function assessmentCenterHref(view: AssessmentView, id?: string | null, classId?: string | null, search = '') {
  const params = new URLSearchParams(search)
  for (const key of ['id', 'student', 'lesson_id', 'block_id', 'ch', 'generate', 'create', 'submission', 'activity', 'question', 'lesson', 'target', 'inbox', 'older', 'source', 'task_id', 'target_id', 'set_id']) params.delete(key)
  params.set('view', view)
  if (['mastery', 'choices', 'plan', 'guide', 'live', 'calendar', 'access', 'tasks', 'pacing'].includes(view) && ['all', 'unmapped'].includes(params.get('unit') ?? '')) params.set('unit', 'auto')
  if(view==='assignments')params.delete('fromWork')
  if (['results', 'mastery', 'assignments', 'choices', 'plan', 'calendar', 'guide', 'live', 'access', 'tasks', 'pacing'].includes(view)) params.delete('fromResults')
  if (classId !== undefined) { if (classId) params.set('class', classId); else params.set('class', '') }
  if (id) params.set('id', id)
  return '/admin/control-room?' + params.toString()
}

/** A different class/unit must never keep a detail from the previous scope. */
export function assessmentScopeHref(search: string, key: 'class' | 'unit', value: string) {
  const params = new URLSearchParams(search)
  params.set(key, value)
  if (params.get('fromResults') === '1') params.set('view', 'results')
  for (const name of ['id', 'student', 'lesson', 'target', 'lesson_id', 'block_id', 'submission', 'label', 'generate', 'create', 'ch', 'inbox', 'older', 'source', 'activity', 'question', 'resultStudent', 'fromResults', 'day', 'task_id', 'target_id', 'set_id']) params.delete(name)
  if (key === 'class') { params.set('unit', 'auto'); params.delete('q'); params.delete('workSearch') }
  return '/admin/control-room?' + params.toString()
}

/** Open a source's existing review desk without losing the unified gradebook filters. */
export function assessmentResultHref(kind: import('./assessment-results/types').ResultKind, sourceId: string, classId: string, search: string, studentId?: string) {
  if (['vocabulary', 'math', 'video', 'reflection', 'choice'].includes(kind)) {
    const params = new URLSearchParams(assessmentCenterHref('results', null, classId, search).split('?')[1]); params.set('resultKind', kind); if (studentId) params.set('resultStudent', studentId); return '/admin/control-room?' + params
  }
  const view: AssessmentView = kind === 'quiz' ? 'quizzes' : kind === 'reading' ? 'readings' : kind === 'review' ? 'reviews' : 'interactive'
  const params = new URLSearchParams(assessmentCenterHref(view, sourceId, classId, search).split('?')[1])
  params.set('fromResults', '1')
  if (studentId) params.set('student', studentId)
  return '/admin/control-room?' + params.toString()
}
