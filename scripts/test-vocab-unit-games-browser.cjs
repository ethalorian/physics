const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), pkg = name => require(path.join(root, 'node_modules', name));
const {chromium} = require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out = '/private/tmp/vocab-unit-games-browser'; fs.mkdirSync(out, {recursive:true});
const games = ['matching','concentration','quiz-bowl','word-shoot','letter-catch','hangman','crossword','duel','balderdash'];
const terms = ['force','motion','mass','speed','energy','power','work','heat','wave','light','sound','charge','current','voltage','momentum','velocity','friction','pressure','density','gravity'].map((term,i)=>({id:`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,term,definition:`Meaning of ${term}`,vocabulary_set_id:'set-1',tier:i%3+1}));
let browser, server, fail = false; const requests = [];
(async()=>{
  const mocks = {
    'next/link':`import React from 'react';export default function Link({prefetch,...p}){return <a {...p}/>}`,
    'next/navigation':`export const useSearchParams=()=>new URLSearchParams(location.search);export const useRouter=()=>({push:p=>location.assign(p)});`,
    'next-auth/react':`export const useSession=()=>({data:{user:{id:'student-1',name:'Alex',role:'student'}},status:'authenticated'});`,
  };
  await pkg('esbuild').build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Hub from './src/components/vocabulary/UnitVocabularyPractice';${games.map((g,i)=>`import Game${i} from './src/app/vocabulary/${g}/page';`).join('')}const pages={${games.map((g,i)=>`'${g}':Game${i}`).join(',')}};const Page=pages[location.pathname.split('/').pop()]||Hub;createRoot(document.getElementById('root')).render(<Page/>);`,loader:'tsx',resolveDir:root},bundle:true,jsx:'automatic',format:'esm',outfile:out+'/app.js',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'fixtures',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:root}));}}]});
  const css = await pkg('postcss')([pkg('@tailwindcss/postcss/dist/index.js')({base:root})]).process(fs.readFileSync(root+'/src/app/globals.css','utf8'),{from:root+'/src/app/globals.css'});fs.writeFileSync(out+'/style.css',css.css);
  server=http.createServer((req,res)=>{
    const u=new URL(req.url,'http://local');requests.push(u.pathname+u.search);const json=(d,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(d));};
    if(u.pathname==='/api/vocab/sources')return json({units:[{id:'unit-1',name:'Motion & Forces'},{id:'unit-2',name:'Energy'}],sets:[{id:'set-1',unitId:'unit-1',lessonId:'lesson-1'}]});
    if(u.pathname==='/api/vocab/play')return fail?json({error:'Practice words could not load.'},503):json({terms:u.searchParams.get('unit_id')==='unit-2'?terms.slice(0,12):terms,unitId:u.searchParams.get('unit_id')||'unit-1',scoreSetId:'set-1',label:u.searchParams.get('unit_id')==='unit-2'?'Energy':'Motion & Forces'});
    if(u.pathname==='/api/language-profile')return json({profile:null});
    if(u.pathname.startsWith('/api/'))return json({open:[],ghosts:[],recorded:0});
    if(['/app.js','/style.css'].includes(u.pathname)){res.setHeader('Content-Type',u.pathname.endsWith('.js')?'text/javascript':'text/css');return res.end(fs.readFileSync(out+u.pathname));}
    res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body><main id="root"></main><script type="module" src="/app.js"></script></body></html>');
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'/vocabulary/work');await page.getByRole('link',{name:'Matching',exact:true}).waitFor();
  assert.equal(await page.locator('a[href*="unit_id=unit-1"]').count(),9);
  await page.getByRole('combobox',{name:'Unit',exact:true}).selectOption('unit-2');assert.equal(await page.locator('a[href*="unit_id=unit-2"]').count(),9);
  await page.getByRole('combobox',{name:'Unit',exact:true}).selectOption('unit-1');await page.screenshot({path:out+'/hub.png',fullPage:true});
  for(const game of games){
    await page.goto(url+'/vocabulary/'+game+'?task_id=one-word-assignment');
    await page.getByText(/Motion & Forces · 20 (terms|words)/).waitFor({timeout:10000}).catch(async e=>{console.error(game,errors,await page.locator('body').innerText());throw e;});
    await page.getByRole('button',{name:'Options',exact:true}).click();
    await page.getByText('20 words · all published words and tiers in this unit',{exact:true}).waitFor();
    assert.equal(await page.getByRole('combobox',{name:'Practice unit',exact:true}).inputValue(),'unit-1');
    assert.equal(await page.getByText(/Need at least|Not enough words/).count(),0,game+' can use the full pool');
    if(game==='duel')assert(await page.getByRole('button',{name:'Live Duel',exact:true}).isEnabled());
    if(game==='balderdash')assert(await page.getByRole('button',{name:'Open Table',exact:true}).isEnabled());
  }
  assert(requests.filter(r=>r.startsWith('/api/vocab/play?')).every(r=>r.includes('practice=unit')));
  await page.goto(url+'/vocabulary/matching?unit_id=unit-1');await page.getByText('Motion & Forces · 20 terms',{exact:false}).waitFor();await page.getByRole('button',{name:'Options',exact:true}).click();
  await page.getByRole('combobox',{name:'Practice unit',exact:true}).selectOption('unit-2');await page.getByText('12 words · all published words and tiers in this unit',{exact:true}).waitFor();
  fail=true;await page.getByRole('combobox',{name:'Practice unit',exact:true}).selectOption('unit-1');await page.getByRole('alert').waitFor();fail=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await page.getByText('20 words · all published words and tiers in this unit',{exact:true}).waitFor();
  await page.setViewportSize({width:390,height:844});await page.goto(url+'/vocabulary/work');await page.getByRole('link',{name:'Matching',exact:true}).waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:out+'/hub-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);console.log('PASS: all nine vocabulary games receive the full unit pool, practice hub links, assignment entry, unit switching, retry, mobile layout, and no browser exceptions.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.close();});
