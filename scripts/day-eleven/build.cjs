// Package the original interactive export; preserve its executable logic.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),p5=require('parse5');
const base='resources/foundations/day-eleven/original',source=base+'/Day 11 Second Law Lab Vary Mass.dc.html',dest='public/foundations/day-11-runtime-v1';
const original=fs.readFileSync(source,'utf8'),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const script=code=>`<script>${code.replace(/<\/script/gi,'<\\/script')}</script>`;
const sourceSections=[...original.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)];
if(sourceSections.length!==33||sourceSections.slice(30).some(m=>!m[0].includes('data-deck-skip')))throw Error('Unexpected source structure');

const rows=fs.readFileSync('resources/foundations/day-eleven/copy.txt','utf8').trim().split('\n').map(l=>l.split('|'));
const copy=Object.fromEntries(rows.map(([id,en])=>[id,en]));
fs.writeFileSync('src/data/foundations/day-eleven-copy.json',JSON.stringify(copy,null,2)+'\n');
const panels=[[11,1,1,413,729],[17,2,2,406,704],[22,3,3,78,590],[29,4,4,397,499]];
const panelGuides=[16,25,22,23];
const sectionPattern=/<section\b[^>]*>[\s\S]*?<\/section>/g;
let originalIndex=0,number=0;
const steps=[];
let html=original.replace(sectionPattern,section=>{
 if(section.includes('data-deck-skip'))return '';
 originalIndex++;
 steps.push(copy['g'+originalIndex]);

 const panel=panels.find(([after])=>after===originalIndex);
 if(!panel)return section;
 const [,k,page,y,height]=panel;
 steps.push(copy['g'+panelGuides[page-1]]);
 const labStyle=sourceSections[3][0].match(/^<section[^>]* style="([^"]*)"/)[1];
 return section+`<section data-lab-day="1" data-label="${copy['t'+k]}" style="${labStyle}"><div style="font:26px 'IBM Plex Mono',monospace;letter-spacing:.1em;color:#4b4ba8;">2026-XJ · ${40+page}</div><h2 style="font-size:78px;font-weight:500;letter-spacing:-.02em;margin:36px 0;">${copy['t'+k]}</h2><div style="display:grid;grid-template-columns:1.5fr 1fr;gap:42px;align-items:center;flex:1;min-height:0"><svg role="img" aria-label="${copy['alt'+k]}" viewBox="0 ${y} 1024 ${height}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;justify-self:center;max-width:${Math.floor(580*1024/height)}px;border:2px solid #e1d7c8;background:white;"><title>${copy['alt'+k]}</title><image href="/comics/2026-xj/book-one-day-11-v1/page-0${page}.webp" width="1024" height="1536"/></svg><p style="font-size:42px;line-height:1.35">${copy['b'+k]}</p></div><footer style="font:22px 'IBM Plex Mono',monospace;color:#625f72;border-top:1px solid #dbd2c3;padding:20px 0 32px;">Antocci Physics · ${40+page}</footer></section>`;
}).replace(/ data-speaker-notes="[^"]*"/g,'');
html=html.replace(sectionPattern,s=>{number++;return s.replace(/data-screen-label="[^"]*"/,`data-screen-label="${number}"`).replace(/Antocci Physics · \d{2} \/ 33/g,`Antocci Physics · ${String(number).padStart(2,'0')} / 34`);});
html=require('../foundation-groups/slide-copy.cjs')(html,{preserveSlideCopy:true});
const companion=require('../foundation-groups/slide-language.cjs').companion;
const slides=[...html.matchAll(sectionPattern)].map((m,i)=>({number:i+1,comicPage:m[0].match(/<image\b[^>]*\bhref="(\/comics\/2026-xj\/[^"]+\.webp)"/)?.[1],title:m[0].match(/data-label="([^"]+)"/)[1],text:companion(p5.parseFragment(m[0])),teachingStep:steps[i]}));
if(slides.length!==34||steps.some(x=>!x))throw Error('Day 11 guide alignment');
const vendor='resources/foundations/day-one/vendor';
const libraries=[['react.production.min.js','DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z'],['react-dom.production.min.js','gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1']].map(([file,integrity])=>{const bytes=fs.readFileSync(path.join(vendor,file));if(crypto.createHash('sha384').update(bytes).digest('base64')!==integrity)throw Error('Runtime integrity mismatch');return script(bytes.toString());}).join('\n');
const stage=fs.readFileSync(base+'/deck-stage.js','utf8'),support=fs.readFileSync(base+'/support.js','utf8');
const setup=script(`window.__resources={};window.__resourceBlobs={"./deck-stage.js":new Blob([${JSON.stringify(stage)}],{type:"text/javascript"})};`);
const bridge=fs.readFileSync('scripts/day-one/slides-bridge.js','utf8').replaceAll('physics-day-one-slides-v1','physics-day-eleven-slides-v1');
const transition=fs.readFileSync('resources/foundations/day-one/slides-transition.css','utf8');
html=html.replace('<script src="./support.js"></script>',()=>libraries+setup+script(bridge)+script(support))
 .replace('<html>','<html lang="en">')
 .replace('</head>',`<style data-lesson-transition>${transition}</style></head>`)
 .replace('<head>',`<head><title>Day 11 · Newton’s second law: Vary mass</title><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">`);
// Keep a normal asset URL: the original style parser splits on semicolons,
// which truncates data URLs before their image payload.
fs.mkdirSync(dest+'/art',{recursive:true});
fs.copyFileSync(base+'/art/asteroid-briefing.png',dest+'/art/asteroid-briefing.png');
fs.writeFileSync(dest+'/day-11.dc.html',html);fs.copyFileSync(vendor+'/LICENSE-react.txt',dest+'/LICENSE-react.txt');
fs.writeFileSync('src/data/foundations/day-eleven-slides.json',JSON.stringify(slides));


fs.writeFileSync('src/data/foundations/day-eleven-source.json',JSON.stringify({project:'Asteroid 2026-XJ briefing',file:path.basename(source),sourceSha256:hash(original),packagedSha256:hash(html),sourceStudentSlides:30,teacherSlidesExcluded:3,studentSlides:34,panels,timers:['lab','exit'],lab:true},null,2));
