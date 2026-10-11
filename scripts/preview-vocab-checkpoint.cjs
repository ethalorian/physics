/** Standalone synthetic-data UI preview. It imports no auth, API, or database clients. */
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const http = require('node:http')
const { build } = require('esbuild')
const root = path.resolve(__dirname, '..')
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'vocab-checkpoint-preview-'))
const port = Number(process.env.CHECKPOINT_PREVIEW_PORT || 4332)

async function main() {
  await build({ stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import Preview from './src/components/vocabulary/checkpoint/CheckpointPreview'; createRoot(document.getElementById('root')).render(<Preview/>);`, resolveDir: root, loader: 'tsx' }, bundle: true, outdir: output, platform: 'browser', format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'warning' })
  const css = (await require('postcss')([require('@tailwindcss/postcss')({base:root})]).process(fs.readFileSync(path.join(root, 'src/app/globals.css'),'utf8'), { from:path.join(root, 'src/app/globals.css') })).css
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vocabulary Checkpoint · Screen Preview</title><link rel="stylesheet" href="/preview.css"></head><body><div id="root"></div><script src="/preview.js"></script></body></html>'
  const server = http.createServer((req, res) => {
    res.setHeader('Cache-Control','no-store')
    if(req.method!=='GET'){res.writeHead(405);res.end();return}
    if(req.url==='/preview.js'){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(path.join(output,'stdin.js')));return}
    if(req.url==='/preview.css'){res.setHeader('Content-Type','text/css');res.end(css+fs.readFileSync(path.join(output,'stdin.css'),'utf8'));return}
    if(req.url==='/'||req.url==='/checkpoint'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);return}
    if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return}
    res.writeHead(404);res.end('Not found')
  })
  server.listen(port,'127.0.0.1',()=>console.log(`Vocabulary checkpoint preview: http://127.0.0.1:${port}/checkpoint\nSynthetic data only. Stop with Ctrl+C.`))
}
main().catch(e=>{console.error(e);process.exitCode=1})
