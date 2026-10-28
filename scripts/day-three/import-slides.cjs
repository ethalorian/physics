// Package the original interactive export; preserve its executable logic.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),p5=require('parse5');
const base='resources/foundations/day-three/original',source=base+'/Day 3 Velocity.dc.html',dest='public/foundations/day-3-runtime-v1';
const original=fs.readFileSync(source,'utf8'),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const script=code=>`<script>${code.replace(/<\/script/gi,'<\\/script')}</script>`;
const sourceSections=[...original.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)];
if(sourceSections.length!==32||sourceSections.slice(29).some(m=>!m[0].includes('data-deck-skip')))throw Error('Unexpected source structure');
const snapshots=[
 {
  "after": 11,
  "page": 9,
  "file": "page-01.webp",
  "y": 939,
  "height": 566,
  "title": "Same displacement, different velocity",
  "alt": "Maz and Eli each walk six meters east. Maz takes six seconds and Eli takes twelve. Maz averages one meter per second east; Eli averages half a meter per second east.",
  "body": "Both walkers reach the same endpoint. Their elapsed times differ.",
  "question": "Why does the same displacement produce different average velocities?",
  "work": "Part 1 · Compare your motion predictions"
 },
 {
  "after": 17,
  "page": 10,
  "file": "page-02.webp",
  "y": 735,
  "height": 301,
  "title": "A round trip still includes motion",
  "alt": "The notebook shows six meters east and six west in twelve seconds. Average speed is one meter per second and average velocity is zero.",
  "body": "The route has 12 m of distance and zero displacement over 12 s.",
  "question": "Which measurements would reveal the motion that the zero average velocity hides?",
  "work": "Part 2 · Collect and check your trials"
 },
 {
  "after": 22,
  "page": 11,
  "file": "page-03.webp",
  "y": 350,
  "height": 356,
  "title": "Walk the graph, then explain it",
  "alt": "A position–time graph joins zero seconds and one meter, four seconds and five meters, six seconds and five meters, then ten seconds and one meter.",
  "body": "The rising, flat and falling segments tell different parts of the trip.",
  "question": "How can +1, 0 and −1 m/s describe the segments while the whole-trip average is zero?",
  "work": "Part 3 · Defend the whole motion story"
 }
];
function comic(s){return `<section data-label="${s.title}" class="foundation-comic" style="background:#1b1c2e;color:#f6f6fb;font-family:Newsreader,Georgia,serif;padding:64px 88px;box-sizing:border-box;display:flex;flex-direction:column;">
 <div style="font:24px 'IBM Plex Mono',monospace;letter-spacing:2px;color:#a9a7ff;">2026-XJ · The Line Moves · Graphic novel, page ${s.page}</div>
 <h2 style="font-size:64px;line-height:1.1;font-weight:500;margin:22px 0 30px;">${s.title}</h2>
 <div style="display:grid;grid-template-columns:1.55fr 1fr;gap:52px;align-items:center;flex:1;min-height:0;">
  <svg role="img" aria-label="${s.alt}" viewBox="0 ${s.y} 1024 ${s.height}" style="width:100%;height:auto;max-height:610px;display:block;background:#fff;border:2px solid #9291bf;"><title>${s.alt}</title><image href="/comics/2026-xj/book-one-day-03-v1/${s.file}" width="1024" height="1536"/></svg>
  <div><p style="font-size:32px;line-height:1.4;margin:0 0 28px;">${s.body}</p><p style="font-size:38px;line-height:1.25;margin:0;">${s.question}</p></div>
 </div><div style="font:24px 'IBM Plex Mono',monospace;color:#c8c7e2;margin-top:28px;">${s.work} · Write your own answer in Work.</div>
 <footer style="font:20px 'IBM Plex Mono',monospace;color:#c8c7e2;margin-top:22px;">Fictional story · Original artwork · Day 3</footer></section>`;}
