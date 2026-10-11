import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
const root=process.cwd(),source=path.join(root,'src/data/explainers/claude-source'),dest=path.join(root,'public/explainers/claude'),manifest=JSON.parse(fs.readFileSync(path.join(root,'src/data/explainers/claude-manifest.json'),'utf8'))
fs.mkdirSync(dest,{recursive:true})
for(const item of manifest){const bytes=fs.readFileSync(path.join(source,item.file));if(crypto.createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw new Error('Original export changed: '+item.file);fs.writeFileSync(path.join(dest,item.file),bytes)}
fs.copyFileSync(path.join(source,'support.js'),path.join(dest,'support.js'))
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
fs.writeFileSync(path.join(dest,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Original interactive explainers · Antocci Physics</title><style>body{font:18px/1.5 system-ui;margin:0;background:#f6f6fb;color:#22233a}main{max-width:900px;margin:auto;padding:48px 24px}a{color:#4b4ba8}li{margin:14px 0}li a{display:block;padding:18px 24px;background:white;border:1px solid #d4d5e2}h1{font:500 44px/1.1 Georgia,serif}</style></head><body><main><p>ANTOCCI PHYSICS</p><h1>Original interactive explainers</h1><p>Open any explainer directly. For iPad control and classroom group work, <a href="/auth/signin?callbackUrl=%2Fadmin%2Fcommand-center">open Teach</a>, start a Unit 1 lesson, and choose <strong>Open an explainer</strong>.</p><ul>${manifest.map(e=>`<li><a href="${encodeURI(e.file)}">${esc(e.title)}</a></li>`).join('')}</ul><p><a href="/decks/unit-1-teaching/index.html">Unit 1 lesson decks</a></p></main></body></html>`)
console.log('Copied six unchanged original explainers and runtime; built the direct library.')
