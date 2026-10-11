// Isolated browser fixture: real reader components and both real chapter PDFs.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'../..'),out='/private/tmp/textbook-spanish-preview';
fs.mkdirSync(out,{recursive:true});
const mocks={
 'next/dynamic':`import React,{lazy,Suspense}from'react';export default function dynamic(loader){const C=lazy(loader);return p=><Suspense fallback={<p>Loading…</p>}><C {...p}/></Suspense>}`,
 'next/link':`import React from'react';export default function Link({href,...p}){return <a href={href} {...p}/>}`,
 'next/navigation':`import {useSyncExternalStore}from'react';const subscribe=f=>{window.addEventListener('route',f);window.addEventListener('popstate',f);return()=>{window.removeEventListener('route',f);window.removeEventListener('popstate',f)}};const router={replace:p=>{history.replaceState(null,'',p);window.dispatchEvent(new Event('route'))}};export const useRouter=()=>router;export const useSearchParams=()=>new URLSearchParams(useSyncExternalStore(subscribe,()=>location.search));`,
 '@/hooks/usePermissions':`export const usePermissions=()=>({userRole:'student'})`,
};
(async()=>{
 await require(root+'/node_modules/esbuild').build({stdin:{contents:`import React,{useState}from'react';import{createRoot}from'react-dom/client';import Textbook from './src/app/textbook/page';import Preview from './src/components/readings/ReadingBookPreview';function App(){const[p,setP]=useState(2);return location.pathname==='/embedded'?<div style={{maxWidth:800,margin:'auto'}}><Preview chapter={2} page={p} offset={11} onPage={setP}/></div>:<Textbook/>}createRoot(document.getElementById('root')).render(<App/>);`,resolveDir:root,loader:'tsx'},bundle:true,format:'esm',jsx:'automatic',outfile:out+'/app.js',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'mock'}:undefined);b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:root}))}}]});
 const css=await require(root+'/node_modules/postcss')([require(root+'/node_modules/@tailwindcss/postcss/dist/index.js')({base:root})]).process(fs.readFileSync(root+'/src/app/globals.css','utf8'),{from:root+'/src/app/globals.css'});
 fs.writeFileSync(out+'/style.css',css.css+'\n'+fs.readFileSync(out+'/app.css','utf8'));
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(u.pathname.startsWith('/api/textbook/')){
   const n=Number(u.pathname.split('/').pop()),spanish=u.searchParams.get('lang')==='es';
   const base=spanish?'/Users/craigantocci/Documents/Claude/Projects/Physics Curriculum Planning/Textbook Spanish/output/pdf':'/Users/craigantocci/Desktop/Current/Conc. Text teachers copy/student-edition';
   const file=path.join(base,`cp${String(n).padStart(2,'0')}.pdf`);
   if(!fs.existsSync(file)){res.writeHead(404,{'Content-Type':'application/json'});return res.end('{"error":"Missing translation"}');}
   res.writeHead(200,{'Content-Type':'application/pdf','Content-Language':spanish?'es':'en'});return res.end(fs.readFileSync(file));
  }
  if(u.pathname==='/pdfjs-dist/build/pdf.worker.min.mjs'){res.setHeader('Content-Type','text/javascript');return res.end(fs.readFileSync(root+'/node_modules/pdfjs-dist/build/pdf.worker.min.mjs'));}
  if(['/app.js','/style.css'].includes(u.pathname)){res.setHeader('Content-Type',u.pathname.endsWith('.js')?'text/javascript':'text/css');return res.end(fs.readFileSync(out+u.pathname));}
  res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
 });
 server.listen(4329,'127.0.0.1',()=>console.log('Textbook fixture: http://127.0.0.1:4329/textbook?ch=2&page=2'));
})().catch(e=>{console.error(e);process.exitCode=1});
