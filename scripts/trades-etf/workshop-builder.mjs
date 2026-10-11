import fs from 'node:fs';
import path from 'node:path';
import {solutionScene} from '../../src/data/deck-sources/worksheet-guided/solutions.mjs';
import {stories} from './workshop-story.mjs';
import {workshopGraphic,practiceGraphic,esc} from './workshop-visuals.mjs';
import {prompts,feedback} from './deck-prompts.mjs';

const p=t=>`<p>${esc(t)}</p>`;
const cue=(label,t)=>`<div class="cue"><strong>${esc(label)}</strong><span>${esc(t)}</span></div>`;
const split=(image,copy)=>`<div class="workshop-split"><div class="workshop-figure">${image}</div><div class="workshop-copy">${copy}</div></div>`;
const strip=items=>`<div class="route">${items.map((s,i)=>`<span><b>${i+1}</b>${esc(s)}</span>`).join('')}</div>`;
const stageInfo={Brief:['Look. Predict. Explain.','Start with a prediction. Point to a feature before you explain it.'],Measure:['Find the reference. Make the mark.','Name the datum and endpoints before the partner reads the tool.'],Plan:['Make the quantities visible.','Sketch first. Use the supplied practice values for this calculation.'],Make:['One move at a time.','Maker acts. Checker compares with the drawing. Swap roles at the pause.'],Test:['Let the trial decide.','Keep every result. Change one feature and repeat the same test.'],Explain:['Show the evidence.','Use your object, drawing and record to support one clear claim.']};

