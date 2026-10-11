const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),pkg=n=>require(path.join(root,'node_modules',n));
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='/private/tmp/mastery-review-browser';fs.mkdirSync(out,{recursive:true});
let browser,server;let writes=[],failRating=false;
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
            'next/navigation': `const params=new URLSearchParams(location.search);export const useSearchParams=()=>params;export const usePathname=()=>location.pathname;export const useRouter=()=>({push:p=>location.assign(p),refresh:()=>{}});`,
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
  const students=[{id:'s1',name:'Student One',ratable:true},{id:'s2',name:'Student Two',ratable:true},{id:'s3',name:'Student Three',ratable:true}];
  const targets=[{id:'motion',statement:'Explain motion from evidence',domain:'reasoning'},{id:'graph',statement:'Interpret a position graph',domain:'reasoning'}];
  const initialQueue=[{studentId:'s1',targetId:'motion',lessonId:'lesson-1',lessonTitle:'Motion investigation'}, {studentId:'s1',targetId:'motion',lessonId:'lesson-2',lessonTitle:'Second investigation'}, {studentId:'s1',targetId:'graph',lessonId:'lesson-1',submissionId:'sub-1',lessonTitle:'Motion investigation'}, {studentId:'s3',targetId:'motion',lessonId:'lesson-1',lessonTitle:'Motion investigation'}];
  const reviews=[];const returned=new Set();let requests=[];
  const same=(r,item)=>r.user_id===item.studentId&&r.target_id===item.targetId&&r.lesson_id===item.lessonId&&r.evidence[0]?.submissionId===(item.submissionId??null);
  const scopedWork=(u)=>{
    const lesson=u.searchParams.get('lesson_id')||'lesson-2';const sub=u.searchParams.get('submission_id')||null;
    return work.map(w=>({...w,lessonId:lesson,lessonTitle:lesson==='lesson-2'?'Second investigation':w.lessonTitle,evidenceKey:lesson+':'+(sub||'saved')+':'+w.evidenceKey,submissionId:sub}));
  };
  server=http.createServer(async(req,res)=>{
    const u=new URL(req.url,'http://local');let body='';for await(const part of req)body+=part;
    requests.push({path:u.pathname,query:Object.fromEntries(u.searchParams),method:req.method});
    const json=(data,status=200)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data))};
    if(u.pathname==='/api/courses')return json({courses:[]});
    if(u.pathname==='/api/mastery/grid'){
      const reviewQueue=initialQueue.filter(i=>!reviews.some(r=>same(r,i)));const pending={};
      for(const i of reviewQueue)(pending[i.studentId]??={})[i.targetId]=true;
      return json({unitId:'unit-1',units:[{id:'unit-1',name:'Motion'}],targets,students,cells:{s1:{motion:{value:2,count:1}}},pending,reviewQueue});
    }
    if(u.pathname==='/api/mastery/queue')return json({queue:[],submissions:returned.has("sub-1")?[]:[{id:'sub-1',user_id:'s1',lesson_id:'lesson-1',name:'Student One',lessonTitle:'Motion investigation',submitted_at:'2026-09-16T12:00:00Z'}],evidence:[]});
    if(u.pathname==='/api/mastery/student-work')return json({userId:u.searchParams.get('user_id'),unitId:'unit-1',targets,records:[],work:scopedWork(u),submissions:u.searchParams.get('submission_id')?[{id:'sub-1',reviewed:returned.has("sub-1"),contentSnapshot:null,legacySnapshot:true}]:[]});
    if(u.pathname==='/api/mastery/evidence-review'){
      if(req.method==='GET')return json({reviews:reviews.filter(r=>r.user_id===u.searchParams.get('user_id')&&r.target_id===u.searchParams.get('target_id')).slice().reverse()});
      const payload=JSON.parse(body);writes.push({path:u.pathname,body:payload});if(failRating)return json({error:'Rating save failed'},503);
      let review=reviews.find(r=>r.id===payload.requestId);
      if(!review){const levels=payload.decisions.flatMap(d=>d.level===null?[]:[d.level]);const mean=payload.mode==='target'?null:levels.reduce((a,b)=>a+b,0)/levels.length;
        review={id:payload.requestId,user_id:payload.userId,target_id:payload.targetId,lesson_id:payload.lessonId,evidence:(payload.mode==='target'?payload.evidenceKeys.map(key=>({key})):payload.decisions).map(e=>({...e,submissionId:payload.submissionId??null})),message:payload.message,note:payload.message,rating_mode:payload.mode,overall_level:payload.mode==='target'?payload.level:Math.round(mean),mean,created_at:new Date().toISOString()};reviews.push(review);}
      return json({id:review.id,level:review.overall_level,mean:review.mean,review});
    }
    if(u.pathname==='/api/mastery/lesson-review'&&req.method==='POST'){returned.add(JSON.parse(body).submission_id);writes.push({path:u.pathname,body:JSON.parse(body)});return json({reviewed:true})}
    if(u.pathname.startsWith('/api/'))return json({feedback:[],presence:[]});
    if(['/app.js','/app.css','/style.css'].includes(u.pathname)){res.setHeader('Content-Type',u.pathname.endsWith('.js')?'text/javascript':'text/css');return res.end(fs.readFileSync(out+u.pathname))}
    res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/app.css"><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  if(process.env.MASTERY_PREVIEW){console.log('PREVIEW_URL=http://127.0.0.1:'+server.address().port);await new Promise(()=>{});}
  browser=await chromium.launch({headless:true,channel:'chrome'});
  const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.getByRole('button',{name:/^Grade \d+ pending$/}).click();
  let dialog=page.getByRole('dialog',{name:'Student One',exact:true});
  const feedback=()=>dialog.getByRole('textbox',{name:'Written feedback',exact:true});
  const ready=()=>page.waitForFunction(()=>document.querySelector('[aria-label="3 · Got it"]')?.disabled===false);
  await ready();
  await dialog.getByRole('button',{name:'3 · Got it',exact:true}).click();
  assert.equal(writes.length,0,'selecting a rating only creates a draft');
  await page.keyboard.press('f');await feedback().fill('Use equal time intervals as evidence.');
  await page.keyboard.press('1');assert.equal(await feedback().inputValue(),'Use equal time intervals as evidence.1');
  await feedback().fill('Use equal time intervals as evidence.');await page.keyboard.press('Escape');
  await page.keyboard.press('Shift+ArrowRight');await page.getByRole('heading',{name:'Student Two',exact:true}).waitFor();
  await page.keyboard.press('Shift+ArrowLeft');await page.getByRole('heading',{name:'Student One',exact:true}).waitFor();
  assert.equal(await feedback().inputValue(),'Use equal time intervals as evidence.');
  assert.equal(await dialog.getByRole('button',{name:'3 · Got it',exact:true}).getAttribute('aria-pressed'),'true');
  await page.screenshot({path:out+'/desktop.png'});
  failRating=true;await dialog.getByRole('button',{name:'Save review and continue',exact:true}).click();
  await dialog.getByRole('alert').waitFor();assert.equal(reviews.length,0);
  assert.equal(await feedback().inputValue(),'Use equal time intervals as evidence.');
  assert(await dialog.getByRole('button',{name:'Skip for now',exact:true}).isDisabled(),'resolve uncertain save before skipping');
  failRating=false;await dialog.getByRole('button',{name:'Retry review and continue',exact:true}).click();
  await dialog.getByText('Second investigation',{exact:true}).waitFor();await ready();
  assert.equal(writes[0].body.requestId,writes[1].body.requestId);assert.equal(reviews.length,1);
  assert.equal(reviews[0].evidence.length,2);assert.equal(reviews[0].rating_mode,'target');
  assert.equal(requests.filter(r=>r.path==='/api/mastery/student-work').at(-1).query.lesson_id,'lesson-2');
  await dialog.getByRole('button',{name:'2 · Almost',exact:true}).click();
  await dialog.getByRole('button',{name:'Save review and continue',exact:true}).click();await ready();
  await dialog.getByRole('combobox',{name:'Learning target',exact:true}).waitFor();
  assert.equal(await dialog.getByRole('combobox',{name:'Learning target',exact:true}).inputValue(),'graph');
  assert.equal(requests.filter(r=>r.path==='/api/mastery/student-work').at(-1).query.submission_id,'sub-1');
  await dialog.getByText('Rating guidance & method',{exact:true}).click();
  await dialog.getByRole('combobox',{name:'Rating method',exact:true}).selectOption('evidence');
  await dialog.getByRole('checkbox',{name:'Rate & next response',exact:true}).check();
  await dialog.getByRole('button',{name:'2 · Almost',exact:true}).click();
  assert(await dialog.getByRole('button',{name:'Save review and continue',exact:true}).isDisabled(),'all responses need a score or explicit exclusion');
  await dialog.getByRole('button',{name:'3 · Got it',exact:true}).click();
  await dialog.getByRole('checkbox',{name:/Ask for a correction/}).check();
  assert(await dialog.getByRole('button',{name:'Save review and continue',exact:true}).isDisabled(),'a revision request needs written feedback');
  await feedback().fill('Use two points to explain the slope.');
  await dialog.getByRole('button',{name:'Save review and continue',exact:true}).click();
  const gate=page.getByRole('dialog',{name:'Next: Student Three',exact:true});await gate.waitFor();
  assert.deepEqual(reviews.map(r=>r.user_id),['s1','s1','s1'],'finish one student before the next');
  assert.equal(reviews[2].rating_mode,'evidence');assert.equal(reviews[2].mean,2.5);
  const returns=writes.filter(w=>w.path==='/api/mastery/lesson-review');
  assert.equal(returns.length,1);assert.equal(returns[0].body.submission_id,'sub-1');assert.equal(returns[0].body.feedback,'Use two points to explain the slope.');
  await gate.getByRole('button',{name:'Continue →',exact:true}).click();
  dialog=page.getByRole('dialog',{name:'Student Three',exact:true});await ready();
  assert.equal(await feedback().inputValue(),'','feedback never leaks between students');
  await page.setViewportSize({width:390,height:844});
  await dialog.getByRole('button',{name:'3 · Got it',exact:true}).click();await feedback().fill('Clear explanation.');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const footer=await dialog.locator('footer[aria-label="Active student"]').boundingBox();
  assert(footer.y>=0&&footer.y+footer.height<=844);
  await page.screenshot({path:out+'/mobile.png'});
  await dialog.getByRole('button',{name:'Save review and continue',exact:true}).click();
  await dialog.waitFor({state:'hidden'});assert.equal(reviews.length,4);
  assert.equal(writes.filter(w=>w.path==='/api/mastery/lesson-review').length,1,'rating alone never returns the lesson');
  assert.deepEqual(errors,[]);
  console.log('PASS: shared controls, per-student drafts, keyboard guards, idempotent retry, student-first queue, exact submission scope, detailed scoring, explicit revision feedback, next-student gate, responsive drawer');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
