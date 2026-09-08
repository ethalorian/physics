const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async function({page,base,out,remaining,scores,fail,deny,plays}){
 for(const [slug,file] of Object.entries(remaining)){
  await page.goto(base+'/arcade/'+slug);const frame=page.frameLocator('iframe');
  await frame.locator('#startOv .bigbtn').first().click();
  const game=page.frames().find(f=>f.url().endsWith(file+'.html'));
  await game.waitForFunction(()=>window.__mathTest?.state()?.running);
  assert(await game.evaluate(()=>!!window.__mathTest.bridge.playId));
  if(slug==='fusion'){
   // One real swipe fills a controlled board with no legal merges left.
   await game.evaluate(()=>{const s=window.__mathTest.state();s.board=Array.from({length:16},(_,i)=>i===15?null:mkTile(s.mode,2+((i>=12?0:Math.floor(i/4))+i%4)%2));window.__mathTest.render()});
   await game.locator('body').press('ArrowRight');await frame.locator('#auditOv.show').waitFor();
   const k=await game.evaluate(()=>window.__audit.chips.findIndex(c=>c.ok));fail();await frame.locator('.achip').nth(k).click();
  }else if(slug==='expression-crush'){
   // Known boards exercise nine round transitions and all three phases.
   // Outcomes are scored by production handlers; tests never assign score.
   for(let n=1;n<=9;n++){
    await game.waitForFunction(()=>!window.__mathTest.busy());
    await game.evaluate(()=>{const s=window.__mathTest.state(),r=s.round;r.quota=1;
     if(r.phase==='C'){r.grid=Array.from({length:36},()=>mkSym('d','d'));r.formula.syms.forEach((v,i)=>r.grid[i]=mkSym(v,SYM_LABELS[v]));}
     else {r.grid=Array.from({length:36},()=>mkNum(1));if(r.phase==='A'){r.target=2;r.grid[0]=mkNum(1);r.grid[1]=mkOp('+');r.grid[2]=mkNum(1);}else{r.grid[0]=mkGiven(r.sc.a);r.grid[1]=mkOp(r.sc.op);r.grid[2]=mkGiven(r.sc.b);}}
     window.__mathTest.render();window.__mathTest.click(r.grid.slice(-2).map(t=>t.id));});
    await game.waitForFunction(n=>window.__mathTest.state().roundNum>n,n);
   }
   assert.equal(await game.evaluate(()=>window.__mathTest.state().roundNum),10);
   for(let life=3;life>0;life--){
    await game.waitForFunction(()=>!window.__mathTest.busy());if(life===1)fail();
    await game.evaluate(()=>{const s=window.__mathTest.state();s.moves=1;s.round.phase='A';s.round.target=99;s.round.grid=Array.from({length:36},()=>mkNum(1));window.__mathTest.render();window.__mathTest.click(s.round.grid.slice(-2).map(t=>t.id))});
    await game.waitForFunction(life=>window.__mathTest.state().hearts<life,life);
   }
  }else{
   const target=await game.evaluate(()=>window.__mathTest.state().target);
   await game.evaluate(t=>{for(const k of t)window.__mathTest.press(k);window.__mathTest.press('ENTER')},target);
   await game.waitForFunction(()=>window.__mathTest.state().puzzleNum===2&&!window.__mathTest.busy());
   assert.equal(await game.evaluate(()=>window.__mathTest.state().solvedCt),1);
   const wrong=await game.evaluate(()=>window.__mathTest.state().target==='12+34=46'?'11+34=45':'12+34=46');
   for(let row=0;row<6;row++){await game.waitForFunction(()=>!window.__mathTest.busy());if(row===5)fail();await game.evaluate(t=>{for(const k of t)window.__mathTest.press(k);window.__mathTest.press('ENTER')},wrong);await game.waitForFunction(row=>window.__mathTest.state().row>row,row);}
  }
  await frame.getByRole('button',{name:'Retry save',exact:true}).waitFor();
  const playId=await game.evaluate(()=>window.__mathTest.bridge.playId);
  await frame.locator('#overOv:not(.hidden)').waitFor();assert(await frame.locator('#againBtn').isDisabled());
  await frame.getByRole('button',{name:'Retry save',exact:true}).click();await game.waitForFunction(()=>window.__mathTest.bridge.playId===null);
  assert.match(await frame.locator('#xpLine').innerText(),/4 XP banked/);
  if(slug==='mathle')assert.equal(await game.evaluate(()=>window.__mathTest.state().guessRecords.length),1);
  const finals=scores.filter(s=>s.final&&s.playId===playId);assert.equal(finals.length,2);assert.deepEqual(finals[0],finals[1]);
  await game.locator('body').screenshot({path:path.join(out,slug+'-complete.png')});
  await frame.locator('#againBtn').click();await game.waitForFunction(()=>window.__mathTest.state().running);
  if(slug==='expression-crush')await game.evaluate(()=>window.__mathTest.click([window.__mathTest.state().round.grid[0].id]));
  if(slug==='mathle')await game.evaluate(()=>window.__mathTest.press('1'));
  await frame.locator('#finishBtn').click();
  if(slug==='fusion'){await frame.locator('#auditOv.show').waitFor();const k=await game.evaluate(()=>window.__audit.chips.findIndex(c=>c.ok));await frame.locator('.achip').nth(k).click();}
  await frame.locator('#overOv:not(.hidden)').waitFor();await game.waitForFunction(()=>window.__mathTest.bridge.playId===null);
  if(slug==='mathle')assert.equal(await game.evaluate(()=>window.__mathTest.state().failedCt),1);
  assert.match(await frame.locator('#overOv h1').innerText(),/RUN COMPLETE/);assert.match(await frame.locator('#xpLine').innerText(),/4 XP banked/);
  await frame.locator('#menuBtn').click();deny();await frame.locator('#startOv .bigbtn').first().click();await frame.locator('#mathConnection').filter({hasText:'Could not start'}).waitFor();assert.equal(await game.evaluate(()=>window.__mathTest.state().running),false);
  const before=plays();await frame.locator('#practiceMode').check();await frame.locator('#startOv .bigbtn').first().click();await game.waitForFunction(()=>window.__mathTest.state().running);assert.equal(plays(),before);
  if(slug==='expression-crush')await game.evaluate(()=>window.__mathTest.click(window.__mathTest.state().round.grid.slice(0,2).map(t=>t.id)));
  await game.waitForFunction(()=>!window.__mathTest.busy());
  const scoreCount=scores.length;
  await frame.locator('#finishBtn').click();
  if(slug==='fusion'){await frame.locator('#auditOv.show').waitFor();const k=await game.evaluate(()=>window.__audit.chips.findIndex(c=>!c.ok));await frame.locator('.achip').nth(k).click();}
  await frame.locator('#overOv:not(.hidden)').waitFor();assert.match(await frame.locator('#xpLine').innerText(),/Practice complete/);assert.equal(scores.length,scoreCount);
  for(let door=0;door<3;door++){
   await page.setViewportSize({width:390,height:844});await page.goto(base+'/games/'+file+'.html');await page.locator('#practiceMode').check();await page.locator('#startOv .bigbtn').nth(door).click();
   await page.waitForTimeout(150);const box=await page.locator('#finishBtn').boundingBox();assert(box&&box.x>=0&&box.x+box.width<=391&&box.y+box.height<=845,slug+' finish control fit');
   await page.screenshot({path:path.join(out,slug+'-mobile-'+door+'.png')});
  }
  await page.setViewportSize({width:1366,height:1050});console.log('PASS',slug,'ranked end state, retry, voluntary finish, restart, denied start, practice, mobile modes');
 }
};
