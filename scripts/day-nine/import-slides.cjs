// Package the original interactive export; preserve its executable logic.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),p5=require('parse5');
const base='resources/foundations/day-nine/original',source=base+'/Day 9 Newtons First Law.dc.html',dest='public/foundations/day-9-runtime-v1';
const original=fs.readFileSync(source,'utf8'),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const script=code=>`<script>${code.replace(/<\/script/gi,'<\\/script')}</script>`;
const sourceSections=[...original.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)];
if(sourceSections.length!==30||sourceSections.slice(27).some(m=>!m[0].includes('data-deck-skip')))throw Error('Unexpected source structure');
const snapshots=[
  {
    "after": 9,
    "page": 33,
    "file": "page-01.webp",
    "y": 925,
    "height": 198,
    "title": "The push ended. The motion did not.",
    "alt": "After Maz releases the cart, it keeps moving. The novel states that the push ended but the motion did not.",
    "body": "The hand loses contact, so its force ends. The cart can still move. Real surface and air interactions can change its velocity.",
    "question": "Which forces remain after release? How would an ideal zero-net-force case differ?",
    "work": "Part 1 · Explain motion after the push"
  },
  {
    "after": 16,
    "page": 34,
    "file": "page-02.webp",
    "y": 790,
    "height": 302,
    "title": "One coin, two directions",
    "alt": "Mr. Antocci explains that friction had little time to change the coin’s horizontal velocity. Mei explains that gravity made it fall after the card was removed.",
    "body": "The supplied story shows little sideways motion and a downward fall. These are story observations, not measurements you collected.",
    "question": "Which interaction changes each component of velocity? Does inertia supply another force?",
    "work": "Part 2 · Challenge the demonstration explanation"
  },
  {
    "after": 17,
    "page": 35,
    "file": "page-03.webp",
    "y": 608,
    "height": 540,
    "title": "A passenger keeps moving",
    "alt": "In a classroom toy model, the car stops while the passenger continues forward. Nadia says no new forward force threw it, and Mei explains that the strap supplies the force that slows it.",
    "body": "Use the classroom frame. The car and passenger can change velocity at different times because different interactions act on them.",
    "question": "Why does the passenger move forward relative to the car? Which interaction slows the passenger?",
    "work": "Part 2 · Compare the interaction explanations"
  },
  {
    "after": 21,
    "page": 36,
    "file": "page-04.webp",
    "y": 438,
    "height": 280,
    "title": "No floor does not mean no force",
    "alt": "Mr. Antocci says gravity still acts, especially the Sun’s. Mei says zero net force is a model, not the asteroid’s actual situation.",
    "body": "Space lacks the classroom floor, but gravitational interactions remain. Constant velocity is a conditional model.",
    "question": "What does zero net force predict? What evidence would challenge that model for the asteroid?",
    "work": "Part 3 · Test the limits of the model"
  }
];
function comic(s){return `<section data-label="${s.title}" class="foundation-comic" style="background:#1b1c2e;color:#f6f6fb;font-family:Newsreader,Georgia,serif;padding:64px 88px;box-sizing:border-box;display:flex;flex-direction:column;">
 <div style="font:24px 'IBM Plex Mono',monospace;letter-spacing:2px;color:#a9a7ff;">2026-XJ · Keep Going · Graphic novel, page ${s.page}</div>
 <h2 style="font-size:64px;line-height:1.1;font-weight:500;margin:22px 0 30px;">${s.title}</h2>
 <div style="display:grid;grid-template-columns:1.55fr 1fr;gap:52px;align-items:center;flex:1;min-height:0;">
  <svg role="img" aria-label="${s.alt}" viewBox="0 ${s.y} 1024 ${s.height}" style="width:100%;height:auto;max-height:610px;display:block;background:#fff;border:2px solid #9291bf;"><title>${s.alt}</title><image href="/comics/2026-xj/book-one-day-09-v1/${s.file}" width="1024" height="1536"/></svg>
  <div><p style="font-size:32px;line-height:1.4;margin:0 0 28px;">${s.body}</p><p style="font-size:38px;line-height:1.25;margin:0;">${s.question}</p></div>
 </div><div style="font:24px 'IBM Plex Mono',monospace;color:#c8c7e2;margin-top:28px;">${s.work} · Write your own answer in Work.</div>
 <footer style="font:20px 'IBM Plex Mono',monospace;color:#c8c7e2;margin-top:22px;">Fictional story · Original artwork · Day 9</footer></section>`;}
