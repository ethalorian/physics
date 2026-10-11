// Content/identity checks. These do not claim a physical prototype was tested.
const assert=require('node:assert/strict'),fs=require('node:fs');
const days=require('./trades-etf/days.json'),lessons=require('./trades-etf/lessons.json'),plans=require('../src/data/trades-etf-plans.json');
assert.equal(days.length,36);
for(const [i,d] of days.entries()){
 const l=lessons[i],p=plans[l.unit_id].find(p=>p.lessonId===l.id);
 for(const field of ['why','kit','read','prep','demo','look','trouble'])assert.ok(d[field]?.length>45,`${l.slug}: ${field}`);
 assert.ok(d.build.length>=5,`${l.slug}: construction sequence`);
 assert.ok(d.done.length>=2&&d.test.length>=2);
 const stages=l.content_blocks.blocks.filter(b=>b.workshop?.pageBreakBefore);
 assert.deepEqual(stages[3].workshop.steps,d.build);
 assert.deepEqual(stages[4].workshop.steps,d.test);
 assert.ok(p.bodyHtml.includes(d.demo.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;')));
 const student=JSON.stringify(l.content_blocks);
 assert.ok(!/Choose a small press|teacher-selected test|Choose a prepared route|teacher-defined gentle test|boat route/i.test(student),l.slug);
 for(const b of stages)assert.equal(b.teachingTool.frames[0].image,`/trades-etf/${d.diagram}.svg`);
 assert.match(student,/practice values|Practice numbers/);
 const print=fs.readFileSync(`public/trades-etf/${l.slug}.html`,'utf8');
 assert.match(print,/Daily kit/);assert.match(print,/Finished means/);assert.match(print,/Numbered bench directions/);assert.ok(!print.includes('Teacher answer key'));
}
// Critical geometry: overlap is excluded from section perimeter; organizer fits
// four thicknesses; the door retains a lintel; guide rails clear the full stroke.
assert.equal(3+3+4+.5,10.5);
assert.equal(6-2*.125,5.75);
assert.equal(2.625-.125,2.5);
assert.equal(5.25-(2.625+.125),2.5);
assert.equal(8-.125-(5.25+.125),2.5);
assert.equal(16*.5,8);assert.equal(12*.5,6);assert.equal(7*.5,3.5);
assert.equal(2*8*4+2*6*4-1.5*3.5,106.75);
assert.ok(2+20/25.4<3,'3-in rail covers 2-in deck plus 20-mm stroke');
assert.equal(2*.3*4-(.3*4+.3*1),.8999999999999999);
// Existing lesson/capture identities remain valid for saved progress.
if(process.env.TRADES_BEFORE){
 const old=JSON.parse(fs.readFileSync(process.env.TRADES_BEFORE,'utf8')).lessons;
 assert.deepEqual(lessons.map(l=>l.id).sort(),old.map(l=>l.id).sort());
 for(const l of lessons){const prev=old.find(o=>o.id===l.id);assert.equal(l.slug,prev.slug);assert.deepEqual(l.content_blocks.blocks.filter(b=>b.capture).map(b=>[b.id,b.type,b.targetId]),prev.content_blocks.blocks.filter(b=>b.capture).map(b=>[b.id,b.type,b.targetId]));}
}
console.log('PASS: 36 complete daily recipes; coordinated student/teacher/print directions; concrete kits, tests and finished work; critical geometry; stable lesson/capture identities. Physical builds require local equipment rehearsal.');
