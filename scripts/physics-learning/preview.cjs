// Synthetic screen preview of the real library and reader. No production writes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const root=path.resolve(__dirname,'../..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'physics-learning-preview-'));
const {build}=require('esbuild');
const mocks={
 'next/link':"import React from 'react';export default function Link(p){return React.createElement('a',p)}",
 'next/navigation':"export const usePathname=()=>location.pathname;export const useSearchParams=()=>new URLSearchParams(location.search);export const useRouter=()=>({refresh:()=>{},push:p=>location.assign(p),replace:p=>history.replaceState(null,'',p)});",
 'next-auth/react':"export const useSession=()=>({data:{user:{id:'local-preview',role:'student'}},status:'authenticated'});",
 'next/dynamic':"import React from 'react';export default function dynamic(load){const C=React.lazy(async()=>{const m=await load();return typeof m==='function'?{default:m}:m});return p=>React.createElement(React.Suspense,{fallback:React.createElement('p',null,'Loading…')},React.createElement(C,p))}",
};
(async()=>{
 await build({stdin:{resolveDir:root,loader:'tsx',contents:`
 import React from 'react';import{createRoot}from'react-dom/client';
 import Library from './src/components/lessons/PhysicsLearningLibrary';
 import Reader from './src/components/lessons/BlockLessonViewer';
 import catalog from './src/data/physics-learning-catalog.json';
 import seed from './scripts/physics-learning/seed.json';
 import{filterDocumentForViewer}from './src/lib/track-visibility';
 const selected=seed.lessons.find(l=>location.pathname==='/lessons/'+l.slug);
 const lessons=catalog.map(e=>({...e,unit_id:e.unitId,estimated_time:seed.lessons.find(l=>l.id===e.id)?.estimated_time??20,learning:e,window:{state:'open'}})).sort((a,b)=>Number(a.source==='new')-Number(b.source==='new')); // Exercise legacy-first API ordering.
 const keys=selected?Object.fromEntries(selected.content_blocks.blocks.filter(b=>b.type==='question').map(b=>[b.id,b.question.correctOptionId])):{};
 const targetData=selected?.objectives.map(slug=>({...catalog.find(e=>e.id===selected.id).targets.find(t=>t.slug===slug),teacher:null,self:null,delta:null}));
 const safe=selected?{...selected,content_blocks:filterDocumentForViewer(selected.content_blocks,{role:'student',track:'cpa'})}:null;
 createRoot(document.getElementById('root')).render(<><div style={{padding:'10px 20px',background:'var(--secondary)',fontSize:13}}>Design preview · sample data · responses stay in this preview</div>{safe?<Reader lesson={safe} preview staffView={location.search==='?teacher=1'} previewTargets={targetData} previewAnswerKeys={keys} previewFlags={{experience:'stepped',gateCheckpoints:true}}/>:<main style={{maxWidth:1280,margin:'auto',padding:24}}><Library lessons={lessons} staff onOtherCourses={()=>alert('The live app returns to the existing course library.')}/></main>}</>);
 `},bundle:true,outfile:path.join(out,'app.js'),platform:'browser',format:'esm',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'preview',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'jsx',resolveDir:root}));}}],logLevel:'warning'});
 const css=(await require('postcss')([require('@tailwindcss/postcss')({base:root})]).process(fs.readFileSync(path.join(root,'src/app/globals.css'),'utf8'),{from:path.join(root,'src/app/globals.css')})).css+fs.readFileSync(path.join(out,'app.css'),'utf8');
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Physics learning preview</title><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>';
 http.createServer((req,res)=>{const u=new URL(req.url,'http://local');res.setHeader('Cache-Control','no-store');if(req.method!=='GET'){res.writeHead(405);res.end('Preview only');return}if(u.pathname==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(path.join(out,'app.js')));return}if(u.pathname==='/style.css'){res.setHeader('Content-Type','text/css');res.end(css);return}if(u.pathname.startsWith('/learning/')&&/^\/learning\/[a-z-]+\.svg$/.test(u.pathname)){const p=path.join(root,'public',u.pathname);if(fs.existsSync(p)){res.setHeader('Content-Type','image/svg+xml');res.end(fs.readFileSync(p));return}}if(u.pathname.startsWith('/api/')){res.setHeader('Content-Type','application/json');res.end('{}');return}if(u.pathname==='/favicon.ico'){res.writeHead(204);res.end();return}res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)}).listen(4390,'127.0.0.1',()=>console.log('Preview ready: http://127.0.0.1:4390'));
})().catch(e=>{console.error(e);process.exitCode=1});
