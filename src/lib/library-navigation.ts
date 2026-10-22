export const LIBRARY_SECTIONS = [
  { key: 'lessons', label: 'Lessons & activities', description: 'Browse reusable video lessons, classroom activities, and practice.' },
  { key: 'interactive', label: 'Simulations & vocabulary', description: 'Explore models, guided investigations, and vocabulary practice.' },
  { key: 'materials', label: 'Reading & media', description: 'Find textbook chapters and upload materials for your lessons.' },
  { key: 'curriculum', label: 'Curriculum tools', description: 'Check curriculum coverage and prepare shared review materials.', adminOnly: true },
] as const

export type LibrarySection = typeof LIBRARY_SECTIONS[number]['key']
export function librarySection(value: string | null | undefined): LibrarySection {
  return value === 'interactive' || value === 'materials' || value === 'curriculum' ? value : 'lessons'
}
const routes: [string, LibrarySection][] = [
  ['/admin/dashboard', 'lessons'], ['/admin/lessons', 'lessons'],
  ['/admin/simulations', 'interactive'], ['/admin/vocabulary', 'interactive'],
  ['/admin/resources', 'materials'], ['/admin/textbook', 'materials'], ['/admin/media', 'materials'],
  ['/admin/workshop', 'curriculum'], ['/admin/reviews', 'curriculum'],
]
export function librarySectionForPath(path: string, search = ''): LibrarySection | null {
  // Assigning and reviewing student work belongs to Teaching.
  if (path === '/admin/vocabulary/tasks' || path === '/admin/vocabulary/assign') return null
  if (path === '/admin/library') return librarySection(new URLSearchParams(search).get('section'))
  return routes.find(([route]) => path === route || path.startsWith(route + '/'))?.[1] ?? null
}
export function libraryHref(section: LibrarySection = 'lessons', search = '') {
  const current = new URLSearchParams(search), next = new URLSearchParams({ section })
  for (const key of ['class', 'unit', 'program']) if (current.has(key)) next.set(key, current.get(key)!)
  return '/admin/library?' + next
}
/** Preserve catalog filters and selected-lesson bookmarks on retired URLs. */
export function legacyLibraryHref(path: string, search: string) {
  const params = new URLSearchParams(search)
  const lesson = params.get('lesson')
  if (path === '/admin/dashboard' && lesson && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(lesson)) {
    const context = new URLSearchParams({ lesson })
    if (params.has('class')) context.set('class', params.get('class')!)
    return '/admin/lessons/' + lesson + '?' + context
  }
  params.set('section', path === '/admin/resources' ? 'materials' : 'lessons')
  return '/admin/library?' + params
}
