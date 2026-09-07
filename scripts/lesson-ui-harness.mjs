// Local-only renderer verification. No application authentication or database writes.
import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
const root = path.resolve(import.meta.dirname, '..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lesson-ui-'));
const source = `
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import BlockRenderer from './src/components/blocks/BlockRenderer';
const blocks = [
{id:'transfer',type:'transfer_prompt',masteryTaskSlug:'fixture',task:{id:'fixture',slug:'fixture',prompt:'Use your measurements to defend a design choice.',rubric:'Connect the claim to evidence.'}},
{id:'exit',type:'exit_ticket',prompt:'Explain the direction of acceleration.',sei:{modes:['text','sketch','audio','label'],frames:[{level:2,text:'The acceleration is ___ because ___.'}]}},
{id:'observation',type:'observation',prompt:'Observe motion.',patternPrompt:'Describe the measured pattern.',interpretPrompt:'Explain what the pattern means.',capture:true,sei:{modes:['sketch']}},
{id:'sketch',type:'sketch',instruction:'Represent balanced forces.',capture:true},
{id:'table',type:'data_table',title:'Signed position',columns:['Time (s)','Position (m)'],rows:2,minRows:2,graph:{x:0,y:1},capture:true},
];
function App(){
 const [responses,setResponses]=useState(()=>JSON.parse(localStorage.getItem('fixture-responses')||'{}'));
 const [readonly,setReadonly]=useState(false);
 const save=async(id,type,response)=>{setResponses(old=>{const next={...old,[id]:{response,created_at:new Date().toISOString()}};localStorage.setItem('fixture-responses',JSON.stringify(next));return next});return true};
 const draft=(id,type,response)=>{localStorage.setItem('fixture-last-draft',JSON.stringify({id,type,response}))};
 return <main><h1>Lesson renderer verification fixture</h1><p>Local synthetic work only</p><button onClick={()=>setReadonly(x=>!x)}>{readonly?'Resume editing':'Review saved work'}</button><BlockRenderer key={String(readonly)} blocks={blocks} lessonId="fixture" hydrated responses={responses} save={save} draft={draft} readOnly={readonly}/><pre id="saved">{JSON.stringify(responses,null,2)}</pre></main>
}
createRoot(document.getElementById('root')).render(<App/>);
`;
await esbuild.build({ absWorkingDir: root, jsx: "automatic", stdin: {contents:source,resolveDir:root,loader:'tsx'}, outfile:path.join(dir,'app.js'), bundle:true, platform:'browser', format:'esm', define:{"process.env":"{}",'process.env.NODE_ENV':'"development"'}, loader:{'.woff2':'dataurl','.woff':'dataurl','.ttf':'dataurl'}, plugins:[{name:'fixture-session',setup(build){build.onResolve({filter:/^next-auth\/react$/},()=>({path:'session',namespace:'fixture'}));build.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const useSession=()=>({data:null,status:"unauthenticated"});',loader:'js'}));}}] });
fs.writeFileSync(path.join(dir,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Lesson renderer verification</title><style>:root{--foreground:#182239;--muted-foreground:#4f5669;--background:#fff;--card:#fff;--border:#ccd3df;--primary:#6557a5;--secondary:#f2f1f8;--success:#3f755b;--primary-foreground:#fff}body{font:16px system-ui;margin:20px}main{max-width:850px;margin:auto}fieldset{margin:15px 0;padding:15px}textarea{min-height:100px;width:95%}button{padding:8px;margin:4px}canvas{max-width:100%}img,svg{max-width:100%}pre{white-space:pre-wrap}</style><link rel="stylesheet" href="/app.css"><div id="root"></div><script type="module" src="/app.js"></script></html>`);
http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;const base=pathname==='/'?'index.html':pathname.slice(1);const file=path.resolve(dir,base);if(!file.startsWith(dir+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}).listen(4318,'127.0.0.1',()=>console.log('Renderer fixture http://127.0.0.1:4318 (synthetic local data only)'));
