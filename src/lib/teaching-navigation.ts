import { librarySectionForPath, librarySection } from './library-navigation'
import { assessmentCenterHref, assessmentView, type AssessmentView } from './assessment-center'

export function teachingHref(view: AssessmentView, classId = '', unit = 'auto', day?: number | null) {
  const params = new URLSearchParams({ view, class: classId, unit })
  if (day) params.set('day', String(day))
  return '/admin/control-room?' + params
}

/** Navigation retains the current class/unit, but never reopens an old lesson. */
export function scopedTeachingHref(href: string, search: string, rememberedClass = '') {
  const current = new URLSearchParams(search)
  const [path, query = ''] = href.split('?')
  const destination = new URLSearchParams(query)
  const classId = current.get('class') ?? current.get('course') ?? rememberedClass
  if (path === '/admin/control-room') {
    const view = assessmentView(destination.get('view') ?? 'plan')
    const scoped = new URLSearchParams(assessmentCenterHref(view, null, classId, search).split('?')[1])
    if (!scoped.has('unit')) scoped.set('unit', 'auto')
    return path + '?' + scoped
  }
  if (!['/admin/students', '/admin/library', '/admin/dashboard', '/admin/resources', '/admin/workshop', '/admin/reviews', '/admin/simulations', '/admin/simulations/activities', '/admin/vocabulary', '/admin/textbook', '/admin/media', '/admin/teacher/plans', '/admin/command-center', '/admin/observe', '/admin/lobby', '/admin/student-preview'].includes(path)) return href
  destination.set('class', classId)
  const unit = current.get('unit')
  if (unit && !['auto', 'all', 'unmapped'].includes(unit)) destination.set('unit', unit)
  return path + '?' + destination
}

export function teachingNavActive(path: string, search: string, href: string) {
  if (href.startsWith('/admin/library')) return librarySectionForPath(path, search) === librarySection(new URLSearchParams(href.split('?')[1]).get('section'))
  if (href.startsWith('/admin/students')) {
    const destination = studentsView(new URLSearchParams(href.split('?')[1]).get('view'))
    if (path === '/admin/teacher') return destination === 'settings'
    return path === '/admin/students' && studentsView(new URLSearchParams(search).get('view')) === destination
  }
  if (!href.startsWith('/admin/control-room')) return path === href || path.startsWith(href + '/') || href === '/admin/dashboard' && path.startsWith('/admin/lessons')
  const destination = new URLSearchParams(href.split('?')[1]).get('view') ?? 'plan'
  if (path === '/admin/teacher/plans') return destination === 'plan'
  if (path.startsWith('/admin/pacing/')) return destination === 'calendar'
  if (path === '/admin/student-preview') return destination === 'results'
  if (['/admin/command-center', '/admin/observe', '/admin/lobby'].some(route => path === route || path.startsWith(route + '/'))) return destination === 'live'
  if (path !== '/admin/control-room') return false
  const view = assessmentView(new URLSearchParams(search).get('view'))
  const section = ['choices', 'guide', 'access', 'tasks'].includes(view) ? 'plan' : ['assignments', 'pacing'].includes(view) ? 'calendar' : ['plan', 'calendar', 'live'].includes(view) ? view : 'results'
  return section === destination
}

export function studentLessonHref(classId: string, studentId = '', lessonId = '', unit = '') {
  const params = new URLSearchParams({ class: classId })
  if (studentId) params.set('student', studentId)
  if (lessonId) params.set('lesson', lessonId)
  if (unit) params.set('unit', unit)
  return '/admin/student-preview?' + params
}

export type StudentsView = 'roster' | 'activity' | 'rewards' | 'settings'
export function studentsView(value: string | null): StudentsView {
  return value === 'activity' || value === 'rewards' || value === 'settings' ? value : 'roster'
}
export function studentsHref(view: StudentsView, classId = '', section?: string) {
  const params = new URLSearchParams({ view, class: classId })
  if (section) params.set('section', section)
  return '/admin/students?' + params
}
/** Old bookmarks retain their class and open the tool's new home. */
export function legacyWorkspaceHref(path: string, search: string, classId?: string) {
  const params = new URLSearchParams(search)
  const course = classId ?? params.get('class') ?? params.get('course') ?? params.get('course_id')
  const oldTab = params.get('tab')?.toLowerCase()
  let destination = '/admin/control-room', view = 'plan'
  if (path === '/admin/home') { destination = '/admin/students'; view = 'activity' }
  else if (path === '/admin/roster') { destination = '/admin/students'; view = 'settings' }
  else if (path === '/admin/challenges' || path === '/admin/store') { destination = '/admin/students'; view = 'rewards'; params.set('section', path === '/admin/store' ? 'store' : 'challenges') }
  else if (path === '/admin/lesson-access') view = 'access'
  else if (path === '/admin/vocabulary/tasks') view = 'tasks'
  else if (path === '/admin/pacing' || oldTab === 'pacing') view = 'pacing'
  else if (oldTab === 'roster & analytics' || oldTab === 'roster') { destination = '/admin/students'; view = 'roster' }
  else if (oldTab === 'engagement') { destination = '/admin/students'; view = 'rewards' }
  else if (oldTab === 'plans') view = 'guide'
  params.delete('tab'); params.delete('course'); params.delete('course_id')
  params.set('view', view)
  if (course !== null && course !== undefined) params.set('class', course)
  return destination + '?' + params
}
