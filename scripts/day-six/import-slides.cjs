// Package the original interactive export; preserve its executable logic.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),p5=require('parse5');
const base='resources/foundations/day-six/original',source=base+'/Day 6 Vector Addition and Decomposition.dc.html',dest='public/foundations/day-6-runtime-v1';
const original=fs.readFileSync(source,'utf8'),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const script=code=>`<script>${code.replace(/<\/script/gi,'<\\/script')}</script>`;
const sourceSections=[...original.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)];
if(sourceSections.length!==29||sourceSections.slice(26).some(m=>!m[0].includes('data-deck-skip')))throw Error('Unexpected source structure');
const snapshots=[
  {
    "after": 7,
    "page": 21,
    "file": "page-01.webp",
    "y": 1187,
    "height": 300,
    "title": "The route and the shortcut",
    "alt": "Nadia asks how far Eli is from his start. The notebook shows three meters east followed by four meters north, a seven-meter walking route. The straight displacement still needs to be found.",
    "body": "The novel walks 3 m east, then 4 m north. The preceding slide swaps those two legs.",
    "question": "Which results stay the same when the legs swap? Which direction changes?",
    "work": "Part 1 · Check the route and resultant"
  },
  {
    "after": 10,
    "page": 22,
    "file": "page-02.webp",
    "y": 355,
    "height": 440,
    "title": "The resultant has a direction",
    "alt": "A schematic triangle joins a three-meter east arrow to a four-meter north arrow. The resultant runs from the first tail to the final tip. Its magnitude is five meters and its direction is 53.1 degrees north of east.",
    "body": "Translate an arrow without turning or stretching it. Use a stated scale for your own drawing.",
    "question": "How would a rotated or stretched arrow change the result?",
    "work": "Part 1 · Check the route and resultant"
  },
  {
    "after": 15,
    "page": 24,
    "file": "page-04.webp",
    "y": 380,
    "height": 275,
    "title": "Rebuild the fictional velocity",
    "alt": "The classroom model points positive x away from Earth. The velocity components are negative 8210 meters per second in x and positive 2200 in y. They give speed about 8500 meters per second and direction about 15 degrees from toward Earth toward positive y.",
    "body": "With +x away from Earth, vₓ = −8,210 m/s and vᵧ = +2,200 m/s.",
    "question": "Why is the direction about 165° from +x, rather than 15° from +x?",
    "work": "Part 2 · Check components and direction"
  },
  {
    "after": 24,
    "page": 23,
    "file": "page-03.webp",
    "y": 380,
    "height": 585,
    "title": "Check the angle before choosing sine or cosine",
    "alt": "The same ten-meter-per-second vector is shown 30 degrees above horizontal, equivalently 60 degrees from vertical. Its components stay 8.66 horizontally and 5 vertically. Mr. Antocci explains that cosine belongs to the component beside the marked angle.",
    "body": "Changing the reference angle does not change the arrow. Cosine goes with the adjacent component.",
    "question": "How can both angle descriptions produce the same two components?",
    "work": "Part 3 · Defend your reference angle"
  }
];
function comic(s){return `<section data-label="${s.title}" class="foundation-comic" style="background:#1b1c2e;color:#f6f6fb;font-family:Newsreader,Georgia,serif;padding:64px 88px;box-sizing:border-box;display:flex;flex-direction:column;">
 <div style="font:24px 'IBM Plex Mono',monospace;letter-spacing:2px;color:#a9a7ff;">2026-XJ · The Arrow Test · Graphic novel, page ${s.page}</div>
 <h2 style="font-size:64px;line-height:1.1;font-weight:500;margin:22px 0 30px;">${s.title}</h2>
 <div style="display:grid;grid-template-columns:1.55fr 1fr;gap:52px;align-items:center;flex:1;min-height:0;">
  <svg role="img" aria-label="${s.alt}" viewBox="0 ${s.y} 1024 ${s.height}" style="width:100%;height:auto;max-height:610px;display:block;background:#fff;border:2px solid #9291bf;"><title>${s.alt}</title><image href="/comics/2026-xj/book-one-day-06-v1/${s.file}" width="1024" height="1536"/></svg>
  <div><p style="font-size:32px;line-height:1.4;margin:0 0 28px;">${s.body}</p><p style="font-size:38px;line-height:1.25;margin:0;">${s.question}</p></div>
 </div><div style="font:24px 'IBM Plex Mono',monospace;color:#c8c7e2;margin-top:28px;">${s.work} · Write your own answer in Work.</div>
 <footer style="font:20px 'IBM Plex Mono',monospace;color:#c8c7e2;margin-top:22px;">Fictional story · Original artwork · Day 6</footer></section>`;}
