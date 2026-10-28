const assert=require('node:assert/strict'),fs=require('node:fs');const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const {start}=require('./preview.cjs'),fixture=await start();let browser;
 try {
  const {f,base}=fixture;
  // The database already contains the prior API checks; start the browser with an empty plan only.
  f.sql('truncate teaching_plan_classes,teaching_unit_plans');
  browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
  await page.goto(base+'/?view=plan&edit=sequence');
  await page.getByRole('button',{name:'Browse activities',exact:true}).first().click();
  const library=page.getByRole('region',{name:'Activity library'});await library.waitFor();await library.locator('select').nth(0).selectOption('worksheet');await library.locator('select').nth(2).selectOption('unit');
  assert.equal(await library.locator('article').count(),44);
  await library.getByRole('searchbox').fill('notice');const card=library.locator('article').filter({has:page.getByRole('heading',{name:'Day 1 · Notice, question, predict · CPA',exact:true})});
  await card.getByRole('button',{name:'Add',exact:true}).click();await page.getByRole('button',{name:'Save sequence',exact:true}).click();await page.getByText('Sequence changes saved.',{exact:false}).waitFor();
  await page.goto(base+'/?view=calendar');const shelf=page.getByLabel('Course sequence activities');await shelf.getByRole('button').first().click();await page.getByRole('button',{name:'Place activity on Oct 27, G block',exact:true}).click();await page.getByText('Calendar saved.',{exact:false}).waitFor();
  const getPair=()=>JSON.parse(f.sql("select to_jsonb(w) from worksheet_assignments w where plan_key='worksheet-template:unit-1:1:cpa'"));const initial=getPair();assert.equal(initial.status,'published');
  await shelf.getByRole('button').first().click();await page.getByRole('button',{name:'Place activity on Oct 29, G block',exact:true}).click();await page.getByText('Calendar saved.',{exact:false}).waitFor();assert.equal(getPair().id,initial.id);assert.equal(getPair().due_at,'2026-10-29T23:59:00-04:00');
  const output='/Users/craigantocci/Documents/Claude/Projects/Physics Curriculum Planning/outputs/worksheet-calendar/verification';await page.screenshot({path:output+'/calendar.png',fullPage:true});
  await shelf.getByRole('button').first().click();await page.getByRole('button',{name:'Unassign selected activity',exact:true}).click();await page.getByText('Activity unassigned and returned to the sequence.',{exact:false}).waitFor();assert.equal(getPair().status,'archived');
  await page.setViewportSize({width:390,height:900});await page.screenshot({path:output+'/calendar-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(fixture.errors,[]);fs.writeFileSync(output+'/browser.json',JSON.stringify({status:'pass',checks:['Worksheet filter with 44 editions in Unit 1','Add worksheet to sequence and save','Place on class day through actual API/database','Move pair through calendar without duplication','Unassign via calendar preserves native IDs','390px layout rendered'],browserErrors:errors,serverErrors:fixture.errors},null,2));console.log('PASS: real Plan UI → API → local database; add, save, assign, move and unassign worksheet pair.');
 } finally {await browser?.close();await new Promise(resolve=>fixture.server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
