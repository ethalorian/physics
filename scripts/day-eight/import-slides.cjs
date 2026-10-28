// Package the original interactive export; preserve its executable logic.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),p5=require('parse5');
const base='resources/foundations/day-eight/original',source=base+'/Day 8 Constant Acceleration Problem Solving.dc.html',dest='public/foundations/day-8-runtime-v1';
const original=fs.readFileSync(source,'utf8'),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const script=code=>`<script>${code.replace(/<\/script/gi,'<\\/script')}</script>`;
const sourceSections=[...original.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)];
if(sourceSections.length!==29||sourceSections.slice(26).some(m=>!m[0].includes('data-deck-skip')))throw Error('Unexpected source structure');
const snapshots=[
  {
    "after": 11,
    "page": 29,
    "file": "page-01.webp",
    "y": 1142,
    "height": 354,
    "title": "Choose from what you know",
    "alt": "Nadia explains that the equation must connect what is known to what is needed. The notebook shows v squared equals initial velocity squared plus twice acceleration times displacement. No time is needed.",
    "body": "A stop supplies a hidden given: final velocity is zero. Choose an equation from the quantities, not the story.",
    "question": "Which known quantities let you find a stopping displacement without first finding time?",
    "work": "Part 1 · Defend your equation choice"
  },
  {
    "after": 16,
    "page": 30,
    "file": "page-02.webp",
    "y": 0,
    "height": 620,
    "title": "Negative acceleration, positive displacement",
    "alt": "The novel’s separate practice car brakes from positive thirty meters per second at constant negative six meters per second squared. The calculation gives positive seventy-five meters of braking displacement. Nadia explains that it is still moving forward while slowing; reaction distance is excluded.",
    "body": "The novel uses +30 m/s and −6 m/s². The preceding slide uses +20 m/s and −4 m/s². Both end at rest.",
    "question": "Why do both displacements stay positive? Check each result using time and average velocity.",
    "work": "Part 2 · Check the result another way"
  },
  {
    "after": 21,
    "page": 32,
    "file": "page-04.webp",
    "y": 400,
    "height": 292,
    "title": "Different unknowns, different equations",
    "alt": "The novel’s train starts from rest with acceleration 0.50 meters per second squared and reaches eighty meters per second in 160 seconds. A separate cart starts at two meters per second and accelerates at 1.5 meters per second squared for four seconds, moving twenty meters.",
    "body": "These are separate practice examples. The train’s unknown is time; the cart’s unknown is displacement.",
    "question": "Which quantities explain the different equation choices? What constant-acceleration assumption do they share?",
    "work": "Part 3 · Transfer the method"
  },
  {
    "after": 23,
    "page": 31,
    "file": "page-03.webp",
    "y": 915,
    "height": 283,
    "title": "At the top, which quantity is zero?",
    "alt": "A separate paper model ignores air resistance and chooses upward positive. With launch velocity fifteen meters per second, final vertical velocity zero and acceleration negative 9.8 meters per second squared, the calculation gives a rise of about 11.5 meters.",
    "body": "The novel’s paper model launches at 15 m/s; the slide’s example uses 14 m/s. Gravity still acts at the top.",
    "question": "Why is the zero assigned to velocity rather than acceleration? Explain the different rises.",
    "work": "Part 3 · Transfer the method"
  }
];
function comic(s){return `<section data-label="${s.title}" class="foundation-comic" style="background:#1b1c2e;color:#f6f6fb;font-family:Newsreader,Georgia,serif;padding:64px 88px;box-sizing:border-box;display:flex;flex-direction:column;">
 <div style="font:24px 'IBM Plex Mono',monospace;letter-spacing:2px;color:#a9a7ff;">2026-XJ · No Clock · Graphic novel, page ${s.page}</div>
 <h2 style="font-size:64px;line-height:1.1;font-weight:500;margin:22px 0 30px;">${s.title}</h2>
 <div style="display:grid;grid-template-columns:1.55fr 1fr;gap:52px;align-items:center;flex:1;min-height:0;">
  <svg role="img" aria-label="${s.alt}" viewBox="0 ${s.y} 1024 ${s.height}" style="width:100%;height:auto;max-height:610px;display:block;background:#fff;border:2px solid #9291bf;"><title>${s.alt}</title><image href="/comics/2026-xj/book-one-day-08-v1/${s.file}" width="1024" height="1536"/></svg>
  <div><p style="font-size:32px;line-height:1.4;margin:0 0 28px;">${s.body}</p><p style="font-size:38px;line-height:1.25;margin:0;">${s.question}</p></div>
 </div><div style="font:24px 'IBM Plex Mono',monospace;color:#c8c7e2;margin-top:28px;">${s.work} · Write your own answer in Work.</div>
 <footer style="font:20px 'IBM Plex Mono',monospace;color:#c8c7e2;margin-top:22px;">Fictional story · Original artwork · Day 8</footer></section>`;}