let index=0;
let html=original.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g,section=>{
 if(section.includes('data-deck-skip'))return '';
 index++;
 // Keep executable logic intact; clarify individual work, axes and default timer labels.
 const change=(before,after)=>{if(!section.includes(before))throw Error('Source clarification missing on slide '+index+': '+before);section=section.replaceAll(before,after);};
 if(index===2)change("Writes the group's answers and notes.","Keeps group notes; each person submits their own answers.");
 if(index===10||index===11)change('≈ 20 min','≈ 12 min');
 if(index===16||index===17)change('≈ 17 min','≈ 12 min');
 if(index===22){change('≈ 8 min','≈ 5 min');change('Mini-quiz · 3 problems','Practice · 3 checks');}
 if(index===26)change('≈ 8 min','≈ 2 min');
 if(index===11)section=section.replace(/data-label="[^"]*"/,'data-label="Put the asteroid’s velocity back together"');
 if(index===24)section=section.replace(/data-label="[^"]*"/,'data-label="The same angle measured from another axis"');
 if(index===11){change('Toward Earth','x · toward Earth');change('8,210 m/s','−8,210 m/s');change('Perpendicular','y · sideways');change('2,200 m/s','+2,200 m/s');}

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
const bridge=fs.readFileSync('scripts/day-one/slides-bridge.js','utf8').replaceAll('physics-day-one-slides-v1','physics-day-six-slides-v1');
const transition=fs.readFileSync('resources/foundations/day-one/slides-transition.css','utf8');
html=html.replace('<script src="./support.js"></script>',()=>libraries+setup+script(bridge)+script(support))
 .replace('<html>','<html lang="en">')
 .replace('</head>',`<style data-lesson-transition>${transition}</style></head>`)
 .replace('<head>',`<head><title>Day 6 · Vector addition and decomposition</title><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">`);
// Keep a normal asset URL: the original style parser splits on semicolons,
// which truncates data URLs before their image payload.
fs.mkdirSync(dest+'/art',{recursive:true});
fs.copyFileSync(base+'/art/asteroid-briefing.png',dest+'/art/asteroid-briefing.png');
fs.writeFileSync(dest+'/day-6.dc.html',html);fs.copyFileSync(vendor+'/LICENSE-react.txt',dest+'/LICENSE-react.txt');
fs.writeFileSync('src/data/foundations/day-six-slides.json',JSON.stringify(slides));
fs.writeFileSync('src/data/foundations/day-six-source.json',JSON.stringify({collaboration:{maxGroupSize:4,primaryRoles:['Slideshow lead','Whiteboard scribe'],secondaryDuties:['Timekeeper','Checker'],individualResponses:true},project:'Asteroid 2026-XJ briefing',file:path.basename(source),sourceSha256:hash(original),runtimeSha256:{support:hash(support),stage:hash(stage)},packagedSha256:hash(html),cover:{file:'art/asteroid-briefing.png',sha256:hash(fs.readFileSync(dest+'/art/asteroid-briefing.png'))},studentSlides:30,originalStudentSlides:26,teacherSlidesExcluded:3,timers:4,answerReveals:5,transition:{type:'fade',durationMs:260,respectsReducedMotion:true},snapshots:snapshots.map(s=>({...s,sha256:hash(fs.readFileSync('public/comics/2026-xj/book-one-day-06-v1/'+s.file))})),notes:'Original executable logic, four timers and five reveal controls unchanged. Teacher-only slides and notes removed. Four snapshots use viewport crops of approved Day 6 pages 21–24 with text companions; source artwork bytes are unchanged. Original cover uses its relative URL. Clarified separate individual responses. Timer captions match the original runtime defaults of 12, 12, 5 and 2 minutes. The in-deck mini-quiz is labeled practice to distinguish it from the separately gated daily quiz. Asteroid component labels explicitly use the novel’s fixed axes, positive x away from Earth and positive y sideways; this does not change the speed calculation. Original export archived unchanged.'},null,2));
console.log('Packaged '+slides.length+' slides, four timers, five reveals, and four original graphic novel snapshots.');
