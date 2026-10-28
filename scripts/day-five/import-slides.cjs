// Package the original interactive export; preserve its executable logic.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),p5=require('parse5');
const base='resources/foundations/day-five/original',source=base+'/Day 5 Predicting Position.dc.html',dest='public/foundations/day-5-runtime-v1';
const original=fs.readFileSync(source,'utf8'),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const script=code=>`<script>${code.replace(/<\/script/gi,'<\\/script')}</script>`;
const sourceSections=[...original.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)];
if(sourceSections.length!==29||sourceSections.slice(26).some(m=>!m[0].includes('data-deck-skip')))throw Error('Unexpected source structure');
const snapshots=[
  {
    "after": 9,
    "page": 17,
    "file": "page-01.webp",
    "y": 608,
    "height": 556,
    "title": "Choose the axes before calculating",
    "alt": "The classroom model starts at positive 120 million kilometers on the x axis with Earth at the origin. Toward-Earth motion has negative x velocity. Maz and Nadia explain that changing axes changes signs, not the motion.",
    "body": "Day 5 uses the novel’s fixed axes: +x points toward the starting location; +y is sideways.",
    "question": "Why is toward-Earth velocity negative on these axes?",
    "work": "Part 1 · Check the start, change and axes"
  },
  {
    "after": 15,
    "page": 18,
    "file": "page-02.webp",
    "y": 308,
    "height": 752,
    "title": "A negative coordinate is not a collision",
    "alt": "Eli asks whether negative x means a collision. Maz points to the positive y coordinate. The straight model path starts at 120 million kilometers on x and ends at negative 11.36 million x and positive 35.20 million y, passing above Earth.",
    "body": "Use both coordinates to describe the endpoint. The six-month separation is about 37 million km.",
    "question": "Why is this endpoint distance different from closest approach?",
    "work": "Part 2 · Check the two-dimensional prediction"
  },
  {
    "after": 21,
    "page": 19,
    "file": "page-03.webp",
    "y": 631,
    "height": 472,
    "title": "The window is part of the answer",
    "alt": "Eli and Maz discuss measurement limits. A rectangle around the predicted endpoint extends 3.25 million kilometers from the center in each coordinate. It represents bounds on x and y, not an impact probability.",
    "body": "50,000 + 0.200 × 16,000,000 = 3,250,000 km in each coordinate.",
    "question": "What is the full width? What does this window leave out?",
    "work": "Part 3 · Defend the window and its limits"
  },
  {
    "after": 24,
    "page": 20,
    "file": "page-04.webp",
    "y": 0,
    "height": 537,
    "title": "Test what the model leaves out",
    "alt": "Mr. Antocci says the window covers only the measurement limits included. Nadia asks about the Sun’s gravity. Maz circles constant velocity because gravity changes velocity and the straight-line model leaves it out.",
    "body": "Measurement bounds do not automatically include missing physics.",
    "question": "What observation would test constant velocity, and what model change would address gravity?",
    "work": "Part 3 · Defend the window and its limits"
  }
];
function comic(s){return `<section data-label="${s.title}" class="foundation-comic" style="background:#1b1c2e;color:#f6f6fb;font-family:Newsreader,Georgia,serif;padding:64px 88px;box-sizing:border-box;display:flex;flex-direction:column;">
 <div style="font:24px 'IBM Plex Mono',monospace;letter-spacing:2px;color:#a9a7ff;">2026-XJ · The Window · Graphic novel, page ${s.page}</div>
 <h2 style="font-size:64px;line-height:1.1;font-weight:500;margin:22px 0 30px;">${s.title}</h2>
 <div style="display:grid;grid-template-columns:1.55fr 1fr;gap:52px;align-items:center;flex:1;min-height:0;">
  <svg role="img" aria-label="${s.alt}" viewBox="0 ${s.y} 1024 ${s.height}" style="width:100%;height:auto;max-height:610px;display:block;background:#fff;border:2px solid #9291bf;"><title>${s.alt}</title><image href="/comics/2026-xj/book-one-day-05-v1/${s.file}" width="1024" height="1536"/></svg>
  <div><p style="font-size:32px;line-height:1.4;margin:0 0 28px;">${s.body}</p><p style="font-size:38px;line-height:1.25;margin:0;">${s.question}</p></div>
 </div><div style="font:24px 'IBM Plex Mono',monospace;color:#c8c7e2;margin-top:28px;">${s.work} · Write your own answer in Work.</div>
 <footer style="font:20px 'IBM Plex Mono',monospace;color:#c8c7e2;margin-top:22px;">Fictional story · Original artwork · Day 5</footer></section>`;}
