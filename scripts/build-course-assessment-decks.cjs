// Assessment directions derived from the authored course-plan identity.
// Reuses the existing deck stage/runtime so Teach and projector controls agree.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rubric = [
  ['Science', 'Use the physics correctly. Label quantities, units, and diagrams.'],
  ['Reasoning', 'Explain why your model applies. State assumptions and support your choices.'],
  ['Communication', 'Organize the work so another person can follow the argument.'],
  ['Transfer-to-Asteroid', 'Connect the analysis to 2026-XJ and state what the model cannot establish.'],
];
const bullets = xs => '<ul>'+xs.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul>';
const slidesFor = stage => {
  const first = stage === 'start';
  const capstone = stage === 'capstone';
  return [
    {title: first ? 'Receive, plan, begin' : capstone ? 'Race and defend your design' : 'Complete, defend, submit',
      label: 'Transfer assessment', body: '<p>'+esc(first ? 'Read the assigned task. Plan your analysis, then begin your own work.' : capstone ? 'Use your measurements to explain your wheel, alignment, and circuit decisions.' : 'Finish your own analysis. Explain your reasoning, listen to questions, and revise.')+'</p>',
      notes: first ? 'First of two 50-minute assessment meetings. Keep the preceding synthesis lesson. Give the task with all supplied data separately.' : capstone ? 'Keep the race and design judging schedule from the plan. Use the individual plan prepared on Day 8. Performance and craftsmanship scores stay separate from physics understanding.' : 'Second assessment meeting. Return the work held in class. Keep the same task and permitted references.'},
    {title: 'Assessment conditions', label: first ? '0–5 min' : capstone ? 'Before the individual task' : '0–5 min',
      body: bullets(['Work independently on the assigned task.', 'Use the agreed calculator, reference card, and access supports.', 'Ask about the meaning of the task; save requests for physics coaching until feedback.']),
      notes: 'No new worked examples, practice answers, or video coaching during the formal assessment. Access supports preserve the same physics prompt and rubric.'},
    {title: 'Science and reasoning', label: 'Four independent dimensions', body: bullets(rubric.slice(0,2).map(([a,b])=>a+': '+b)), notes: 'Score each dimension separately from 0–4. A polished answer does not compensate for unsupported reasoning.'},
    {title: 'Communication and transfer', label: 'Four independent dimensions', body: bullets(rubric.slice(2).map(([a,b])=>a+': '+b)), notes: capstone ? 'For the vehicle capstone, compare one tested design principle with a powered engineered response and explain where the analogy stops.' : 'Use the same Unit 1 rubric. Explain the asteroid connection with the evidence actually available.'},
    ...(first ? [
      {title:'Read and plan',label:'5–25 min',body:bullets(['Read silently; record what you notice and wonder.','Identify the diagrams, equations, evidence, and assumptions you need.','Plan how your work will address each rubric dimension.']),notes:'5–15: read and clarify the task. 15–25: plan against the rubric. Clarify wording without supplying a method.'},
      {title:'Begin independently',label:'25–45 min',body:bullets(['Follow your plan and show your reasoning.','Label the quantities and units you use.','Keep a record of assumptions and unfinished steps.']),notes:'Circulate to record approaches and access needs. Do not correct the physics during assessment.'},
      {title:'Keep the work for tomorrow',label:'45–50 min',body:bullets(['Record the next step you need to take.','Identify the dimension that needs more attention.','Hand in the work for safekeeping in class.']),notes:'The next meeting provides completion time, peer defense, final revision, and submission.'},
    ] : [
      {title:'Complete your own analysis',label:capstone?'32–43 min':'5–25 min',body:bullets(['Use your own plan and evidence.','Finish the explanation, including assumptions and model limits.','Prepare to explain why the conclusion follows from the work.']),notes:'Teacher help remains limited to task clarification and agreed access supports.'},
      {title:'Peer defense',label:capstone?'43–48 min':'25–40 min',body:bullets(['Explain your model and point to evidence in your work.','The listener asks about a choice, assumption, or limit.','Switch roles and leave a specific feedback note.']),notes:capstone?'Each student defends one design choice. Allow additional time when access needs or unfinished defenses require it.':'Each student explains for about five minutes, then answers questions. Feedback uses the four dimensions. Do not copy a partner’s solution.'},
      {title:'Revise and submit',label:capstone?'48–50 min':'40–50 min',body:bullets(['Record a short revision and explain why you made it.','Self-rate each rubric dimension from 0–4.','Submit your analysis, plan, feedback, and reflection.']),notes:'The teacher independently rates the evidence. Do not average rubric dimensions. The 1–3 target self-rating is a separate scale. Follow Unit 1’s revision policy.'},
    ]),
  ];
};
const manifest=[];
for(let unit=2;unit<=8;unit++) {
  const plans=JSON.parse(fs.readFileSync(path.join(root,`src/data/unit${unit}-cpa-lesson-plans.json`),'utf8'));
  for(const plan of plans.filter(p=>p.assessmentStage)) {
    const slides=slidesFor(plan.assessmentStage);
    const label=`Unit ${unit} · Day ${plan.day}`;
    const title=`Transfer assessment — ${plan.assessmentStage==='start'?'Receive, plan, begin':plan.assessmentStage==='capstone'?'Design defense':'Complete, defend, submit'}`;
    const src=`/decks/course-assessments/unit-${unit}-day-${plan.day}.html`;
    const rendered=slides.map((s,i)=>`<section class="slide${i===0?' cover':''}" id="slide-${i+1}" data-title="${esc(s.title)}" data-label="${esc(s.label)}" data-speaker-notes="${esc(s.notes)}" data-solution="false" data-question="${i+1}" aria-hidden="true"><header><span>${esc(s.label)}</span><span>${esc(label)}</span></header><${i===0?'h1':'h2'}>${esc(s.title)}</${i===0?'h1':'h2'}><div class="content">${s.body}</div><footer><span>Science · Reasoning · Communication · Transfer</span><span>${i+1} / ${slides.length}</span></footer></section>`).join('');
    const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(label+' — '+title)}</title><link rel="stylesheet" href="/decks/worksheet-guided/style.css"><style>.toolbar [hidden]{display:none!important}</style></head><body><main class="stage-shell"><deck-stage class="stage">${rendered}</deck-stage></main><nav class="toolbar" aria-label="Presentation controls"><button id="prev" aria-label="Previous step">← Back</button><span id="count" aria-live="polite"></span><button id="next">Next step →</button><label class="select-label">Step<select id="problem" aria-label="Choose assessment step">${slides.map((s,i)=>`<option value="${i}">${esc(s.title)}</option>`).join('')}</select></label><button id="nextProblem" hidden>Next step</button><button id="replay" hidden>Replay</button><button id="notes">Teacher notes</button><button id="fullscreen">Full screen</button><button id="reset">Restart</button></nav><script src="/decks/worksheet-guided/runtime.js"></script></body></html>`;
    const dest=path.join(root,'public',src);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,html);
    manifest.push({unit:`unit-${unit}`,day:plan.day,stage:plan.assessmentStage,title,src,slides:slides.length});
  }
}
fs.writeFileSync(path.join(root,'src/data/course-assessments.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Built ${manifest.length} course assessment decks from plan identities.`);
