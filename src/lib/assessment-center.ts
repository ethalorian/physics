export type AssessmentView = 'assignments' | 'mastery' | 'lessons' | 'videos' | 'vocabulary' | 'math' | 'quizzes' | 'readings'
export function assessmentView(value: string | null): AssessmentView {
  return value === 'assignments' || value === 'lessons' || value === 'videos' || value === 'vocabulary' || value === 'math' || value === 'quizzes' || value === 'readings' ? value : 'mastery'
}
/** Keep the class and unit while dropping a different assessment's detail ID. */
export function assessmentCenterHref(view: AssessmentView, id?: string | null, classId?: string | null, search = '') {
  const params = new URLSearchParams(search)
  for (const key of ['id', 'student', 'lesson_id', 'block_id', 'ch', 'generate', 'create', 'submission']) params.delete(key)
  params.set('view', view)
  if(view==='assignments')params.delete('fromWork')
  if (classId !== undefined) { if (classId) params.set('class', classId); else params.set('class', '') }
  if (id) params.set('id', id)
  return '/admin/control-room?' + params.toString()
}

/** A different class/unit must never keep a detail from the previous scope. */
export function assessmentScopeHref(search: string, key: 'class' | 'unit', value: string) {
  const params = new URLSearchParams(search)
  params.set(key, value)
  for (const name of ['id', 'student', 'lesson', 'target', 'lesson_id', 'block_id', 'submission', 'label', 'generate', 'create', 'ch', 'inbox', 'older', 'source']) params.delete(name)
  if (key === 'class') { params.set('unit', 'auto'); params.delete('q'); params.delete('workSearch') }
  return '/admin/control-room?' + params.toString()
}
