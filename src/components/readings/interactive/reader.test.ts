import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { netForce, supportForce, ropeTension, questionSection } from './chapter-two-model'
import { chapterTwoDefinition as chapter } from './chapter-two-definition'
import { assignmentSource, validateChapterDefinition } from './reader-contract'
import { parseMemory } from './reader-memory'
import { interactiveChapterForAssignment } from './registry'
const a = { id:'fixture',course_id:'course',chapter:2,title:'Chapter two',reading:'2.1–2.5',section_ids:['2.1','2.2'],instructions:'',questions:[],due_at:null,status:'published' as const,version:1,created_at:'' }
const question = (reference:string)=>({id:'q',reference,prompt:'',target_id:'t'})
test('force explorations preserve equilibrium and direction at boundaries',()=>{
 for(const l of [0,5,40,80]) for(const r of [0,5,40,80]) assert.equal(netForce(l,r)+netForce(r,l),0)
 assert.equal(netForce(30,40),10); assert.equal(netForce(80,0),-80); assert.equal(netForce(0,0),0)
 for(let p=0;p<=40;p+=5) assert.equal(supportForce(20,p)-20-p,0)
})
test('rope geometry balances both axes across every slider position',()=>{
 let previous=Infinity
 for(let angle=15;angle<=75;angle+=5){const t=ropeTension(300,angle);assert.ok(Math.abs(2*t*Math.sin(angle*Math.PI/180)-300)<1e-9);assert.ok(t<previous);previous=t}
 assert.ok(Math.abs(ropeTension(300,30)-300)<1e-9);assert.equal(ropeTension(300,90),150);assert.throws(()=>ropeTension(300,0),RangeError)
})
test('question source map respects the section boundary at questions 13 and 14',()=>{
 for(const [n,id] of [[1,'force'],[6,'force'],[7,'balance'],[10,'balance'],[11,'support'],[13,'support'],[14,'motion'],[16,'motion'],[17,'vectors'],[20,'vectors']] as const) assert.equal(questionSection(question(`Check Concepts #${n}`)),id)
 assert.equal(questionSection(question('Section 2.3 · Explain')), 'support');assert.equal(questionSection(question('Think and Explain #24')),null);assert.equal(questionSection(question('Check Concepts #21')),null)
})
test('reader chooses only fully covered source and language',()=>{
 assert.equal(interactiveChapterForAssignment(a),chapter);assert.equal(interactiveChapterForAssignment({...a,section_ids:[]}),chapter)
 for(const unsupported of [{...a,chapter:3},{...a,section_ids:['2.6']},{...a,passage:'Course reading'},{...a,honors_reading:{sections:['2.9'],from:42,to:47,focus:''}}])assert.equal(interactiveChapterForAssignment(unsupported),null)
 assert.equal(interactiveChapterForAssignment(a,'es'),null); assert.equal(interactiveChapterForAssignment(a,'pt'),null)
 assert.deepEqual(assignmentSource({...a,honors_reading:{sections:['2.1','3.1'],from:42,to:57,focus:''}}),{book:'openstax',sections:['2.1','3.1'],chapter:null})
})
test('corrupted local progress never becomes mastery or invalid practice state',()=>{
 assert.deepEqual(parseMemory('invalid',chapter).checks,{})
 const m=parseMemory(JSON.stringify({version:1,last:'unexpected',notes:{force:'x'.repeat(5000),bad:'no'},checks:{force:{choice:0,firstChoice:0,attempts:1,correct:true},balance:{choice:9,firstChoice:9,attempts:1}},reflection:'y'.repeat(5000)}),chapter)
 assert.equal(m.last,'opening');assert.equal(m.notes.force.length,4000);assert.equal(m.notes.bad,undefined);assert.equal(m.checks.force.correct,false);assert.equal(m.checks.balance,undefined);assert.equal(m.reflection.length,4000)
})
test('chapter validation rejects missing feedback and duplicate section anchors',()=>{
 assert.throws(()=>validateChapterDefinition({...chapter,sections:[chapter.sections[0],chapter.sections[0]]}))
 assert.throws(()=>validateChapterDefinition({...chapter,sections:[{...chapter.sections[0],check:{...chapter.sections[0].check,feedback:[]}}]}))
})

test('chapter registration requires a source figure inventory with traceable adaptations',()=>{
 assert.throws(()=>validateChapterDefinition({...chapter,visualCoverage:[]}), /Inventory the source figures/)
 const figure=chapter.visualCoverage[0]
 assert.throws(()=>validateChapterDefinition({...chapter,visualCoverage:[{...figure,anchors:[]}]}), /Incomplete visual coverage/)
 assert.throws(()=>validateChapterDefinition({...chapter,visualCoverage:[figure,figure]}), /Incomplete visual coverage/)
 assert.throws(()=>validateChapterDefinition({...chapter,visualCoverage:[{...figure,section:'2.99'}]}), /Incomplete visual coverage/)
 assert.equal(validateChapterDefinition(chapter),chapter)
})

test('moving scaffold loads conserve force and balance moments at both supports', async () => {
  const { scaffoldSupports } = await import('./chapter-two-model')
  for (let p = 0; p <= 100; p += 5) {
    const { left, right, total } = scaffoldSupports(p)
    assert.equal(left + right, total)
    assert.equal(total, 1200)
    assert.equal(right - 400 * .25 - 600 * p / 100 - 200 * .5, 0)
    assert.ok(Math.abs(left - 400 * .75 - 600 * (1 - p / 100) - 200 * .5) < 1e-9)
  }
  assert.equal(scaffoldSupports(80).right - scaffoldSupports(70).right, 60)
  assert.equal(scaffoldSupports(80).left - scaffoldSupports(70).left, -60)
  assert.throws(() => scaffoldSupports(NaN), RangeError)
})

test('unequal-angle ropes cancel horizontally and support the full weight vertically', async () => {
  const { angledRopeForces } = await import('./chapter-two-model')
  for (const a of [15, 30, 45, 60, 75]) for (const b of [15, 30, 45, 60, 75]) {
    const { left, right } = angledRopeForces(300, a, b), rad = Math.PI / 180
    assert.ok(Math.abs(left * Math.cos(a * rad) - right * Math.cos(b * rad)) < 1e-9)
    assert.ok(Math.abs(left * Math.sin(a * rad) + right * Math.sin(b * rad) - 300) < 1e-9)
    if (a === b) assert.ok(Math.abs(left - ropeTension(300, a)) < 1e-9)
  }
  assert.ok(Math.abs(angledRopeForces(300, 30, 60).left - 150) < 1e-9)
  assert.throws(() => angledRopeForces(300, 90, 90), RangeError)
})

test('reading position follows long sections after jumps and reverse scrolling', async()=>{
 const {sectionAtReadingLine}=await import('./reader-position')
 assert.equal(sectionAtReadingLine([{id:'previous',top:-5000,bottom:-500},{id:'current',top:-500,bottom:4000},{id:'next',top:4000,bottom:8000}],180),'current')
 assert.equal(sectionAtReadingLine([{id:'previous',top:-500,bottom:220},{id:'current',top:220,bottom:4000}],180),'previous')
 assert.equal(sectionAtReadingLine([{id:'first',top:-200,bottom:180},{id:'second',top:180,bottom:1000}],180),'second')
 assert.equal(sectionAtReadingLine([{id:'synthesis',top:-1000,bottom:-10}],180),'synthesis')
 assert.equal(sectionAtReadingLine([],180),'opening')
})
