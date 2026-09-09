const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),pkg=n=>require(path.join(root,'node_modules',n));
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='/private/tmp/mastery-review-browser';fs.mkdirSync(out,{recursive:true});
let browser,server;let writes=[],failRating=false,savedReview=null;
const work=[{evidenceKey:'e1',lessonId:'lesson-1',lessonTitle:'Motion investigation',blockId:'q',blockType:'question',prompt:'Why is velocity constant?\na: Equal spacing\nb: Increasing spacing',targetLinked:true,response:{optionId:'a',explain:'Equal distances in equal times.'},createdAt:'2026-09-07T12:00:00Z',evidenceSource:'individual'},{evidenceKey:'e2',lessonId:'lesson-1',lessonTitle:'Motion investigation',blockId:'exit',blockType:'exit_ticket',prompt:'Explain the position graph.',targetLinked:true,response:{text:'Its constant slope shows constant velocity.'},createdAt:'2026-09-07T12:01:00Z',evidenceSource:'exit_ticket'}];
(async()=>{
  await pkg('esbuild').build({
    stdin: {
      contents: `import React from 'react';import {createRoot} from 'react-dom/client';import ControlRoom from './src/app/admin/control-room/page';createRoot(document.getElementById('root')).render(<ControlRoom/>);`,
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
  fs.writeFileSync(out + '/style.css', css.css)
  server=http.createServer(async(req,res)=>{
    const u=new URL(req.url,'http://local');let body='';for await(const part of req)body+=part;
    const json=(data,status=200)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data))};
    if(u.pathname==='/api/courses')return json({courses:[]});
    if(u.pathname==='/api/mastery/grid')return json({unitId:'unit-1',units:[{id:'unit-1',name:'Motion'}],targets:[{id:'motion',statement:'Explain motion from evidence',domain:'reasoning'}],students:[{id:'s1',name:'Student One',email:'s1@test',ratable:true},{id:'s2',name:'Student Two',email:'s2@test',ratable:true}],cells:{s1:{motion:{value:2,count:1}}},pending:{s1:{motion:true}}});
    if(u.pathname==='/api/mastery/queue')return json({queue:[{studentId:'s1',name:'Student One',count:1,oldestAgeHours:1}],submissions:[],evidence:[]});
    if(u.pathname==='/api/mastery/student-work')return json({userId:'s1',unitId:'unit-1',targets:[],records:[],work});
    if(u.pathname==='/api/mastery/lesson-comparison')return json({studentAvg:null,globalAvg:null,nStudents:0,lessonTitle:'Motion'});
    if(u.pathname==='/api/mastery/suggest-rating'){writes.push({path:u.pathname,body:JSON.parse(body)});return json({level:null,rationale:'An individual explanation is needed.',nextStep:'Explain the slope.'})}
    if(u.pathname==='/api/mastery/evidence-review'){
      if(req.method==='GET')return json({reviews:savedReview&&u.searchParams.get('user_id')==='s1'?[savedReview]:[]});
      const payload=JSON.parse(body);writes.push({path:u.pathname,body:payload});if(failRating)return json({error:'Rating save failed'},503);
      const levels=payload.decisions.flatMap(d=>d.level===null?[]:[d.level]);const mean=levels.reduce((a,b)=>a+b,0)/levels.length;
      savedReview={id:payload.requestId,lesson_id:'lesson-1',evidence:payload.decisions,message:payload.message,overall_level:Math.round(mean),mean};return json({id:payload.requestId,level:Math.round(mean),mean});
    }
    if(req.method==='POST'){writes.push({path:u.pathname,body:JSON.parse(body)});return json(failRating&&u.pathname==='/api/mastery/records'?{error:'Rating save failed'}:{ok:true},failRating&&u.pathname==='/api/mastery/records'?503:200)}
    if(u.pathname.startsWith('/api/'))return json({feedback:[],presence:[]});
    if(['/app.js','/app.css','/style.css'].includes(u.pathname)){res.setHeader('Content-Type',u.pathname.endsWith('.js')?'text/javascript':'text/css');return res.end(fs.readFileSync(out+u.pathname))}
    res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/app.css"><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({headless:true,channel:'chrome'});
  const page=await browser.newPage({viewport:{width:1600,height:1050}});const errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message)});
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.getByRole('button',{name:'Grade 1 pending',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Student One',exact:true});await dialog.getByText('Equal distances in equal times.',{exact:false}).waitFor();
  await dialog.getByRole('button',{name:'2 · Almost',exact:true}).click();assert.equal(writes.length,0);
  await page.keyboard.press('ArrowRight');await dialog.getByText('Its constant slope shows constant velocity.',{exact:true}).waitFor();
  await page.keyboard.press('3');assert.equal(await dialog.getByRole('button',{name:'3 · Got it'}).getAttribute('aria-pressed'),'true');
  const feedback=page.getByRole('textbox',{name:'Written feedback',exact:true});await page.keyboard.press('f');assert.equal(await feedback.evaluate(el=>el===document.activeElement),true);await feedback.fill('Strength: You connect slope to velocity.');
  await page.keyboard.press('1');assert.match(await feedback.inputValue(),/1$/);assert.equal(await dialog.getByRole('button',{name:'3 · Got it'}).getAttribute('aria-pressed'),'true');await feedback.fill('Strength: You connect slope to velocity.');await page.keyboard.press('Escape');
  await page.keyboard.press('Shift+ArrowRight');await page.getByRole('heading',{name:'Student Two',exact:true}).waitFor();await feedback.fill('Separate student draft.');await page.keyboard.press('Escape');await page.keyboard.press('Shift+ArrowLeft');await page.getByRole('heading',{name:'Student One',exact:true}).waitFor();
  assert.equal(await feedback.inputValue(),'Strength: You connect slope to velocity.');assert.equal(await dialog.getByRole('button',{name:'2 · Almost'}).getAttribute('aria-pressed'),'true');
  await dialog.getByRole('button',{name:'Close lesson mastery review'}).click();await page.getByRole('button',{name:'Grade 1 pending',exact:true}).click();await feedback.waitFor();assert.equal(await feedback.inputValue(),'Strength: You connect slope to velocity.');
  await page.screenshot({path:out+'/desktop.png'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/mobile.png'});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width:1600,height:1050});
  await page.keyboard.press('r');const finalReview=page.getByRole('dialog',{name:'Review before sending'});await finalReview.getByText('Overall: 3 · Got it',{exact:true}).waitFor();assert.equal(writes.length,0);
  failRating=true;await page.keyboard.press('Control+Enter');await finalReview.getByRole('alert').waitFor();assert.equal(writes.length,1);assert.equal(writes[0].path,'/api/mastery/evidence-review');assert.equal(writes[0].body.decisions.length,2);assert.equal(writes[0].body.message,'Strength: You connect slope to velocity.');
  failRating=false;await page.keyboard.press('Control+Enter');await finalReview.waitFor({state:'hidden'});await page.getByText('✓ Review sent. Scores and feedback are saved with this evidence.').waitFor();assert.equal(writes.length,2);assert.equal(writes[0].body.requestId,writes[1].body.requestId,'retry retains idempotency key');assert.equal(writes.filter(w=>w.path==='/api/feedback').length,0,'review is one atomic request');assert.deepEqual(errors,[]);
  console.log('PASS: per-evidence scores, aggregate, keyboard controls, per-student drafts, explicit confirmation, retry idempotency, mobile layout, and no separate feedback write');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
