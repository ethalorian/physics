/** Test the imported tool's motion and practice state, without classroom writes. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src/data/deck-sources/project-physics/week-1-day-1.html'), 'utf8');
const logic = html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
let frame;
const context = vm.createContext({
  DCLogic: class { setState(patch) { Object.assign(this.state, patch); } },
  React: { createRef: () => ({current:null}), createElement: (...args) => args },
  document: { querySelector: () => null },
  requestAnimationFrame: f => { frame=f; return 1; }, cancelAnimationFrame: () => {},
});
vm.runInContext(logic + '\nthis.Walk=Component;this.targets=TARGETS;this.interpolate=interp;', context);
const tool = new context.Walk();
tool.setMode('auto'); tool.record();
assert.equal(tool.state.recording, false, 'Cannot record the covered prediction');
tool.renderVals().reveal();
assert.equal(tool.state.recording, true);
tool.componentDidMount();
for(let ms=1;ms<=11001;ms+=20) frame(ms);
assert.equal(tool.state.t,10); assert.equal(tool.state.d,1);
assert.equal(tool.state.recording,false);
for(const [time,expected] of [[0,1],[3,2.5],[4,2.5],[5,2.5],[6,1],[10,1]]) {
  const sample=tool.state.trace.reduce((a,b)=>Math.abs(b[0]-time)<Math.abs(a[0]-time)?b:a);
  assert.ok(Math.abs(sample[1]-expected)<0.04, 'Script segment at '+time+' s');
}
for(let i=0;i<3;i++) {
  tool.setMode('m'+i);
  assert.equal(tool.state.d,context.targets[i].pts[0][1]);
  tool.state.trace=[[0,tool.state.d]]; tool.state.t=0;
  assert.equal(tool.renderVals().scoreText,'—');
  assert.equal(tool.renderVals().cannotLog,true);
  tool.state.t=10;
  tool.state.trace=Array.from({length:101},(_,k)=>[k/10,context.interpolate(context.targets[i].pts,k/10)]);
  assert.equal(tool.renderVals().scoreText,'100%');
  tool.renderVals().logScore(); assert.equal(tool.state.rows[i].score,'100%');
  tool.state.trace=tool.state.trace.map(([t,d])=>[t,d+1]);
  assert.equal(tool.renderVals().scoreText,'50%');
}
tool.setMode('m1');
tool.key({key:'ArrowRight',repeat:false,shiftKey:false,preventDefault(){}},true);
tool.key({key:'ArrowRight',preventDefault(){}},false);
assert.equal(tool.state.d,3.08,'A single arrow press moves the walker');
tool.renderVals().reset(); assert.equal(tool.state.d,3);
tool.renderVals().frames[0].chips[0].pick();
assert.match(tool.renderVals().frames[0].answer,/away/);
assert.equal(tool.renderVals().frames[0].chips[0].border,'#C9673F');
tool.renderVals().setOwnWords({target:{value:'Flat means stopped.'}});
tool.renderVals().setLevelTwo({target:{value:'Up means away.'}});
tool.state.tab=1; tool.state.timer=0;
tool.renderVals().startTimer(); assert.equal(tool.state.speaker,'B'); assert.equal(tool.state.timer,60);
tool.state.tab=2;
assert.equal(tool.renderVals().ownWords,'Flat means stopped.');
assert.equal(tool.renderVals().levelTwo,'Up means away.');
assert.equal((html.match(/data-section-anchor=/g)||[]).length,3);
assert.ok(!/href="[^"\n]*\.dc\.html"/.test(html),'No broken artifact sibling links');
console.log('PASS prediction gate, 10-second script, three matches, full-run scoring, per-match logs, keyboard/reset, writing persistence and timer swap');
