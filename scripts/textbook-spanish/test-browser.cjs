const assert=require('node:assert/strict');
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try {
  const page=await browser.newPage({viewport:{width:1366,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const wait=(lang,n)=>page.locator(`[data-pdf-language="${lang}"][data-pdf-page="${n}"] canvas`).waitFor({state:'visible'});
  await page.goto('http://127.0.0.1:4329/textbook?ch=2&page=2&lang=en');await wait('en',2);
  await page.getByRole('button',{name:'Español',exact:true}).click();await wait('es',2);
  assert.equal(new URL(page.url()).searchParams.get('page'),'2');
  assert.equal(await page.getByRole('button',{name:'Español',exact:true}).getAttribute('aria-pressed'),'true');
  assert((await page.getByRole('link',{name:'Abrir en otra pestaña',exact:true}).getAttribute('href')).includes('?lang=es#page=2'));
  await page.getByRole('button',{name:'Página siguiente',exact:true}).click();await wait('es',3);
  await page.getByRole('button',{name:'English',exact:true}).click();await wait('en',3);
  await page.getByRole('button',{name:'Español',exact:true}).click();await wait('es',3);
  await page.reload();await wait('es',3);
  await page.screenshot({path:'/private/tmp/textbook-spanish-preview/spanish-desktop.png',fullPage:true});
  for(const width of[768,390,320]){await page.setViewportSize({width,height:900});await wait('es',3);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);}
  await page.screenshot({path:'/private/tmp/textbook-spanish-preview/spanish-mobile.png',fullPage:true});
  await page.getByLabel('Capítulo',{exact:true}).selectOption('3');await wait('es',1);assert.equal(new URL(page.url()).searchParams.get('ch'),'3');
  await page.goto('http://127.0.0.1:4329/textbook?ch=2&page=2');await wait('es',2);
  await page.goto('http://127.0.0.1:4329/textbook?ch=2&page=2&lang=en');await wait('en',2);
  await page.route('**/api/textbook/2?lang=es',r=>r.fulfill({status:404,contentType:'application/json',body:'{"error":"missing"}'}));
  await page.getByRole('button',{name:'Español',exact:true}).click();await page.getByRole('alert').waitFor();
  assert.equal(await page.locator('[data-pdf-page] canvas').count(),0,'must not show English as Spanish');
  await page.unroute('**/api/textbook/2?lang=es');await page.getByRole('button',{name:'Intentar de nuevo',exact:true}).click();await wait('es',2);
  await page.goto('http://127.0.0.1:4329/embedded');await wait('es',2);
  await page.getByRole('button',{name:'English',exact:true}).click();await wait('en',2);
  await page.getByRole('button',{name:'Español',exact:true}).click();await wait('es',2);
  // Repeated switching must not render a destroyed/stale PDF document.
  for(let i=0;i<3;i++){await page.getByRole('button',{name:'English',exact:true}).click();await page.getByRole('button',{name:'Español',exact:true}).click();}
  await wait('es',2);
  await page.setViewportSize({width:1366,height:1000});
  await page.goto('http://127.0.0.1:4329/textbook?ch=17&page=13&lang=es');await wait('es',13);
  for(let i=0;i<4;i++) await page.getByRole('button',{name:'Ampliar',exact:true}).click();
  await wait('es',13);
  assert(await page.locator('[data-pdf-page="13"] canvas').evaluate(c=>c.width*c.height<=14_000_000),'long page canvas memory is bounded');
  assert.deepEqual(errors,[]);
  console.log('PASS: English/Spanish page retention, next page/chapter, saved preference, explicit URL precedence, reload, 320–1366px layouts, new-tab language, missing Spanish retry, reading preview, rapid switching, long-page zoom memory, no browser exceptions.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
