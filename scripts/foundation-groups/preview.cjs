// Local fictional browser → actual routes → disposable PostgreSQL. Only auth and
// Realtime transport are replaced. Production components, gates and saves are used.
const fs=require('fs'),path=require('path'),http=require('http');
module.exports=async({api,student,teacher,root,out,room,sql,q})=>{
 const port=Number(process.env.FOUNDATION_GROUPS_PORT||4334),fixture=await room(0),pkg=n=>require(root+'/node_modules/'+n),clients=new Set(),requests=[];
 const names=['Maya (fictional)','Jordan (fictional)','Avery (fictional)','Sam (fictional)','Casey (fictional)'];
 sql(fixture.users.map((u,i)=>`update students set name=${q(names[i])} where id=${q(u)}`).join(';'));
 const mocks={
  'next/dynamic':`import React,{lazy,Suspense}from'react';export default function dynamic(loader){const C=lazy(loader);return p=><Suspense fallback={<p>Loading…</p>}><C {...p}/></Suspense>}`,
  'next/link':`import React from 'react';export default function Link({prefetch,...p}){return <a {...p}/>}`,
  'next/image':`import React from 'react';export default function Image({fill,priority,unoptimized,...p}){return <img {...p}/>}`,
  'next/navigation':`export const useSearchParams=()=>new URLSearchParams(location.search);export const useRouter=()=>({replace:u=>location.assign(u),push:u=>location.assign(u)});export const usePathname=()=>location.pathname;`,
  'next-auth/react':`export const useSession=()=>({data:{user:{role:'student',email:'fixture@example.test'}}});`,
  '@supabase/supabase-js':`export function createClient(){let source;return {channel(){let handler;return {on(_type,_filter,fn){handler=fn;return this},subscribe(fn){source=new EventSource('/fixture/changes');source.onopen=()=>fn('SUBSCRIBED');source.onmessage=()=>handler?.({});source.onerror=()=>fn('CHANNEL_ERROR');return this}}},async removeAllChannels(){source?.close()}}}`,
 };
 await pkg('esbuild').build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Lesson from './src/components/interactive-assignments/VelocityAssignment';const who=new URLSearchParams(location.search).get('student')||'0';const original=window.fetch;window.fetch=(url,options)=>original(typeof url==='string'&&url.startsWith('/api/')?url+'?fixtureStudent='+who:url,options);createRoot(document.getElementById('root')).render(<Lesson id="${fixture.assignment}"/>);`,resolveDir:root,loader:'tsx'},bundle:true,format:'esm',jsx:'automatic',outfile:out+'/app.js',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'fictional-boundaries',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:root}))}}]});
 const css=await pkg('postcss')([pkg('@tailwindcss/postcss/dist/index.js')({base:root})]).process(fs.readFileSync(root+'/src/app/globals.css','utf8'),{from:root+'/src/app/globals.css'});fs.writeFileSync(out+'/style.css',css.css+'\n'+fs.readFileSync(out+'/app.css','utf8'));
 let queue=Promise.resolve();
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1:'+port);
  if(url.pathname==='/fixture/changes'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive'});res.write(': connected\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return}
  if(url.pathname.startsWith('/api/')||url.pathname==='/fixture/approve'){
   queue=queue.catch(()=>{}).then(async()=>{
    const who=Number(url.searchParams.get('fixtureStudent')??0);student(fixture.users[who]??fixture.users[0]);let raw='';for await(const c of req)raw+=c;
    const request=new Request(url,{method:req.method,...(raw?{headers:{'content-type':'application/json'},body:raw}:{})});
    const match=url.pathname.match(/^\/api\/interactive-assignments\/([^/]+)(?:\/(partner|sequence))?$/);let response;
    if(url.pathname==='/fixture/approve'){teacher();response=await api.partnerPost(new Request(url,{method:'POST',body:JSON.stringify({action:'approveMakeup',userId:fixture.users[Number(url.searchParams.get('student'))]})}),{params:{id:fixture.assignment}})}
    else if(match)response=await api[match[2]==='partner'?req.method==='POST'?'partnerPost':'partnerGet':match[2]==='sequence'?'sequence':req.method==='POST'?'lessonSave':'lessonGet'](request,{params:{id:match[1]}});
    else response=Response.json({});
    let data=await response.json();
    if(data.pair&&!data.pair.makeup)data.pair.realtime={url:'http://127.0.0.1:'+port,key:'fictional-transport',topic:'fixture'};
    requests.push({path:url.pathname,method:req.method,user:who,status:response.status});
    // A failed diagnostic log must not turn a successful fictional save into an API error.
    try{fs.writeFileSync(out+'/browser-requests.json',JSON.stringify(requests,null,2))}catch(error){console.warn('Could not save local verification log:',error.code)}
    res.writeHead(response.status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));
    if(req.method==='POST'&&response.ok)for(const c of clients)c.write('data: {}\n\n');
   }).catch(e=>{console.error(e);res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:String(e.message??e)}))});return;
  }
  if(url.pathname==='/app.js'||url.pathname==='/style.css'){res.setHeader('Content-Type',url.pathname.endsWith('.js')?'text/javascript':'text/css');return res.end(fs.readFileSync(out+url.pathname))}
  const file=path.resolve(root+'/public','.'+url.pathname);if(file.startsWith(root+'/public/')&&fs.existsSync(file)&&fs.statSync(file).isFile()){res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.png')?'image/png':file.endsWith('.webp')?'image/webp':file.endsWith('.svg')?'image/svg+xml':'application/octet-stream');return res.end(fs.readFileSync(file))}
  const selected=Number(url.searchParams.get('student')??0);
  res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html lang="en" class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Day 7 groups · local verification</title><link rel="stylesheet" href="/style.css"></head><body style="background:var(--background);color:var(--foreground);margin:0"><aside style="padding:14px;text-align:center;border-bottom:1px solid var(--border)">Local verification · fictional students · Viewing ${names[selected]}<nav>${names.map((n,i)=>`<a style="padding:8px" href="/?student=${i}">${n}</a>`).join('')}</nav><button onclick="fetch('/fixture/approve?student=${selected}',{method:'POST'}).then(r=>this.textContent=r.ok?'Fictional teacher approved':'No pending request')">Fictional teacher: approve this student’s request</button></aside><div id="root"></div><script type="module" src="/app.js"></script></body></html>`);
 });
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));console.log('Actual group lesson preview: http://127.0.0.1:'+port+'/?student=0');
 await new Promise(resolve=>{process.once('SIGINT',()=>{for(const c of clients)c.end();server.close(resolve)})});
};
