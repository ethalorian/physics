import assert from 'node:assert/strict'
import test from 'node:test'
import { LIBRARY_SECTIONS, legacyLibraryHref, libraryHref, librarySectionForPath } from './library-navigation'
import { scopedTeachingHref, teachingNavActive } from './teaching-navigation'

const url = (href: string) => new URL(href, 'https://example.test')
test('library tools select exactly one section, separate from teaching and arcade', () => {
  for (const [path, expected] of [
    ['/admin/library', 'lessons'], ['/admin/lessons/l1/build', 'lessons'],
    ['/admin/simulations/activities', 'interactive'], ['/admin/vocabulary', 'interactive'],
    ['/admin/media', 'materials'], ['/admin/textbook', 'materials'],
    ['/admin/workshop', 'curriculum'], ['/admin/reviews', 'curriculum'],
  ]) {
    assert.equal(librarySectionForPath(path), expected)
    assert.deepEqual(LIBRARY_SECTIONS.filter(section => teachingNavActive(path, '', libraryHref(section.key))).map(section => section.key), [expected])
  }
  for (const path of ['/admin/review-modules', '/admin/vocabulary/tasks', '/admin/vocabulary/assign', '/admin/teacher/plans', '/admin/avatar', '/admin/simulations-fake']) assert.equal(librarySectionForPath(path), null)
})
test('changing library sections carries class context without stale lesson filters', () => {
  const next = url(libraryHref('interactive', 'class=c1&unit=unit-2&program=physics&lesson=l1&view=classroom&q=old'))
  assert.equal(next.searchParams.get('section'), 'interactive')
  for (const [key, value] of [['class', 'c1'], ['unit', 'unit-2'], ['program', 'physics']]) assert.equal(next.searchParams.get(key), value)
  for (const key of ['lesson', 'view', 'q']) assert.equal(next.searchParams.has(key), false)
  const sidebar = url(scopedTeachingHref('/admin/library?section=materials', 'class=c1&lesson=l1', 'c2'))
  assert.equal(sidebar.searchParams.get('class'), 'c1')
  assert.equal(sidebar.searchParams.get('section'), 'materials')
  assert.equal(sidebar.searchParams.has('lesson'), false)
  assert.equal(url(scopedTeachingHref('/admin/workshop', 'class=c1&unit=unit-2')).searchParams.get('class'), 'c1')
})
test('old catalog and Resources bookmarks keep filters and selected lessons', () => {
  const catalog = url(legacyLibraryHref('/admin/dashboard', 'class=c1&unit=unit-2&view=classroom&q=forces'))
  assert.equal(catalog.pathname, '/admin/library')
  assert.equal(catalog.searchParams.get('view'), 'classroom')
  assert.equal(catalog.searchParams.get('q'), 'forces')
  assert.equal(catalog.searchParams.get('section'), 'lessons')
  const resources = url(legacyLibraryHref('/admin/resources', 'class=c1&unit=unit-2'))
  assert.equal(resources.searchParams.get('section'), 'materials')
  assert.equal(resources.searchParams.get('class'), 'c1')
  const id = 'f2770d7c-8494-4808-9ba2-fb463bd47508'
  const selected = url(legacyLibraryHref('/admin/dashboard', 'class=c1&lesson=' + id))
  assert.equal(selected.pathname, '/admin/lessons/' + id)
  assert.equal(selected.searchParams.get('class'), 'c1')
  assert.equal(url(legacyLibraryHref('/admin/dashboard', 'lesson=../../evil')).pathname, '/admin/library')
})
