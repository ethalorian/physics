const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('../public/games/pulse/engine.js');
function playAll(run, error = 0) {
  const actions = run.notes.flatMap(n => [{time:n.time+error,lane:n.lane,down:true},{time:n.time+n.duration+error+(n.duration ? 0.005 : 0.02),lane:n.lane,down:false}]).sort((a,b)=>a.time-b.time || Number(a.down)-Number(b.down));
  for(const action of actions) run[action.down?'press':'release'](action.lane,action.time);
  run.update(E.DURATION); return run.summary();
}
test('charts are deterministic, distinct, bounded, and physically playable',()=>{
  const counts=[];
  for(const difficulty of ['easy','arcade','expert']){
    const chart=E.makeChart(difficulty);assert.deepEqual(chart,E.makeChart(difficulty));counts.push(chart.length);
    const ends=[-Infinity,-Infinity,-Infinity,-Infinity];
    for(const note of chart){assert(note.time>=E.LEAD);assert(note.time+note.duration<E.DURATION);assert(note.time-ends[note.lane]>=0.21);ends[note.lane]=note.time+note.duration;}
    assert(chart.some(n=>n.duration>0));
    if(difficulty!=='easy')assert(chart.some((n,i)=>i&&chart[i-1].time===n.time),'has chords');
  }
  assert(counts[0]<counts[1]&&counts[1]<counts[2]);assert.equal(E.DURATION,75);
});
test('a perfect full chart earns exactly 1,000,000 and a full combo on each difficulty',()=>{
  for(const difficulty of ['easy','arcade','expert']){
    const s=playAll(new E.Run(difficulty));assert.equal(s.score,1000000);assert.equal(s.accuracy,1);assert.equal(s.fullCombo,true);assert.equal(s.bestCombo,s.total);assert.equal(s.grade,'S');
  }
});
test('judgement windows distinguish early, late, and missed notes',()=>{
  for(const [delta,kind] of [[-.049,'perfect'],[.049,'perfect'],[-.08,'great'],[.08,'great'],[-.14,'good'],[.14,'good']]){
    const r=new E.Run();r.press(r.notes[0].lane,r.notes[0].time+delta);assert.equal(r.counts[kind],1);assert.equal(r.drain()[0].error.toFixed(3),delta.toFixed(3));
  }
  const r=new E.Run();r.update(r.notes[0].time+0.161);assert.equal(r.counts.miss,1);
});
test('early hold release loses the tail; holding and key repeat cannot farm points',()=>{
  const r=new E.Run(),n=r.notes.find(n=>n.duration);r.press(n.lane,n.time);const earned=r.earned;
  for(let i=0;i<20;i++)r.press(n.lane,n.time+.01);assert.equal(r.earned,earned);
  r.release(n.lane,n.time+.2);assert.equal(n.tail,'miss');r.update(n.time+n.duration);assert.equal(r.earned,earned);
});
test('no input still completes the track, with zero score and no combo',()=>{
  const r=new E.Run();r.update(E.DURATION);const s=r.summary();assert(r.finished);assert.equal(s.score,0);assert.equal(s.counts.miss,s.total);assert.equal(s.fullCombo,false);
});
test('rapid all-lane mashing is penalized and cannot produce a high score',()=>{
  const r=new E.Run();
  for(let t=0;t<=E.DURATION;t+=.04)for(let lane=0;lane<4;lane++){r.press(lane,t);r.release(lane,t+.001);}
  r.update(E.DURATION);assert.equal(r.summary().score,0);assert(r.counts.stray>1000);assert(r.summary().accuracy<.1);
});
test('a paused hold can be re-grabbed; failing to re-grab loses its tail',()=>{
  for(const regrab of [false,true]){
    const r=new E.Run(),n=r.notes.find(n=>n.duration);r.press(n.lane,n.time);r.clearKeys();if(regrab)r.down[n.lane]=true;
    r.dropUnheld(n.time+.2);r.update(n.time+n.duration);assert.equal(n.tail,regrab?'hit':'miss');
  }
});
test('all 25 song/level charts are playable, deterministic, and finish at a perfect million',()=>{
  for(const song of E.songs) for(const level of E.levels) {
    const run=new E.Run(level.id,song.id), t=E.timing(song.id), last=Array(level.keys.length).fill(-Infinity);
    assert.equal(run.down.length,level.keys.length);
    assert.deepEqual(E.makeChart(level.id,song.id),E.makeChart(level.id,song.id));
    const events=run.notes.flatMap(n=>[{time:n.time,lane:n.lane,down:true},{time:n.time+n.duration+.005,lane:n.lane,down:false}]).sort((a,b)=>a.time-b.time||Number(a.down)-Number(b.down));
    for(const n of run.notes){assert(n.lane>=0&&n.lane<level.keys.length);assert(n.time>=t.lead&&n.time+n.duration<t.duration);assert(n.time-last[n.lane]>=.12);last[n.lane]=n.time+n.duration;}
    assert.equal(new Set(run.notes.map(n=>n.lane)).size,level.keys.length);
    for(const a of events) run[a.down?'press':'release'](a.lane,a.time);
    run.update(t.duration);assert(run.finished);assert.equal(run.summary().score,1000000,song.title+' '+level.name);assert(run.summary().fullCombo);
  }
});
test('new levels increase density and travel speed, with six-key triple chords',()=>{
  for(const song of E.songs){
    const counts=E.levels.map(l=>E.makeChart(l.id,song.id).length);
    assert(counts.every((n,i)=>i===0||n>counts[i-1]),song.title);
    assert(counts[3]>counts[2]*1.5);assert(counts[4]>counts[3]*1.2);
    const six=E.makeChart('overdrive',song.id), chords=new Map();
    for(const n of six)chords.set(n.time,(chords.get(n.time)||0)+1);
    assert([...chords.values()].includes(3));assert(Math.max(...chords.values())<=3);
  }
  assert(E.getLevel('master').fall<E.getLevel('expert').fall);
  assert(E.getLevel('overdrive').fall<E.getLevel('master').fall);
});
test('nearest note wins when fast same-lane timing windows overlap',()=>{
  const run=new E.Run('overdrive','terminal-velocity');
  const pair=run.notes.flatMap((n,i)=>run.notes.slice(i+1).filter(m=>m.lane===n.lane&&m.time-n.time<.30).map(m=>[n,m]))[0];
  assert(pair);const [earlier,later]=pair;run.press(later.lane,later.time-.02);
  assert.equal(later.state,'hit');assert.notEqual(earlier.state,'hit');
});