let index=0;
let html=original.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g,section=>{
 if(section.includes('data-deck-skip'))return '';
 index++;
 // Preserve executable logic; clarify assumptions, individual authorship and the timer caption.
 const change=(before,after)=>{if(!section.includes(before))throw Error('Source clarification missing on slide '+index+': '+before);section=section.replaceAll(before,after);};
 if(index===2)change("Writes the group's answers and notes.","Keeps group notes; each person submits their own answers.");
 if(index===4)change("Same as Day 7: right now, 2026-XJ's velocity is nearly constant.","Day 7: constant velocity was a classroom approximation, not a validated orbit forecast.");
 if(index===10)change('Use Δx for signed displacement in all three.','Δx means signed displacement. These equations assume constant acceleration.');
 if(index===19)change("Recorder writes the group's answer","Each person records their own reasoning");
 if(index===26)change('≈ 2 min','≈ 3 min');
 if(index===17)section=section.replace(/data-label="[^"]*"/,'data-label="Check displacement with average velocity"');
 if(index===26)section=section.replace(/data-label="[^"]*"/,'data-label="Exit ticket · individual"');

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
const bridge=fs.readFileSync('scripts/day-one/slides-bridge.js','utf8').replaceAll('physics-day-one-slides-v1','physics-day-eight-slides-v1');
const transition=fs.readFileSync('resources/foundations/day-one/slides-transition.css','utf8');
html=html.replace('<script src="./support.js"></script>',()=>libraries+setup+script(bridge)+script(support))
 .replace('<html>','<html lang="en">')
 .replace('</head>',`<style data-lesson-transition>${transition}</style></head>`)
 .replace('<head>',`<head><title>Day 8 · Constant acceleration problem-solving</title><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">`);
// Keep a normal asset URL: the original style parser splits on semicolons,
// which truncates data URLs before their image payload.
fs.mkdirSync(dest+'/art',{recursive:true});
fs.copyFileSync(base+'/art/asteroid-briefing.png',dest+'/art/asteroid-briefing.png');
fs.writeFileSync(dest+'/day-8.dc.html',html);fs.copyFileSync(vendor+'/LICENSE-react.txt',dest+'/LICENSE-react.txt');
fs.writeFileSync('src/data/foundations/day-eight-slides.json',JSON.stringify(slides));
fs.writeFileSync('src/data/foundations/day-eight-source.json',JSON.stringify({collaboration:{maxGroupSize:4,primaryRoles:['Slideshow lead','Whiteboard scribe'],secondaryDuties:['Timekeeper','Checker'],individualResponses:true},project:'Asteroid 2026-XJ briefing',file:path.basename(source),sourceSha256:hash(original),runtimeSha256:{support:hash(support),stage:hash(stage)},packagedSha256:hash(html),cover:{file:'art/asteroid-briefing.png',sha256:hash(fs.readFileSync(dest+'/art/asteroid-briefing.png'))},studentSlides:30,originalStudentSlides:26,teacherSlidesExcluded:3,timers:2,answerReveals:8,transition:{type:'fade',durationMs:260,respectsReducedMotion:true},snapshots:snapshots.map(s=>({...s,sha256:hash(fs.readFileSync('public/comics/2026-xj/book-one-day-08-v1/'+s.file))})),notes:'Original executable logic, the 20-minute pair timer, three-minute exit timer and eight reveal controls unchanged. Exit caption corrected from two to three minutes to match the original runtime default. Teacher-only slides and notes removed. Four snapshots use viewport crops of approved Day 8 pages 29–32 with text companions; artwork bytes are unchanged. Original cover uses its relative URL. Clarified separate individual answers and group reflections. Replaced the unsupported nearly-constant asteroid-velocity claim with an explicit classroom-approximation limitation. Clarified that displacement is signed and that all three equations assume constant acceleration. Novel and slide examples have different supplied numbers; captions distinguish them. Original export archived unchanged.'},null,2));
console.log('Packaged '+slides.length+' slides, two timers, eight reveals, and four original graphic novel snapshots.');