export function buildWorkshop(root,day){
 const key=`${day.project}-${String(day.meeting).padStart(2,'0')}`,s=stories[key];
 if(!s)throw Error('Missing workshop story '+key);
 const [warmup,warmupKey,warmupTarget,practice]=prompts[key],answer=feedback[key]??day.example.slice(1);
 const assets=path.join(root,'public/trades-etf/workshop');fs.mkdirSync(assets,{recursive:true});
 const family=day.diagram;
 const graphic=(view)=>{
  const [scene,mode]=view.includes(':')?view.split(':'):[family,view];
  const name=`${scene}-${mode}`,file=path.join(assets,name+'.svg');
  fs.writeFileSync(file,workshopGraphic(scene,mode));
  return `/trades-etf/workshop/${name}.svg`;
 };
 const mathSrc=`/trades-etf/workshop/practice-${key}.svg`;
 fs.writeFileSync(path.join(root,'public',mathSrc),practiceGraphic(key));
 const img=(src,alt)=>`<img src="${src}" alt="${esc(alt)}"/>`;
 const inline=src=>{let n=0;return fs.readFileSync(path.join(root,'public',src),'utf8').replace('<svg ','<svg class="animated-drawing" ').replace(/<(line|path|polyline|polygon)([^>]*)(\/?)>/g,(_,tag,attrs)=>attrs.includes('M 0 0 L 10')?'<'+tag+attrs+'>':'<'+tag+attrs.replace(/\/$/,'')+' data-motion="draw" data-at="'+Math.min(.7,n++*.025)+'"/>')};
 const art=(view)=>inline(graphic(view));
 const mathArt=()=>inline(mathSrc);
 const parts=text=>text.split(/;\s+|(?<=[.!?])\s+(?=[A-Z])/).map(x=>x.trim()).filter(Boolean);
 const answerSteps=(title,text,tag,visual,notes,problem)=>{
  const steps=parts(text);let shown=[];
  for(const [index,part] of steps.entries()){
   if(shown.join(' ').length+part.length>350||shown.length>=3)shown=[];shown.push(part);
   const drawing=visual?visual().replace(/ data-motion="[^"]+"/g,''):'';
   const body='<div class="walkthrough" data-walk-kind="workshop"><div class="walk-problem">'+p(problem)+'</div><div class="walk-body'+(drawing?'':' no-graphic')+'">'+(drawing?'<div class="walk-drawing">'+drawing+'</div>':'')+'<div class="walk-working">'+shown.map((line,i)=>'<div class="work-line'+(i===shown.length-1?' current':'')+'"'+(i===shown.length-1?' data-motion="reveal"':'')+'>'+esc(line)+'</div>').join('')+'</div></div><div class="walk-pause"><span>Explain this step</span><p>'+esc(index===steps.length-1?'Check the result against the drawing and its units. What would you measure to check it?':'Point to the dimensions used in this step. Why are we combining them this way?')+'</p></div></div>';
   add(title,body,{className:'solution walk-slide',tag:tag+' · '+(index+1)+'/'+steps.length,solution:true,notes});
  }
 };
 const slides=[];
 const add=(title,body,options={})=>slides.push({title,body,tag:'ETF workshop',className:'visual',...options});
 const visual=(title,view,copy,options={})=>add(title,split(art(view),copy),options);
 const activity=(kind,title,prompt,domain,body,tag,notes)=>add(title,body,{className:'question',tag,notes,activity:{kind,domain,prompt}});
 const fullDirections=`Materials and preparation: ${day.kit} ${day.prep}\nDemonstration: ${day.demo}\nFull bench directions:\n${day.build.map((s,i)=>`${i+1}. ${s}`).join('\n')}\nWatch for: ${day.look}\nIf stuck: ${day.trouble}`;
 visual(s.hook,s.focus,p(day.title)+cue('Start here','Notebook open. Project on the bench. Be ready to point.'),{className:'cover visual',tag:`ETF Unit ${day.project} · Day ${day.meeting} · Workshop`,notes:fullDirections});
 activity('warmup','Look first. Make a prediction.',warmup,warmupTarget,split(art(s.focus),p(warmup)+cue('60 seconds · solo','Think → point → explain.')),'Brief · individual opening response',warmupKey+' Ask for a visible feature as evidence. Use Teach to launch the saved response.');
 visual('Compare your prediction',s.focus,p(warmupKey)+cue('Partner check','Each person points to the feature that supports the answer.'),{tag:'Brief · after collecting predictions',solution:true});
 add('Today’s route through the workshop',strip(['Predict','Measure','Plan','Make','Test','Explain'])+`<div class="role-grid"><div><b>MARKER</b>${p('Name the datum. Make the mark.')}</div><div><b>MAKER</b>${p('Carry out the current step.')}</div><div><b>CHECKER</b>${p('Compare. Record. Call for a pause.')}</div></div>`+cue('Pairs: combine marker + maker','Swap roles at each stop-and-show. Trios rotate all three roles.'),{className:'routine',tag:'Brief · set the routine',notes:`110-minute lesson: Brief 10, Measure 15, Plan 15, Make 45, Test 15, Explain 10. Use the Teach timer for short work windows within each stage. ${day.why}`});
 visual('Get the bench ready',s.focus,p('Take out today’s project and kit. Name any missing item before starting.')+cue('30-second partner check','One person names it. The other finds it.'),{tag:'Brief · materials check',notes:`Read the exact kit aloud or use the lesson’s kit list. ${day.kit} ${day.prep}`});
 visual('Find the reference before you mark',s.focus,p(day.measure[0])+cue('Point before you work','Show the datum and both endpoints. Partner checks.'),{tag:'Measure · teacher models, students point',notes:day.measure.join('\n')+' '+day.read});
 visual('Mark → read → swap',s.focus,p(day.measure[1]??'Repeat the reading with roles swapped. Record the actual value and its unit.')+cue('Stop & show','Hold the mark or reading for your partner to check.'),{tag:'Measure · a short work window',notes:`Complete all measuring directions: ${day.measure.join(' ')} ${day.look}`});
 activity('solo','Sketch it. Then work it out.',practice,'math',split(mathArt(),p(practice)+cue('2 minutes · individual','Show the setup and units. Save through Teach.')),'Plan · supplied practice values','Do not change the build dimensions to match a practice example. '+answer.join(' '));
 answerSteps('Check the reasoning',answer.join(' '),'Plan · worked example',mathArt,day.example[2],practice);
 visual('Show the plan before the build',s.focus,p(day.plan[0])+cue('Partner points; you explain','Name the parts, reference and one dimension.'),{tag:'Plan · hold point',notes:`Complete plan directions: ${day.plan.join(' ')} ${day.demo}`});
 for(const [i,m]of s.moves.entries()){
  visual(m.title,m.view,p(m.action)+cue(`MAKE · ${i+1} / ${s.moves.length}`,i===0?'Start only after your plan check.':'Read the current move. Then pick up the tools.'),{tag:`Make · demonstration ${i+1}`,notes:`Lead this move with the object in hand. Ask students to point to the feature before working. Use a short Teach timer and return to the screen at its end.\n${fullDirections}`});
  if(i===Math.floor((s.moves.length-1)/2))visual('Tools down. Show your partner.',m.view,p('Point to the part you just changed. Checker names one match to the plan and one thing to inspect.')+cue('45-second reset','Switch maker and checker. Wait for the next move.'),{className:'pause visual',tag:'Make · stop-and-show',notes:`Ask two crews to show their current work. Redirect to the current part rather than repeating the entire build. ${day.look}`});
 }
 visual('Quick challenge: find the catch',s.focus,p(s.challenge)+cue('30 seconds · talk it through','Point first. Explain the consequence.'),{className:'question visual',tag:'Make → Test · oral check',notes:s.check});
 visual('Check your explanation',s.focus,p(s.check)+cue('Before the next trial','Say what you will keep the same and what you will change.'),{className:'solution visual',tag:'Feedback · after partner explanations',solution:true});
 visual('Run it. Record every result.','test',p(day.test[0])+cue('Operator + observer','Run the same procedure. Keep failures visible.'),{tag:'Test · practical evidence',notes:day.test.join('\n')+' '+day.trouble});
 visual('Stop & show: your evidence','test',p(s.show)+cue('Each person speaks','“We observed ___. Our evidence is ___.”'),{className:'pause visual',tag:'Test → Explain · inspection hold point',notes:day.done.join('\n')+' '+day.look});
 activity('exit_ticket','Your turn. Work independently.',day.exit,'math',`<div class="exit-prompt">${p(day.exit)}</div>`+cue('No group answer','Show working, units and your notebook page. Save the exit ticket.'),'Explain · independent transfer',`Expected evidence: ${day.key}. Practical skills still require individual teacher observation. Collect before advancing.`);
 answerSteps('Check the transfer',day.key,'Explain · after collecting responses',null,day.look,day.exit);
 add('Close the workshop',`<div class="close-grid"><div><b>01</b><h3>Label & store</h3>${p('Name the project and revision. Follow the kit’s storage routine.')}</div><div><b>02</b><h3>Keep the record</h3>${p('Actual measurements. Every trial. One change and its result.')}</div><div><b>03</b><h3>Show your own skill</h3>${p('A measurement, a plan interpretation and your saved response.')}</div></div>`+cue('Before you leave',day.project===4?'Power off. Inventory the parts. Return shared tools.':'Clear the bench. Inventory the parts. Return shared tools.'),{className:'routine',tag:'Explain · reset for next time',notes:day.done.join(' ')});

 const frame=(title,view,prompt,check,body)=>({title,image:graphic(view),alt:`${day.title}: ${title}`,prompt,check,...body?{body}:{}});
 const measurementView={organizer:day.meeting===3?'fit':'layout',tower:'parts',beam:'assembly',building:'layout',frame:'layout',stand:'layout',template:'layout',sled:'layout'}[family]??s.focus;
 const stages={
  Brief:[frame('Predict',s.focus,warmup,warmupKey),frame('Today’s challenge',s.focus,s.hook,s.show)],
  Measure:[frame('Find the datum',measurementView,day.measure[0],'Point to the named reference and both endpoints. Read the tool with units.'),frame('Partner check',measurementView,day.measure[1]??'Swap roles and repeat the measurement. Keep both readings.','Check the actual marks before cutting or assembling. Use all directions below.')],
  Plan:[{title:'Try the calculation',image:mathSrc,alt:`Supplied practice values: ${practice}`,prompt:practice,body:'Supplied practice values. Build from the written construction dimensions.',check:answer.join(' ')}],
  Make:s.moves.map((m,i)=>frame(`${i+1}. ${m.title}`,m.view,m.action,i===s.moves.length-1?s.show:'Point to the changed part. Compare it with the plan, then swap maker and checker.')),
  Test:[frame('Run the trial','test',day.test[0],day.test[1]??s.show),frame('Find the catch',s.focus,s.challenge,s.check)],
  Explain:[frame('Stop & show','test',s.show,'Use the object, the labeled drawing and the actual trial record. Then complete your independent response below.')]
 };
 return {slides,lesson:{slug:day.slug,practicePrompt:practice,unitId:`trades-etf-${day.project}`,day:day.meeting,stages:Object.fromEntries(Object.entries(stages).map(([stage,frames])=>[stage,{frames,title:stage==='Brief'?s.hook:stageInfo[stage][0],lead:stageInfo[stage][1],note:`${stage==='Make'?day.demo:day.look} ${stage==='Make'?'Pause after each move; change roles at the midpoint.':''}`}]))},story:s,mathSrc};
}

