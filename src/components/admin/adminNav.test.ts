import assert from 'node:assert/strict'
import test from 'node:test'
import { GROUPS, gateGroups, flatTools } from './adminNav'

test('ordinary teachers see classroom tools without owner or curriculum authoring links', () => {
  const links = flatTools(false).map(tool => tool.href)
  for (const href of ['/admin/students?view=roster', '/admin/control-room?view=plan', '/admin/teacher/plans', '/admin/control-room?view=tasks', '/admin/library?section=lessons']) {
    assert.ok(links.includes(href), href)
  }
  for (const href of ['/admin/classes', '/admin/workshop', '/admin/collaborators', '/admin/oversight', '/admin/simulations', '/admin/vocabulary']) {
    assert.ok(!links.includes(href), href)
  }
  assert.ok(gateGroups(GROUPS, false).every(group => group.tools.length > 0))
})

test('teacher editing grants expose only the corresponding authoring tools', () => {
  const links = flatTools(false, ['vocabulary']).map(tool => tool.href)
  assert.ok(links.includes('/admin/vocabulary'))
  assert.ok(!links.includes('/admin/simulations'))
  assert.ok(links.includes('/admin/library?section=lessons'))
  assert.ok(!links.includes('/admin/collaborators'))
  assert.ok(flatTools(false, ['lessons']).some(tool => tool.href === '/admin/library?section=lessons'))
})

test('search includes every sidebar entry and the specialist tools', () => {
  for (const isAdmin of [true, false]) {
    const tools = flatTools(isAdmin, ['simulations'])
    for (const tool of gateGroups(GROUPS, isAdmin, ['simulations']).flatMap(group => group.tools)) assert.ok(tools.some(t => t.href === tool.href))
    assert.ok(tools.some(t => t.href === '/admin/observe'))
    assert.equal(new Set(tools.map(t => t.href)).size, tools.length)
  }
})

test('Teaching and Students replace the Classes sidebar and keep all tools reachable', () => {
  assert.deepEqual(GROUPS.slice(0, 2).map(group => group.title), ['Teaching', 'Students'])
  assert.equal(GROUPS.some(group => group.title === 'Classes'), false)
  assert.deepEqual(GROUPS[1].tools.map(tool => tool.label), ['Roster', 'Activity', 'XP & rewards', 'Class settings'])
  for (const view of ['access', 'tasks', 'pacing']) assert.ok(flatTools(false).some(tool => tool.href === '/admin/control-room?view=' + view))
})


test('Library replaces Resources and keeps every specialist discoverable', () => {
  const library = GROUPS.find(group => group.title === 'Library')!
  assert.equal(library.expanded, true)
  assert.equal(GROUPS.some(group => group.title === 'Resources'), false)
  assert.equal(library.tools.length, 4)
  assert.equal(gateGroups([library], false)[0].tools.length, 3)
  for (const href of ['/admin/workshop', '/admin/reviews', '/admin/vocabulary', '/admin/simulations', '/admin/textbook', '/admin/media']) assert.ok(flatTools(true).some(tool => tool.href === href), href)
  assert.ok(GROUPS.find(group => group.title === 'Arcade')!.tools.some(tool => tool.href === '/admin/avatar'))
  assert.ok(!flatTools(false).some(tool => tool.href === '/admin/avatar'))
  assert.ok(!flatTools(false).some(tool => tool.href === '/admin/library?section=curriculum'))
})
