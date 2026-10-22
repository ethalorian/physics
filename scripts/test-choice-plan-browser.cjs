// The real Plan header, choice workspace, editor and resource hook against an
// isolated HTTP fixture. No production records are read or written.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), pkg = name => require(path.join(root, 'node_modules', name));
const { chromium } = require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out = '/private/tmp/choice-plan-browser'; fs.mkdirSync(out, { recursive: true });
const classes = [{ id: 'c1', label: 'Physics · A', program: 'physics', teacher: null }, { id: 'c2', label: 'Physics · B', program: 'physics', teacher: null }, { id: 'trades', label: 'Trades', program: 'trades', teacher: null }];
const catalog = id => ({ steps: ['Day 7 · Acceleration', 'Day 8 · Constant Acceleration Problem-Solving', 'Acceleration Studio · Can positive velocity go with negative acceleration?'].map((title, i) => ({id: 'step-' + id + i, kind:'interactive',sourceId:'step-' + id + i,planKey:'interactive:day-'+i,title,href:'/interactive-assignments/day-'+i,followUp:false})),links:[],targets:[] });
const sections = [], writes = [], requests = [], errors = [];
let browser, server, page, readOnly = false, fail = false, delayFirstClass = false;
const snapshot = id => ({ staff: true, readOnly, courseId: id, courses: classes.filter(c => c.program === 'physics'), sections: sections.filter(s => s.course_id === id), roster: [], selections: [], slots: [], bookings: [], evidence: {}, progress: {} });
(async () => {
  await pkg('esbuild').build({ stdin: { contents: `
    import React,{useState} from 'react'; import {createRoot} from 'react-dom/client';
    import Header from './src/components/admin/StudentWorkHeader'; import Workspace from './src/components/admin/planning/ChoicePlanningWorkspace';
    import ChoiceCalendar from './src/components/choices/ChoiceCalendar';
    import {assessmentView,assessmentScopeHref} from './src/lib/assessment-center';
    import {teachingNavActive} from './src/lib/teaching-navigation';
    const classes=${JSON.stringify(classes)};
    function App(){const [search,setSearch]=useState(location.search); const params=new URLSearchParams(search),id=params.get('class'),view=assessmentView(params.get('view')),course=classes.find(c=>c.id===id);
      const navigate=href=>{history.pushState({},'',href);setSearch(location.search)};
      return <main style={{maxWidth:1280,margin:'auto',padding:16}} onClick={e=>{const link=e.target.closest('a');if(link&&link.target!=='_blank'&&!e.defaultPrevented){e.preventDefault();navigate(link.href)}}}>
      <span data-plan-active={teachingNavActive('/admin/control-room',search,'/admin/control-room?view=plan')}/>
      <Header view={view} search={search} classId={id} classLabel={course?.label??null} classes={classes} teachers={[]} teacher="" onTeacherChange={()=>{}} unitId={params.get('unit')??'unit-1'} units={[{id:'unit-1',name:'Motion'}]} program={course?.program??null} onClassChange={id=>navigate(assessmentScopeHref(search,'class',id))} onUnitChange={unit=>navigate(assessmentScopeHref(search,'unit',unit))} onNavigate={()=>{}}/>
      {view==='choices'?<Workspace unitId={params.get('unit')??'unit-1'} classId={id} classLabel={course?.label??null} program={course?.program??null}/>:<h2>Unit sequence</h2>}
      </main>}
    createRoot(document.getElementById('root')).render(<App/>);`, resolveDir: root, loader: 'tsx' }, bundle: true, format: 'esm', jsx: 'automatic', outfile: out + '/app.js', define: { 'process.env.NODE_ENV': '"development"' }, plugins: [{ name: 'next-link', setup(b) { b.onResolve({ filter: /^next\/link$/ }, () => ({ path: 'link', namespace: 'fixture' })); b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: "import React from 'react';export default function Link({scroll,...p}){return React.createElement('a',p)}", loader: 'jsx', resolveDir: root })); } }] });
  const css = await pkg('postcss')([pkg('@tailwindcss/postcss/dist/index.js')({ base: root })]).process(fs.readFileSync(root + '/src/app/globals.css', 'utf8'), { from: root + '/src/app/globals.css' });
  fs.writeFileSync(out + '/style.css', css.css + '\n' + fs.readFileSync(out + '/app.css', 'utf8'));
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost'), json = (value, status = 200) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
    if (url.pathname === '/api/choice-calendar') {
      if (req.method === 'GET') {
        const id = url.searchParams.get('class'); requests.push(id); assert(['c1', 'c2'].includes(id));
        if (fail) return json({ error: 'Unavailable' }, 503);
        if (url.searchParams.has('catalog')) return json(catalog(id));
        if (delayFirstClass && id === 'c1') return setTimeout(() => json(snapshot(id)), 700);
        return json(snapshot(id));
      }
      let body = ''; req.on('data', chunk => body += chunk); req.on('end', () => {
        const data = JSON.parse(body); writes.push(data); assert.equal(readOnly, false);
        if (data.action === 'create') {
          const id = 'menu-' + sections.length;
          sections.push({ ...data, id, published: false, published_at: null, version: 1, options: data.options.map((option, i) => ({ ...option, id: id + '-' + i, steps: option.steps.map(key=>catalog(data.course_id).steps.find(step=>step.kind+':'+step.sourceId===key)) })) });
          return json({ id });
        }
        const section = sections.find(s => s.id === data.section_id); assert(section);
        if (data.action === 'update') { section.title = data.title; section.version++; }
        if (data.action === 'publish') { section.published = data.published; section.published_at = new Date().toISOString(); }
        json({ id: section.id });
      }); return;
    }
    if (url.pathname === '/api/teaching-plans') {const steps=catalog(url.searchParams.get('class')).steps; return json({plan:{steps:steps.map(s=>({id:s.id,activityKey:s.planKey,title:s.title}))},catalog:[],unitName:'Motion'});}
    if (['/app.js', '/style.css'].includes(url.pathname)) { res.setHeader('Content-Type', url.pathname.endsWith('.js') ? 'text/javascript' : 'text/css'); return res.end(fs.readFileSync(out + url.pathname)); }
    res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script type="module" src="/app.js"></script></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = await chromium.launch({ headless: true, channel: 'chrome' }); page = await browser.newPage({ viewport: { width: 1366, height: 1000 } }); page.setDefaultTimeout(10000); page.on('pageerror', e => errors.push(e.message));
  const base = 'http://127.0.0.1:' + server.address().port, go = query => page.goto(base + '/admin/control-room?' + query);
  console.log("await go('view=plan"); await go('view=plan&class=c1&unit=unit-1');
  const choiceTab = page.getByRole('navigation', { name: 'Plan view', exact: true }).getByRole('link', { name: 'Student choice', exact: true });
  assert((await choiceTab.getAttribute('href')).includes('class=c1')); await choiceTab.click();
  await page.getByRole('button', { name: 'New choice sequence' }).waitFor();
  assert.equal(await choiceTab.getAttribute('aria-current'), 'page'); assert.equal(await page.locator('[data-plan-active]').getAttribute('data-plan-active'), 'true');
  assert.equal(await page.getByRole('heading', { name: 'Plan', exact: true }).count(), 1);
  assert.equal(await page.getByLabel('Assessment unit', { exact: true }).count(), 1, 'choose the source unit');
  await page.getByRole('button', { name: 'New choice sequence' }).click();
  console.log("await page.getByLabel('Menu name').fill('Keep"); await page.getByLabel('Menu name').fill('Keep my draft');
  page.once('dialog', d => d.dismiss()); await page.getByLabel('Teaching class').selectOption('c2');
  assert.equal(await page.getByLabel('Teaching class').inputValue(), 'c1'); assert.equal(await page.getByLabel('Menu name').inputValue(), 'Keep my draft');
  console.log("page.once('dialog', d => d.accept())"); page.once('dialog', d => d.accept()); await page.getByLabel('Teaching class').selectOption('c2');
  await page.getByRole('heading', { name: 'Physics · B', exact: true }).waitFor(); await page.getByLabel('Assessment unit').selectOption('unit-1');
  await page.getByRole('button', { name: 'New choice sequence' }).click();
  assert.equal(await page.getByLabel('Menu name').inputValue(), 'Student choice');
  await page.getByRole('button', { name:'Browse activities', exact:true }).click();
  await page.getByText('Create a reflection activity', {exact:true}).click();
  assert((await page.getByRole('link',{name:'Manga reflection ↗'}).getAttribute('href')).includes('class=c2'));
  await page.getByRole('button',{name:'From unit sequence',exact:true}).click();
  const dialog=page.getByRole('dialog');await dialog.getByRole('checkbox').first().waitFor();
  for(const checkbox of await dialog.getByRole('checkbox').all())await checkbox.check();
  await dialog.getByRole('button',{name:'Add 3 activities',exact:true}).click();
  const cards=page.getByRole('group',{name:'Choice sequence',exact:true}).locator('article');
  assert.equal(await cards.count(),3);
  await cards.nth(0).dragTo(cards.nth(1));
  assert((await cards.nth(0).textContent()).includes('Day 8'));
  await cards.nth(0).getByRole('checkbox').check();await cards.nth(1).getByRole('checkbox').check();
  await page.getByRole('button',{name:'Group selected (2)'}).click();assert.equal(await cards.count(),2);
  await page.getByRole('button',{name:'Separate into individual choices'}).click();assert.equal(await cards.count(),3);
  await page.screenshot({path:out+'/sequence-builder.png',fullPage:true});
  await page.getByRole('button',{name:'Add instructor lab',exact:true}).click();
  await page.getByLabel('Choice name',{exact:true}).fill('Cart lab');
  await page.getByRole('button',{name:'Close choice details'}).click();
  await page.getByLabel('Menu name').fill('Class B lab choices'); await page.getByLabel('Required choices', { exact: true }).fill('1');
  await page.getByLabel('Available from').fill('2026-11-02T08:00'); await page.getByLabel('Deadline').fill('2026-11-06T15:00');
  assert.equal(await cards.count(),4);
  console.log("await page.getByRole('button', { name: 'Save sequence' }).click()"); await page.getByRole('button', { name: 'Save sequence' }).click(); await page.getByRole('button', { name: 'Edit sequence' }).waitFor();
  assert.equal(writes[0].course_id, 'c2'); assert.equal(writes[0].action, 'create');
  console.log("await page.getByRole('button', { name: 'Edit sequence' }).click()"); await page.getByRole('button', { name: 'Edit sequence' }).click(); await page.getByLabel('Menu name').fill('Revised class B choices');
  await page.getByRole('button', { name: 'Save changes' }).click(); await page.getByRole('button', { name: 'Publish choices' }).click();
  await page.getByRole('button', { name: 'Pause availability' }).waitFor(); await page.getByRole('button', { name: 'Lab calendar & groups' }).click();
  await page.getByLabel('Start time').waitFor(); await page.getByRole('button', { name: 'Choices', exact: true }).click();
  console.log("await page.reload()"); await page.reload(); await page.getByRole('button', { name: 'Edit sequence' }).waitFor(); assert((await page.getByLabel('Choice section', { exact: true }).textContent()).includes('Revised class B choices'));
  await page.getByLabel('Teaching class').selectOption('c1'); await page.getByRole('button',{name:'Build a choice sequence',exact:true}).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Edit sequence' }).count(), 0);
  console.log("delayFirstClass = true"); delayFirstClass = true; await go('view=choices&class=c1'); await page.getByLabel('Teaching class').selectOption('c2');
  await page.getByRole('button', { name: 'Edit sequence' }).waitFor(); await page.waitForTimeout(900);
  assert.equal(await page.getByLabel('Choice section', { exact: true }).textContent(), 'Revised class B choices'); delayFirstClass = false;
  console.log("const beforeTrades"); const beforeTrades = requests.length; await page.getByLabel('Teaching class').selectOption('trades');
  await page.getByRole('heading', { name: 'Student choice is available for Physics classes' }).waitFor(); assert.equal(requests.length, beforeTrades);
  await page.getByLabel('Teaching class').selectOption(''); await page.getByRole('heading', { name: 'Choose a class', exact: true }).waitFor();
  console.log("readOnly = true"); readOnly = true; await go('view=choices&class=c2'); await page.getByRole('button', { name: 'New choice sequence' }).waitFor();
  assert(await page.getByRole('button', { name: 'New choice sequence' }).isDisabled()); assert(await page.getByRole('button', { name: 'Edit sequence' }).isDisabled());
  console.log("readOnly = false; fail = true"); readOnly = false; fail = true; await go('view=choices&class=c2'); await page.getByRole('alert').waitFor(); fail = false;
  await page.getByRole('button', { name: 'Retry choice calendar' }).click(); await page.getByRole('button', { name: 'Edit sequence' }).waitFor();
  console.log("for (const width of"); for (const width of [1366, 390]) { await page.setViewportSize({ width, height: 1000 }); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no overflow at ' + width); await page.screenshot({ path: out + '/plan-' + width + '.png', fullPage: true }); }
  assert.deepEqual(errors, []); console.log('PASS: visual sequence library/import, separate choices, drag order, grouping/ungrouping, lab cards, Plan navigation, class-specific create/edit/publish/reload, unsaved class-switch guard, late-response isolation, Physics-only access, lab management, read-only preview, retry and responsive layouts.');
})().catch(async e => { console.error(e); console.error(errors); if (page) await page.screenshot({ path: out + '/failure.png', fullPage: true }); process.exitCode = 1; }).finally(async () => { await browser?.close(); server?.close(); });