export function updatePrintLesson(root,day,result){
 const file=path.join(root,'public/trades-etf',day.slug+'.html');
 if(!fs.existsSync(file))throw Error('Missing print lesson '+file);
 let html=fs.readFileSync(file,'utf8').replace(/<!-- workshop-start -->[\s\S]*?<!-- workshop-end -->/g,'');
 const panels=result.lesson.stages.Make.frames.map(f=>`<figure><img src="${f.image}" alt="${esc(f.alt)}"/><figcaption><strong>${esc(f.title)}</strong><p>${esc(f.prompt)}</p></figcaption></figure>`).join('');
 const insert=`<!-- workshop-start --><section class="workshop-sequence"><h2>Build along · one move at a time</h2><p>Maker acts. Checker compares with the plan. Swap at the pause. Use the complete numbered directions below.</p>${panels}<aside><strong>Stop &amp; show</strong><p>${esc(result.story.show)}</p></aside></section><style>.workshop-sequence{margin:30px 0;padding:20px;background:#f2f5ef;border-top:5px solid #137e83}.workshop-sequence figure{margin:20px 0;break-inside:avoid}.workshop-sequence figure img{width:100%;max-height:none}.workshop-sequence figcaption{padding:14px 0;font-size:18px}.workshop-sequence figcaption p{margin:6px 0}.workshop-sequence aside{padding:18px;border-left:4px solid #bc562d;background:#fffdf7}@media print{.workshop-sequence figure img{max-height:2.5in}.workshop-sequence figcaption{font-size:11pt}.workshop-sequence{padding:8px}}</style><!-- workshop-end -->`;
 html=html.replace('<h2>Make ·',insert+'<h2>Make ·');
 // Make the legacy worked example self-contained in the print companion, too.
 html=html.replace(esc(day.example[0]),esc(prompts[`${day.project}-${String(day.meeting).padStart(2,'0')}`][3]));
 fs.writeFileSync(file,html);
}
