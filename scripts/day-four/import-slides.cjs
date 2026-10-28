// Package the original interactive export; preserve its executable logic.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),p5=require('parse5');
const base='resources/foundations/day-four/original',source=base+'/Day 4 Velocity-Time Graphs and Vectors.dc.html',dest='public/foundations/day-4-runtime-v1';
const original=fs.readFileSync(source,'utf8'),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const script=code=>`<script>${code.replace(/<\/script/gi,'<\\/script')}</script>`;
const sourceSections=[...original.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)];
if(sourceSections.length!==29||sourceSections.slice(26).some(m=>!m[0].includes('data-deck-skip')))throw Error('Unexpected source structure');
const snapshots=[
  {
    "after": 10,
    "page": 13,
    "file": "page-01.webp",
    "y": 369,
    "height": 495,
    "title": "Read the axis before the line",
    "alt": "The velocity–time graph is horizontal at +1 meter per second from zero to four seconds. Mr. Antocci explains that velocity stays constant while Maz points out that the object is still moving.",
    "body": "A flat line at +1 m/s means steady motion in the positive direction.",
    "question": "How would the same line shape mean something different on a position–time graph?",
    "work": "Part 1 · Compare the graph stories"
  },
  {
    "after": 14,
    "page": 14,
    "file": "page-02.webp",
    "y": 578,
    "height": 530,
    "title": "A common scale makes arrows useful",
    "alt": "At one square per meter per second, one arrow is four squares east and another is two squares north. Turning an arrow changes velocity even if its length stays the same.",
    "body": "Use the same units and scale before comparing arrow lengths.",
    "question": "What changes when you rotate an arrow without changing its length?",
    "work": "Part 2 · Check the arrow and its components"
  },
  {
    "after": 18,
    "page": 15,
    "file": "page-03.webp",
    "y": 369,
    "height": 481,
    "title": "One motion, two components",
    "alt": "The fictional 8,500 meter-per-second vector is fifteen degrees from the toward-Earth axis. Its perpendicular components are about 8,210 meters per second toward Earth and 2,200 meters per second sideways.",
    "body": "The perpendicular components describe one simultaneous velocity.",
    "question": "Why do 8,210 and 2,200 not add to 8,500 as ordinary numbers?",
    "work": "Part 2 · Check the arrow and its components"
  },
  {
    "after": 23,
    "page": 16,
    "file": "page-04.webp",
    "y": 321,
    "height": 678,
    "title": "A smaller component still matters",
    "alt": "Over 1.6 times ten to the seventh seconds, the constant-velocity model gives about 131 million kilometers toward Earth and 35 million kilometers sideways. Mr. Antocci calls this a model rather than an orbit forecast.",
    "body": "Over six months, even the smaller sideways rate produces a large displacement.",
    "question": "What information is still missing before you can locate the final position?",
    "work": "Part 3 · Challenge the six-month prediction"
  }
];
function comic(s){return `<section data-label="${s.title}" class="foundation-comic" style="background:#1b1c2e;color:#f6f6fb;font-family:Newsreader,Georgia,serif;padding:64px 88px;box-sizing:border-box;display:flex;flex-direction:column;">
 <div style="font:24px 'IBM Plex Mono',monospace;letter-spacing:2px;color:#a9a7ff;">2026-XJ · The Other Direction · Graphic novel, page ${s.page}</div>
 <h2 style="font-size:64px;line-height:1.1;font-weight:500;margin:22px 0 30px;">${s.title}</h2>
 <div style="display:grid;grid-template-columns:1.55fr 1fr;gap:52px;align-items:center;flex:1;min-height:0;">
  <svg role="img" aria-label="${s.alt}" viewBox="0 ${s.y} 1024 ${s.height}" style="width:100%;height:auto;max-height:610px;display:block;background:#fff;border:2px solid #9291bf;"><title>${s.alt}</title><image href="/comics/2026-xj/book-one-day-04-v1/${s.file}" width="1024" height="1536"/></svg>
  <div><p style="font-size:32px;line-height:1.4;margin:0 0 28px;">${s.body}</p><p style="font-size:38px;line-height:1.25;margin:0;">${s.question}</p></div>
 </div><div style="font:24px 'IBM Plex Mono',monospace;color:#c8c7e2;margin-top:28px;">${s.work} · Write your own answer in Work.</div>
 <footer style="font:20px 'IBM Plex Mono',monospace;color:#c8c7e2;margin-top:22px;">Fictional story · Original artwork · Day 4</footer></section>`;}
