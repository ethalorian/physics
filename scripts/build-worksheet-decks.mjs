import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {formatDeckMath} from '../src/data/deck-sources/worksheet-guided/math-typography.mjs';
import {diagram,esc} from '../src/data/deck-sources/worksheet-guided/diagrams.mjs';
import {roles,guidance} from '../src/data/deck-sources/worksheet-guided/guidance.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'src/data/deck-sources/worksheet-guided'),resources=path.join(root,'resources/worksheet-decks');
const content=fs.readFileSync(path.join(resources,'source.json')),days=JSON.parse(content);
const pictures=JSON.parse(fs.readFileSync(path.join(resources,'figures.json'))),supports=JSON.parse(fs.readFileSync(path.join(resources,'language-supports.json')));
const visualKey=v=>JSON.stringify(v,Object.keys(v).sort());
const figures=new Map(pictures.map(p=>[visualKey(p.visual),p.svg]));
const manifest=[],ledger=[],activities=[],legacyActivities=JSON.parse(fs.readFileSync(path.join(root,'src/data/deck-activities.json')));
const output=path.join(resources,'generated'),assets=path.join(root,'public/decks/worksheet-guided');
fs.mkdirSync(output,{recursive:true});fs.mkdirSync(assets,{recursive:true});
for(const file of ['style.css','runtime.js','solutions.css','motion.js'])fs.copyFileSync(path.join(source,file),path.join(assets,file));
fs.appendFileSync(path.join(assets,'solutions.css'),fs.readFileSync(path.join(source,'math-typography.css')));
export function markup(s){return esc(s).replace(/&lt;(\/?)(b|i|sub|sup|super)&gt;/g,(_,slash,t)=>`<${slash}${t==='super'?'sup':t}>`).replace(/&lt;br\s*\/?&gt;/g,'<br>');}
const p=s=>`<p>${markup(s)}</p>`;
const clean=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const chunks=s=>String(s??'').split(/<br\s*\/?>|;\s+|(?<=[.!?])\s+(?=[A-Z“(])/).map(x=>x.trim()).filter(Boolean);
function pages(parts,limit){const result=[];let batch=[],n=0;for(const part of parts){if(batch.length&&n+clean(part).length>limit){result.push(batch);batch=[];n=0}batch.push(part);n+=clean(part).length}if(batch.length)result.push(batch);return result;}
function figure(v){if(!v)return '';const svg=['graph','vector_grid','table'].includes(v.kind)?diagram(v):figures.get(visualKey(v));if(!svg)throw Error('Missing worksheet model: '+JSON.stringify(v));return `<figure class="model" data-visual-kind="${esc(v.kind)}">${svg}${v.caption?`<figcaption>${markup(v.caption)}</figcaption>`:''}</figure>`;}
function visualText(v){if(!v)return '';if(v.kind==='table')return '\n'+v.headers.join(' | ')+'\n'+v.rows.map(r=>r.join(' | ')).join('\n');if(v.kind==='graph'&&v.points?.length)return '\nGraph: '+v.xlabel+'; '+v.ylabel+'. Points: '+v.points.map(p=>'('+p.join(', ')+')').join(', ')+'.';return '\nUse the model printed beside this problem on your worksheet.';}
for(const day of days)for(const track of ['cpa','honors']){
 const title=`${track==='cpa'?'CPA':'Honors'} · Unit ${day.unit} · Day ${day.day}`,questions=day[track],slides=[],map=[];
 const src=`/api/teacher/worksheets/unit-${day.unit}/${day.day}/presentation?track=${track}`;
 const add=(heading,body,opts={})=>slides.push({heading,body,phase:'orient',...opts});
 const criteria=day.criteria_by_track?.[track]||day.criteria;
 add(day.title,`<div class="cover-layout"><div><p class="eyebrow">Today’s learning target</p>${p(day.target)}<div class="cover-flow"><span>Think</span><span>Model</span><span>Explain</span></div></div><aside class="success"><h2>What success looks like</h2><ol>${criteria.map(c=>`<li>${markup(c)}</li>`).join('')}</ol></aside></div>`,{cover:true,tag:'Guided physics',notes:'Use the matching CPA or Honors worksheet; SEI uses the same problems. Start with a short independent attempt, model a selected problem together, then return to independent work. Use Next problem to skip solutions until the class is ready. '+(day.note||'')});
 const roadmap=questions.map(q=>`<li><span class="map-number">${q.number}</span><span><strong>${esc(q.title.replace(/^Worked example: /,''))}</strong><small>${roles[q.role]||'Practice'}${q.role==='stretch'?' · optional':''}</small></span></li>`).join('');
 add('Our route through the problems',`<ol class="roadmap">${roadmap}</ol><p class="route-note">Your teacher will choose today’s problems. Keep your first attempt, then add what you learn in discussion.</p>`,{tag:'Worksheet map',notes:'The menu jumps directly to a numbered problem. Retrieval and the exit check work best independently; stretch is optional. Do not treat completion of every problem as the lesson goal.'});
 for(const group of pages(chunks(day[track+'_model']),650))add('The model we can use',`<div class="reference">${group.map(p).join('')}</div>`,{tag:'Reference & assumptions',notes:'Read the conditions as well as the relationship. Ask students where this model applies and where it would need to change.'});
 for(const q of questions){
  const start=slides.length,g=guidance(day,q),support=supports[`${day.unit}-${day.day}-${track}-${q.number}`];
  const visual=q.visual,art=figure(visual),kind=visual?.kind||'reasoning';
  const notes=`Worksheet ${q.number} · ${roles[q.role]||q.role}\n${g.teacher}\n\nExpected reasoning:\n${clean(q.answer)}\n\n${q.reference?'Reference: '+clean(q.reference):''}`;
  const tag=`Problem ${q.number} · ${roles[q.role]||'Practice'}`;
  const taskPages=pages(chunks(q.prompt),art?510:760);
  // A worked example is information already supplied on the sheet, not a new cold problem.
  if(q.worked)for(const [i,group] of pages(chunks(q.worked),art?490:700).entries())add(q.title,`<div class="problem-layout ${art?'':'no-model'}"><div class="problem-copy"><p class="eyebrow">Worked example on your worksheet${i?' · continued':''}</p>${group.map(p).join('')}</div>${art||'<div class="thinking-space"><span>Think aloud</span><p>What does each quantity represent?</p></div>'}</div>`,{tag,phase:'example',question:q.number,role:q.role,notes,solution:false,cue:'Follow the given example. Explain why each step is valid.'});
  for(const [i,group] of taskPages.entries())add(q.title,`<div class="problem-layout ${art?'':'no-model'}"><div class="problem-copy"><p class="eyebrow">${q.role==='exit'?'Independent response':'Your turn'}${taskPages.length>1?` · ${i+1} of ${taskPages.length}`:''}</p>${group.map(p).join('')}</div>${art||`<div class="thinking-space"><span>Start with a model</span><p>${esc(g.move)}</p><div class="sketch-lines"></div></div>`}</div>`,{tag,phase:'think',question:q.number,role:q.role,notes,solution:false,cue:g.entry});
  const promptSlide=slides.findIndex((s,i)=>i>=start&&s.phase==='think');
  // Subject-specific guidance supports the attempt without supplying a computed result.
  const reference=q.reference?`<div class="reference-small">${p(q.reference)}</div>`:'';
  add(q.title,`<div class="problem-layout ${art?'':'no-model'}"><div class="problem-copy"><p class="eyebrow">Build the explanation</p><p class="teaching-move">${esc(g.move)}</p>${reference}<div class="language-support"><span>Words to get started</span>${p(support?.frame||'My model shows … because … .')}${support?.meaning?`<small>${markup(support.meaning)}</small>`:''}</div></div>${art||'<div class="thinking-space"><span>Make your thinking visible</span><p>Givens → model → evidence</p><div class="sketch-lines"></div></div>'}</div>`,{tag,phase:'connect',question:q.number,role:q.role,notes,solution:false,cue:'Compare your first attempts. Which mark, relationship, or piece of evidence explains your choice?'});
  const solutionStart=slides.length;
  const answerParts=chunks(q.answer),answerGroups=[];let accumulated=[];
  for(const part of answerParts){if(clean([...accumulated,part].join(' ')).length>(art?380:580)||accumulated.length>=3)accumulated=[];accumulated.push(part);answerGroups.push([...accumulated]);}
  for(const [i,group] of answerGroups.entries()){
   const solutionArt=figure(q.solution_visual||visual);
   add(q.title,`<div class="problem-layout ${solutionArt?'':'no-model'}"><div class="problem-copy"><p class="eyebrow">Reasoning${answerGroups.length>1?` · ${i+1} of ${answerGroups.length}`:''}</p><div class="reasoning">${group.map((line,j)=>`<div class="reason-line ${j===group.length-1?'current-line':'previous-line'}">${p(line)}</div>`).join('')}</div></div>${solutionArt||`<div class="thinking-space"><span>Check the meaning</span><p>${esc(g.check)}</p></div>`}</div>`,{tag,phase:'explain',question:q.number,role:q.role,notes,solution:true,cue:i===answerGroups.length-1?g.check:'Explain this step to a partner before moving on.'});
  }
  const end=slides.length-1;
  for(let i=start;i<=end;i++){slides[i].promptSlide=promptSlide;slides[i].solutionSlide=solutionStart;slides[i].questionStart=start;slides[i].questionEnd=end;}
  map.push({number:q.number,title:q.title,role:q.role,start,end,promptSlide,solutionStart,prompt:q.prompt,answer:q.answer,projectedAnswer:q.answer,model:kind,visual:visual||null});
  if(q.role!=='worked'){
   const target=legacyActivities.find(a=>a.unitId===`unit-${day.unit}`&&a.day===day.day&&(a.track===track||a.track==='shared'))?.targetSlug||'';
   activities.push({id:`worksheet-v2-${day.unit}-${day.day}-${track}-${q.number}`,unitId:`unit-${day.unit}`,day:day.day,track,src,slide:promptSlide+1,title:`${q.number}. ${q.title}`,prompt:clean(q.prompt)+visualText(visual),targetSlug:['retrieve','mixed'].includes(q.role)?'':target,kind:q.role==='exit'?'exit_ticket':q.role==='retrieve'?'warmup':'solo',usesVisual:!!visual});
  }
 }
 add('What can you explain now?',`<div class="reflection"><p class="eyebrow">Return to the learning target</p>${p(day.target)}<div class="reflection-prompts"><div><span>Evidence</span><p>Choose one problem. Point to the part of your work that shows your understanding.</p></div><div><span>Next time</span><p>Name one choice you will make more carefully in a new problem.</p></div></div></div>`,{tag:'Close & transfer',notes:'Use the independent exit response and student explanations to plan the next lesson. A confidence rating is not a mastery judgment.'});
 const attrs=(s,i)=>`id="slide-${i+1}" data-title="${esc(s.heading)}" data-label="${esc(`${s.tag} · ${s.phase}: ${s.heading}`)}" data-speaker-notes="${esc(s.notes||'')}" data-phase="${s.phase}" data-solution="${!!s.solution}"${s.question?` data-question="${s.question}" data-prompt-slide="${s.promptSlide}" data-solution-slide="${s.solutionSlide}" data-question-end="${s.questionEnd}"`:''} aria-hidden="true"`;
 const sections=slides.map((s,i)=>`<section class="slide ${s.phase}${s.cover?' cover':''}${s.solution?' solution':''}" ${attrs(s,i)}><header><span class="brand">ANTOCCI <b>PHYSICS</b></span><span>${esc(title)}</span></header><div class="heading"><p class="kicker">${esc(s.tag)}</p><h${s.cover?'1':'2'}>${esc(s.heading)}</h${s.cover?'1':'2'}>${s.question?`<nav class="phase-path" aria-label="Learning sequence"><span ${s.phase==='think'||s.phase==='example'?'aria-current="step"':''}>Think</span><span ${s.phase==='connect'?'aria-current="step"':''}>Model</span><span ${s.phase==='explain'?'aria-current="step"':''}>Explain</span></nav>`:''}</div><div class="content">${formatDeckMath(s.body)}</div>${s.cue?`<div class="discussion-cue"><span>${s.solution?'Discuss':'Pause & think'}</span><p>${esc(s.cue)}</p></div>`:''}<footer><span>${esc(day.title)}</span><span>${i+1} / ${slides.length}</span></footer></section>`).join('');
 const worksheet=`/worksheets/unit-${day.unit}/${track}/day-${String(day.day).padStart(2,'0')}.pdf`,sei=worksheet.replace('/'+track+'/', '/'+track+'-sei/');
 const toolbar=`<nav class="toolbar" aria-label="Presentation controls"><div class="step-controls"><button id="prev" aria-label="Previous step">← Back</button><span id="count" aria-live="polite"></span><button id="next">Next step →</button></div><label class="select-label">Problem<select id="problem" aria-label="Choose worksheet problem"><option value="0">Introduction</option>${map.map(m=>`<option value="${m.start}">${m.number}. ${esc(m.title)}</option>`).join('')}</select></label><button id="reveal">Show reasoning</button><button id="returnPrompt">Back to question</button><button id="nextProblem">Next problem →</button><details class="more"><summary>Tools</summary><div><button id="notes">Teacher guide</button><button id="timer">60-second think time</button><a href="${worksheet}" target="_blank" rel="noopener">Worksheet PDF</a><a href="${sei}" target="_blank" rel="noopener">SEI worksheet PDF</a><button id="fullscreen">Full screen</button><button id="reset">Restart</button></div></details></nav><output id="thinkTimer" hidden aria-live="off"></output><dialog id="teacherGuide"><button id="closeNotes">Close guide</button><div id="guideText"></div></dialog>`;
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="worksheet-source" content="${crypto.createHash('sha256').update(content).digest('hex')}"><title>${esc(title+' — '+day.title)}</title><link rel="stylesheet" href="/decks/worksheet-guided/style.css?v=20261023"><link rel="stylesheet" href="/decks/worksheet-guided/solutions.css?v=20261023"></head><body><main class="stage-shell"><deck-stage class="stage">${sections}</deck-stage></main>${toolbar}<script src="/decks/worksheet-guided/runtime.js?v=20261023"></script></body></html>`;
 const file=`unit-${day.unit}-${track}-day-${String(day.day).padStart(2,'0')}.html`;fs.writeFileSync(path.join(output,file),html);
 manifest.push({unit:`unit-${day.unit}`,day:day.day,track,title:day.title,slides:slides.length,problems:questions.length,file,src});ledger.push({unit:day.unit,day:day.day,track,file,questions:map,slides:slides.length});
}
fs.writeFileSync(path.join(root,'src/data/worksheet-decks.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(root,'src/data/worksheet-deck-activities.json'),JSON.stringify(activities,null,2)+'\n');
fs.writeFileSync(path.join(resources,'coverage.json'),JSON.stringify({sourceSha256:crypto.createHash('sha256').update(content).digest('hex'),decks:ledger},null,2)+'\n');
console.log(`Built ${manifest.length} decks: ${ledger.reduce((n,d)=>n+d.questions.length,0)} matched problems, ${manifest.reduce((n,d)=>n+d.slides,0)} teaching steps, ${activities.length} activity presets.`);
