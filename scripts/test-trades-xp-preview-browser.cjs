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
const out = '/private/tmp/trades-xp-preview'
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
Object.assign(lesson, require('./trades-opening/lessons.json').find(l=>l.slug==='tu1-s03')); lesson.rewardMaps={cpa:Object.fromEntries(lesson.content_blocks.blocks.filter(b=>b.capture).map(b=>[b.id,8])),honors:Object.fromEntries(lesson.content_blocks.blocks.filter(b=>b.capture).map(b=>[b.id,10]))};
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
  await go('/admin/lessons/test/preview');
  const xp=page.getByRole('region',{name:'Lesson XP rewards'});
  await xp.waitFor();assert.match(await xp.innerText(),/56 XP/);assert.equal(await page.getByText('No XP assigned',{exact:true}).count(),0);
  assert.ok(await page.getByText('8 XP · earn once',{exact:true}).count()>0);
  await page.getByLabel('Preview mode').selectOption('honors');assert.match(await xp.innerText(),/70 XP/);
  await page.getByLabel('Preview mode').selectOption('cpa');assert.match(await xp.innerText(),/56 XP/);
  assert.equal(countWrites(),0);assert.deepEqual(errors,[]);await page.screenshot({path:out+'/xp.png',fullPage:true});
  console.log('PASS actual trades student preview: 56 XP total, 8 XP evidence badge, track switching updates totals, no student writes.');

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
