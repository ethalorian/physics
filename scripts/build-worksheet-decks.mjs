import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {formatDeckMath} from '../src/data/deck-sources/worksheet-guided/math-typography.mjs';
import {diagram,esc} from '../src/data/deck-sources/worksheet-guided/diagrams.mjs';
import {walkthrough,correctedAnswer} from '../src/data/deck-sources/worksheet-guided/walkthroughs.mjs';
import {cueFor,unitNames} from '../src/data/deck-sources/worksheet-guided/teaching.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'src/data/deck-sources/worksheet-guided');
const content=fs.readFileSync(path.join(root,'resources/worksheet-decks/source.json'));
const days=JSON.parse(content), manifest=[], ledger=[];
const output=path.join(root,'resources/worksheet-decks/generated');
const assets=path.join(root,'public/decks/worksheet-guided');
fs.mkdirSync(output,{recursive:true});fs.mkdirSync(assets,{recursive:true});
for(const file of ['style.css','runtime.js','solutions.css','motion.js'])fs.copyFileSync(path.join(source,file),path.join(assets,file));
fs.appendFileSync(path.join(assets,'solutions.css'),fs.readFileSync(path.join(source,'walkthrough.css')));
fs.appendFileSync(path.join(assets,'solutions.css'),fs.readFileSync(path.join(source,'math-typography.css')));
export function markup(s){
 return esc(s).replace(/&lt;(\/?)(b|i|sub|sup|super)&gt;/g,(_,slash,t)=>`<${slash}${t==='super'?'sup':t}>`).replace(/&lt;br\s*\/?&gt;/g,'<br>');
}
const p=s=>`<p>${markup(s)}</p>`;
const clean=s=>String(s).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const chunks=s=>String(s).split(/<br\s*\/?>|;\s+|(?<=[.!?])\s+(?=[A-Z“(])/).map(x=>x.trim()).filter(Boolean);
function paginate(parts,limit=330){const pages=[];let batch=[];let n=0;for(const part of parts){if(batch.length&&(n+clean(part).length>limit||batch.length>=3)){pages.push(batch);batch=[];n=0}batch.push(part);n+=clean(part).length}if(batch.length)pages.push(batch);return pages;}
function questionFigure(day,track,q){
 if(q.visual)return q.visual;
 if(day.unit!==1||day.day!==6||track!=='cpa')return null;
 const grid={kind:'vector_grid',xmin:0,xmax:10,ymin:0,ymax:10,arrows:[]};
 // The approved CPA pilot draws these figures in its layout code, not JSON.
 const figures={2:[[0,0,3,0,'3 m'],[3,0,3,4,'4 m'],[0,0,3,4,'R']],3:[[0,0,4,0,'4 m']],6:[[0,0,5,2,'A']],8:[[0,0,4,0,'4 m'],[0,0,0,3,'3 m'],[4,0,0,3,'Sam’s R']]};
 if([2,3,4,5,6,7,8,10,11,12].includes(q.number))return {...grid,arrows:figures[q.number]||[]};
 return null;
}
for(const day of days)for(const track of ['cpa','honors']){
 const title=`${track==='cpa'?'CPA':'Honors'} · Unit ${day.unit} · Day ${day.day}`;
 const questions=day[track],slides=[],map=[];
 const add=(heading,body,opts={})=>slides.push({heading,body,...opts});
 const notes=day.note||'';
 add(day.title,p(day.target)+`<div class="cover-meta">${esc(title)}<br>${esc(unitNames[day.unit])}</div>`,{tag:'Worksheet guided practice',cover:true,notes:`${notes} Match the worksheet edition. Select problems for available time; review and stretch are available through the problem menu. Answers advance as separate slides, including from Teach.`});
 add('What we are practicing',`<ul class="criteria">${day.criteria.map(c=>`<li>${markup(c)}</li>`).join('')}</ul>`,{tag:'Learning target',notes:'Have students locate the matching worksheet. The problems retain the same numbering and wording as their sheet.'});
 for(const parts of paginate(chunks(day[track+'_model']),530))add('Worksheet reference',p(parts.join(' ')),{tag:'The model and assumptions on your sheet',notes:'Use this reference alongside the numbered examples. Keep the stated units and conditions.'});
 for(const q of questions){

  const start=slides.length,visual=questionFigure(day,track,q),answer=correctedAnswer(day,track,q);
  let refVisual=visual,refLabel='';
  if(!refVisual){const ref=q.prompt.match(/(?:\b(?:problem|question)\s+|\b(?:in|from)\s+)(\d{1,2})(?=[,.;:]|\s+(?:and|or|to|but)\b)/i);const related=ref?questions.find(x=>x.number===+ref[1]):null;if(related&&related.number!==q.number){refVisual=questionFigure(day,track,related);if(refVisual)refLabel='Reference from worksheet '+related.number;}}
  const plan=walkthrough(day,track,{...q,answer},refVisual);
  const correction=answer!==q.answer?'The source answer key conflicts with the printed givens. This solution uses the printed quantities. Original key: '+q.answer:'';
  const sourceContext=q.worked?chunks(q.worked)[0]:'';
  const context=sourceContext?'<div class="walk-source"><b>Worked example on your sheet</b> '+markup(sourceContext)+'</div>':'';
  const problem='<div class="walk-problem'+(clean(q.prompt+sourceContext).length>340?' compact':'')+'">'+p(q.prompt)+context+'</div>';
  const problemStem=q.prompt.split(/<br\s*\/?>/)[0];
  const compactProblem='<div class="walk-problem'+(clean(problemStem+sourceContext).length>340?' compact':'')+'">'+p(problemStem)+context+'</div>';
  const render=(st,number,count,solution)=>{
    const lines=st.lines||[];
    const art=st.graphic?'<div class="walk-drawing">'+st.graphic+(refLabel?'<small>'+esc(refLabel)+'</small>':'')+'</div>':'';
    const body='<div class="walkthrough" data-walk-kind="'+esc(st.kind||'solution')+'">'+(solution?compactProblem:problem)+'<div class="walk-body'+(art?'':' no-graphic')+'">'+art+'<div class="walk-working">'+(lines.length?lines.map((line,i)=>'<div class="work-line'+(i===lines.length-1?' current':'')+'"'+(i===lines.length-1?' data-motion="reveal"':'')+'>'+markup(line)+'</div>').join(''):(art?'<div class="work-entry"><span>Start here</span><p>'+esc(q.frame?clean(q.frame):st.cue)+'</p></div>':'<div class="work-entry"><span>Our working</span><p>'+esc(q.frame?clean(q.frame):'')+'</p></div>'))+'</div></div><div class="walk-pause"><span>'+(solution?'Explain this step':'Before we solve')+'</span><p>'+esc(st.cue)+'</p></div></div>';
    add(q.title,body,{tag:'Worksheet '+q.number+' · '+(solution?'Work through it':'Set up the problem')+' · '+number+'/'+count,question:q.number,role:q.role,solution,working:true,walk:true,notes:(q.diagnostic||cueFor(q,day))+' '+correction+' '+(q.role==='exit'?'Collect independent work before revealing the solution.':'Keep this frame on screen while students add the same marks to their worksheets. Accept another correct approach.')});
  };
  const sequence=[...plan.stages];
  if(!plan.authored){
   const family=q.reviewVariant?.family;const prior=family?days.find(d=>d.unit===family[0]&&d.day===family[1]):null;
   const reference=q.reference||(prior?prior[family[2]].find(x=>x.number===2)?.reference:questions.find(x=>x.number===2)?.reference);
   if(reference&&/\d|calculate|find|predict/i.test(q.prompt)&&!/(teacher|safety|approval|role)/i.test(q.prompt)){
    const fragments=chunks(reference).flatMap(s=>s.length<230?[s]:s.match(/.{1,210}(?:\s|$)/g)||[s]);
    for(const lines of paginate(fragments,sequence[0].graphic?230:420))sequence.push({cue:'Which part of this relationship matches what we know? Which quantity is unknown?',lines,graphic:sequence[0].graphic,kind:sequence[0].kind});
   }
   if(q.worked)for(const part of chunks(q.worked))sequence.push({cue:'Connect this step to the quantities in the problem.',lines:[part],graphic:sequence[0].graphic,kind:sequence[0].kind});
  }
  const answerParts=chunks(answer);
  let accumulated=[];
  for(const part of answerParts){
   if(clean(accumulated.join(' ')+part).length>370||accumulated.length>=3)accumulated=[];
   accumulated.push(part);
   sequence.push({cue:answerParts.at(-1)===part?'Does the result answer the question? Check its direction, units, and meaning.':'Explain why this step follows. What should we do next?',lines:[...accumulated],graphic:plan.stages.at(-1).graphic.replace(/ data-motion="[^"]+"/g,''),kind:plan.stages.at(-1).kind});
  }
  sequence.forEach((st,i)=>render(st,i+1,sequence.length,i>0));
  map.push({number:q.number,title:q.title,role:q.role,start,end:slides.length-1,prompt:q.prompt,answer:q.answer,projectedAnswer:answer,model:plan.stages[0].kind});
 }
 add('Check your understanding',p('Return to the learning target. Identify a problem you can now explain and one step you want to revisit.')+p('Revise your worksheet in your own words. A self-rating describes your confidence; the work provides evidence.'),{tag:'Reflection',notes:notes});
 const attrs=(s,i)=>`id="slide-${i+1}" data-title="${esc(s.heading)}" data-label="${esc(`${s.tag}: ${s.heading}`)}" data-speaker-notes="${esc(s.notes||'')}" data-solution="${!!s.solution}"${s.question?` data-question="${s.question}"`:''} aria-hidden="true"`;
 const sections=slides.map((s,i)=>`<section class="slide${s.cover?' cover':''}${s.demo?' demo-slide':''}${s.solution?' solution':''}${s.working?' working-slide':''}${s.walk?' walk-slide':''}${s.collaboration?' collaboration-slide':''}" ${attrs(s,i)}><header><span>${esc(s.tag)}</span><span>${esc(title)}</span></header><h${s.cover?'1':'2'}>${esc(s.heading)}</h${s.cover?'1':'2'}><div class="content">${formatDeckMath(s.body)}</div><footer><span>${esc(day.title)}</span><span>${i+1} / ${slides.length}</span></footer></section>`).join('');
 const worksheet=`/worksheets/unit-${day.unit}/${track}/day-${String(day.day).padStart(2,'0')}.pdf`;
 const toolbar=`<nav class="toolbar" aria-label="Presentation controls"><button id="prev" aria-label="Previous step">← Back</button><span id="count" aria-live="polite"></span><button id="next">Next step →</button><label class="select-label">Problem<select id="problem" aria-label="Choose worksheet problem"><option value="0">Introduction</option>${map.map(m=>`<option value="${m.start}">${m.number}. ${esc(m.title)}</option>`).join('')}</select></label><button id="nextProblem">Next problem</button><button id="replay">Replay animation</button><button id="notes">Teacher notes</button><a href="${worksheet}" target="_blank" rel="noopener">Worksheet</a><button id="fullscreen">Full screen</button><button id="reset">Restart</button></nav>`;
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(title+' — '+day.title)}</title><link rel="stylesheet" href="/decks/worksheet-guided/style.css"><link rel="stylesheet" href="/decks/worksheet-guided/solutions.css"></head><body><main class="stage-shell"><deck-stage class="stage">${sections}</deck-stage></main>${toolbar}<script src="/decks/worksheet-guided/motion.js"></script><script src="/decks/worksheet-guided/runtime.js"></script></body></html>`;
 const file=`unit-${day.unit}-${track}-day-${String(day.day).padStart(2,'0')}.html`;fs.writeFileSync(path.join(output,file),html);
 manifest.push({unit:`unit-${day.unit}`,day:day.day,track,title:day.title,slides:slides.length,problems:questions.length,file,src:`/api/teacher/worksheets/unit-${day.unit}/${day.day}/presentation?track=${track}`});
 ledger.push({unit:day.unit,day:day.day,track,file,questions:map,slides:slides.length});
}
fs.writeFileSync(path.join(root,'src/data/worksheet-decks.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(root,'resources/worksheet-decks/coverage.json'),JSON.stringify({sourceSha256:crypto.createHash('sha256').update(content).digest('hex'),decks:ledger},null,2)+'\n');
console.log(`Built ${manifest.length} worksheet decks across ${days.length} days, ${ledger.reduce((n,d)=>n+d.questions.length,0)} matched problems, ${manifest.reduce((n,d)=>n+d.slides,0)} teaching steps.`);
