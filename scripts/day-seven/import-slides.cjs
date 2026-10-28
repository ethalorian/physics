// Package the original interactive export; preserve its executable logic.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),p5=require('parse5');
const base='resources/foundations/day-seven/original',source=base+'/Day 7 Acceleration.dc.html',dest='public/foundations/day-7-runtime-v1';
const original=fs.readFileSync(source,'utf8'),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const script=code=>`<script>${code.replace(/<\/script/gi,'<\\/script')}</script>`;
const sourceSections=[...original.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)];
if(sourceSections.length!==29||sourceSections.slice(26).some(m=>!m[0].includes('data-deck-skip')))throw Error('Unexpected source structure');
const snapshots=[
  {
    "after": 9,
    "page": 25,
    "file": "page-01.webp",
    "y": 1174,
    "height": 310,
    "title": "What changes each second?",
    "alt": "Nadia and Mei describe acceleration as how much velocity changes each second and in which direction. Their notebook shows acceleration equals change in velocity divided by elapsed time.",
    "body": "Acceleration describes a change in velocity. Its units are meters per second, per second.",
    "question": "How does a velocity change differ from a velocity? Explain with your own example.",
    "work": "Part 1 · Compare velocity changes"
  },
  {
    "after": 15,
    "page": 26,
    "file": "page-02.webp",
    "y": 353,
    "height": 310,
    "title": "Read the slope, not the height",
    "alt": "Supplied practice data on a velocity–time graph rise from zero meters per second at zero seconds to twelve meters per second at four seconds. The slope is positive three meters per second squared.",
    "body": "The graph’s height gives velocity. Its slope gives acceleration. These are supplied practice data.",
    "question": "What changes if the line is flat at +5 m/s instead?",
    "work": "Part 2 · Check the graph and prediction"
  },
  {
    "after": 18,
    "page": 27,
    "file": "page-03.webp",
    "y": 1109,
    "height": 365,
    "title": "Keep the initial velocity",
    "alt": "Eli presents a practice cart with initial velocity two meters per second, acceleration three meters per second squared and time four seconds. Nadia calculates final velocity as two plus three times four, which equals fourteen meters per second.",
    "body": "The cart already moves at the start. Under constant acceleration, v = v₀ + at.",
    "question": "Why does at give the velocity change, rather than always giving the final velocity?",
    "work": "Part 2 · Check the graph and prediction"
  },
  {
    "after": 20,
    "page": 28,
    "file": "page-04.webp",
    "y": 380,
    "height": 522,
    "title": "A small change is still a change",
    "alt": "An Earth-only classroom estimate gives acceleration magnitude 2.8 times ten to the minus eight meters per second squared. If constant for 1.6 times ten to the seven seconds, the change is about 0.448 meters per second. Mr. Antocci says the Sun’s effect is larger here and gravity changes along the path.",
    "body": "This is a conditional estimate for a fictional scenario. It is not a complete orbit forecast.",
    "question": "Which assumptions must you check before extending this estimate across a long interval?",
    "work": "Part 3 · Challenge the model claim"
  }
];
function comic(s){return `<section data-label="${s.title}" class="foundation-comic" style="background:#1b1c2e;color:#f6f6fb;font-family:Newsreader,Georgia,serif;padding:64px 88px;box-sizing:border-box;display:flex;flex-direction:column;">
 <div style="font:24px 'IBM Plex Mono',monospace;letter-spacing:2px;color:#a9a7ff;">2026-XJ · What Changes · Graphic novel, page ${s.page}</div>
 <h2 style="font-size:64px;line-height:1.1;font-weight:500;margin:22px 0 30px;">${s.title}</h2>
 <div style="display:grid;grid-template-columns:1.55fr 1fr;gap:52px;align-items:center;flex:1;min-height:0;">
  <svg role="img" aria-label="${s.alt}" viewBox="0 ${s.y} 1024 ${s.height}" style="width:100%;height:auto;max-height:610px;display:block;background:#fff;border:2px solid #9291bf;"><title>${s.alt}</title><image href="/comics/2026-xj/book-one-day-07-v1/${s.file}" width="1024" height="1536"/></svg>
  <div><p style="font-size:32px;line-height:1.4;margin:0 0 28px;">${s.body}</p><p style="font-size:38px;line-height:1.25;margin:0;">${s.question}</p></div>
 </div><div style="font:24px 'IBM Plex Mono',monospace;color:#c8c7e2;margin-top:28px;">${s.work} · Write your own answer in Work.</div>
 <footer style="font:20px 'IBM Plex Mono',monospace;color:#c8c7e2;margin-top:22px;">Fictional story · Original artwork · Day 7</footer></section>`;}
