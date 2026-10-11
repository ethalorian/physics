const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.cwd(),out=fs.mkdtempSync('/private/tmp/etf-decks-test-');
(async()=>{
 const esbuild=require(root+'/node_modules/esbuild');
 const bundle=async(file,name)=>{await esbuild.build({entryPoints:[root+'/'+file],outfile:out+'/'+name+'.cjs',bundle:true,platform:'node',format:'cjs',packages:'external',plugins:[{name:'database-fixture',setup(b){b.onResolve({filter:/^@\/lib\/supabase$/},()=>({path:'db',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const supabaseAdmin={from:()=>globalThis.db()}',loader:'js'}))}}]});return require(out+'/'+name+'.cjs')};
 const decks=await bundle('src/data/lesson-decks.ts','decks'),plans=await bundle('src/lib/course-plan-presentation-server.ts','plans'),keys=await bundle('src/lib/course-plan-presentation.ts','keys'),activities=await bundle('src/lib/deck-activities.ts','activities');
 const manifest=require(root+'/src/data/trades-etf-decks.json'),days=require(root+'/scripts/trades-etf/days.json'),catalog=require(root+'/src/data/trades-etf-deck-activities.json');
 const targets=require(root+'/scripts/trades-etf/targets.json').map((t,i)=>({...t,id:'target-'+i}));
 const course={id:'etf',program:'trades',track:'cpa',teacher_email:'teacher@test'};
 global.db=()=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:course,error:null})};return q};
 const choices=plans.coursePlanChoices(course);
 assert.equal(choices.length,36);assert.ok(choices.every(d=>d.deck));assert.equal(catalog.length,108);
 for(const deck of manifest){
  const day=days.find(d=>d.slug===deck.slug),choice=choices.find(d=>d.unit_id===deck.unitId&&d.day===deck.day);
  assert.equal(choice.deck.src,deck.src);
  assert.deepEqual(keys.presentationTarget(choice.id),{plan_unit_id:deck.unitId,plan_day:deck.day});
  const resolved=await plans.resolveClassPlan({plan_unit_id:deck.unitId,plan_day:deck.day},'etf',{role:'teacher',email:'teacher@test'});
  assert.equal(resolved.ok,true);assert.equal(resolved.lesson.deck.src,deck.src);assert.equal(resolved.plan.plan_track,'cpa');
  const identity={plan_unit_id:deck.unitId,plan_day:deck.day,plan_track:'cpa'};
  const list=activities.activitiesForDeck(identity,targets.filter(t=>t.unit_id===deck.unitId));
  assert.deepEqual(list.map(a=>a.kind),['warmup','solo','exit_ticket']);assert.ok(list.every(a=>a.targetId));assert.ok(list.every(a=>a.prompt.length<=1000));
  assert.deepEqual(activities.activitiesForDeck({plan_unit_id:deck.unitId,plan_day:deck.day},targets, 'u1-d01'),activities.activitiesForDeck(identity,targets),'Explicit ETF day wins over legacy lesson slug');
  assert.equal(activities.activitiesForDeck({},targets,deck.slug)[2].id,list[2].id);
  assert.equal(list[2].prompt,day.exit,'Authored ETF exit problem is retained');
  const html=fs.readFileSync(root+'/public'+deck.src,'utf8'),sections=html.split('<section class="slide ').slice(1);
  assert.equal(sections.length,deck.slides);assert.equal(sections.filter(s=>s.includes('data-activity-id=')).length,3);
  for(const a of list){assert.match(sections[a.slide-1],new RegExp('data-activity-id="'+a.id+'"'));assert.match(sections[a.slide-1],/data-solution="false"/)}
  const evidence={type:'prose',id:'existing-student-evidence',markdown:'Retain the saved work.'},doc={schemaVersion:1,blocks:[evidence]};
  const updated=decks.withLessonPresentationDeck(doc,{unit_id:deck.unitId,slug:deck.slug,lesson_number:deck.day});
  assert.equal(updated.blocks[0].src,deck.src);assert.equal(updated.blocks[1],evidence);assert.equal(doc.blocks.length,1);
  assert.equal(decks.withLessonPresentationDeck(updated,{unit_id:deck.unitId,slug:deck.slug}).blocks.length,2,'Read-time injection is idempotent');
  assert.equal(decks.withLessonPresentationDeck(doc,{unit_id:'unit-1',slug:deck.slug}),doc,'Course identity must match');
 }
 const denied=await plans.resolveClassPlan({plan_unit_id:'unit-1',plan_day:1},'etf',{role:'teacher',email:'teacher@test'});assert.equal(denied.ok,false);
 assert.equal((await plans.resolveClassPlan({plan_unit_id:'trades-etf-1',plan_day:1},'etf',{role:'teacher',email:'other@test'})).ok,false);
 for(const invalid of ['plan:trades-etf-1:0','plan:trades-etf-1:1.5','plan:trades-etf-1:1:2','plan:../trades-etf-1:1'])assert.equal(keys.planTarget(invalid),null);
 assert.equal(decks.deckForDay('trades-etf-1',7),null);assert.equal(activities.activitiesForDeck({plan_unit_id:'trades-etf-1',plan_day:7},targets).length,0);
 const custom={schemaVersion:1,blocks:[{type:'deck',id:'teacher-deck',src:'/decks/custom.html',title:'Teacher deck'}]};assert.equal(decks.withLessonPresentationDeck(custom,{unit_id:'trades-etf-1',slug:'mvp-etf-1-01'}),custom);
 console.log('PASS 36 ETF days: Teach identity and class scope; 108 target-linked warm-up/practice/exit activities; matching source slides; existing student work and teacher decks preserved.');
})().catch(e=>{console.error(e);process.exitCode=1});
