import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {diagram} from '../src/data/deck-sources/worksheet-guided/diagrams.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.resolve(process.argv[2]||path.join(root,'.worksheet-print-cache'));
fs.mkdirSync(out,{recursive:true});
const days=JSON.parse(fs.readFileSync(path.join(root,'resources/worksheet-decks/source.json')));
const pictures=JSON.parse(fs.readFileSync(path.join(root,'resources/worksheet-decks/figures.json')));
const key=v=>JSON.stringify(v,Object.keys(v).sort());
const figures=new Map(pictures.map(p=>[key(p.visual),p.svg]));
const index={},cache=new Map();
const css='<style>text{font-family:DejaVu Sans,Arial,sans-serif;fill:#202030}.figure-line{fill:none;stroke:#202030;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.figure-line.accent{stroke:#202030;stroke-width:3}.figure-line.dashed{stroke-dasharray:5 5}.figure-object{fill:white;stroke:#202030;stroke-width:2}.figure-label{font-size:18px}.figure-label.small{font-size:14px}.grid path{stroke:#c8c8ce;stroke-width:.7;fill:none}.grid text{font-size:13px}</style>';
for(const d of days)for(const track of ['cpa','honors'])for(const q of d[track]){
 const v=q.visual;if(!v||v.kind==='table')continue;
 const k=key(v);let entry=cache.get(k);
 if(!entry){
  let svg=['graph','vector_grid'].includes(v.kind)?diagram(v):figures.get(k);
  if(!svg)throw Error(`Missing question figure: ${d.unit}/${d.day}/${track}/${q.number}`);
  svg=svg.slice(0,svg.indexOf('</svg>')+6).replace(/var\(--[^)]+\)/g,'#202030');
  if(!/xmlns=/.test(svg))svg=svg.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ');
  svg=svg.replace(/(<svg[^>]*>)/,`$1${css}`);
  const box=svg.match(/viewBox="([^\"]+)"/)[1].split(/\s+/).map(Number);
  const w=box[2],h=box[3],width=Math.min(480,350*w/h),height=width*h/w;
  const name=crypto.createHash('sha256').update(svg).digest('hex')+'.png';
  const file=path.join(out,name);
  if(!fs.existsSync(file))await sharp(Buffer.from(svg),{density:216}).resize(Math.ceil(width*3),Math.ceil(height*3)).flatten({background:'#ffffff'}).png().toFile(file);
  entry={file:name,width,height,kind:v.kind};cache.set(k,entry);
 }
 index[`${d.unit}-${d.day}-${track}-${q.number}`]=entry;
}
fs.writeFileSync(path.join(out,'index.json'),JSON.stringify(index,null,2));
console.log(JSON.stringify({questionFigures:Object.keys(index).length,uniqueImages:cache.size,directory:out}));
