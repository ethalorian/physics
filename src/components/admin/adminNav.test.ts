import assert from 'node:assert/strict'
import test from 'node:test'
import { GROUPS, gateGroups, flatTools } from './adminNav'

test('ordinary teachers see classroom tools without owner or curriculum authoring links', () => {
  const links = flatTools(false).map(tool => tool.href)
  for (const href of ['/admin/classes', '/admin/control-room', '/admin/teacher/plans', '/admin/vocabulary/tasks']) {
    assert.ok(links.includes(href), href)
  }
  for (const href of ['/admin/dashboard', '/admin/workshop', '/admin/collaborators', '/admin/oversight', '/admin/simulations', '/admin/vocabulary']) {
    assert.ok(!links.includes(href), href)
  }
  assert.ok(gateGroups(GROUPS, false).every(group => group.tools.length > 0))
})

test('teacher editing grants expose only the corresponding authoring tools', () => {
  const links = flatTools(false, ['vocabulary']).map(tool => tool.href)
  assert.ok(links.includes('/admin/vocabulary'))
  assert.ok(!links.includes('/admin/simulations'))
  assert.ok(!links.includes('/admin/dashboard'))
  assert.ok(!links.includes('/admin/collaborators'))
  assert.ok(flatTools(false, ['lessons']).some(tool => tool.href === '/admin/dashboard'))
})

test('admin navigation retains every tool and search matches sidebar', () => {
  assert.deepEqual(flatTools(true), GROUPS.flatMap(group => group.tools))
  for (const isAdmin of [true, false]) {
    assert.deepEqual(flatTools(isAdmin, ['simulations']), gateGroups(GROUPS, isAdmin, ['simulations']).flatMap(group => group.tools))
  }
})
