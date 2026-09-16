// Exercise the real editors and lesson update route with a local, synthetic database.
const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const assert = require('node:assert/strict')
const root = path.resolve(__dirname, '..')
const esbuild = require(path.join(root, 'node_modules/esbuild'))
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const out = '/private/tmp/lesson-manual-save-browser'
fs.mkdirSync(out, { recursive: true })
let lesson = {
  id: 'manual-save-fixture', title: 'Manual lesson corrections', slug: 'manual-save-fixture',
  published: true, unit_id: 'fixture-unit', lesson_number: 1, updated_at: '2026-09-16T12:00:00.000Z',
  content_blocks: { schemaVersion: 1, dayType: 'LAB', layout: 'workshop', blocks: [
    { id: 'intro', type: 'prose', markdown: 'Original generated instructions.' },
    { id: 'evidence', type: 'exit_ticket', capture: true, prompt: 'Explain your measurements.' },
    { id: 'unfinished', type: 'question', capture: true, question: { prompt: '', options: [] } },
  ] },
}
let failSave = false, writes = 0, server, browser
class Query {
  constructor(table) { this.table = table; this.filters = []; this.patch = null }
  select() { return this }
  eq(k, v) { this.filters.push(row => row[k] === v); return this }
  is(k, v) { return this.eq(k, v) }
  update(patch) { this.patch = patch; return this }
  async maybeSingle() {
    if (this.table !== 'lessons') return { data: null, error: null }
    if (!this.filters.every(f => f(lesson))) return { data: null, error: null }
    if (this.patch) {
      if (failSave) return { data: null, error: { message: 'Simulated temporary save failure' } }
      lesson = { ...lesson, ...this.patch }; writes++
      fs.writeFileSync(path.join(out, 'saved-lesson.json'), JSON.stringify(lesson, null, 2))
    }
    return { data: structuredClone(lesson), error: null }
  }
}
global.__manualSaveDb = { from: table => new Query(table) }
const routeMocks = {
  'next/server': 'export const NextResponse={json:(body,options)=>Response.json(body,options)};',
  '@/lib/api-auth': 'export const withAuth=fn=>fn;export const withContentEditor=(_area,fn)=>fn;',
  '@/lib/supabase': 'export const supabaseAdmin=global.__manualSaveDb;',
  '@/lib/lesson-access': 'export const authorizeLesson=async()=>({ok:false,response:new Response(null,{status:403})});export const lessonForReader=x=>x;',
  '@/lib/lesson-targets': 'export const targetIdsForLesson=async()=>[];',
}
function plugin(mocks) {
  return { name: 'local-fixtures', setup(b) {
    b.onResolve({ filter: /.*/ }, a => mocks[a.path] ? { path: a.path, namespace: 'fixture' } : undefined)
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: mocks[a.path], loader: 'js', resolveDir: root }))
  } }
}
;(async () => {
  await esbuild.build({ absWorkingDir: root, entryPoints: ['src/app/api/lessons/[id]/route.ts'], outfile: out + '/route.cjs', bundle: true, platform: 'node', format: 'cjs', plugins: [plugin(routeMocks)] })
  const route = require(out + '/route.cjs')
  await esbuild.build({ absWorkingDir: root, entryPoints: ['src/lib/curriculum-readiness.ts'], outfile: out + '/readiness.cjs', bundle: true, platform: 'node', format: 'cjs' })
  const readiness = require(out + '/readiness.cjs').lessonReadiness(lesson.content_blocks, [], [])
  assert.ok(readiness.some(i => i.message.includes('No visual carries')))
  assert.ok(readiness.some(i => i.message.includes('No frame for output')))
  assert.ok(readiness.some(i => i.message.includes('Choose the learning target')))
  await esbuild.build({
    stdin: { resolveDir: root, loader: 'tsx', contents: `
      import React from 'react';import{createRoot}from'react-dom/client';
      import Builder from './src/components/admin/LessonBlockBuilder';
      import Editor from './src/components/admin/AdminLessonEditor';
      fetch('/fixture/lesson').then(r=>r.json()).then(l=>createRoot(document.getElementById('root')).render(
        location.pathname==='/settings'?<Editor lesson={l} targetCount={0} units={[{id:'fixture-unit',name:'Motion',program:'physics'}]} canPublish/>:
        <Builder lessonId={l.id} lessonTitle={l.title} lessonSlug={l.slug} updatedAt={l.updated_at} published={l.published} initial={l.content_blocks}/>
      ));` },
    outfile: out + '/app.js', bundle: true, platform: 'browser', format: 'esm', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [plugin({
      'next/link': "import React from'react';export default function Link(p){return React.createElement('a',p)}",
      'next/navigation': 'export const usePathname=()=>location.pathname;export const useRouter=()=>({refresh:()=>{},push:p=>location.assign(p)});',
      'next-auth/react': "export const useSession=()=>({data:{user:{id:'fixture-teacher',role:'admin'}},status:'authenticated'});",
    })],
  })
  const css = await require(path.join(root, 'node_modules/postcss'))([require(path.join(root, 'node_modules/@tailwindcss/postcss/dist/index.js'))({ base: root })]).process(fs.readFileSync(root + '/src/app/globals.css', 'utf8'), { from: root + '/src/app/globals.css' })
  fs.writeFileSync(out + '/style.css', css.css + '\n' + fs.readFileSync(out + '/app.css', 'utf8'))
  server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://local')
      if (url.pathname === '/fixture/lesson') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(lesson)); return }
      if (url.pathname === '/api/lessons/manual-save-fixture' && req.method === 'PATCH') {
        let body = ''; for await (const chunk of req) body += chunk
        const response = await route.PATCH(new Request('http://local' + url.pathname, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body }), { realRole: 'admin', params: Promise.resolve({ id: lesson.id }) })
        res.writeHead(response.status, { 'Content-Type': 'application/json' }); res.end(await response.text()); return
      }
      if (url.pathname.startsWith('/api/')) { res.setHeader('Content-Type', 'application/json'); res.end('{}'); return }
      if (['/app.js', '/app.css', '/style.css'].includes(url.pathname)) {
        res.setHeader('Content-Type', url.pathname.endsWith('.js') ? 'text/javascript' : 'text/css'); res.end(fs.readFileSync(out + url.pathname)); return
      }
      res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html><head><meta charset="utf-8"><title>Manual save verification</title><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>')
    } catch (e) { res.writeHead(500); res.end(String(e)) }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = 'http://127.0.0.1:' + server.address().port
  browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  const saveContent = async () => {
    const response = page.waitForResponse(r => r.url().endsWith('/api/lessons/manual-save-fixture') && r.request().method() === 'PATCH')
    await page.getByRole('button', { name: 'Save content', exact: true }).first().click()
    return response
  }
  await page.goto(base)
  await page.getByLabel('Lesson day type').selectOption('WORKSHOP')
  assert.equal((await saveContent()).status(), 200)
  await page.getByRole('status').filter({ hasText: 'Content saved' }).waitFor()
  assert.equal(lesson.content_blocks.dayType, 'WORKSHOP'); assert.equal(lesson.published, true)
  assert.equal(lesson.content_blocks.layout, 'workshop')
  assert.deepEqual(lesson.content_blocks.blocks.map(b => b.id), ['intro', 'evidence', 'unfinished'])
  assert.equal(writes, 1)
  console.log('PASS published lesson with missing visual, frame, target and unfinished question saves through the real API')
  await page.reload()
  await page.getByLabel('Lesson day type').waitFor()
  assert.equal(await page.getByLabel('Lesson day type').inputValue(), 'WORKSHOP')
  await page.locator('[data-bid="intro"]').click()
  const text = page.getByRole('dialog', { name: 'Edit block' }).locator('textarea').first()
  await text.fill('Teacher-corrected instructions: measure twice and record the units.')
  assert.equal((await saveContent()).status(), 200)
  await page.getByRole('status').filter({ hasText: 'Content saved' }).waitFor()
  assert.equal(lesson.content_blocks.blocks[0].markdown, 'Teacher-corrected instructions: measure twice and record the units.')
  await page.reload()
  await page.getByText('Teacher-corrected instructions: measure twice and record the units.', { exact: true }).waitFor()
  console.log('PASS manually edited instructions persist after reload and a second save uses the latest version')
  failSave = true
  await page.getByLabel('Lesson day type').selectOption('STANDARD')
  assert.equal((await saveContent()).status(), 500)
  assert.equal(lesson.content_blocks.dayType, 'WORKSHOP')
  assert.ok(await page.evaluate(() => localStorage.getItem('lesson-builder:v1:fixture-teacher:manual-save-fixture')))
  failSave = false
  assert.equal((await saveContent()).status(), 200)
  await page.getByRole('status').filter({ hasText: 'Content saved' }).waitFor()
  assert.equal(lesson.content_blocks.dayType, 'STANDARD')
  assert.equal(await page.evaluate(() => localStorage.getItem('lesson-builder:v1:fixture-teacher:manual-save-fixture')), null)
  await page.screenshot({ path: out + '/saved-content.png', fullPage: true })
  console.log('PASS failed saves preserve the local draft and retry successfully')
  lesson = { ...lesson, updated_at: '2099-01-01T00:00:00.000Z' }
  await page.getByLabel('Lesson day type').selectOption('LAB')
  const beforeConflict = writes
  assert.equal((await saveContent()).status(), 409)
  assert.equal(writes, beforeConflict)
  assert.equal(await page.getByLabel('Lesson day type').inputValue(), 'LAB')
  console.log('PASS conflict protection keeps the teacher edit and prevents stale overwrites')
  page.once('dialog', d => d.accept())
  await page.goto(base + '/settings')
  await page.getByLabel('Title', { exact: true }).fill('Corrected lesson title')
  let response = page.waitForResponse(r => r.url().endsWith('/api/lessons/manual-save-fixture') && r.request().method() === 'PATCH')
  await page.getByRole('button', { name: 'Save settings', exact: true }).first().click()
  assert.equal((await response).status(), 200)
  await page.getByRole('status').filter({ hasText: 'Lesson settings saved' }).waitFor()
  assert.equal(lesson.title, 'Corrected lesson title'); assert.equal(lesson.published, true)
  await page.reload()
  await page.getByLabel('Title', { exact: true }).waitFor()
  assert.equal(await page.getByLabel('Title', { exact: true }).inputValue(), 'Corrected lesson title')
  console.log('PASS settings save and reopen despite incomplete published content and no targets')
  assert.deepEqual(errors, [])
  console.log('PASS no browser runtime errors')
  console.log('Screenshots and persisted synthetic lesson: ' + out)
})().catch(e => { console.error(e); process.exitCode = 1 }).finally(async () => {
  if (browser) await browser.close()
  if (server) await new Promise(resolve => server.close(resolve))
})