let index=0;
let html=original.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g,section=>{
 if(section.includes('data-deck-skip'))return '';
 index++;
 // Preserve runtime logic; clarify fictional data and the angle reference.
 if(index===2)section=section.replace("Writes the group's answers and notes.", "Keeps group notes; each person submits their own answers.");
 if(index===4)section=section.replace("2026-XJ's current velocity is 8,500 m/s at 15° toward Earth.", "Our fictional model uses 8,500 m/s at 15° from the toward-Earth axis.");
 if(index===5)section=section.replace(/data-label="[^"]*"/, 'data-label="What does a velocity–time graph look like?"');
 if(index===9)section=section.replace('Tilted line.', 'Sloped or curved line.').replace(/data-label="[^"]*"/, 'data-label="Sketch the v–t graph for yesterday’s walk"');
 if(index===20)section=section.replace(/data-label="[^"]*"/, 'data-label="A model with limits"').replaceAll('This is exactly what NASA does to predict where it will be.', 'This simplified model assumes constant velocity. A real trajectory also changes under gravity.');

 return section+(snapshots.find(s=>s.after===index)?comic(snapshots.find(s=>s.after===index)):'');
}).replace(/ data-speaker-notes="[^"]*"/g,'');
let number=0;
html=html.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g,section=>{number++;return section.replace(/data-screen-label="[^"]*"/,`data-screen-label="${String(number).padStart(2,'0')}"`).replace(/Antocci Physics · \d{2} \/ 29/g,`Antocci Physics · ${String(number).padStart(2,'0')} / 30`);});
html = require('../foundation-groups/slide-copy.cjs')(html);
const plain=n=>n.nodeName==='#text'?n.value.replace(/\{\{[^}]+\}\}/g,''):['button','script','style','image'].includes(n.tagName)?'':n.tagName==='sc-if'&&n.attrs.some(a=>/q\dOpen/.test(a.value))?'':(n.childNodes||[]).map(plain).join(' ');
const slides=[...html.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/g)].map((m,i)=>({number:i+1,title:m[1].match(/data-label="([^"]+)"/)[1],text:plain(p5.parseFragment(m[0])).replace(/\s+/g,' ').trim()}));
const vendor='resources/foundations/day-one/vendor';
const libraries=[['react.production.min.js','DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z'],['react-dom.production.min.js','gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1']].map(([file,integrity])=>{const bytes=fs.readFileSync(path.join(vendor,file));if(crypto.createHash('sha384').update(bytes).digest('base64')!==integrity)throw Error('Runtime integrity mismatch');return script(bytes.toString());}).join('\n');
const stage=fs.readFileSync(base+'/deck-stage.js','utf8'),support=fs.readFileSync(base+'/support.js','utf8');
const setup=script(`window.__resources={};window.__resourceBlobs={"./deck-stage.js":new Blob([${JSON.stringify(stage)}],{type:"text/javascript"})};`);
const bridge=fs.readFileSync('scripts/day-one/slides-bridge.js','utf8').replaceAll('physics-day-one-slides-v1','physics-day-four-slides-v1');
const transition=fs.readFileSync('resources/foundations/day-one/slides-transition.css','utf8');
html=html.replace('<script src="./support.js"></script>',()=>libraries+setup+script(bridge)+script(support))
 .replace('<html>','<html lang="en">')
 .replace('</head>',`<style data-lesson-transition>${transition}</style></head>`)
 .replace('<head>',`<head><title>Day 4 · Velocity–time graphs and vectors</title><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">`);
// Keep a normal asset URL: the original style parser splits on semicolons,
// which truncates data URLs before their image payload.
fs.mkdirSync(dest+'/art',{recursive:true});
fs.copyFileSync(base+'/art/asteroid-briefing.png',dest+'/art/asteroid-briefing.png');
fs.writeFileSync(dest+'/day-4.dc.html',html);fs.copyFileSync(vendor+'/LICENSE-react.txt',dest+'/LICENSE-react.txt');
fs.writeFileSync('src/data/foundations/day-four-slides.json',JSON.stringify(slides));
fs.writeFileSync('src/data/foundations/day-four-source.json',JSON.stringify({collaboration:{maxGroupSize:4,primaryRoles:['Slideshow lead','Whiteboard scribe'],secondaryDuties:['Timekeeper','Checker'],individualResponses:true},project:'Asteroid 2026-XJ briefing',file:path.basename(source),sourceSha256:hash(original),runtimeSha256:{support:hash(support),stage:hash(stage)},packagedSha256:hash(html),cover:{file:'art/asteroid-briefing.png',sha256:hash(fs.readFileSync(dest+'/art/asteroid-briefing.png'))},studentSlides:30,originalStudentSlides:26,teacherSlidesExcluded:3,timers:3,answerReveals:5,transition:{type:'fade',durationMs:260,respectsReducedMotion:true},snapshots:snapshots.map(s=>({...s,sha256:hash(fs.readFileSync('public/comics/2026-xj/book-one-day-04-v1/'+s.file))})),notes:'Original executable logic, timers and reveal controls unchanged. Teacher-only slides/notes removed. Four snapshots use viewport crops of existing immutable artwork with text companions. Original cover PNG and comic assets are separately cacheable; the original cover URL avoids the export’s data-URL CSS parsing bug. Clarified individual response directions, changing-velocity graphs, fictional model and angle reference. Original export archived unchanged.'},null,2));
console.log('Packaged '+slides.length+' slides, three timers, five reveals, and four original graphic novel snapshots.');