let index=0;
let html=original.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g,section=>{
 if(section.includes('data-deck-skip'))return '';
 index++;
 // Preserve executable logic; clarify assumptions, individual authorship and the timer caption.
 const change=(before,after)=>{if(!section.includes(before))throw Error('Source clarification missing on slide '+index+': '+before);section=section.replaceAll(before,after);};
 if(index===2)change("Writes the group's answers and notes.","Keeps group notes; each person submits their own answers.");
 if(index===4)change("There's no friction in space — good for predictability, bad for stopping it.","No classroom floor in space — but gravity still changes velocity.");
 if(index===10)change('shown mostly by thought experiments','experiments and idealized motion with less resistance');
 if(index===11)change('An object in motion stays in motion, and an object at rest stays at rest — unless acted on by a net force.','In an inertial frame, zero net external force means constant velocity — including rest.');
 if(index===16){change('pull the cloth from under a stack of cups.','watch the teacher pull the cloth from under plastic cups.');change('flick the card off your finger.','watch a card removed from under a coin over a cup.');change('For each: predict first, then explain with inertia.','Predict first, then explain the interactions. Label story evidence if using the novel.');}
 if(index===17)change("Recorder writes the group's answer","Each person records their own reasoning");
 if(index===20){change("In space there's no air resistance and no friction.","Idealization: net external force is zero in an inertial frame.");change('It would keep going at constant velocity — forever.','Velocity would stay constant while that condition holds.');change('Unless something pushes it.','The actual asteroid still feels gravity.');}
 if(index===27)change("What does Newton's 1st Law tell us about why the asteroid keeps coming?","Distinguish the zero-net-force model from the gravitational forces that remain.");
 const titles={6:'Why do some objects stop sooner?',11:'The zero-net-force condition',17:'Why does the passenger continue forward?',20:'Constant velocity is a conditional model'};
 if(titles[index])section=section.replace(/data-label="[^"]*"/,'data-label="'+titles[index]+'"');

 return section+(snapshots.find(s=>s.after===index)?comic(snapshots.find(s=>s.after===index)):'');
}).replace(/ data-speaker-notes="[^"]*"/g,'');
let number=0;
html=html.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g,section=>{number++;return section.replace(/data-screen-label="[^"]*"/,`data-screen-label="${String(number).padStart(2,'0')}"`).replace(/Antocci Physics · \d{2} \/ 30/g,`Antocci Physics · ${String(number).padStart(2,'0')} / 31`);});
html = require('../foundation-groups/slide-copy.cjs')(html);
const plain=n=>n.nodeName==='#text'?n.value.replace(/\{\{[^}]+\}\}/g,''):['button','script','style','image'].includes(n.tagName)?'':n.tagName==='sc-if'&&n.attrs.some(a=>/q\dOpen/.test(a.value))?'':(n.childNodes||[]).map(plain).join(' ');
const slides=[...html.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/g)].map((m,i)=>({number:i+1,title:m[1].match(/data-label="([^"]+)"/)[1],text:plain(p5.parseFragment(m[0])).replace(/\s+/g,' ').trim()}));
const vendor='resources/foundations/day-one/vendor';
const libraries=[['react.production.min.js','DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z'],['react-dom.production.min.js','gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1']].map(([file,integrity])=>{const bytes=fs.readFileSync(path.join(vendor,file));if(crypto.createHash('sha384').update(bytes).digest('base64')!==integrity)throw Error('Runtime integrity mismatch');return script(bytes.toString());}).join('\n');
const stage=fs.readFileSync(base+'/deck-stage.js','utf8'),support=fs.readFileSync(base+'/support.js','utf8');
const setup=script(`window.__resources={};window.__resourceBlobs={"./deck-stage.js":new Blob([${JSON.stringify(stage)}],{type:"text/javascript"})};`);
const bridge=fs.readFileSync('scripts/day-one/slides-bridge.js','utf8').replaceAll('physics-day-one-slides-v1','physics-day-nine-slides-v1');
const transition=fs.readFileSync('resources/foundations/day-one/slides-transition.css','utf8');
html=html.replace('<script src="./support.js"></script>',()=>libraries+setup+script(bridge)+script(support))
 .replace('<html>','<html lang="en">')
 .replace('</head>',`<style data-lesson-transition>${transition}</style></head>`)
 .replace('<head>',`<head><title>Day 9 · Newton’s first law and inertia</title><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">`);
// Keep a normal asset URL: the original style parser splits on semicolons,
// which truncates data URLs before their image payload.
fs.mkdirSync(dest+'/art',{recursive:true});
fs.copyFileSync(base+'/art/asteroid-briefing.png',dest+'/art/asteroid-briefing.png');
fs.writeFileSync(dest+'/day-9.dc.html',html);fs.copyFileSync(vendor+'/LICENSE-react.txt',dest+'/LICENSE-react.txt');
fs.writeFileSync('src/data/foundations/day-nine-slides.json',JSON.stringify(slides));
fs.writeFileSync('src/data/foundations/day-nine-source.json',JSON.stringify({collaboration:{maxGroupSize:4,primaryRoles:['Slideshow lead','Whiteboard scribe'],secondaryDuties:['Timekeeper','Checker'],individualResponses:true},project:'Asteroid 2026-XJ briefing',file:path.basename(source),sourceSha256:hash(original),runtimeSha256:{support:hash(support),stage:hash(stage)},packagedSha256:hash(html),cover:{file:'art/asteroid-briefing.png',sha256:hash(fs.readFileSync(dest+'/art/asteroid-briefing.png'))},studentSlides:31,originalStudentSlides:27,teacherSlidesExcluded:3,timers:1,answerReveals:6,transition:{type:'fade',durationMs:260,respectsReducedMotion:true},snapshots:snapshots.map(s=>({...s,sha256:hash(fs.readFileSync('public/comics/2026-xj/book-one-day-09-v1/'+s.file))})),notes:"Original executable logic, two-minute exit timer and six answer reveals unchanged. Teacher-only slides and notes removed. Four viewport snapshots of approved Day 9 pages 33–36 retain original artwork bytes and have text companions. Original cover uses its relative URL. Clarified individual authorship and demonstration evidence sources, teacher-led cup/card demonstrations, inertial-frame wording and the conditional zero-net-force model. Replaced claims that no space friction ensures constant velocity with explicit gravity/idealization limits. Clarified the historical summary to include experiments and idealization. This is an ordinary foundation, not a designated lab. Original export archived unchanged."},null,2));
console.log('Packaged '+slides.length+' slides, one timer, six reveals, and four original graphic novel snapshots.');