let index=0;
let html=original.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g,section=>{
 if(section.includes('data-deck-skip'))return '';
 index++;
 // Keep the reviewed logic; clarify equipment-dependent setup and fictional data.
 if(index===4)section=section.replace("The walker starts at the 0.5 m mark — the detector can't read anything closer.","Start at a distance your teacher approves for this detector. Check its minimum range first.");
 if(index===7)section=section.replace("NASA's trajectory data gives us 2026-XJ's velocity", "Our fictional model includes 2026-XJ's velocity");
 if(index===13)section=section.replaceAll('Build the definitions from student responses. Then convert km/h to m/s as a class.', 'Explain both definitions in your own words. Then compare units with your partner.');
 if(index===14)section=section.replace('>Given<', '>Fictional model<');
 if(index===23)section=section.replace(/data-label="[^"]*"/, 'data-label="Velocity in the fictional model"').replaceAll("NASA's data is a position–time graph — at huge scale.", 'Our fictional model uses position–time data.').replace("Know the slope at any point, and you know the asteroid's velocity there.", 'A slope gives velocity along the plotted axis; a full trajectory needs all relevant directions.');

 return section+(snapshots.find(s=>s.after===index)?comic(snapshots.find(s=>s.after===index)):'');
}).replace(/ data-speaker-notes="[^"]*"/g,'');
let number=0;
html=html.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g,section=>{number++;return section.replace(/data-screen-label="[^"]*"/,`data-screen-label="${String(number).padStart(2,'0')}"`).replace(/Antocci Physics · \d{2} \/ 32/g,`Antocci Physics · ${String(number).padStart(2,'0')} / 32`);});
html = require('../foundation-groups/slide-copy.cjs')(html);
const plain=n=>n.nodeName==='#text'?n.value.replace(/\{\{[^}]+\}\}/g,''):['button','script','style','image'].includes(n.tagName)?'':n.tagName==='sc-if'&&n.attrs.some(a=>/q\dOpen/.test(a.value))?'':(n.childNodes||[]).map(plain).join(' ');
const slides=[...html.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/g)].map((m,i)=>({number:i+1,title:m[1].match(/data-label="([^"]+)"/)[1],text:plain(p5.parseFragment(m[0])).replace(/\s+/g,' ').trim()}));
const vendor='resources/foundations/day-one/vendor';
const libraries=[['react.production.min.js','DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z'],['react-dom.production.min.js','gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1']].map(([file,integrity])=>{const bytes=fs.readFileSync(path.join(vendor,file));if(crypto.createHash('sha384').update(bytes).digest('base64')!==integrity)throw Error('Runtime integrity mismatch');return script(bytes.toString());}).join('\n');
const stage=fs.readFileSync(base+'/deck-stage.js','utf8'),support=fs.readFileSync(base+'/support.js','utf8');
const setup=script(`window.__resources={};window.__resourceBlobs={"./deck-stage.js":new Blob([${JSON.stringify(stage)}],{type:"text/javascript"})};`);
const bridge=fs.readFileSync('scripts/day-one/slides-bridge.js','utf8').replaceAll('physics-day-one-slides-v1','physics-day-three-slides-v1');
const transition=fs.readFileSync('resources/foundations/day-one/slides-transition.css','utf8');
html=html.replace('<script src="./support.js"></script>',()=>libraries+setup+script(bridge)+script(support))
 .replace('<html>','<html lang="en">')
 .replace('</head>',`<style data-lesson-transition>${transition}</style></head>`)
 .replace('<head>',`<head><title>Day 3 · Velocity</title><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">`);
// Keep a normal asset URL: the original style parser splits on semicolons,
// which truncates data URLs before their image payload.
fs.mkdirSync(dest+'/art',{recursive:true});
fs.copyFileSync(base+'/art/asteroid-briefing.png',dest+'/art/asteroid-briefing.png');
fs.writeFileSync(dest+'/day-3.dc.html',html);fs.copyFileSync(vendor+'/LICENSE-react.txt',dest+'/LICENSE-react.txt');
fs.writeFileSync('src/data/foundations/day-three-slides.json',JSON.stringify(slides));
fs.writeFileSync('src/data/foundations/day-three-source.json',JSON.stringify({collaboration:{maxGroupSize:4,primaryRoles:['Slideshow lead','Whiteboard scribe'],secondaryDuties:['Timekeeper','Checker'],individualResponses:true},project:'Asteroid 2026-XJ briefing',file:path.basename(source),sourceSha256:hash(original),runtimeSha256:{support:hash(support),stage:hash(stage)},packagedSha256:hash(html),cover:{file:'art/asteroid-briefing.png',sha256:hash(fs.readFileSync(dest+'/art/asteroid-briefing.png'))},studentSlides:32,originalStudentSlides:29,teacherSlidesExcluded:3,timers:2,answerReveals:5,transition:{type:'fade',durationMs:260,respectsReducedMotion:true},snapshots:snapshots.map(s=>({...s,sha256:hash(fs.readFileSync('public/comics/2026-xj/book-one-day-03-v1/'+s.file))})),notes:'Original executable logic, timers and reveal controls unchanged. Teacher-only slides/notes removed. Three snapshots use viewport crops of existing immutable artwork with text companions. Original cover PNG and comic assets are separately cacheable; the original cover URL avoids the export’s data-URL CSS parsing bug. Clarified detector-specific setup guidance, student-facing directions and fictional trajectory claims. Original export archived unchanged.'},null,2));
console.log('Packaged '+slides.length+' slides, two timers, five reveals, and three original graphic novel snapshots.');
