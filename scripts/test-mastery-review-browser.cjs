const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),pkg=n=>require(path.join(root,'node_modules',n));
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='/private/tmp/mastery-review-browser';fs.mkdirSync(out,{recursive:true});
let browser,server;let writes=[],failRating=false;
const work=[{lessonTitle:'Motion investigation',blockId:'q',blockType:'question',prompt:'Why is velocity constant?\na: Equal spacing\nb: Increasing spacing',targetLinked:true,response:{optionId:'a',explain:'Equal distances in equal times.'},createdAt:'2026-09-07T12:00:00Z',evidenceSource:'individual'},{lessonTitle:'Motion investigation',blockId:'exit',blockType:'exit_ticket',prompt:'Explain the position graph.',targetLinked:true,response:{text:'Its constant slope shows constant velocity.'},createdAt:'2026-09-07T12:01:00Z',evidenceSource:'exit_ticket'}];
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
    if(u.pathname==='/api/mastery/grid')return json({unitId:'unit-1',units:[{id:'unit-1',name:'Motion'}],targets:[{id:'motion',statement:'Explain motion from evidence',domain:'physics'}],students:[{id:'s1',name:'Student One',email:'s1@test',ratable:true}],cells:{s1:{motion:{value:2,count:1}}},pending:{s1:{motion:true}}});
    if(u.pathname==='/api/mastery/queue')return json({queue:[{studentId:'s1',name:'Student One',count:1,oldestAgeHours:1}],submissions:[],evidence:[]});
    if(u.pathname==='/api/mastery/student-work')return json({userId:'s1',unitId:'unit-1',targets:[],records:[],work});
    if(u.pathname==='/api/mastery/lesson-comparison')return json({studentAvg:null,globalAvg:null,nStudents:0,lessonTitle:'Motion'});
    if(u.pathname==='/api/mastery/suggest-rating'){writes.push({path:u.pathname,body:JSON.parse(body)});return json({level:null,rationale:'An individual explanation is needed.',nextStep:'Explain the slope.'})}
    if(req.method==='POST'){writes.push({path:u.pathname,body:JSON.parse(body)});return json(failRating&&u.pathname==='/api/mastery/records'?{error:'Rating save failed'}:{ok:true},failRating&&u.pathname==='/api/mastery/records'?503:200)}
    if(u.pathname.startsWith('/api/'))return json({feedback:[],presence:[]});
    if(['/app.js','/style.css'].includes(u.pathname)){res.setHeader('Content-Type',u.pathname.endsWith('.js')?'text/javascript':'text/css');return res.end(fs.readFileSync(out+u.pathname))}
    res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch({headless:true,channel:'chrome'});
  const page=await browser.newPage({viewport:{width:1400,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.getByRole('button',{name:'Grade 1 pending',exact:true}).click();
  const dialog=page.getByRole('dialog');await dialog.getByText('Equal distances in equal times.',{exact:false}).waitFor();
  await dialog.getByRole('button',{name:'3 · Got it',exact:true}).click();assert.equal(writes.length,0,'selecting a rating must not write or advance');
  await dialog.getByRole('button',{name:'Next',exact:true}).click();await dialog.getByText('Its constant slope shows constant velocity.',{exact:true}).waitFor();
  const feedback=dialog.getByRole('textbox',{name:'Feedback and next step'});await feedback.fill('Strength: You connect slope to velocity.');
  await dialog.getByRole('button',{name:'Close lesson mastery review'}).click();
  await page.getByRole('button',{name:'Grade 1 pending',exact:true}).click();
  assert.equal(await feedback.inputValue(),'Strength: You connect slope to velocity.');assert.equal(await dialog.getByRole('button',{name:'3 · Got it',exact:true}).getAttribute('aria-pressed'),'true');
  await dialog.getByRole('button',{name:'✨ Suggest',exact:true}).click();await dialog.getByText('An individual explanation is needed.',{exact:true}).waitFor();
  assert.match(writes[0].body.work,/Why is velocity constant/);assert.match(writes[0].body.work,/Its constant slope/);
  await page.screenshot({path:out+'/desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/mobile.png'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile page must not overflow');
  await dialog.getByRole('button',{name:'Save review and continue',exact:true}).scrollIntoViewIfNeeded();
  failRating=true;await dialog.getByRole('button',{name:'Save review and continue',exact:true}).click();await dialog.getByRole('alert').filter({hasText:'Rating save failed'}).waitFor();
  assert.equal(writes.filter(w=>w.path==='/api/feedback').length,1);assert.equal(await feedback.inputValue(),'');
  failRating=false;await dialog.getByRole('button',{name:'Save review and continue',exact:true}).click();await dialog.waitFor({state:'hidden'});
  assert.equal(writes.filter(w=>w.path==='/api/feedback').length,1,'rating retry must not resend feedback');assert.equal(writes.filter(w=>w.path==='/api/mastery/records').length,2);assert.equal(writes.at(-1).body.level,3);assert.deepEqual(errors,[]);
  console.log('PASS: explicit save, contextual evidence navigation, persistent drafts, insufficient-evidence suggestion, mobile layout, and safe rating retry');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close()});
