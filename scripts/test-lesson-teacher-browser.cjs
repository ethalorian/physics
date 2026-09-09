const fs = require('node:fs'),
  http = require('node:http'),
  path = require('node:path'),
  assert = require('node:assert/strict')
const root = path.resolve(__dirname, '..'),
  pkg = (n) => require(path.join(root, 'node_modules', n))
const { chromium } = require(
  process.env.PLAYWRIGHT_PATH ||
    '/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)
const out = '/private/tmp/lesson-teacher-browser'
fs.mkdirSync(out, { recursive: true })
const doc = {
  schemaVersion: 1,
  dayType: 'STANDARD',
  blocks: [
    {
      id: 'intro',
      type: 'prose',
      markdown: '## Motion investigation\nCompare position at two times.',
    },
    {
      id: 'q',
      type: 'question',
      capture: true,
      gate: true,
      targetId: 'motion',
      question: {
        prompt: 'Which direction?',
        options: [
          { id: 'a', text: 'Forward', feedback: 'Correct.' },
          {
            id: 'b',
            text: 'Backward',
            feedback: 'Look at the change in position.',
          },
        ],
        correctOptionId: 'a',
      },
    },
    {
      id: 'more',
      type: 'prose',
      markdown:
        '## Explain your evidence\nConnect the direction to your measurements.',
    },
    {
      id: 'exit',
      type: 'exit_ticket',
      capture: true,
      prompt: 'Explain the change.',
      targetId: 'motion',
    },
    { id: 'observe', type: 'observation', capture: true, patternPrompt: 'What changed?', interpretPrompt: 'Why did it change?' },
    { id: 'notebook', type: 'lab_notebook', capture: true, instruction: 'Record the investigation.', requireAllFields: true, fields: ['Measurements', 'Reasoning'] },
    { id: 'frame', type: 'sentence_frame', capture: true, frame: 'The motion changes because ___.' },
  ],
}
const lesson = {
  id: 'first',
  title: 'Motion investigation',
  slug: 'motion',
  unit: 'Motion',
  unit_id: 'u1',
  lesson_number: 1,
  estimated_time: 20,
  published: false,
  content: 'LEGACY CONTENT MUST NOT APPEAR IN PREVIEW',
  content_blocks: doc,
  key_terms: [
    { term: 'position', definition: 'Location relative to an origin.' },
  ],
  objectives: [],
  videos: [],
}
let writes = [],
  failWrite = false,
  failHonors = false,
  failLoad = false,
  windows = {}
const classes = [
  {
    id: 'cpa',
    name: 'Physics',
    section: 'Period 2',
    track: 'cpa',
    program: 'physics',
    lesson_experience: 'stepped',
    gate_checkpoints: true,
  },
  {
    id: 'honors',
    name: 'Honors',
    section: 'Period 3',
    track: 'honors',
    program: 'physics',
  },
  {
    id: 'trades',
    name: 'Trades',
    section: 'Period 4',
    track: 'cpa',
    program: 'trades',
  },
]
const lessons = [
  { ...lesson, published: true, unit_order: 1 },
  {
    ...lesson,
    id: 'next',
    title: 'Acceleration investigation',
    lesson_number: 2,
    published: true,
    unit_order: 1,
  },
  {
    ...lesson,
    id: 'honors-only',
    title: 'Honors extension',
    published: true,
    visibility_track: 'honors',
    unit_order: 1,
  },
  {
    ...lesson,
    id: 'trade',
    title: 'Trades measurement',
    published: true,
    program: 'trades',
    unit_id: 't1',
    unit_order: 1,
  },
].map((l) => ({ ...l, program: l.program ?? 'physics' }))
let browser, server, activePage
;(async () => {
  await pkg('esbuild').build({
    stdin: {
      contents: `import React from 'react';import{createRoot}from'react-dom/client';import Release from './src/components/admin/LessonReleasePanel';import Preview from './src/components/admin/AdminLessonPreview';import Editor from './src/components/admin/AdminLessonEditor';import Builder from './src/components/admin/LessonBlockBuilder';import Plans from './src/app/admin/teacher/plans/page';import Review from './src/components/admin/LessonReviewQueue';const l=${JSON.stringify(lesson)};const targets=[{id:'target',slug:'motion',statement:'Explain motion from evidence.'}];const p=location.pathname;createRoot(document.getElementById('root')).render(p.endsWith('/review')?<Review unitId='u1' classQuery='&class=cpa' lessonId='first' onReviewed={()=>{}} onRateTarget={(student,target)=>{document.getElementById('assessment').textContent=student+':'+target}} renderResponse={r=><p>{JSON.stringify(r)}</p>}/>:p.endsWith('/preview')?<Preview lesson={l}/>:p.endsWith('/edit')?<Editor lesson={l} targetCount={1} targets={targets} units={[{id:'u1',name:'Motion',program:'physics'},{id:'u2',name:'Energy',program:'physics'}]} canPublish/>:p.endsWith('/build')?<Builder lessonId={l.id} lessonTitle={l.title} lessonSlug={l.slug} unitId={l.unit_id} day={1} published={false} initial={l.content_blocks} previewDocument={l.content_blocks} targets={targets}/>:p.includes('/teacher/plans')?<Plans/>:<Release/>);`,
      resolveDir: root,
      loader: 'tsx',
    },
    bundle: true,
    format: 'esm',
    jsx: 'automatic',
    outfile: out + '/app.js',
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [
      {
        name: 'browser-fixture',
        setup(b) {
          const mocks = {
            'next/link': `import React from'react';export default function Link(p){return React.createElement('a',p)}`,
            'next/navigation': `export const usePathname=()=>location.pathname;export const useRouter=()=>({push:p=>location.assign(p),refresh:()=>{}});`,
            'next-auth/react': `const s={data:{user:{id:'teacher-fixture',email:'fixture@test',role:'admin'}},status:'authenticated'};export const useSession=()=>s;`,
          }
          b.onResolve({ filter: /.*/ }, (a) =>
            mocks[a.path] ? { path: a.path, namespace: 'fixture' } : undefined,
          )
          b.onLoad({ filter: /.*/, namespace: 'fixture' }, (a) => ({
            contents: mocks[a.path],
            loader: 'js',
            resolveDir: root,
          }))
        },
      },
    ],
  })
  const css = await pkg('postcss')([
    pkg('@tailwindcss/postcss/dist/index.js')({ base: root }),
  ]).process(fs.readFileSync(root + '/src/app/globals.css', 'utf8'), {
    from: root + '/src/app/globals.css',
  })
  fs.writeFileSync(out + '/style.css', css.css + '\n' + fs.readFileSync(out + '/app.css', 'utf8'))
  server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://local')
    res.setHeader('Content-Type', 'application/json')
    const json = (d, status = 200) => {
      res.statusCode = status
      res.end(JSON.stringify(d))
    }
    let body = ''
    for await (const part of req) body += part
    if (u.pathname === '/api/lesson-access')
      return json(
        failLoad
          ? { error: 'Access service temporarily unavailable' }
          : { classes, lessons, windows, canEdit: true },
        failLoad ? 503 : 200,
      )
    if (u.pathname.match(/^\/api\/classes\/[^/]+\/windows$/)) {
      if (failWrite || (failHonors && u.pathname.includes('/honors/')))
        return json({ error: 'Schedule could not be saved' }, 503)
      const d = JSON.parse(body),
        id = u.pathname.split('/')[3]
      writes.push({ path: u.pathname, body: d })
      if (!d.open_at && !d.close_at) delete windows[id + '|' + d.lesson_id]
      else
        windows[id + '|' + d.lesson_id] = {
          open_at: d.open_at,
          close_at: d.close_at,
        }
      return json({ ok: true })
    }
    if (u.pathname === '/api/lessons/first' && req.method === 'PUT') {
      if (failWrite) return json({ error: 'Settings could not be saved' }, 503)
      const d = JSON.parse(body)
      writes.push({ path: u.pathname, body: d })
      return json({ lesson: { ...lesson, ...d } })
    }
    if (u.pathname === '/api/mastery/queue')
      return json({
        submissions: [
          {
            id: 'sub',
            user_id: 'student',
            lesson_id: 'first',
            name: 'Student One',
            lessonTitle: 'Motion investigation',
            submitted_at: '2026-09-07T12:00:00Z',
          },
          {
            id: 'other',
            user_id: 'other',
            lesson_id: 'next',
            name: 'Student Two',
            lessonTitle: 'Other lesson',
            submitted_at: '2026-09-07T12:00:00Z',
          },
        ],
        evidence: [],
      })
    if (u.pathname === '/api/mastery/student-work')
      return json({
        submissions: [
          { id: 'sub', contentSnapshot: doc, legacySnapshot: false },
        ],
        work: [
          {
            blockId: 'q',
            blockType: 'question',
            response: { optionId: 'a' },
            createdAt: '2026-09-07T12:00:00Z',
          },
        ],
        targets: [
          {
            id: 'motion',
            slug: 'motion',
            statement: 'Explain motion from evidence.',
          },
        ],
      })
    if (u.pathname === '/api/mastery/lesson-review' && req.method === 'POST') {
      writes.push({ path: u.pathname, body: JSON.parse(body) })
      return json({ ok: true })
    }
    if (u.pathname === '/api/simulations') return json({ simulations: [] })
    if (u.pathname === '/api/teacher/lesson-plans')
      return json({
        days: [
          {
            day: 1,
            title: 'Motion teacher plan',
            bodyHtml: '<p>Introduce motion with a cart.</p>',
          },
          {
            day: 2,
            title: 'Acceleration teacher plan',
            bodyHtml: '<p>Compare changing speeds.</p>',
          },
        ],
        tracks: ['cpa'],
        availableUnits: ['u1'],
        honorsDays: [],
      })
    if (u.pathname.startsWith('/api/')) return json({ terms: [], targets: [] })
    if (u.pathname === '/app.js' || u.pathname === '/style.css') {
      res.setHeader(
        'Content-Type',
        u.pathname.endsWith('.js') ? 'text/javascript' : 'text/css',
      )
      return res.end(fs.readFileSync(out + u.pathname))
    }
    res.setHeader('Content-Type', 'text/html')
    res.end(
      '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"><title>Lesson teacher verification</title><body><div id="root"></div><div id="assessment" role="status"></div><script type="module" src="/app.js"></script></body></html>',
    )
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const base = 'http://127.0.0.1:' + server.address().port
  browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    timezoneId: 'America/New_York',
  })
  activePage = page
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  const go = (p) => page.goto(base + p)
  const countWrites = () => writes.length
  await go('/admin/lesson-access?class=cpa&lesson=first')
  await page.getByRole('heading', { name: 'Motion investigation' }).waitFor()
  const choices = await page
    .getByLabel('Lesson', { exact: true })
    .locator('option')
    .allTextContents()
  assert.ok(!choices.some((s) => /Trades|Honors extension/.test(s)))
  console.log('PASS class-specific curriculum choices')
  failWrite = true
  await page
    .getByRole('button', { name: 'Open for this class', exact: true })
    .click()
  await page
    .getByRole('alert')
    .filter({ hasText: 'Schedule could not' })
    .waitFor()
  assert.equal(
    await page.getByText('This class: closed', { exact: true }).count(),
    1,
  )
  assert.equal(countWrites(), 0)
  failWrite = false
  await page
    .getByRole('button', { name: 'Open for this class', exact: true })
    .click()
  await page.getByText('This class: open', { exact: true }).waitFor()
  assert.equal(countWrites(), 1)
  console.log('PASS failed release stays closed; retry confirms open')
  windows['cpa|first'] = { open_at: '2026-09-08T12:00:00.000Z', close_at: null }
  await page.reload()
  await page
    .getByRole('button', { name: 'Schedule access', exact: true })
    .click()
  assert.equal(
    await page.getByLabel('Opens', { exact: true }).inputValue(),
    '2026-09-08T08:00',
  )
  await page.getByRole('button', { name: 'Save schedule', exact: true }).click()
  await page.getByRole('dialog').waitFor({ state: 'detached' })
  assert.equal(writes.at(-1).body.open_at, '2026-09-08T12:00:00.000Z')
  await page
    .getByRole('button', { name: 'Schedule access', exact: true })
    .click()
  await page.getByLabel('Closes', { exact: true }).fill('2026-09-07T08:00')
  const before = countWrites()
  await page.getByRole('button', { name: 'Save schedule', exact: true }).click()
  await page
    .getByRole('alert')
    .filter({ hasText: 'after the opening' })
    .waitFor()
  assert.equal(countWrites(), before)
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  console.log('PASS schedule preserves 8 a.m. and rejects reverse dates')
  await page.getByText('All classes and lessons', { exact: true }).click()
  await page
    .getByRole('button', { name: 'Open for matching classes (2)', exact: true })
    .first()
    .click()
  await page.getByRole('region', { name: 'Confirm class release' }).waitFor()
  failHonors = true
  await page
    .getByRole('button', { name: 'Open listed classes', exact: true })
    .click()
  await page.getByRole('status').filter({ hasText: '1 failed' }).waitFor()
  assert.equal(
    await page
      .getByRole('region', { name: 'Confirm class release' })
      .getByRole('listitem')
      .count(),
    1,
  )
  failHonors = false
  await page
    .getByRole('button', { name: 'Open listed classes', exact: true })
    .click()
  await page
    .getByRole('region', { name: 'Confirm class release' })
    .waitFor({ state: 'detached' })
  console.log(
    'PASS bulk release reports partial failure and retries only failed class',
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByText('All classes and lessons', { exact: true }).click()
  await page.screenshot({ path: out + '/release-phone.png', fullPage: true })
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  )
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.screenshot({ path: out + '/release-desktop.png', fullPage: true })
  await page.getByRole('link', { name: 'Student preview', exact: true }).click()
  await page.getByLabel('Preview mode').waitFor()
  assert.ok(new URL(page.url()).searchParams.get('class') === 'cpa')
  assert.equal(
    await page.getByText('LEGACY CONTENT MUST NOT APPEAR IN PREVIEW').count(),
    0,
  )
  await page.getByLabel('Preview mode').selectOption('teacher')
  await page.setViewportSize({ width: 768, height: 1000 })
  const section = page.getByLabel('Lesson section', { exact: true })
  await section.waitFor()
  const options = await section
    .locator('option')
    .evaluateAll((xs) =>
      xs.map((x) => ({ value: x.value, disabled: x.disabled })),
    )
  assert.ok(options.length > 1)
  assert.ok(options.every((x) => !x.disabled))
  await section.selectOption(options.at(-1).value)
  console.log('PASS shared preview content; teacher can jump past checkpoints')
  await page.screenshot({ path: out + '/teacher-preview.png', fullPage: true })
  await page.getByLabel('Preview mode').selectOption('cpa')
  await section.waitFor()
  assert.ok(
    (
      await section
        .locator('option')
        .evaluateAll((xs) => xs.map((x) => x.disabled))
    ).some(Boolean),
  )
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.getByRole('navigation', { name: 'Lesson answer checklist' }).waitFor()
  assert.equal(await page.getByRole('navigation', { name: 'Lesson answer checklist' }).getByRole('button', { name: /2. Exit ticket/ }).isDisabled(), true)
  await page.getByText('What to do', { exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Continue', exact: true }).isDisabled(), true)
  await page.locator('#lesson-step-title').locator('../../..').screenshot({ path: out + '/student-desktop.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.locator('#lesson-step-title').locator('../../..').screenshot({ path: out + '/student-phone.png' })
  await page.getByRole('button', { name: 'Open activity', exact: true }).click()
  assert.equal(await page.evaluate(() => document.activeElement.id), 'lesson-answer-first-q')
  const previewWrites = countWrites()
  await page.getByRole('button', { name: 'Forward', exact: true }).click()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('button', { name: 'Saved ✓', exact: true }).waitFor()
  assert.equal(countWrites(), previewWrites)
  assert.equal(await page.getByRole('button', { name: 'Continue', exact: true }).isDisabled(), false)
  await page.getByText('Responses saved', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByText('Exit ticket', { exact: true }).first().waitFor()
  await page.getByText(/All lesson answers/).click()
  const answers = page.getByRole('navigation', { name: 'Lesson answer checklist' }).filter({ visible: true })
  await answers.getByRole('button', { name: /3. Observation/ }).click()
  await page.locator('#lesson-answer-first-observe').waitFor()
  assert.equal(await page.evaluate(() => document.activeElement.id), 'lesson-answer-first-observe')
  await page.getByLabel('What changed?', { exact: true }).fill('The distance increased.')
  await page.getByLabel('Why did it change?', { exact: true }).fill('The cart moved forward.')
  await page.getByRole('button', { name: 'Save observation and interpretation', exact: true }).click()
  await answers.getByRole('button', { name: /3. Observation.*Saved/ }).waitFor()
  await answers.getByRole('button', { name: /4. Lab notebook/ }).click()
  await page.getByLabel('Measurements', { exact: true }).fill('Two meters in one second.')
  assert.equal(await page.getByRole('button', { name: 'Save notebook' }).isDisabled(), true)
  await page.getByLabel('Reasoning', { exact: true }).fill('The position change is positive.')
  await page.getByRole('button', { name: 'Save notebook' }).click()
  await answers.getByRole('button', { name: /4. Lab notebook.*Saved/ }).waitFor()
  await page.getByLabel('Reasoning', { exact: true }).fill('Revised reasoning, not yet saved.')
  await answers.getByRole('button', { name: /4. Lab notebook.*Changes need saving/ }).waitFor()
  await answers.getByRole('button', { name: /5. Complete the sentence/ }).click()
  await page.locator('#lesson-answer-first-frame').waitFor()
  assert.ok(await page.locator('#lesson-answer-first-frame').getByRole('textbox').count() > 0)
  console.log('PASS answer checklist jumps to every response type; partial notebooks and drafts remain unfinished')
  await page.getByRole('button', { name: 'Reset preview answers' }).click()
  assert.equal(countWrites(), previewWrites)
  console.log(
    'PASS student preview retains gates and writes no student evidence',
  )
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await page.getByLabel('Title', { exact: true }).fill('Motion settings update')
  let dialogSeen = false
  page.once('dialog', async (d) => {
    dialogSeen = true
    await d.dismiss()
  })
  await page.getByRole('link', { name: 'Preview', exact: true }).click()
  assert.ok(dialogSeen)
  assert.ok(page.url().includes('/edit'))
  await page.getByLabel('Curriculum unit', { exact: true }).selectOption('u2')
  failWrite = true
  await page
    .getByRole('button', { name: 'Save settings', exact: true })
    .first()
    .click()
  await page
    .getByRole('alert')
    .filter({ hasText: 'Settings could not' })
    .waitFor()
  failWrite = false
  await page
    .getByRole('button', { name: 'Save settings', exact: true })
    .first()
    .click()
  await page
    .getByRole('status')
    .filter({ hasText: 'Lesson settings saved.' })
    .waitFor()
  assert.ok(page.url().includes('/edit'))
  assert.equal(writes.at(-1).body.unit_id, 'u2')
  assert.equal(writes.at(-1).body.key_terms, undefined)
  await page.screenshot({ path: out + '/settings.png', fullPage: true })
  console.log(
    'PASS settings protect unsaved work, keep existing glossary and stay after save',
  )
  await go('/admin/teacher/plans?class=cpa&lesson=next&unit=u1&day=2')
  await page.getByText('Compare changing speeds.', { exact: true }).waitFor()
  console.log('PASS teacher plan opens requested unit and day')
  await go('/admin/lessons/first/build?class=cpa')
  await page.getByRole('heading', { name: 'Lesson content' }).waitFor()
  await page
    .getByRole('button', {
      name: '+ Reading, checkpoint & exit ticket starter',
      exact: true,
    })
    .click()
  await page
    .getByRole('button', { name: 'Save content', exact: true })
    .first()
    .click()
  await page
    .getByRole('status')
    .filter({ hasText: 'Content saved' })
    .first()
    .waitFor()
  const savedDoc = writes.at(-1).body.content_blocks
  assert.equal(savedDoc.blocks.length, doc.blocks.length + 3)
  assert.deepEqual(
    savedDoc.blocks.slice(0, doc.blocks.length).map((b) => b.id),
    doc.blocks.map((b) => b.id),
  )
  assert.equal(
    new Set(savedDoc.blocks.map((b) => b.id)).size,
    savedDoc.blocks.length,
  )
  console.log(
    'PASS builder starter appends without changing existing block IDs',
  )
  await go('/admin/review')
  await page.getByRole('button', { name: /Student One · Motion/ }).click()
  await page
    .getByRole('region', { name: 'Submitted lesson', exact: true })
    .getByRole('heading', { name: 'Motion investigation', exact: true })
    .waitFor()
  assert.equal(
    await page.getByRole('button', { name: /Student Two/ }).count(),
    0,
  )
  const beforeAssessment = countWrites()
  await page
    .getByRole('button', {
      name: 'Explain motion from evidence. — assess',
      exact: true,
    })
    .click()
  await page.getByText('student:motion', { exact: true }).waitFor()
  assert.equal(countWrites(), beforeAssessment)
  await page.screenshot({ path: out + '/review.png', fullPage: true })
  await page
    .getByRole('button', {
      name: 'Return for revision · mark reviewed',
      exact: true,
    })
    .click()
  await page
    .getByRole('region', { name: 'Submitted lesson', exact: true })
    .waitFor({ state: 'hidden' })
  assert.deepEqual(writes.at(-1).body, { submission_id: 'sub' })
  console.log(
    'PASS lesson-filtered immutable review and explicit separate assessment/return actions',
  )
  failLoad = true
  await go('/admin/lesson-access')
  await page
    .getByRole('alert')
    .filter({ hasText: 'temporarily unavailable' })
    .waitFor()
  failLoad = false
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await page.getByRole('heading', { name: 'Lesson access' }).waitFor()
  console.log('PASS initial load failure has working retry')
  assert.deepEqual(errors, [])
  console.log('PASS no browser runtime errors')
  console.log('Screenshots: ' + out)
})()
  .catch(async (e) => {
    if (activePage) {
      console.error(
        'At',
        activePage.url(),
        (await activePage.locator('body').innerText()).slice(0, 800),
      )
      await activePage.screenshot({
        path: out + '/failure.png',
        fullPage: true,
      })
    }
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await browser?.close()
    await new Promise((resolve) => (server ? server.close(resolve) : resolve()))
  })
