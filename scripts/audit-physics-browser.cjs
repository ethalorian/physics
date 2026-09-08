// Local runtime smoke audit; does not authenticate or touch production data.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('/Users/craigantocci/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
const games=['dynamics-push','energy-cascade','momentum-impact','gravitation-orbit','waves-resonance','thermal-furnace','em-flux','car-garage'];
(async()=>{let browser;const server=http.createServer((req,res)=>{const file=path.join(root,'public/games',path.basename(new URL(req.url,'http://localhost').pathname));if(!fs.existsSync(file)){res.statusCode=404;return res.end()}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/html');res.end(fs.readFileSync(file))});
try{await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage();await page.route('https://fonts.googleapis.com/**',r=>r.abort());let errors=[];page.on('pageerror',e=>errors.push(e.message));const rows=[];
for(const name of games){for(const act of [1,2,3]){errors=[];await page.goto(`http://127.0.0.1:${server.address().port}/${name}.html`);let result;try{result=await page.evaluate(a=>{Object.assign(STATS,{solved:4,right:2,wrong:1});startAct(a);const freshStats=JSON.stringify(STATS);let carriedStats=true;if(typeof ARCADE.canStart!=='function'){Object.assign(STATS,{solved:2,right:1,wrong:1});ARCADE.playId='audit-active';startAct(a);carriedStats=STATS.solved===2&&STATS.right===1&&STATS.wrong===1;ARCADE.playId=null;Object.assign(STATS,{solved:0,right:0,wrong:0});}launch();if(typeof fire1==='function'&&state==='aim')fire1();if(typeof launchGo==='function'&&state==='charge'){spring=lv.springMax*.65;launchGo()};for(let i=0;i<1200&&state==='play';i++)step(1/120);return {state,time:t,finite:Number.isFinite(t),freshStats,carriedStats,landedOK,reason:lastResult?.failMsg||null}},act);await page.waitForTimeout(80)}catch(e){errors.push(e.message)}rows.push({game:name,act,...result,errors:[...errors]});console.log(JSON.stringify(rows.at(-1)))}}
// Introductory challenges must require a player action.
await page.goto(`http://127.0.0.1:${server.address().port}/waves-resonance.html`);
assert(await page.evaluate(()=>{startAct(2);launch();for(let i=0;i<600;i++)step(1/120);return state==='play'&&STATS.solved===0}));
await page.evaluate(()=>{myF=lv.v/(2*lv.L);for(let i=0;i<600&&state==='play';i++)step(1/120)});
assert(await page.evaluate(()=>landedOK));console.log('PASS Resonance requires tuning and correct tuning succeeds');
await page.goto(`http://127.0.0.1:${server.address().port}/thermal-furnace.html`);
const furnace=await page.evaluate(()=>{muted=true;let drift=0;for(let run=0;run<20;run++){startAct(2);if(run%2)showMission(endless2(1));launch();for(let i=0;i<600&&state==='play';i++)step(1/120);drift=Math.max(drift,Math.abs(chamberT('L')-chamberT('R')));if(state!=='play'||STATS.solved)throw new Error('Idle sorting completed');}return drift});
assert(furnace<1e-8);console.log('PASS Furnace starts balanced and a closed gate preserves temperatures across 20 random starts');
const sorted=await page.evaluate(()=>{
 const original=Math.random;let wins=0;
 try{for(let seed=1;seed<=3;seed++){
  let rng=seed;Math.random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296};
  startAct(2);launch();
  for(let i=0;i<8400&&state==='play';i++){
   const mean=parts.reduce((sum,p)=>sum+p.vx*p.vx+p.vy*p.vy,0)/parts.length;
   const near=parts.filter(p=>Math.abs(p.x-24)<.7&&Math.abs(p.y-15)<lv.gapH/2&&((p.x<24&&p.vx>0)||(p.x>24&&p.vx<0)));
   gateOpen=near.length>0&&near.every(p=>p.x>24?p.vx*p.vx+p.vy*p.vy>mean:p.vx*p.vx+p.vy*p.vy<mean);
   step(1/120);
  }
  if(landedOK&&state==='down')wins++;
 }}finally{Math.random=original}return wins;
});
assert(sorted>0,'Furnace sorting pilot must complete a mission');console.log('PASS Furnace selective gate control succeeds',sorted,'of 3 seeded runs');

// Regression: an uncomputed asteroid forecast must never award a rescue.
await page.goto(`http://127.0.0.1:${server.address().port}/gravitation-orbit.html`);
const forecast=await page.evaluate(()=>{startAct(3);launch();step(1/120);const before={state,solved:STATS.solved};predict();return {...before,miss:astMiss}});
assert.equal(forecast.state,'play');assert.equal(forecast.solved,0);assert(Number.isFinite(forecast.miss));assert(forecast.miss<=0);console.log('PASS Orbit unknown forecast cannot win; initial natural path predicts impact');
for(const act of [1,2,3]){errors=[];await page.goto(`http://127.0.0.1:${server.address().port}/kinematics-redline.html`);
 const result=await page.evaluate(a=>{onCoinResult(true);store.prog=3;chooseAct(a);startLevel();state.bike.gas=true;for(let i=0;i<1200&&state.screen==='play';i++)simStep(1/120);return {state:state.screen,time:state.t,finite:Number.isFinite(state.bike.x)&&Number.isFinite(state.bike.v)}},act);
 await page.waitForTimeout(80);rows.push({game:'kinematics-redline',act,...result,errors:[...errors]});console.log(JSON.stringify(rows.at(-1)));}
fs.mkdirSync(path.join(root,'docs/physics-verification'),{recursive:true});fs.writeFileSync(path.join(root,'docs/physics-verification/runtime-audit.json'),JSON.stringify(rows,null,2)+'\n');if(rows.some(r=>r.errors.length||!r.finite||(r.game!=='kinematics-redline'&&(!r.carriedStats||r.freshStats!==JSON.stringify({solved:0,right:0,wrong:0})))))process.exitCode=1;
}finally{await browser?.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});