let index=0;
let html=original.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g,section=>{
 if(section.includes('data-deck-skip'))return '';
 index++;
 // Preserve every interactive control; clarify inputs and use the novel's fixed axes throughout.
 const change=(before,after)=>{if(!section.includes(before))throw Error('Source correction missing on slide '+index+': '+before);section=section.replaceAll(before,after);};
 if(index===2)change("Writes the group's answers and notes.", "Keeps group notes; each person submits their own answers.");
 if(index===4){change("We know 2026-XJ's current position and velocity, with components calculated yesterday.","Our fictional model supplies a starting position and velocity. Day 5 uses Earth at the origin and +x toward the asteroid’s start.");change('Using those components, we predict where 2026-XJ will be in 6 months.','Use both components to predict a position after six months, assuming fixed Earth and constant velocity.');}
 if(index===10){change('1.2 × 10⁸ km from Earth','(+1.2 × 10⁸ km, 0)');change('Velocity toward Earth','x velocity · toward Earth');change('≈ 8,210 m/s','−8,210 m/s = −8.210 km/s');change('Velocity perpendicular','y velocity · sideways');change('≈ 2,200 m/s','+2,200 m/s = +2.200 km/s');}
 if(index===16)change('Position: ±50,000 km. Velocity: ±200 m/s.','Each coordinate: starting position ±50,000 km; velocity component ±0.200 km/s. Treat elapsed time as exact.');
 if(index===17){change('Use the uncertainties to find the range of possible positions.','For each coordinate, add the initial bound to the velocity bound × time.');change('Why is the real window even bigger than ours?','Which effects does this window leave out?');}
 if(index===18){change('Put Earth at (0, 0) and the asteroid initially at (−1.2 × 10⁸ km, 0). Define +x toward Earth from that initial position.','Put Earth at (0, 0) and the asteroid initially at (+1.2 × 10⁸ km, 0). Define +x toward the initial asteroid location and +y sideways.');change('Use v = 8.5 km/s at 15° above +x. Let six months mean','Use vₓ = −8.210 km/s and vᵧ = +2.200 km/s. The direction is 15° from −x toward +y. Let six months mean');}
 if(index===20){change('v<sub>x</sub> ≈ 8.210 km/s','v<sub>x</sub> ≈ −8.210 km/s');change('= −1.20 × 10⁸ + 8.210(1.6 × 10⁷)','= +1.20 × 10⁸ − 8.210(1.6 × 10⁷)');change('≈ +1.14 × 10⁷ km','≈ −1.14 × 10⁷ km');}
 if(index===22)section=section.replace(/data-label="[^"]*"/, 'data-label="The scenario is fiction. The methods are real."');
 if(index===23)section=section.replace(/data-label="[^"]*"/, 'data-label="Position and displacement are different vectors"');

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
const bridge=fs.readFileSync('scripts/day-one/slides-bridge.js','utf8').replaceAll('physics-day-one-slides-v1','physics-day-five-slides-v1');
const transition=fs.readFileSync('resources/foundations/day-one/slides-transition.css','utf8');
html=html.replace('<script src="./support.js"></script>',()=>libraries+setup+script(bridge)+script(support))
 .replace('<html>','<html lang="en">')
 .replace('</head>',`<style data-lesson-transition>${transition}</style></head>`)
 .replace('<head>',`<head><title>Day 5 · Predicting position and uncertainty</title><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">`);
// Keep a normal asset URL: the original style parser splits on semicolons,
// which truncates data URLs before their image payload.
fs.mkdirSync(dest+'/art',{recursive:true});
fs.copyFileSync(base+'/art/asteroid-briefing.png',dest+'/art/asteroid-briefing.png');
fs.writeFileSync(dest+'/day-5.dc.html',html);fs.copyFileSync(vendor+'/LICENSE-react.txt',dest+'/LICENSE-react.txt');
fs.writeFileSync('src/data/foundations/day-five-slides.json',JSON.stringify(slides));
fs.writeFileSync('src/data/foundations/day-five-source.json',JSON.stringify({collaboration:{maxGroupSize:4,primaryRoles:['Slideshow lead','Whiteboard scribe'],secondaryDuties:['Timekeeper','Checker'],individualResponses:true},project:'Asteroid 2026-XJ briefing',file:path.basename(source),sourceSha256:hash(original),runtimeSha256:{support:hash(support),stage:hash(stage)},packagedSha256:hash(html),cover:{file:'art/asteroid-briefing.png',sha256:hash(fs.readFileSync(dest+'/art/asteroid-briefing.png'))},studentSlides:30,originalStudentSlides:26,teacherSlidesExcluded:3,timers:3,answerReveals:6,transition:{type:'fade',durationMs:260,respectsReducedMotion:true},snapshots:snapshots.map(s=>({...s,sha256:hash(fs.readFileSync('public/comics/2026-xj/book-one-day-05-v1/'+s.file))})),notes:'Original executable logic, timers and reveal controls unchanged. Teacher-only slides/notes removed. Four snapshots use viewport crops of existing immutable artwork with text companions. Original cover PNG and comic assets are separately cacheable; the original cover URL avoids the export’s data-URL CSS parsing bug. Clarified individual response directions. Reconciled contradictory source coordinate conventions to the approved Day 5 novel: Earth at zero, positive x toward the initial asteroid, negative toward-Earth velocity. Made the supplied position and velocity bounds explicitly componentwise with exact elapsed time. Replaced the unsupported assertion that missing physics must make the window bigger with a question about omitted effects. Fixed truncated navigation titles. Original export archived unchanged.'},null,2));
console.log('Packaged '+slides.length+' slides, three timers, six reveals, and four original graphic novel snapshots.');
