import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {walkthrough,vectorConstruction,graphConstruction,correctedAnswer,answerCorrections} from '../src/data/deck-sources/worksheet-guided/walkthroughs.mjs';
import {physicalModel} from '../src/data/deck-sources/worksheet-guided/physical-models.mjs';
const days=JSON.parse(fs.readFileSync('resources/worksheet-decks/source.json'));
const manifest=JSON.parse(fs.readFileSync('src/data/worksheet-decks.json'));
const coverage=JSON.parse(fs.readFileSync('resources/worksheet-decks/coverage.json'));
const day=(u,d)=>days.find(x=>x.unit===u&&x.day===d);
const plan=(u,d,t,n)=>{const source=day(u,d),q=source[t].find(x=>x.number===n);return walkthrough(source,t,{...q,answer:correctedAnswer(source,t,q)},q.visual).stages;};
let count=0,illustrated=0;
for(const deck of coverage.decks){
 const html=fs.readFileSync('resources/worksheet-decks/generated/'+deck.file,'utf8');
 assert.ok(!/Choose an approach together|Student A · Explain|Student B · Check|reasoningBoard|data-scene="reasoning"/.test(html));
 assert.ok(!/(?:="| )[+-]?(?:NaN|Infinity)(?:"| )/.test(html),deck.file);
 const slides=[...html.matchAll(/<section class="slide[\s\S]*?<\/section>/g)].map(m=>m[0]);
 for(const q of deck.questions){const frames=slides.slice(q.start,q.end+1);assert.ok(frames.length>=2);for(const frame of frames){assert.match(frame,/class="walk-problem/);assert.match(frame,/class="walk-pause/);assert.ok(!frame.includes('conversation-card'));}
 assert.ok(frames[0].includes('data-solution="false"'));assert.ok(frames.at(-1).includes('data-solution="true"'));if(frames.some(f=>f.includes('<svg')))illustrated++;count++;}
}
assert.equal(count,2124);assert.equal(manifest.length,262);
const v=vectorConstruction([[0,0],[3,0],[3,4]]);assert.match(v[2].graphic,/data-motion="translate"/);assert.ok(!v[1].graphic.includes('class="wb-result"'));assert.match(v[3].graphic,/R = \(3, 4\)/);assert.match(v[5].lines.join(' '),/5 m/);assert.match(v[5].lines.join(' '),/7 m/);
const paths=[...v[3].graphic.matchAll(/d="M([\d.-]+) ([\d.-]+)L([\d.-]+) ([\d.-]+)[^"]*" class="wb-([ab])"/g)];assert.equal(paths.length,2);assert.equal((+paths[0][3]-+paths[0][1])/3,(+paths[1][2]-+paths[1][4])/4,'Vector axes must have equal scale');
const ret=plan(1,6,'honors',7);assert.ok(ret.some(s=>s.lines.join(' ').includes('(-6, -5)')));assert.ok(ret.some(s=>s.lines.join(' ').includes('south of west')));assert.ok(!ret.some(s=>s.lines.join(' ').includes('R = (0, 0)')));
const missing=plan(1,6,'honors',11);assert.ok(missing.some(s=>s.lines.join(' ').includes('Bₓ = −6')));assert.ok(missing.some(s=>s.lines.join(' ').includes('Bᵧ = +√')));
const motion=plan(1,6,'honors',9);assert.ok(motion.some(s=>s.graphic.includes('x position (m)')));assert.ok(motion.some(s=>s.graphic.includes('y position (m)')));
const graph=graphConstruction({points:[[0,2],[2,6],[4,6],[6,0]],xlabel:'Time (s)',ylabel:'Position (m)'});assert.ok(graph.some(s=>s.lines.join(' ').includes('−')));assert.ok(graph.some(s=>s.lines.join(' ').includes('-3 m/s')));
const work=graphConstruction({points:[[0,3],[2,3]],xlabel:'Position change (m)',ylabel:'Force (N)'});assert.match(work.at(-1).lines.join(' '),/W = 6 J/);assert.ok(!work.some(s=>s.lines.join(' ').includes('Δt')));
const impulse=graphConstruction({points:[[0,4],[3,4]],xlabel:'Time (s)',ylabel:'Force (N)'});assert.match(impulse.at(-1).lines.join(' '),/J = 12 N·s/);
assert.equal(graphConstruction({points:[[0,0],[3,4]],xlabel:'East (m)',ylabel:'North (m)'}),null);
assert.match(plan(7,7,'honors',4).map(s=>s.lines.join(' ')).join(' '),/0.4 A/);assert.match(plan(7,8,'honors',4).map(s=>s.lines.join(' ')).join(' '),/3 A/);
const lamp=plan(1,15,'honors',3);assert.equal(lamp[0].kind,'force');assert.ok(lamp.some(s=>s.lines.join(' ').includes('19.6 N')));assert.ok(lamp.some(s=>s.lines.join(' ').includes('T − Fg')));
const corrections=Object.entries(answerCorrections);assert.equal(corrections.length,7);for(const [key,value]of corrections){const [u,t,d,num]=key.split('/');const source=day(+u,+d),q=source[t].find(x=>x.number===+num);assert.notEqual(value,q.answer);assert.equal(correctedAnswer(source,t,q),value);}
assert.match(correctedAnswer(day(1,3),'cpa',day(1,3).cpa.find(q=>q.number===9)),/−1.2/);assert.match(correctedAnswer(day(1,7),'honors',day(1,7).honors.find(q=>q.number===4)),/84 m/);
// A downward constant-acceleration example must not acquire a circular-motion law.
const noncircle=physicalModel(day(2,1),'honors',day(2,1).honors.find(q=>q.number===4));assert.notEqual(noncircle?.[0]?.kind,'circular-motion');
const attrs={height:'100',y:'200'},styles={};const element={dataset:{motion:'bar',at:'0',base:'300'},style:styles,getAttribute:k=>attrs[k]??null,setAttribute:(k,v)=>attrs[k]=v};
const root={querySelectorAll:()=>[element],querySelector:()=>null};const context={window:{},document:{addEventListener(){},querySelector:()=>root},matchMedia:()=>({matches:true,addEventListener(){}}),cancelAnimationFrame(){},requestAnimationFrame(){throw Error('Reduced motion scheduled animation')},performance:{now:()=>0}};
vm.runInNewContext(fs.readFileSync('src/data/deck-sources/worksheet-guided/motion.js','utf8'),context);context.window.WorksheetMotion.play(root);assert.equal(attrs.height,'100');assert.equal(attrs.y,'200');
const etf=JSON.parse(fs.readFileSync('src/data/trades-etf-decks.json'));for(const d of etf){const html=fs.readFileSync('public'+d.src,'utf8');assert.match(html,/class="walk-problem/);assert.match(html,/data-motion="reveal"/);assert.ok(!html.includes('Choose the approach together'));}
console.log(`PASS ${manifest.length+etf.length} decks; ${count} persistent problem sequences (${illustrated} with diagrams); signed vector geometry, return vectors, missing components, x/y graphs, force-area units, circuits, 7 corrected keys, reduced motion.`);