let index=0;
let html=original.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g,section=>{
 if(section.includes('data-deck-skip'))return '';
 index++;
 // Clarify individual authorship and the limits of the Earth-only estimate; logic stays unchanged.
 const change=(before,after)=>{if(!section.includes(before))throw Error('Source clarification missing on slide '+index+': '+before);section=section.replaceAll(before,after);};
 if(index===2)change("Writes the group's answers and notes.","Keeps group notes; each person submits their own answers.");
 if(index===19)section=section.replace(/data-label="[^"]*"/,'data-label="Earth’s pull at the starting separation"');
 if(index===20)section=section.replace(/data-label="[^"]*"/,'data-label="Gravity changes along the path"');
 if(index===19)change("Far below 0.001 m/s² — that's why Day 5's constant-velocity model was a good approximation.","Earth-only estimate at this separation. It does not include the Sun or prove a long-term forecast accurate.");
 if(index===20)change('Constant velocity is approximate but useful — for now. Unit 2 retires it.','Constant velocity is a classroom approximation. Gravity changes along the path; Unit 2 improves the model.');

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
const bridge=fs.readFileSync('scripts/day-one/slides-bridge.js','utf8').replaceAll('physics-day-one-slides-v1','physics-day-seven-slides-v1');
const transition=fs.readFileSync('resources/foundations/day-one/slides-transition.css','utf8');
html=html.replace('<script src="./support.js"></script>',()=>libraries+setup+script(bridge)+script(support))
 .replace('<html>','<html lang="en">')
 .replace('</head>',`<style data-lesson-transition>${transition}</style></head>`)
 .replace('<head>',`<head><title>Day 7 · Acceleration</title><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">`);
// Keep a normal asset URL: the original style parser splits on semicolons,
// which truncates data URLs before their image payload.
fs.mkdirSync(dest+'/art',{recursive:true});
fs.copyFileSync(base+'/art/asteroid-briefing.png',dest+'/art/asteroid-briefing.png');
fs.writeFileSync(dest+'/day-7.dc.html',html);fs.copyFileSync(vendor+'/LICENSE-react.txt',dest+'/LICENSE-react.txt');
fs.writeFileSync('src/data/foundations/day-seven-slides.json',JSON.stringify(slides));
fs.writeFileSync('src/data/foundations/day-seven-source.json',JSON.stringify({collaboration:{maxGroupSize:4,primaryRoles:['Slideshow lead','Whiteboard scribe'],secondaryDuties:['Timekeeper','Checker'],individualResponses:true},project:'Asteroid 2026-XJ briefing',file:path.basename(source),sourceSha256:hash(original),runtimeSha256:{support:hash(support),stage:hash(stage)},packagedSha256:hash(html),cover:{file:'art/asteroid-briefing.png',sha256:hash(fs.readFileSync(dest+'/art/asteroid-briefing.png'))},studentSlides:30,originalStudentSlides:26,teacherSlidesExcluded:3,timers:1,answerReveals:5,transition:{type:'fade',durationMs:260,respectsReducedMotion:true},snapshots:snapshots.map(s=>({...s,sha256:hash(fs.readFileSync('public/comics/2026-xj/book-one-day-07-v1/'+s.file))})),notes:'Original executable logic, the two-minute exit timer and five reveal controls unchanged. Teacher-only slides and notes removed. Four snapshots use viewport crops of approved Day 7 pages 25–28 with text companions; artwork bytes are unchanged. Original cover uses its relative URL. Clarified separate individual responses. Replaced the unsupported claim that a small Earth-only acceleration validates the full constant-velocity forecast: the estimate excludes the Sun and changes along the path. Supplied examples are not collected measurements. Original export archived unchanged.'},null,2));
console.log('Packaged '+slides.length+' slides, one timer, five reveals, and four original graphic novel snapshots.');
