const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const E=require('../public/games/mic-check/engine.js'),tracks=require('../public/games/mic-check/tracks.js');
const roadmap=require('../src/data/physics-learning-roadmap.json');
test('every unit lyric is connected to an actual target and a nonempty original vocal sample',()=>{
 const manifest=require('../public/games/mic-check/vocals/manifest.json');assert.equal(manifest.samples.length,192);assert.equal(tracks.length,8);for(const [i,t] of tracks.entries()){assert.equal(t.id,'unit-'+(i+1));assert.equal(t.verses.length,6);for(const [v,verse] of t.verses.entries()){assert(roadmap.some(r=>r.unit===t.id&&r.slug===verse.target),'Missing target: '+verse.target);assert.equal(verse.chunks.length,4);assert(verse.source);for(let c=0;c<4;c++)assert.equal(manifest.samples.find(s=>s.file===t.id+'-'+v+'-'+c+'.wav')?.text,verse.chunks[c]);assert(verse.fact.length>40);for(let c=0;c<4;c++){const wav=fs.readFileSync(path.join(__dirname,'../public/games/mic-check/vocals',t.id+'-'+v+'-'+c+'.wav'));assert.equal(wav.toString('ascii',0,4),'RIFF');assert(wav.length>4000,'Silent/empty vocal');let peak=0;for(let j=44;j<wav.length;j+=2)peak=Math.max(peak,Math.abs(wav.readInt16LE(j)));assert(peak>1000);}}}
});
test('ninety-second chart yields identical million-point perfect results for all tracks',()=>{
 for(const t of tracks){const r=new E.Run();for(const note of r.notes){const hit=r.hit(note.lane,note.time);assert.equal(hit.kind,'perfect',t.id);}r.update(E.DURATION);assert(r.finished);assert.equal(r.score(),1000000);assert.equal(r.best,24);assert.equal(r.accuracy(),100);}assert.equal(E.DURATION,90);
});
test('one key cannot clear other lanes; rapid wrong taps never improve a score',()=>{
 const r=new E.Run();const n=r.notes[0];assert.equal(r.hit((n.lane+1)%4,n.time).kind,'wrong');assert.equal(r.score(),0);assert.equal(r.hit(n.lane,n.time).kind,'perfect');const before=r.score();for(let i=0;i<10;i++)r.hit((n.lane+1)%4,n.time+.05);assert(r.score()<before);assert.equal(r.perfect,1);
});
test('misses and partial runs count toward the fixed total; timing windows distinguish perfect and good',()=>{
 const r=new E.Run();r.hit(r.notes[0].lane,r.notes[0].time+.15);assert.equal(r.good,1);assert.equal(r.perfect,0);r.update(r.notes[1].time+.3);assert.equal(r.misses,1);assert(r.accuracy()<10);r.update(E.DURATION);assert.equal(r.misses,23);assert(r.finished);
});
test('coach listening never penalizes; freestyle never inflates ranked score',()=>{
 const r=new E.Run();r.hit(0,4);assert.equal(r.wrong,0);for(let i=0;i<32;i++)r.hit(i%4,75+i*E.BEAT/2);assert.equal(r.freestyle,32);assert.equal(r.score(),0);r.hit(0,75+31*E.BEAT/2);assert.equal(r.freestyle,32);r.update(E.DURATION);assert.equal(r.hit(0,90).kind,'ignore');
});
test('phase and response chart meet exactly; taps just before a response are valid',()=>{
 for(const n of E.chart()){assert.equal(E.section(n.time).phase,'echo');assert.equal(E.section(n.time).verse,n.verse);}assert.equal(E.section(3).phase,'coach');assert.equal(E.section(9).phase,'echo');assert.equal(E.section(75).phase,'freestyle');assert.equal(E.section(87).phase,'outro');const r=new E.Run();assert.equal(r.hit(0,8.92).kind,'perfect');
});
